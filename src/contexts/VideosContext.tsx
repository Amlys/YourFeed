import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Video } from '../types';
import { youtubeAPI } from '../services/youtubeAPI';
import { useAuth } from './AuthContext';
import { useFavorites } from './FavoritesContext';
import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where 
} from 'firebase/firestore';

interface VideosContextType {
  videos: Video[];
  watchedVideoIds: string[];
  laterVideoIds: string[];
  isLoading: boolean;
  error: string | null;
  fetchLatestVideos: () => Promise<void>;
  markVideoWatched: (videoId: string) => void;
  markVideoLater: (videoId: string) => void;
  markVideoDeleted: (videoId: string) => void;
  removeVideoFromWatched: (videoId: string) => void;
  removeVideoFromLater: (videoId: string) => void;
  restoreVideoFromDeleted: (videoId: string) => void;
  clearError: () => void;
  // 🆕 Helpers pour les vidéos supprimées
  getDeletedVideos: () => Video[];
  getVisibleVideos: () => Video[];
}

const VideosContext = createContext<VideosContextType | undefined>(undefined);

export const VideosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { favorites } = useFavorites();
  const [videos, setVideos] = useState<Video[]>([]);
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const [laterVideoIds, setLaterVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Mémoisation des clés localStorage pour compatibilité (états utilisateur)
  const storageKeys = useMemo(() => {
    if (!currentUser) return null;
    return {
      watched: `watchedVideos_${currentUser.uid}`,
      later: `laterVideos_${currentUser.uid}`,
    };
  }, [currentUser]);

  // Charger les états "watched" et "later" depuis localStorage (compatibilité)
  useEffect(() => {
    if (!currentUser || !storageKeys) {
      setWatchedVideoIds([]);
      setLaterVideoIds([]);
      return;
    }
    
    const watched = localStorage.getItem(storageKeys.watched);
    const later = localStorage.getItem(storageKeys.later);
    
    setWatchedVideoIds(watched ? JSON.parse(watched) : []);
    setLaterVideoIds(later ? JSON.parse(later) : []);
  }, [currentUser, storageKeys]);

  // Sauvegarder les états "watched" et "later" dans localStorage
  useEffect(() => {
    if (!currentUser || !storageKeys) return;
    localStorage.setItem(storageKeys.watched, JSON.stringify(watchedVideoIds));
  }, [watchedVideoIds, currentUser, storageKeys]);

  useEffect(() => {
    if (!currentUser || !storageKeys) return;
    localStorage.setItem(storageKeys.later, JSON.stringify(laterVideoIds));
  }, [laterVideoIds, currentUser, storageKeys]);

  // 🆕 Charger les vidéos depuis Firestore avec listener temps réel
  useEffect(() => {
    if (!currentUser) {
      setVideos([]);
      return;
    }

    console.log(`[VideosContext] 🔥 Setting up Firestore listener for user ${currentUser.uid}`);
    
    const videosRef = collection(db, 'videos', currentUser.uid, 'userVideos');
    const unsubscribe = onSnapshot(videosRef, (snapshot) => {
      try {
        const videosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Video[];
        
        console.log(`[VideosContext] 📱 ${videosData.length} vidéos chargées depuis Firestore`);
        
        // Debug: afficher les vidéos supprimées
        const deletedVideos = videosData.filter(v => v.is_deleted);
        if (deletedVideos.length > 0) {
          console.log(`[VideosContext] 🗑️ ${deletedVideos.length} vidéos supprimées trouvées:`, 
            deletedVideos.map(v => ({ id: v.id, title: v.title, channelId: v.channelId })));
        }
        
        setVideos(videosData);
      } catch (error) {
        console.error('[VideosContext] Erreur lors du chargement des vidéos Firestore:', error);
        setError('Erreur lors du chargement des vidéos');
      }
    }, (error) => {
      console.error('[VideosContext] Erreur listener Firestore:', error);
      setError('Erreur de synchronisation des vidéos');
    });

    return unsubscribe;
  }, [currentUser]);

  // 🆕 Sauvegarder une vidéo dans Firestore
  const saveVideoToFirestore = useCallback(async (video: Video) => {
    if (!currentUser) return;
    
    try {
      const videoRef = doc(db, 'videos', currentUser.uid, 'userVideos', video.id);
      await setDoc(videoRef, video, { merge: true });
      console.log(`[VideosContext] 💾 Vidéo "${video.title}" sauvegardée dans Firestore`);
    } catch (error) {
      console.error(`[VideosContext] Erreur lors de la sauvegarde de la vidéo ${video.id}:`, error);
      throw error;
    }
  }, [currentUser]);

  // 🆕 Supprimer une vidéo de Firestore
  const deleteVideoFromFirestore = useCallback(async (videoId: string) => {
    if (!currentUser) return;
    
    try {
      const videoRef = doc(db, 'videos', currentUser.uid, 'userVideos', videoId);
      await deleteDoc(videoRef);
      console.log(`[VideosContext] 🗑️ Vidéo ${videoId} supprimée de Firestore`);
    } catch (error) {
      console.error(`[VideosContext] Erreur lors de la suppression de la vidéo ${videoId}:`, error);
      throw error;
    }
  }, [currentUser]);

  const markVideoWatched = useCallback((videoId: string) => {
    setWatchedVideoIds((prev) => prev.includes(videoId) ? prev : [...prev, videoId]);
    setLaterVideoIds((prev) => prev.filter(id => id !== videoId));
    
    // 🆕 Marquer comme non supprimée dans Firestore si elle existait
    const video = videos.find(v => v.id === videoId);
    if (video && video.is_deleted) {
      const updatedVideo = { ...video, is_deleted: false };
      saveVideoToFirestore(updatedVideo);
    }
  }, [videos, saveVideoToFirestore]);

  const markVideoLater = useCallback((videoId: string) => {
    setLaterVideoIds((prev) => prev.includes(videoId) ? prev : [...prev, videoId]);
    setWatchedVideoIds((prev) => prev.filter(id => id !== videoId));
    
    // 🆕 Marquer comme non supprimée dans Firestore si elle existait
    const video = videos.find(v => v.id === videoId);
    if (video && video.is_deleted) {
      const updatedVideo = { ...video, is_deleted: false };
      saveVideoToFirestore(updatedVideo);
    }
  }, [videos, saveVideoToFirestore]);

  const markVideoDeleted = useCallback(async (videoId: string) => {
    console.log('[VideosContext] 🗑️ Marquage vidéo comme supprimée:', videoId);
    
    setWatchedVideoIds((prev) => prev.filter(id => id !== videoId));
    setLaterVideoIds((prev) => prev.filter(id => id !== videoId));
    
    // 🆕 Marquer comme supprimée dans Firestore
    const video = videos.find(v => v.id === videoId);
    if (video) {
      try {
        const updatedVideo = { ...video, is_deleted: true };
        await saveVideoToFirestore(updatedVideo);
        console.log(`[VideosContext] ✅ Vidéo ${videoId} marquée comme supprimée dans Firestore`);
      } catch (error) {
        console.error(`[VideosContext] Erreur lors de la suppression de ${videoId}:`, error);
        setError('Erreur lors de la suppression de la vidéo');
      }
    }
  }, [videos, saveVideoToFirestore]);

  const removeVideoFromWatched = useCallback((videoId: string) => {
    setWatchedVideoIds((prev) => prev.filter(id => id !== videoId));
  }, []);

  const removeVideoFromLater = useCallback((videoId: string) => {
    setLaterVideoIds((prev) => prev.filter(id => id !== videoId));
  }, []);

  const restoreVideoFromDeleted = useCallback(async (videoId: string) => {
    console.log('[VideosContext] 🔄 Restauration de la vidéo supprimée:', videoId);
    
    // 🆕 Restaurer dans Firestore
    const video = videos.find(v => v.id === videoId);
    if (video) {
      try {
        const updatedVideo = { ...video, is_deleted: false };
        await saveVideoToFirestore(updatedVideo);
        console.log(`[VideosContext] ✅ Vidéo ${videoId} restaurée dans Firestore`);
      } catch (error) {
        console.error(`[VideosContext] Erreur lors de la restauration de ${videoId}:`, error);
        setError('Erreur lors de la restauration de la vidéo');
      }
    }
  }, [videos, saveVideoToFirestore]);

  // 🆕 Helper pour obtenir les vidéos supprimées
  const getDeletedVideos = useCallback(() => {
    return videos.filter(video => video.is_deleted);
  }, [videos]);

  // 🆕 Helper pour obtenir les vidéos visibles (non supprimées)
  const getVisibleVideos = useCallback(() => {
    return videos.filter(video => !video.is_deleted);
  }, [videos]);

  const fetchLatestVideos = useCallback(async () => {
    if (!currentUser) {
      setVideos([]);
      setIsLoading(false);
      return;
    }
    
    if (favorites.length === 0) {
      setVideos([]);
      setIsLoading(false);
      console.log("[VideosContext] No favorites to fetch videos for.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    console.info(`[VideosContext] 🚀 Fetching latest videos for ${favorites.length} favorite(s) of user ${currentUser.uid}.`);
    
    try {
      const channelIds = favorites.map(channel => channel.id);
      const latestVideos = await youtubeAPI.getLatestVideos(channelIds);
      
      // 🆕 LOGIQUE INTELLIGENTE DE COMPARAISON AVEC FIRESTORE
      for (const newVideo of latestVideos) {
        // Ajouter la thumbnail de la chaîne
        const videoWithThumbnail = {
          ...newVideo,
          channelThumbnail: favorites.find(f => f.id === newVideo.channelId)?.thumbnail || '',
          is_deleted: false, // Par défaut, nouvelle vidéo = visible
        };
        
        // Chercher si cette EXACTE vidéo (même ID) existe déjà dans Firestore
        const existingVideo = videos.find(v => v.id === newVideo.id);
        
        if (existingVideo) {
          // 🎯 MÊME VIDÉO TROUVÉE
          if (existingVideo.is_deleted) {
            console.log(`[VideosContext] 🗑️ Vidéo "${newVideo.title}" (ID: ${newVideo.id}) toujours supprimée, ne pas afficher`);
            // Ne rien faire - la vidéo reste supprimée
          } else {
            console.log(`[VideosContext] ✅ Vidéo "${newVideo.title}" (ID: ${newVideo.id}) déjà en base et visible`);
            // Mettre à jour les métadonnées si nécessaire
            await saveVideoToFirestore(videoWithThumbnail);
          }
        } else {
          // 🎯 NOUVELLE VIDÉO (ID différent)
          
          // Vérifier s'il y a une vidéo supprimée de cette chaîne
          const deletedVideoFromChannel = videos.find(
            v => v.channelId === newVideo.channelId && v.is_deleted
          );
          
          if (deletedVideoFromChannel) {
            console.log(`[VideosContext] 🔄 NOUVELLE vidéo "${newVideo.title}" (ID: ${newVideo.id}) détectée pour ${newVideo.channelTitle}. ` +
              `Remplace l'ancienne vidéo supprimée "${deletedVideoFromChannel.title}" (ID: ${deletedVideoFromChannel.id}) → RESTAURATION AUTOMATIQUE`);
            
            // Supprimer l'ancienne vidéo supprimée de Firestore
            await deleteVideoFromFirestore(deletedVideoFromChannel.id);
          } else {
            console.log(`[VideosContext] 🆕 Nouvelle vidéo "${newVideo.title}" (ID: ${newVideo.id}) pour ${newVideo.channelTitle}`);
          }
          
          // Sauvegarder la nouvelle vidéo (visible par défaut)
          await saveVideoToFirestore(videoWithThumbnail);
        }
      }
      
      console.log(`[VideosContext] ✅ Traitement terminé pour ${latestVideos.length} vidéos`);
    } catch (error: any) {
      console.error(`[VideosContext] Error fetching latest videos for user ${currentUser.uid}:`, error.message || error);
      setError(error.message || 'Failed to fetch latest videos');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, favorites, videos, saveVideoToFirestore, deleteVideoFromFirestore]);

  // Récupérer les vidéos lorsque les favoris changent
  useEffect(() => {
    if (currentUser && favorites.length > 0) {
      console.log("[VideosContext] Favorites changed or user changed, fetching latest videos.");
      fetchLatestVideos();
    }
  }, [currentUser, favorites, fetchLatestVideos]);

  // Mémoisation de la valeur du contexte pour éviter les re-renders inutiles
  const contextValue = useMemo(() => ({
    videos,
    watchedVideoIds,
    laterVideoIds,
    isLoading,
    error,
    fetchLatestVideos,
    markVideoWatched,
    markVideoLater,
    markVideoDeleted,
    removeVideoFromWatched,
    removeVideoFromLater,
    restoreVideoFromDeleted,
    clearError,
    getDeletedVideos,
    getVisibleVideos,
  }), [
    videos,
    watchedVideoIds,
    laterVideoIds,
    isLoading,
    error,
    fetchLatestVideos,
    markVideoWatched,
    markVideoLater,
    markVideoDeleted,
    removeVideoFromWatched,
    removeVideoFromLater,
    restoreVideoFromDeleted,
    clearError,
    getDeletedVideos,
    getVisibleVideos,
  ]);

  return (
    <VideosContext.Provider value={contextValue}>
      {children}
    </VideosContext.Provider>
  );
};

export const useVideos = (): VideosContextType => {
  const context = useContext(VideosContext);
  if (context === undefined) {
    throw new Error('useVideos must be used within a VideosProvider');
  }
  return context;
}; 