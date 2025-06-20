import React from 'react';
import { AuthProvider } from './AuthContext';
import { FavoritesProvider } from './FavoritesContext';
import { SearchProvider } from './SearchContext';
import { VideosProvider } from './VideosContext';
import { CategoriesProvider } from './CategoriesContext';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <FavoritesProvider>
          <SearchProvider>
            <VideosProvider>
              {children}
            </VideosProvider>
          </SearchProvider>
        </FavoritesProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
};

// Hook combiné pour un accès facile à tous les contextes
export const useApp = () => {
  // Import dynamique pour éviter les dépendances circulaires
  const { useAuth } = require('./AuthContext');
  const { useFavorites } = require('./FavoritesContext');
  const { useSearch } = require('./SearchContext');
  const { useVideos } = require('./VideosContext');

  return {
    auth: useAuth(),
    favorites: useFavorites(),
    search: useSearch(),
    videos: useVideos(),
  };
}; 