import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SearchProvider, useSearch } from '../contexts/SearchContext';
import { FavoritesProvider, useFavorites } from '../contexts/FavoritesContext';
import { VideosProvider, useVideos } from '../contexts/VideosContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { createBrandedString } from '../types/common';
import React from 'react';

// Mock Firebase
vi.mock('../firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
}));

// Mock Firebase Auth functions
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
}));

// Test component for SearchContext
const SearchTestComponent: React.FC = () => {
  const { searchResults, isLoading, searchChannels } = useSearch();
  
  return (
    <div>
      <div data-testid="search-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="search-results-count">{searchResults.length}</div>
      <button onClick={() => searchChannels('test')} data-testid="search-button">
        Search
      </button>
    </div>
  );
};

// Test component for FavoritesContext  
const FavoritesTestComponent: React.FC = () => {
  const { favorites, isLoading, addFavorite } = useFavorites();
  
  const handleAdd = () => {
    addFavorite({
      id: createBrandedString('test-id'),
      title: createBrandedString('Test Channel'),
      description: 'Test Description',
      thumbnail: 'test-thumbnail.jpg'
    });
  };
  
  return (
    <div>
      <div data-testid="favorites-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="favorites-count">{favorites.length}</div>
      <button onClick={handleAdd} data-testid="add-favorite-button">
        Add Favorite
      </button>
    </div>
  );
};

// Test component for VideosContext
const VideosTestComponent: React.FC = () => {
  const { videos, isLoading, fetchLatestVideos } = useVideos();
  
  return (
    <div>
      <div data-testid="videos-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="videos-count">{videos.length}</div>
      <button onClick={fetchLatestVideos} data-testid="fetch-videos-button">
        Fetch Videos
      </button>
    </div>
  );
};

// Test component for AuthContext
const AuthTestComponent: React.FC = () => {
  const { currentUser, isAuthLoading, signInWithGoogle } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-loading">{isAuthLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="current-user">{currentUser ? 'logged-in' : 'not-logged-in'}</div>
      <button onClick={signInWithGoogle} data-testid="signin-button">
        Sign In
      </button>
    </div>
  );
};

describe('Contexts Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock YouTube API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: { channelId: 'test-channel' },
          snippet: {
            title: 'Test Channel',
            description: 'Description',
            thumbnails: { high: { url: 'thumbnail.jpg' } }
          }
        }]
      }),
    });
  });

  describe('SearchContext', () => {
    it('should initialize with default values', () => {
      render(
        <SearchProvider>
          <SearchTestComponent />
        </SearchProvider>
      );

      expect(screen.getByTestId('search-loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
    });

    it('should handle search operations', async () => {
      render(
        <SearchProvider>
          <SearchTestComponent />
        </SearchProvider>
      );

      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      // Attendre que l'état de chargement se mette à jour
      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toHaveTextContent('loading');
      }, { timeout: 1000 });

      console.log('Search context test completed');
    });
  });

  describe('FavoritesContext', () => {
    it('should initialize with default values', () => {
      render(
        <AuthProvider>
          <FavoritesProvider>
            <FavoritesTestComponent />
          </FavoritesProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId('favorites-loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
    });
  });

  describe('VideosContext', () => {
    it('should initialize with default values', () => {
      render(
        <AuthProvider>
          <FavoritesProvider>
            <VideosProvider>
              <VideosTestComponent />
            </VideosProvider>
          </FavoritesProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId('videos-loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('videos-count')).toHaveTextContent('0');
    });
  });

  describe('AuthContext', () => {
    it('should initialize with default values', () => {
      render(
        <AuthProvider>
          <AuthTestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('current-user')).toHaveTextContent('not-logged-in');
    });
  });
}); 