import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Channel } from '../types/schemas';
import { CategoryId } from '../types/common';
import { youtubeAPI } from '../services/youtubeAPI';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';

interface FavoritesContextType {
  favorites: Channel[];
  isLoading: boolean;
  error: string | null;
  addFavorite: (channel: Channel, categoryId?: CategoryId) => Promise<void>;
  removeFavorite: (channelId: string) => Promise<void>;
  updateChannelCategory: (channelId: string, categoryId: CategoryId) => Promise<void>;
  getFavoritesByCategory: (categoryId: CategoryId) => Channel[];
  clearError: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Gestion des favoris avec Firestore
  useEffect(() => {
    let unsubscribeFavorites: (() => void) | undefined = undefined;

    if (currentUser) {
      console.log(`[FavoritesContext] User ${currentUser.uid} detected, setting up favorites listener.`);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      unsubscribeFavorites = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const firestoreFavorites = userData.favorites || [];
          console.log(`[FavoritesContext] Favorites loaded from Firestore for user ${currentUser.uid}:`, firestoreFavorites.length);
          
          // Comparaison pour éviter les mises à jour inutiles
          setFavorites(currentLocalFavorites => {
            if (JSON.stringify(firestoreFavorites) !== JSON.stringify(currentLocalFavorites)) {
              return firestoreFavorites;
            }
            return currentLocalFavorites;
          });
        } else {
          // L'utilisateur est nouveau, créer le document
          console.log(`[FavoritesContext] No favorites document for user ${currentUser.uid}, creating one.`);
          try {
            await setDoc(userDocRef, { favorites: [] });
            setFavorites([]);
          } catch (e: any) {
            console.error(`[FavoritesContext] Error creating user document for ${currentUser.uid}:`, e.message || e);
            setError('Failed to initialize user data.');
          }
        }
      }, (e: any) => {
        console.error(`[FavoritesContext] Error listening to favorites for user ${currentUser.uid}:`, e.message || e);
        setError('Failed to load favorites in real-time.');
        setFavorites([]); // Réinitialiser en cas d'erreur de listener
      });
    } else {
      console.log("[FavoritesContext] No current user, clearing favorites.");
      setFavorites([]); // Assurer que les favoris sont vides si pas d'utilisateur
    }

    return () => {
      if (unsubscribeFavorites) {
        console.log("[FavoritesContext] Cleaning up favorites listener.");
        unsubscribeFavorites();
      }
    };
  }, [currentUser]);

  const addFavorite = useCallback(async (channel: Channel, categoryId?: CategoryId) => {
    if (!currentUser) {
      setError("Vous devez être connecté pour ajouter des favoris.");
      console.warn("[FavoritesContext] Add favorite attempt while not logged in.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Ajouter la catégorie à la chaîne si fournie
      const channelWithCategory: Channel = {
        ...channel,
        categoryId: categoryId
      };
      
      console.log(`[FavoritesContext] Adding channel to favorites:`, channelWithCategory);
      
      // Vérifier d'abord si le document utilisateur existe
      const docSnap = await getDoc(userDocRef);
      
      // Si le document n'existe pas, le créer avant d'ajouter le favori
      if (!docSnap.exists()) {
        console.log(`[FavoritesContext] Creating new user document for user ${currentUser.uid} before adding favorite.`);
        await setDoc(userDocRef, { favorites: [channelWithCategory] });
        console.log(`[FavoritesContext] Channel ${channel.id} added to favorites for new user ${currentUser.uid}`);
        return; // Le listener onSnapshot va mettre à jour l'état
      }
      
      // Vérifier si le favori existe déjà
      const userData = docSnap.data();
      const existingFavorites = userData.favorites || [];
      if (existingFavorites.some((fav: Channel) => fav.id === channel.id)) {
        console.log(`[FavoritesContext] Channel ${channel.id} already in favorites for user ${currentUser.uid}.`);
        return;
      }
      
      // Ajouter le favori
      console.log(`[FavoritesContext] Adding channel ${channel.id} to favorites for user ${currentUser.uid}`);
      await updateDoc(userDocRef, {
        favorites: arrayUnion(channelWithCategory)
      });
      console.log(`[FavoritesContext] Channel ${channel.id} added to favorites for user ${currentUser.uid}`);
      
    } catch (e: any) {
      console.error(`[FavoritesContext] Error adding favorite ${channel.id} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || "Échec de l'ajout de la chaîne aux favoris");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const removeFavorite = useCallback(async (channelId: string) => {
    if (!currentUser) {
      setError("You must be logged in to remove favorites.");
      console.warn("[FavoritesContext] Remove favorite attempt while not logged in.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const channelToRemove = favorites.find(fav => fav.id === channelId);
      
      if (!channelToRemove) {
        console.warn(`[FavoritesContext] Channel ${channelId} not found in local favorites for user ${currentUser.uid} during removal.`);
        return;
      }
      
      await updateDoc(userDocRef, {
        favorites: arrayRemove(channelToRemove)
      });
      console.log(`[FavoritesContext] Channel ${channelId} removed from favorites for user ${currentUser.uid}`);
      
    } catch (e: any) {
      console.error(`[FavoritesContext] Error removing favorite ${channelId} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || 'Failed to remove channel from favorites');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, favorites]);

  const updateChannelCategory = useCallback(async (channelId: string, categoryId: CategoryId) => {
    if (!currentUser) {
      setError("Vous devez être connecté pour modifier la catégorie.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const channelToUpdate = favorites.find(fav => fav.id === channelId);
      
      if (!channelToUpdate) {
        console.warn(`[FavoritesContext] Channel ${channelId} not found in favorites for user ${currentUser.uid} during category update.`);
        return;
      }
      
      const updatedChannel: Channel = {
        ...channelToUpdate,
        categoryId: categoryId
      };
      
      // Supprimer l'ancien et ajouter le nouveau
      await updateDoc(userDocRef, {
        favorites: arrayRemove(channelToUpdate)
      });
      
      await updateDoc(userDocRef, {
        favorites: arrayUnion(updatedChannel)
      });
      
      console.log(`[FavoritesContext] Channel ${channelId} category updated to ${categoryId} for user ${currentUser.uid}`);
      
    } catch (e: any) {
      console.error(`[FavoritesContext] Error updating channel category ${channelId} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || 'Failed to update channel category');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, favorites]);

  const getFavoritesByCategory = useCallback((categoryId: CategoryId): Channel[] => {
    return favorites.filter(channel => channel.categoryId === categoryId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        error,
        addFavorite,
        removeFavorite,
        updateChannelCategory,
        getFavoritesByCategory,
        clearError,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}; 