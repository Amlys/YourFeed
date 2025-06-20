import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Channel } from '../types';
import { youtubeAPI } from '../services/youtubeAPI';

interface SearchContextType {
  searchResults: Channel[];
  selectedChannel: string | null;
  isLoading: boolean;
  error: string | null;
  searchChannels: (query: string) => Promise<void>;
  setSelectedChannel: (id: string | null) => void;
  clearError: () => void;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearResults = useCallback(() => setSearchResults([]), []);

  const searchChannels = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    console.info(`[SearchContext] Searching channels for query: "${query}"`);
    
    try {
      const results = await youtubeAPI.searchChannels(query);
      setSearchResults(results);
      
      if (results.length === 0) {
        console.log('[SearchContext] No channels found for query.');
      } else {
        console.log(`[SearchContext] Found ${results.length} channels for query: "${query}"`);
      }
    } catch (error: any) {
      console.error('[SearchContext] Error searching channels:', error.message || error);
      setError(error.message || 'Failed to search channels');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  // Mémoisation de la valeur du contexte pour éviter les re-renders inutiles
  const contextValue = useMemo(() => ({
    searchResults,
    selectedChannel,
    isLoading,
    error,
    searchChannels,
    setSelectedChannel,
    clearError,
    clearResults,
  }), [
    searchResults,
    selectedChannel,
    isLoading,
    error,
    searchChannels,
    clearError,
    clearResults,
  ]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 