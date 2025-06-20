import React, { useState } from 'react';
import { Trash2, Plus, User, Tag, Settings, Filter, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { useSearch } from '../contexts/SearchContext';
import { Channel } from '../types/schemas';
import { CategoryId } from '../types/common';
import CategoryManager from './CategoryManager';
import CategorySelector from './CategorySelector';

const FavoritesList: React.FC = () => {
  const { currentUser } = useAuth();
  const { favorites, removeFavorite, updateChannelCategory } = useFavorites();
  const { categories, getCategoryById } = useCategories();
  const { selectedChannel, setSelectedChannel } = useSearch();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryId | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  // Filtrer les favoris par catégorie si une catégorie est sélectionnée
  const filteredFavorites = selectedCategoryFilter
    ? favorites.filter(channel => channel.categoryId === selectedCategoryFilter)
    : favorites;

  // Grouper les favoris par catégorie pour l'affichage
  const favoritesByCategory = favorites.reduce((acc, channel) => {
    const categoryId = channel.categoryId || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'uncategorized') return 'Sans catégorie';
    const category = getCategoryById(categoryId as CategoryId);
    return category?.name || 'Catégorie inconnue';
  };

  const getCategoryColor = (categoryId: string) => {
    if (categoryId === 'uncategorized') return '#6B7280';
    const category = getCategoryById(categoryId as CategoryId);
    return category?.color || '#6B7280';
  };

  const handleCategoryChange = async (channelId: string, categoryId: CategoryId | null) => {
    try {
      if (categoryId) {
        await updateChannelCategory(channelId, categoryId);
      }
      setEditingChannelId(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
    }
  };

  if (showCategoryManager) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCategoryManager(false)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ← Retour aux favoris
          </button>
        </div>
        <CategoryManager />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chaînes Favorites</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCategoryManager(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Gérer les catégories"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Filtre par catégorie */}
        {categories.length > 0 && favorites.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Filter size={14} className="mr-1" />
              Filtrer par catégorie
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategoryFilter === null
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Toutes ({favorites.length})
              </button>
              {categories.map((category) => {
                const categoryCount = favorites.filter(fav => fav.categoryId === category.id).length;
                if (categoryCount === 0) return null;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryFilter(category.id)}
                    className={`flex items-center px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategoryFilter === category.id
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name} ({categoryCount})
                  </button>
                );
              })}
              
              {/* Favoris sans catégorie */}
              {favorites.filter(fav => !fav.categoryId).length > 0 && (
                <button
                  onClick={() => setSelectedCategoryFilter('uncategorized' as CategoryId)}
                  className={`flex items-center px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategoryFilter === 'uncategorized'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full mr-1.5 border border-gray-400" />
                  Sans catégorie ({favorites.filter(fav => !fav.categoryId).length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!currentUser && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Connectez-vous pour voir vos chaînes favorites</p>
        </div>
      )}

      {currentUser && filteredFavorites.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredFavorites.map((channel: Channel) => {
            const category = channel.categoryId ? getCategoryById(channel.categoryId) : null;
            
            return (
              <li key={channel.id} className="relative">
                <div 
                  className={`p-4 lg:p-5 flex items-center space-x-4 cursor-pointer transition-all duration-200 ${
                    selectedChannel === channel.id 
                      ? 'bg-red-50 dark:bg-red-900/20 border-r-4 border-red-600' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <div className="flex-shrink-0">
                    {channel.thumbnail ? (
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 shadow-sm">
                        <User size={24} className="text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {channel.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Chaîne YouTube
                      </p>
                      {editingChannelId === channel.id ? (
                        <div className="flex items-center space-x-2">
                          <CategorySelector
                            selectedCategoryId={channel.categoryId || null}
                            onCategorySelect={(categoryId) => handleCategoryChange(channel.id, categoryId)}
                            placeholder="Choisir catégorie"
                            className="text-xs"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChannelId(null);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {category ? (
                            <div className="flex items-center">
                              <div
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {category.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Sans catégorie
                            </span>
                          )}
                          {categories.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChannelId(channel.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Modifier la catégorie"
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(channel.id);
                    }}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label={`Supprimer ${channel.title}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : currentUser && favorites.length > 0 && filteredFavorites.length === 0 ? (
        <div className="p-8 lg:p-12 text-center">
          <Tag size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-3">
            Aucune chaîne dans cette catégorie
          </p>
          <button
            onClick={() => setSelectedCategoryFilter(null)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm underline"
          >
            Voir toutes les chaînes
          </button>
        </div>
      ) : currentUser ? (
        <div className="p-8 lg:p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <Plus size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-3">Pas encore de chaînes favorites</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
            Utilisez la barre de recherche ci-dessus pour trouver et ajouter vos chaînes YouTube préférées
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default FavoritesList;