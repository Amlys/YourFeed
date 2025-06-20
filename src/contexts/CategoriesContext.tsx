import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category } from '../types/schemas';
import { CategoryId, createBrandedString } from '../types/common';
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

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  addCategory: (name: string, description?: string, color?: string) => Promise<Category>;
  updateCategory: (categoryId: CategoryId, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'isDefault'>>) => Promise<void>;
  removeCategory: (categoryId: CategoryId) => Promise<void>;
  getCategoryById: (categoryId: CategoryId) => Category | undefined;
  getDefaultCategories: () => Category[];
  clearError: () => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

// Catégories par défaut
const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  {
    id: createBrandedString<'CategoryId'>('default-entertainment'),
    name: createBrandedString<'NonEmptyString'>('Divertissement'),
    description: 'Chaînes de divertissement, humour, gaming',
    color: '#EF4444', // Rouge
    isDefault: true,
  },
  {
    id: createBrandedString<'CategoryId'>('default-science'),
    name: createBrandedString<'NonEmptyString'>('Science'),
    description: 'Chaînes scientifiques, éducatives',
    color: '#3B82F6', // Bleu
    isDefault: true,
  },
  {
    id: createBrandedString<'CategoryId'>('default-sport'),
    name: createBrandedString<'NonEmptyString'>('Sport'),
    description: 'Chaînes sportives, fitness',
    color: '#10B981', // Vert
    isDefault: true,
  },
  {
    id: createBrandedString<'CategoryId'>('default-technology'),
    name: createBrandedString<'NonEmptyString'>('Technologie'),
    description: 'Chaînes technologiques, informatique, innovation',
    color: '#8B5CF6', // Violet
    isDefault: true,
  },
];

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Initialiser les catégories par défaut
  const initializeDefaultCategories = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      const defaultCategoriesWithTimestamp: Category[] = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        createdAt: createBrandedString<'ISO8601Date'>(new Date().toISOString()),
      }));

      if (!docSnap.exists()) {
        console.log(`[CategoriesContext] Creating new user document with default categories for user ${currentUser.uid}`);
        await setDoc(userDocRef, { 
          categories: defaultCategoriesWithTimestamp,
          favorites: []
        });
      } else {
        const userData = docSnap.data();
        if (!userData.categories || userData.categories.length === 0) {
          console.log(`[CategoriesContext] Adding default categories to existing user ${currentUser.uid}`);
          await updateDoc(userDocRef, {
            categories: defaultCategoriesWithTimestamp
          });
        }
      }
    } catch (e: any) {
      console.error(`[CategoriesContext] Error initializing default categories for user ${currentUser.uid}:`, e.message || e);
      setError('Failed to initialize default categories.');
    }
  }, [currentUser]);

  // Gestion des catégories avec Firestore
  useEffect(() => {
    let unsubscribeCategories: (() => void) | undefined = undefined;

    if (currentUser) {
      console.log(`[CategoriesContext] User ${currentUser.uid} detected, setting up categories listener.`);
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      unsubscribeCategories = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const firestoreCategories = userData.categories || [];
          console.log(`[CategoriesContext] Categories loaded from Firestore for user ${currentUser.uid}:`, firestoreCategories.length);
          
          // Si aucune catégorie, initialiser avec les catégories par défaut
          if (firestoreCategories.length === 0) {
            await initializeDefaultCategories();
          } else {
            setCategories(currentLocalCategories => {
              if (JSON.stringify(firestoreCategories) !== JSON.stringify(currentLocalCategories)) {
                return firestoreCategories;
              }
              return currentLocalCategories;
            });
          }
        } else {
          // L'utilisateur est nouveau, initialiser avec les catégories par défaut
          console.log(`[CategoriesContext] No document for user ${currentUser.uid}, initializing with defaults.`);
          await initializeDefaultCategories();
        }
      }, (e: any) => {
        console.error(`[CategoriesContext] Error listening to categories for user ${currentUser.uid}:`, e.message || e);
        setError('Failed to load categories in real-time.');
        setCategories([]);
      });
    } else {
      console.log("[CategoriesContext] No current user, clearing categories.");
      setCategories([]);
    }

    return () => {
      if (unsubscribeCategories) {
        console.log("[CategoriesContext] Cleaning up categories listener.");
        unsubscribeCategories();
      }
    };
  }, [currentUser, initializeDefaultCategories]);

  const addCategory = useCallback(async (name: string, description = '', color = '#6B7280'): Promise<Category> => {
    if (!currentUser) {
      setError("Vous devez être connecté pour créer des catégories.");
      throw new Error("User not logged in");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      const newCategory: Category = {
        id: createBrandedString<'CategoryId'>(`custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
        name: createBrandedString<'NonEmptyString'>(name),
        description,
        color,
        isDefault: false,
        createdAt: createBrandedString<'ISO8601Date'>(new Date().toISOString()),
      };
      
      console.log(`[CategoriesContext] Adding new category:`, newCategory);
      
      await updateDoc(userDocRef, {
        categories: arrayUnion(newCategory)
      });
      
      console.log(`[CategoriesContext] Category ${newCategory.id} added for user ${currentUser.uid}`);
      return newCategory;
      
    } catch (e: any) {
      console.error(`[CategoriesContext] Error adding category for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || "Échec de la création de la catégorie");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const updateCategory = useCallback(async (categoryId: CategoryId, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'isDefault'>>) => {
    if (!currentUser) {
      setError("Vous devez être connecté pour modifier des catégories.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const categoryToUpdate = categories.find(cat => cat.id === categoryId);
      
      if (!categoryToUpdate) {
        throw new Error(`Category ${categoryId} not found`);
      }

      // Vérifier si c'est une catégorie par défaut
      if (categoryToUpdate.isDefault) {
        throw new Error("Cannot modify default categories");
      }
      
      const updatedCategory: Category = {
        ...categoryToUpdate,
        ...updates,
      };
      
      // Supprimer l'ancienne et ajouter la nouvelle
      await updateDoc(userDocRef, {
        categories: arrayRemove(categoryToUpdate)
      });
      
      await updateDoc(userDocRef, {
        categories: arrayUnion(updatedCategory)
      });
      
      console.log(`[CategoriesContext] Category ${categoryId} updated for user ${currentUser.uid}`);
      
    } catch (e: any) {
      console.error(`[CategoriesContext] Error updating category ${categoryId} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || 'Failed to update category');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, categories]);

  const removeCategory = useCallback(async (categoryId: CategoryId) => {
    if (!currentUser) {
      setError("Vous devez être connecté pour supprimer des catégories.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const categoryToRemove = categories.find(cat => cat.id === categoryId);
      
      if (!categoryToRemove) {
        console.warn(`[CategoriesContext] Category ${categoryId} not found for user ${currentUser.uid} during removal.`);
        return;
      }

      // Vérifier si c'est une catégorie par défaut
      if (categoryToRemove.isDefault) {
        throw new Error("Cannot delete default categories");
      }
      
      await updateDoc(userDocRef, {
        categories: arrayRemove(categoryToRemove)
      });
      
      console.log(`[CategoriesContext] Category ${categoryId} removed for user ${currentUser.uid}`);
      
    } catch (e: any) {
      console.error(`[CategoriesContext] Error removing category ${categoryId} for user ${currentUser.uid}:`, e.message || e);
      setError(e.message || 'Failed to remove category');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, categories]);

  const getCategoryById = useCallback((categoryId: CategoryId): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  }, [categories]);

  const getDefaultCategories = useCallback((): Category[] => {
    return categories.filter(cat => cat.isDefault);
  }, [categories]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        error,
        addCategory,
        updateCategory,
        removeCategory,
        getCategoryById,
        getDefaultCategories,
        clearError,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = (): CategoriesContextType => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}; 