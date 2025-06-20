import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Channel, Video } from '../types';
import { youtubeAPI } from '../services/youtubeAPI';
import { auth, db } from '../firebaseConfig'; // Import Firebase auth and db
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  onSnapshot, 
  getDoc // Pour vérifier l'existence du document utilisateur
} from 'firebase/firestore';

interface YoutubeContextType {
  favorites: Channel[];
  videos: Video[];
  searchResults: Channel[];
  isLoading: boolean;
  error: string | null;
  selectedChannel: string | null;
  currentUser: User | null; // État pour l'utilisateur connecté
  isAuthLoading: boolean; // Nouveau champ pour le chargement de l'authentification
  addFavorite: (channel: Channel) => Promise<void>; // Modifié pour prendre Channel et être async
  removeFavorite: (channelId: string) => Promise<void>; // Modifié pour être async
  searchChannels: (query: string) => Promise<void>;
  fetchLatestVideos: () => Promise<void>;
  setSelectedChannel: (id: string | null) => void;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>; // Fonction de connexion
  signOutUser: () => Promise<void>; // Fonction de déconnexion
  watchedVideoIds: string[];
  laterVideoIds: string[];
  markVideoWatched: (videoId: string) => void;
  markVideoLater: (videoId: string) => void;
  removeVideoFromWatched: (videoId: string) => void;
  removeVideoFromLater: (videoId: string) => void;
}

const YoutubeContext = createContext<YoutubeContextType | undefined>(undefined);

export const YoutubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // État pour le chargement initial de l'auth
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const [laterVideoIds, setLaterVideoIds] = useState<string[]>([]);

  const clearError = () => setError(null);

  // Authentification
  useEffect(() => {
    console.info("[YoutubeContext] Setting up auth state listener");
    setIsAuthLoading(true); // Commence le chargement de l'auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[YoutubeContext] User signed in:", user.uid);
        setCurrentUser(user);
      } else {
        console.log("[YoutubeContext] User signed out");
        setCurrentUser(null);
        setFavorites([]); // Vider les favoris si l'utilisateur se déconnecte
        setVideos([]); // Vider les vidéos
      }
      setIsAuthLoading(false); // Termine le chargement de l'auth
    });
    return () => {
      console.info("[YoutubeContext] Cleaning up auth state listener");
      unsubscribe();
    }
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("[YoutubeContext] Sign in with Google successful");
      // currentUser sera mis à jour par onAuthStateChanged
    } catch (e: any) {
      console.error('[YoutubeContext] Error signing in with Google:', e.message || e);
      setError(e.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signOutUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
      console.log("[YoutubeContext] Sign out successful");
      // currentUser, favorites, videos seront mis à jour par onAuthStateChanged
    } catch (e: any) {
      console.error('[YoutubeContext] Error signing out:', e.message || e);
      setError(e.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestion des favoris avec Firestore
  useEffect(() => {
    let unsubscribeFavorites: (() => void) | undefined = undefined;

    if (currentUser) {
      console.log(`[YoutubeContext] User ${currentUser.uid} detected, setting up favorites listener.`);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      unsubscribeFavorites = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const firestoreFavorites = userData.favorites || [];
          console.log(`[YoutubeContext] Favorites loaded from Firestore for user ${currentUser.uid}:`, firestoreFavorites.length);
          // Comparaison pour éviter les mises à jour inutiles si les données sont identiques
          setFavorites(currentLocalFavorites => {
            if (JSON.stringify(firestoreFavorites) !== JSON.stringify(currentLocalFavorites)) {
              return firestoreFavorites;
            }
            return currentLocalFavorites;
          });
        } else {
          // L'utilisateur est nouveau, créer le document
          console.log(`[YoutubeContext] No favorites document for user ${currentUser.uid}, creating one.`);
          try {
            await setDoc(userDocRef, { favorites: [] });
            setFavorites([]);
          } catch (e: any) {
            console.error(`[YoutubeContext] Error creating user document for ${currentUser.uid}:`, e.message || e);
            setError('Failed to initialize user data.');
          }
        }
      }, (e: any) => {
        console.error(`[YoutubeContext] Error listening to favorites for user ${currentUser.uid}:`, e.message || e);
        setError('Failed to load favorites in real-time.');
        setFavorites([]); // Réinitialiser en cas d'erreur de listener
      });
    } else {
      console.log("[YoutubeContext] No current user, clearing favorites listener.");
      setFavorites([]); // Assurer que les favoris sont vides si pas d'utilisateur
    }

    return () => {
      if (unsubscribeFavorites) {
        console.log("[YoutubeContext] Cleaning up favorites listener.");
        unsubscribeFavorites();
      }
    };
  }, [currentUser]);

  // Gestion du localStorage pour les vidéos vues et plus tard (par utilisateur)
  useEffect(() => {
    if (!currentUser) {
      setWatchedVideoIds([]);
      setLaterVideoIds([]);
      return;
    }
    const watchedKey = `watchedVideos_${currentUser.uid}`;
    const laterKey = `laterVideos_${currentUser.uid}`;
    const watched = localStorage.getItem(watchedKey);
    const later = localStorage.getItem(laterKey);
    setWatchedVideoIds(watched ? JSON.parse(watched) : []);
    setLaterVideoIds(later ? JSON.parse(later) : []);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const watchedKey = `watchedVideos_${currentUser.uid}`;
    localStorage.setItem(watchedKey, JSON.stringify(watchedVideoIds));
  }, [watchedVideoIds, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const laterKey = `laterVideos_${currentUser.uid}`;
    localStorage.setItem(laterKey, JSON.stringify(laterVideoIds));
  }, [laterVideoIds, currentUser]);

  const markVideoWatched = (videoId: string) => {
    setWatchedVideoIds((prev) => prev.includes(videoId) ? prev : [...prev, videoId]);
    setLaterVideoIds((prev) => prev.filter(id => id !== videoId)); // Si on marque comme vue, on l'enlève de "plus tard"
  };
  const markVideoLater = (videoId: string) => {
    setLaterVideoIds((prev) => prev.includes(videoId) ? prev : [...prev, videoId]);
    setWatchedVideoIds((prev) => prev.filter(id => id !== videoId)); // Si on met "plus tard", on l'enlève de "vue"
  };
  const removeVideoFromWatched = (videoId: string) => {
    setWatchedVideoIds((prev) => prev.filter(id => id !== videoId));
  };
  const removeVideoFromLater = (videoId: string) => {
    setLaterVideoIds((prev) => prev.filter(id => id !== videoId));
  };

  const addFavorite = useCallback(async (channel: Channel) => {
    if (!currentUser) {
      setError("Vous devez être connecté pour ajouter des favoris.");
      console.warn("[YoutubeContext] Add favorite attempt while not logged in.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      // Récupérer les vraies infos de la chaîne (miniature haute qualité)
      const detailedChannel = await youtubeAPI.getChannelDetails(channel.id);
      if (!detailedChannel) {
        setError("Impossible de récupérer les informations détaillées de la chaîne.");
        setIsLoading(false);
        return;
      }
      // Vérifier d'abord si le document utilisateur existe
      const docSnap = await getDoc(userDocRef);
      // Si le document n'existe pas, le créer avant d'ajouter le favori
      if (!docSnap.exists()) {
        console.log(`[YoutubeContext] Creating new user document for user ${currentUser.uid} before adding favorite.`);
        await setDoc(userDocRef, { favorites: [detailedChannel] });
        console.log(`[YoutubeContext] Channel ${channel.id} added to favorites for new user ${currentUser.uid}`);
        return; // Le listener onSnapshot va mettre à jour l'état
      }
      // Vérifier si le favori existe déjà
      const userData = docSnap.data();
      const existingFavorites = userData.favorites || [];
      if (existingFavorites.some((fav: Channel) => fav.id === channel.id)) {
        console.log(`[YoutubeContext] Channel ${channel.id} already in favorites for user ${currentUser.uid}.`);
        setIsLoading(false);
        return;
      }
      // Ajouter le favori
      console.log(`[YoutubeContext] Adding channel ${channel.id} to favorites for user ${currentUser.uid}`);
      await updateDoc(userDocRef, {
        favorites: arrayUnion(detailedChannel)
      });
      console.log(`[YoutubeContext] Channel ${channel.id} added to favorites for user ${currentUser.uid}`);
      // L'état local des favoris sera mis à jour par le listener onSnapshot
    } catch (e: any) {
      console.error(`[YoutubeContext] Error adding favorite ${channel.id} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || "Échec de l'ajout de la chaîne aux favoris");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const removeFavorite = useCallback(async (channelId: string) => {
    if (!currentUser) {
      setError("You must be logged in to remove favorites.");
      console.warn("[YoutubeContext] Remove favorite attempt while not logged in.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const channelToRemove = favorites.find(fav => fav.id === channelId);
      if (!channelToRemove) {
        console.warn(`[YoutubeContext] Channel ${channelId} not found in local favorites for user ${currentUser.uid} during removal.`);
        setIsLoading(false);
        return;
      }
      await updateDoc(userDocRef, {
        favorites: arrayRemove(channelToRemove)
      });
      console.log(`[YoutubeContext] Channel ${channelId} removed from favorites for user ${currentUser.uid}`);
      // L'état local des favoris sera mis à jour par le listener onSnapshot
      
      if (selectedChannel === channelId) {
        setSelectedChannel(null);
      }
      // Laisser le listener onSnapshot gérer la mise à jour de 'videos' si nécessaire,
      // ou ajuster fetchLatestVideos pour qu'il soit appelé après la mise à jour des favoris.
      // Pour l'instant, on ne filtre plus les vidéos ici directement.
    } catch (e: any) {
      console.error(`[YoutubeContext] Error removing favorite ${channelId} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || 'Failed to remove channel from favorites');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, favorites, selectedChannel]); // favorites est une dépendance pour trouver channelToRemove

  const searchChannels = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    console.info(`[YoutubeContext] Searching channels for query: "${query}"`);
    try {
      const results = await youtubeAPI.searchChannels(query);
      setSearchResults(results);
      if (results.length === 0) {
        console.log('[YoutubeContext] No channels found for query.');
      }
    } catch (error: any) {
      console.error('[YoutubeContext] Error searching channels:', error.message || error);
      setError(error.message || 'Failed to search channels');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  const fetchLatestVideos = useCallback(async () => {
    if (!currentUser) { // Ne rien faire si pas d'utilisateur
      setVideos([]);
      setIsLoading(false);
      return;
    }
    if (favorites.length === 0) {
      setVideos([]); 
      setIsLoading(false); 
      console.log("[YoutubeContext] No favorites to fetch videos for.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    console.info(`[YoutubeContext] Fetching latest videos for ${favorites.length} favorite(s) of user ${currentUser.uid}.`);
    try {
      const channelIds = favorites.map(channel => channel.id);
      const latestVideos = await youtubeAPI.getLatestVideos(channelIds);
      
      const videosWithChannelThumbnail = latestVideos.map(video => ({
        ...video,
        channelThumbnail: favorites.find(f => f.id === video.channelId)?.thumbnail || ''
      }));
      
      setVideos(videosWithChannelThumbnail);
      console.log(`[YoutubeContext] Successfully fetched ${latestVideos.length} videos for user ${currentUser.uid}.`);
    } catch (error: any) {
      console.error(`[YoutubeContext] Error fetching latest videos for user ${currentUser.uid}:`, error.message || error);
      setError(error.message || 'Failed to fetch latest videos');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, favorites]); // Dépendances : currentUser et favorites

  // Récupérer les vidéos lorsque les favoris (chargés depuis Firestore) changent
  // ou lorsque l'utilisateur change (ce qui recharge les favoris)
  useEffect(() => {
    if (currentUser && favorites.length > 0) {
      console.log("[YoutubeContext] Favorites changed or user changed, fetching latest videos.");
      fetchLatestVideos();
    } else if (currentUser && favorites.length === 0) {
      console.log("[YoutubeContext] User has no favorites, clearing videos.");
      setVideos([]); // Vider les vidéos si l'utilisateur n'a pas de favoris
    }
    // Si !currentUser, les vidéos sont déjà vidées par le listener onAuthStateChanged
  }, [currentUser, favorites, fetchLatestVideos]);

  return (
    <YoutubeContext.Provider
      value={{
        favorites,
        videos,
        searchResults,
        isLoading,
        error,
        selectedChannel,
        currentUser, // Exposer currentUser
        isAuthLoading, // Exposer isAuthLoading
        addFavorite,
        removeFavorite,
        searchChannels,
        fetchLatestVideos,
        setSelectedChannel,
        clearError,
        signInWithGoogle, // Exposer signInWithGoogle
        signOutUser, // Exposer signOutUser
        watchedVideoIds,
        laterVideoIds,
        markVideoWatched,
        markVideoLater,
        removeVideoFromWatched,
        removeVideoFromLater,
      }}
    >
      {children}
    </YoutubeContext.Provider>
  );
};

export const useYoutube = (): YoutubeContextType => {
  const context = useContext(YoutubeContext);
  if (context === undefined) {
    throw new Error('useYoutube must be used within a YoutubeProvider');
  }
  return context;
};