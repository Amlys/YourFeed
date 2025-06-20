import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Moon, Sun, LogIn, LogOut, Search, AlertCircle, Plus, User, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { Channel } from '../types/schemas';
import { CategoryId } from '../types/common';
import CategorySelector from './CategorySelector';
import Modal from './Modal';
import { extractFirstName } from '../utils/userUtils';

const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, setDarkMode, isAutoMode, toggleAutoMode, systemPreference } = useTheme();
  const { currentUser, signInWithGoogle, signOutUser } = useAuth();
  const { searchResults, isLoading, error, searchChannels, clearError } = useSearch();
  const { addFavorite } = useFavorites();
  
  // États pour la SearchBar intégrée
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [addingFavorite, setAddingFavorite] = useState<string | null>(null);
  const [brokenThumbnails, setBrokenThumbnails] = useState<string[]>([]);
  
  // État pour le menu de thème
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // État pour le modal de sélection de catégorie
  const [channelToAdd, setChannelToAdd] = useState<Channel | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<CategoryId | null>(null);

  useEffect(() => {
    // Cacher les résultats si on clique en dehors de la searchbar et de ses résultats
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showResults && !target.closest('.header-search-container')) {
        setShowResults(false);
      }
      if (showThemeMenu && !target.closest('.theme-menu-container')) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults, showThemeMenu]);

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
      return;
    }

    // Ouvrir le modal de sélection de catégorie
    setChannelToAdd(channel);
    setShowCategoryModal(true);
    setShowResults(false);
  };

  const handleConfirmAddFavorite = async (categoryId: CategoryId | null) => {
    if (!channelToAdd) return;

    try {
      setAddingFavorite(channelToAdd.id);
      await addFavorite(channelToAdd, categoryId || undefined);
      setShowCategoryModal(false);
      setChannelToAdd(null);
      setQuery('');
      clearError();
    } catch (error) {
      console.error('[Header] Erreur lors de l\'ajout aux favoris:', error);
    } finally {
      setAddingFavorite(null);
    }
  };

  // Fonction pour obtenir l'icône du thème actuel
  const getThemeIcon = () => {
    if (isAutoMode) {
      return <Monitor size={20} className="text-blue-500" />;
    }
    return darkMode ? (
      <Moon size={20} className="text-blue-400" />
    ) : (
      <Sun size={20} className="text-yellow-500" />
    );
  };

  // Fonction pour obtenir le texte du thème actuel
  const getThemeText = () => {
    if (isAutoMode) {
      return `Auto (${systemPreference ? 'Sombre' : 'Clair'})`;
    }
    return darkMode ? 'Sombre' : 'Clair';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-full px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo Section */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
          >
            <Youtube size={28} />
            <span className="font-bold text-xl lg:text-2xl">YourFeed</span>
          </Link>
          
          {/* Search Section - Uniquement visible pour les utilisateurs connectés */}
          {currentUser && (
            <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-2xl mx-4 lg:mx-8 header-search-container">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-20 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-transparent transition-all duration-200 shadow-sm"
                    placeholder="Rechercher une chaîne YouTube..."
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-1 top-1 bottom-1 bg-red-600 hover:bg-red-700 text-white px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isLoading ? '...' : 'Chercher'}
                  </button>
                </div>

                {/* Résultats de recherche */}
                {error && showResults && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle size={16} />
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {showResults && searchResults && searchResults.length > 0 && !error && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((channel: Channel) => (
                        <div
                          key={channel.id}
                          className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {/* Miniature de la chaîne */}
                          <div className="flex-shrink-0">
                            {channel.thumbnail && !brokenThumbnails.includes(channel.id) ? (
                              <img
                                src={channel.thumbnail}
                                alt={channel.title}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={() => {
                                  setBrokenThumbnails((prev) => [...prev, channel.id]);
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                <User size={20} className="text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                          
                          {/* Informations de la chaîne */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 dark:text-white font-medium text-sm truncate">
                              {channel.title}
                            </h3>
                            {channel.description && (
                              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                {channel.description.length > 80 
                                  ? channel.description.substring(0, 80) + '...' 
                                  : channel.description
                                }
                              </p>
                            )}
                          </div>
                          
                          {/* Bouton d'ajout */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleAddFavorite(channel)}
                              disabled={addingFavorite === channel.id}
                              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
                              aria-label={`Ajouter ${channel.title} aux favoris`}
                            >
                              {addingFavorite === channel.id ? (
                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Plus size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showResults && searchResults.length === 0 && !error && !isLoading && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-300 text-sm">Aucune chaîne trouvée</p>
                  </div>
                )}
              </form>
            </div>
          )}
          
          {/* Controls Section */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Menu de Thème Amélioré */}
            <div className="relative theme-menu-container">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
                aria-label="Changer le thème"
              >
                {getThemeIcon()}
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${showThemeMenu ? 'rotate-180' : ''}`} />
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (!isAutoMode) toggleAutoMode();
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 ${
                        isAutoMode ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Monitor size={16} />
                      <div>
                        <div className="text-sm font-medium">Automatique</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Suit les réglages système</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setDarkMode(false); // Force le mode clair
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 ${
                        !isAutoMode && !darkMode ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Sun size={16} />
                      <div>
                        <div className="text-sm font-medium">Mode Clair</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Interface lumineuse</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setDarkMode(true); // Force le mode sombre
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 ${
                        !isAutoMode && darkMode ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Moon size={16} />
                      <div>
                        <div className="text-sm font-medium">Mode Sombre</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Interface sombre</div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Actuel : {getThemeText()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-2 lg:space-x-3">
                {currentUser.photoURL && (
                  <img 
                    src={currentUser.photoURL} 
                    alt={extractFirstName(currentUser.displayName, currentUser.email) + ' avatar'} 
                    className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-gray-200 dark:border-gray-600"
                  />
                )}
                <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300 hidden sm:inline font-medium max-w-32 truncate">
                  {extractFirstName(currentUser.displayName, currentUser.email)}
                </span>
                <button
                  onClick={signOutUser}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                  <span className="hidden lg:inline">Déconnexion</span>
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                aria-label="Sign in with Google"
              >
                <LogIn size={16} />
                <span>Connexion</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de sélection de catégorie */}
      {showCategoryModal && channelToAdd && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setChannelToAdd(null);
          }}
          title="Choisir une catégorie"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {channelToAdd.thumbnail ? (
                <img
                  src={channelToAdd.thumbnail}
                  alt={channelToAdd.title}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                  <User size={24} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                  {channelToAdd.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sélectionnez une catégorie pour cette chaîne
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catégorie
              </label>
              <CategorySelector
                selectedCategoryId={selectedCategoryForAdd}
                onCategorySelect={setSelectedCategoryForAdd}
                placeholder="Choisir une catégorie..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => handleConfirmAddFavorite(selectedCategoryForAdd)}
                disabled={addingFavorite === channelToAdd.id}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {addingFavorite === channelToAdd.id ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Ajouter aux favoris'
                )}
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setChannelToAdd(null);
                  setSelectedCategoryForAdd(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};

export default Header;