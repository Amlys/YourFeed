import React, { useState, useMemo, useCallback } from 'react';
import { Play, Calendar, ExternalLink, Trash2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Video } from '../types';
import OptimizedImage from './OptimizedImage';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface VideoCardProps {
  video: Video;
  tab?: 'a_voir' | 'deja_vu' | 'plus_tard' | 'supprimees';
  onMarkWatched?: () => void;
  onMarkLater?: () => void;
  onMarkDeleted?: () => void;
  onRemoveWatched?: () => void;
  onRemoveLater?: () => void;
  onRestoreDeleted?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({ 
  video, 
  tab, 
  onMarkWatched, 
  onMarkLater, 
  onMarkDeleted,
  onRemoveWatched, 
  onRemoveLater,
  onRestoreDeleted
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Performance monitoring  
  usePerformanceMonitor('VideoCard', {
    trackRenderTime: true,
    trackMemory: false,
    logInterval: 10000,
  });

  // Mémoisation du formatage de date
  const formattedDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  }, [video.publishedAt]);

  // Mémoisation des handlers pour éviter les re-créations
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleOpenModal = useCallback(() => setModalOpen(true), []);
  const handleCloseModal = useCallback(() => setModalOpen(false), []);

  // Mémoisation des URL YouTube
  const youtubeVideoUrl = useMemo(() => 
    `https://www.youtube.com/watch?v=${video.id}`, [video.id]);
  const youtubeEmbedUrl = useMemo(() => 
    `https://www.youtube.com/embed/${video.id}`, [video.id]);

  return (
    <>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
          <OptimizedImage
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full"
            loading="lazy"
            quality="medium"
          />
          <div 
            className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={handleOpenModal}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transform transition-all duration-300 hover:scale-110 shadow-lg"
              aria-label="Play video"
            >
              <Play size={28} fill="white" />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          <h3 
            className="text-gray-900 dark:text-white font-semibold text-lg line-clamp-2 mb-3 h-14 leading-7"
            title={video.title}
          >
            {video.title}
          </h3>
          
          <div className="flex items-center mb-4">
            <OptimizedImage
              src={video.channelThumbnail}
              alt={video.channelTitle}
              className="w-8 h-8 rounded-full mr-3"
              loading="lazy"
              quality="low"
              width={32}
              height={32}
            />
            <span className="text-base text-gray-700 dark:text-gray-300 font-medium">
              {video.channelTitle}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Calendar size={16} className="mr-2" />
            <span>Publié {formattedDate}</span>
          </div>
          
          <div className="flex gap-2 mt-4 flex-wrap">
            {tab === 'a_voir' && (
              <>
                <button 
                  onClick={onMarkWatched} 
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                >
                  Déjà vu
                </button>
                <button 
                  onClick={onMarkLater} 
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Plus tard
                </button>
                <button 
                  onClick={onMarkDeleted} 
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm"
                  title="Supprimer cette vidéo"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </>
            )}
            {tab === 'deja_vu' && (
              <>
                <button 
                  onClick={onRemoveWatched} 
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors shadow-sm"
                >
                  Retirer
                </button>
                <button 
                  onClick={onMarkDeleted} 
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm"
                  title="Supprimer cette vidéo"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </>
            )}
            {tab === 'plus_tard' && (
              <>
                <button 
                  onClick={onRemoveLater} 
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors shadow-sm"
                >
                  Retirer
                </button>
                <button 
                  onClick={onMarkDeleted} 
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm"
                  title="Supprimer cette vidéo"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </>
            )}
            {tab === 'supprimees' && (
              <button 
                onClick={onRestoreDeleted} 
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                title="Restaurer cette vidéo"
              >
                <RotateCcw size={14} />
                Restaurer
              </button>
            )}
          </div>
        </div>
        
        <div className="px-5 pb-5">
          <a 
            href={youtubeVideoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            <span>Voir sur YouTube</span>
            <ExternalLink size={14} className="ml-2" />
          </a>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden max-w-6xl w-full shadow-2xl">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={youtubeEmbedUrl}
                title={video.title}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {video.title}
              </h3>
              <div className="flex justify-between items-center">
                              <div className="flex items-center">
                <OptimizedImage
                  src={video.channelThumbnail}
                  alt={video.channelTitle}
                  className="w-10 h-10 rounded-full mr-3"
                  loading="lazy"
                  quality="low"
                  width={40}
                  height={40}
                />
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {video.channelTitle}
                  </span>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;