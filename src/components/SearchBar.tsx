import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Plus, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { Channel } from '../types.ts';

const SearchBar: React.FC = () => {
  const { currentUser } = useAuth();
  const { searchResults, isLoading, error, searchChannels, clearError } = useSearch();
  const { addFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [addingFavorite, setAddingFavorite] = useState<string | null>(null);
  const [brokenThumbnails, setBrokenThumbnails] = useState<string[]>([]);

  // Log pour déboguer l'état du composant
  console.log("[SearchBar] Rendering. State:", {
    query,
    showResults,
    searchResultsLength: searchResults ? searchResults.length : 0,
    isLoading,
    error,
    currentUser: !!currentUser
  });

  useEffect(() => {
    // Cacher les résultats si on clique en dehors de la searchbar et de ses résultats
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showResults && !target.closest('.searchbar-results-container') && !target.closest('.searchbar-form-container')) {
        console.log("[SearchBar] Clicked outside, hiding results.");
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      clearError();
      await searchChannels(query);
      setShowResults(true);
    }
  };

  const handleAddFavorite = async (channel: Channel) => {
    if (!currentUser) {
      console.warn("[SearchBar] Tentative d'ajout d'un favori sans être connecté");
      return;
    }

    try {
      console.log("[SearchBar] Tentative d'ajout de la chaîne aux favoris:", channel);
      setAddingFavorite(channel.id);
      await addFavorite(channel);
      console.log("[SearchBar] Chaîne ajoutée aux favoris avec succès:", channel.title);
      setShowResults(false);
      setQuery('');
      clearError();
    } catch (error) {
      console.error('[SearchBar] Erreur lors de l\'ajout aux favoris:', error);
    } finally {
      setAddingFavorite(null);
    }
  };

  return (
    <div className="relative searchbar-results-container"> {/* Ajout d'une classe pour le listener de clic extérieur */} 
      <form onSubmit={handleSearch} className="flex searchbar-form-container"> {/* Ajout d'une classe pour le listener de clic extérieur */} 
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600"
            placeholder="Rechercher une chaîne YouTube..."
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {error && showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {showResults && searchResults && searchResults.length > 0 && !error && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden searchbar-results-list">
          <div className="max-h-96 overflow-y-auto">
            {searchResults.map((channel: Channel) => (
              <div
                key={channel.id}
                className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-0"
              >
                {/* Miniature de la chaîne */}
                <div className="flex-shrink-0">
                  {channel.thumbnail && !brokenThumbnails.includes(channel.id) ? (
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        console.log(`[SearchBar] Image failed to load for ${channel.title}: ${channel.thumbnail}`);
                        setBrokenThumbnails((prev) => [...prev, channel.id]);
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <User size={24} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Informations de la chaîne */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white font-medium text-sm leading-5 mb-1 truncate">
                    {channel.title}
                  </h3>
                  {channel.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-4 overflow-hidden">
                      <span className="block max-h-8 overflow-hidden">
                        {channel.description.length > 120 
                          ? channel.description.substring(0, 120) + '...' 
                          : channel.description
                        }
                      </span>
                    </p>
                  )}
                </div>
                
                {/* Bouton d'ajout */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleAddFavorite(channel)}
                    disabled={addingFavorite === channel.id}
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white p-2 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
                    aria-label={`Ajouter ${channel.title} aux favoris`}
                  >
                    {addingFavorite === channel.id ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && searchResults.length === 0 && !error && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 text-center">
          <p className="text-gray-500 dark:text-gray-300">Aucune chaîne trouvée</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;