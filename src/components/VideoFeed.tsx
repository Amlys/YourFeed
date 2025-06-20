import React, { useState, useMemo, useCallback } from 'react';
import VideoCard from './VideoCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { useVideos } from '../contexts/VideosContext';
import { useSearch } from '../contexts/SearchContext';
import { CategoryId } from '../types/common';
import { ExternalLink, RefreshCw, AlertCircle, Filter, X } from 'lucide-react';

const VideoFeed: React.FC = () => {
  const { favorites } = useFavorites();
  const { categories, getCategoryById } = useCategories();
  const { selectedChannel } = useSearch();
  const { 
    videos, 
    isLoading, 
    error,
    clearError,
    fetchLatestVideos,
    watchedVideoIds,
    laterVideoIds,
    markVideoWatched,
    markVideoLater,
    markVideoDeleted,
    removeVideoFromWatched,
    removeVideoFromLater,
    restoreVideoFromDeleted,
    getDeletedVideos,
    getVisibleVideos,
  } = useVideos();
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<'a_voir' | 'deja_vu' | 'plus_tard' | 'supprimees'>('a_voir');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryId | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    clearError();
    await fetchLatestVideos();
    setTimeout(() => setRefreshing(false), 1000);
  }, [clearError, fetchLatestVideos]);

  // Fonction pour obtenir la catégorie d'une chaîne
  const getChannelCategory = useCallback((channelId: string) => {
    const channel = favorites.find(f => f.id === channelId);
    return channel?.categoryId || null;
  }, [favorites]);

  // Mémoisation des vidéos filtrées avec filtrage par catégorie
  const filteredVideos = useMemo(() => {
    let baseVideos: typeof videos = [];
    
    if (tab === 'a_voir') {
      // 🆕 Vidéos à voir = visibles + non vues + non "plus tard"
      baseVideos = getVisibleVideos().filter(
        v => !watchedVideoIds.includes(v.id) && 
            !laterVideoIds.includes(v.id)
      );
    } else if (tab === 'deja_vu') {
      // 🆕 Vidéos vues = parmi les visibles + marquées comme vues
      baseVideos = getVisibleVideos().filter(
        v => watchedVideoIds.includes(v.id)
      );
    } else if (tab === 'plus_tard') {
      // 🆕 Vidéos plus tard = parmi les visibles + marquées "plus tard"
      baseVideos = getVisibleVideos().filter(
        v => laterVideoIds.includes(v.id)
      );
    } else if (tab === 'supprimees') {
      // 🆕 Vidéos supprimées = celles avec is_deleted: true
      baseVideos = getDeletedVideos();
    } else {
      // Par défaut : toutes les vidéos visibles
      baseVideos = getVisibleVideos();
    }

    // Filtrage par chaîne
    if (!showAll && selectedChannel) {
      baseVideos = baseVideos.filter(v => v.channelId === selectedChannel);
    }

    // Filtrage par catégorie
    if (selectedCategoryFilter) {
      baseVideos = baseVideos.filter(v => {
        const channelCategory = getChannelCategory(v.channelId);
        if (selectedCategoryFilter === ('uncategorized' as any)) {
          // Filtre pour les vidéos sans catégorie
          return channelCategory === null;
        }
        return channelCategory === selectedCategoryFilter;
      });
    }

    return baseVideos;
  }, [videos, tab, watchedVideoIds, laterVideoIds, showAll, selectedChannel, selectedCategoryFilter, getChannelCategory, getVisibleVideos, getDeletedVideos]);

  // Statistiques par catégorie pour les boutons de filtre
  const categoryStats = useMemo(() => {
    const stats = new Map<string, number>();
    
    // Compter les vidéos par catégorie pour l'onglet actuel
    let baseVideos: typeof videos = [];
    if (tab === 'a_voir') {
      baseVideos = getVisibleVideos().filter(
        v => !watchedVideoIds.includes(v.id) && 
            !laterVideoIds.includes(v.id)
      );
    } else if (tab === 'deja_vu') {
      baseVideos = getVisibleVideos().filter(v => watchedVideoIds.includes(v.id));
    } else if (tab === 'plus_tard') {
      baseVideos = getVisibleVideos().filter(v => laterVideoIds.includes(v.id));
    } else if (tab === 'supprimees') {
      baseVideos = getDeletedVideos();
    }

    // Appliquer le filtre par chaîne si nécessaire
    if (!showAll && selectedChannel) {
      baseVideos = baseVideos.filter(v => v.channelId === selectedChannel);
    }

    // Compter par catégorie
    baseVideos.forEach(video => {
      const categoryId = getChannelCategory(video.channelId);
      const key = categoryId || 'uncategorized';
      stats.set(key, (stats.get(key) || 0) + 1);
    });

    return stats;
  }, [videos, tab, watchedVideoIds, laterVideoIds, showAll, selectedChannel, getChannelCategory, getVisibleVideos, getDeletedVideos]);

  // Mémoisation du nom de la chaîne sélectionnée
  const selectedChannelName = useMemo(() => 
    selectedChannel ? favorites.find(f => f.id === selectedChannel)?.title : null,
    [selectedChannel, favorites]
  );

  // Mémoisation des handlers de changement d'onglet
  const handleTabChange = useCallback((newTab: 'a_voir' | 'deja_vu' | 'plus_tard' | 'supprimees') => {
    setTab(newTab);
    // Réinitialiser le filtre catégorie quand on change d'onglet
    setSelectedCategoryFilter(null);
  }, []);
  
  const handleShowAllToggle = useCallback(() => setShowAll(prev => !prev), []);

  // Handler pour le filtre par catégorie
  const handleCategoryFilter = useCallback((categoryId: CategoryId | null) => {
    setSelectedCategoryFilter(categoryId);
  }, []);

  // Mémoisation des handlers de vidéo pour éviter les re-créations
  const createVideoHandlers = useCallback((videoId: string) => ({
    onMarkWatched: () => markVideoWatched(videoId),
    onMarkLater: () => markVideoLater(videoId),
    onMarkDeleted: () => markVideoDeleted(videoId),
    onRemoveWatched: () => removeVideoFromWatched(videoId),
    onRemoveLater: () => removeVideoFromLater(videoId),
    onRestoreDeleted: () => restoreVideoFromDeleted(videoId),
  }), [markVideoWatched, markVideoLater, markVideoDeleted, removeVideoFromWatched, removeVideoFromLater, restoreVideoFromDeleted]);

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-6">
          <AlertCircle size={24} />
          <p className="text-lg">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 font-medium"
        >
          <RefreshCw size={18} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Onglets principaux */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => handleTabChange('a_voir')} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'a_voir' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              À voir
            </button>
            <button 
              onClick={() => handleTabChange('deja_vu')} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'deja_vu' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Déjà visionnée
            </button>
            <button 
              onClick={() => handleTabChange('plus_tard')} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'plus_tard' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Plus tard
            </button>
            <button 
              onClick={() => handleTabChange('supprimees')} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'supprimees' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Supprimées
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading || refreshing}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
              aria-label="Rafraîchir le flux"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {selectedChannel && !showAll && (
              <button
                onClick={handleShowAllToggle}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors shadow-sm"
              >
                Voir toutes les vidéos
              </button>
            )}
            {showAll && (
              <button
                onClick={handleShowAllToggle}
                className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 text-sm font-medium transition-colors shadow-sm"
              >
                Filtrer par chaîne
              </button>
            )}
          </div>
        </div>

        {/* Filtres par catégorie */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter size={16} />
              <span>Filtrer par catégorie :</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bouton "Toutes" */}
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategoryFilter
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Toutes
                {categoryStats.size > 0 && (
                  <span className="ml-1 text-xs opacity-80">
                    ({Array.from(categoryStats.values()).reduce((a, b) => a + b, 0)})
                  </span>
                )}
              </button>

              {/* Boutons pour chaque catégorie */}
              {categories.map((category) => {
                const count = categoryStats.get(category.id) || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.id)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategoryFilter === category.id
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    {count > 0 && (
                      <span className="ml-1 text-xs opacity-80">({count})</span>
                    )}
                  </button>
                );
              })}

              {/* Bouton "Sans catégorie" si des vidéos non catégorisées existent */}
              {(categoryStats.get('uncategorized') || 0) > 0 && (
                <button
                  onClick={() => handleCategoryFilter('uncategorized' as any)} // Filtre spécial pour les non catégorisées
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategoryFilter === ('uncategorized' as any)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full mr-2 border border-gray-400" />
                  Sans catégorie
                  <span className="ml-1 text-xs opacity-80">
                    ({categoryStats.get('uncategorized') || 0})
                  </span>
                </button>
              )}

              {/* Bouton pour effacer le filtre si une catégorie est sélectionnée */}
              {selectedCategoryFilter && (
                <button
                  onClick={() => handleCategoryFilter(null)}
                  className="flex items-center px-2 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Effacer le filtre"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
          {filteredVideos.map((video) => {
            const handlers = createVideoHandlers(video.id);
            return (
              <VideoCard 
                key={video.id} 
                video={video} 
                tab={tab}
                {...handlers}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
              {selectedCategoryFilter 
                ? `Aucune vidéo dans la catégorie "${getCategoryById(selectedCategoryFilter)?.name || 'Inconnue'}"`
                : tab === 'supprimees' 
                  ? "Aucune vidéo supprimée"
                  : selectedChannel 
                    ? "Aucune vidéo trouvée pour cette chaîne au cours du dernier mois" 
                    : favorites.length > 0 
                      ? "Aucune vidéo disponible pour le dernier mois"
                      : "Aucune vidéo disponible pour le moment"}
            </p>
            {selectedChannel && tab !== 'supprimees' && (
              <a
                href={`https://www.youtube.com/channel/${selectedChannel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                <span>Voir la chaîne sur YouTube</span>
                <ExternalLink size={16} className="ml-2" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;