import { Channel, Video } from '../types';
import { cache, CACHE_TTL, cacheKeys } from '../utils/cache';
import { 
  YouTubeSearchResponseSchema,
  YouTubeChannelsResponseSchema,
  YouTubeChannelContentDetailsSchema,
  YouTubePlaylistItemsResponseSchema,
  YouTubeVideoContentDetailsResponse,
  ChannelSchema,
  VideoSchema,
  validateChannel
} from '../types/schemas';
import { ValidationService } from './validation';
import { transformAndValidateChannels } from './transformers';

// YouTube API key
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const youtubeAPI = {
  // Search for YouTube channels
  searchChannels: async (query: string): Promise<Channel[]> => {
    console.info(`[youtubeAPI] Searching channels for query: "${query}"`);
    
    // Check cache first
    const cacheKey = cacheKeys.searchResults(query);
    const cachedResults = cache.get<Channel[]>(cacheKey);
    if (cachedResults) {
      console.info(`[youtubeAPI] Using cached results for query: "${query}"`);
      return cachedResults;
    }
    
    try {
      const response = await fetch(
        `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=channel&maxResults=10&key=${API_KEY}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[youtubeAPI] Failed to fetch channels. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
        throw new Error(`Failed to fetch channels: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[youtubeAPI] Raw search response:`, JSON.stringify(data, null, 2));

      if (!data.items || data.items.length === 0) {
        console.warn('[youtubeAPI] No items found in API response for searchChannels.');
        return []; 
      }

      console.log(`[youtubeAPI] Found ${data.items.length} raw search results`);
      
      // Extraire les channel IDs et les données de base
      const channelIds = data.items.map((item: any) => item.id?.channelId).filter(Boolean);
      console.log(`[youtubeAPI] Extracted channel IDs:`, channelIds);
      
      if (channelIds.length === 0) {
        console.warn('[youtubeAPI] No valid channel IDs found');
        return [];
      }

      // Récupérer les détails complets des chaînes pour avoir les vraies miniatures
      console.log(`[youtubeAPI] Fetching detailed channel information for ${channelIds.length} channels`);
      const channelsDetailsResponse = await fetch(
        `${BASE_URL}/channels?part=snippet&id=${channelIds.join(',')}&key=${API_KEY}`
      );

      if (!channelsDetailsResponse.ok) {
        console.warn(`[youtubeAPI] Failed to fetch channel details, falling back to search results`);
        
        // Fallback: utiliser les données de search directement avec logs de débogage
        const fallbackChannels: Channel[] = [];
        
        for (const item of data.items) {
          if (item.id?.channelId && item.snippet?.title) {
            const thumbnailUrl = item.snippet.thumbnails?.high?.url || 
                                item.snippet.thumbnails?.medium?.url || 
                                item.snippet.thumbnails?.default?.url || 
                                '';
            
            console.log(`[youtubeAPI] Creating fallback channel for ${item.snippet.title} with thumbnail: ${thumbnailUrl}`);
            
            const channel: Channel = {
              id: item.id.channelId,
              title: item.snippet.title,
              description: item.snippet.description || '',
              thumbnail: thumbnailUrl,
            };
            fallbackChannels.push(channel);
          }
        }
        
        console.log(`[youtubeAPI] Created ${fallbackChannels.length} fallback channels`);
        
        // Cache les résultats de fallback
        if (fallbackChannels.length > 0) {
          cache.set(cacheKey, fallbackChannels, CACHE_TTL.SEARCH_RESULTS);
        }
        
        return fallbackChannels;
      }

      const channelsDetailsData = await channelsDetailsResponse.json();
      console.log(`[youtubeAPI] Channel details response:`, JSON.stringify(channelsDetailsData, null, 2));

      if (!channelsDetailsData.items || channelsDetailsData.items.length === 0) {
        console.warn('[youtubeAPI] No channel details found, using search results as fallback');
        
        // Même fallback que ci-dessus avec logs de débogage
        const fallbackChannels: Channel[] = [];
        
        for (const item of data.items) {
          if (item.id?.channelId && item.snippet?.title) {
            const thumbnailUrl = item.snippet.thumbnails?.high?.url || 
                                item.snippet.thumbnails?.medium?.url || 
                                item.snippet.thumbnails?.default?.url || 
                                '';
            
            console.log(`[youtubeAPI] Creating fallback channel for ${item.snippet.title} with thumbnail: ${thumbnailUrl}`);
            
            const channel: Channel = {
              id: item.id.channelId,
              title: item.snippet.title,
              description: item.snippet.description || '',
              thumbnail: thumbnailUrl,
            };
            fallbackChannels.push(channel);
          }
        }
        
        console.log(`[youtubeAPI] Created ${fallbackChannels.length} fallback channels from search`);
        
        if (fallbackChannels.length > 0) {
          cache.set(cacheKey, fallbackChannels, CACHE_TTL.SEARCH_RESULTS);
        }
        
        return fallbackChannels;
      }

      // Créer le mapping des thumbnails haute qualité depuis les détails des chaînes
      const detailsMap = new Map();
      for (const ch of channelsDetailsData.items) {
        const highQualityThumbnail = ch.snippet.thumbnails?.high?.url || 
                                   ch.snippet.thumbnails?.medium?.url || 
                                   ch.snippet.thumbnails?.default?.url || 
                                   '';
        
        console.log(`[youtubeAPI] Channel ${ch.id} (${ch.snippet.title}) has thumbnail: ${highQualityThumbnail}`);
        
        detailsMap.set(ch.id, {
          thumbnail: highQualityThumbnail,
          description: ch.snippet.description || '',
        });
      }

      // Créer les objets Channel finaux en combinant search et détails
      const results: Channel[] = [];
      
      for (const item of data.items) {
        if (item.id?.channelId && item.snippet?.title) {
          const channelId = item.id.channelId;
          const details = detailsMap.get(channelId) || {};
          
          // Priorité aux thumbnails des détails, puis fallback sur search
          const finalThumbnail = details.thumbnail || 
                                item.snippet.thumbnails?.high?.url || 
                                item.snippet.thumbnails?.medium?.url || 
                                item.snippet.thumbnails?.default?.url || 
                                '';
          
          console.log(`[youtubeAPI] Final channel ${item.snippet.title} thumbnail: ${finalThumbnail}`);
          
          const channel: Channel = {
            id: channelId,
            title: item.snippet.title,
            description: details.description || item.snippet.description || '',
            thumbnail: finalThumbnail,
          };
          
          results.push(channel);
        }
      }
      
      console.log(`[youtubeAPI] Successfully created ${results.length} channel objects`);
      
      // Cache the results
      if (results.length > 0) {
        cache.set(cacheKey, results, CACHE_TTL.SEARCH_RESULTS);
        console.info(`[youtubeAPI] Cached ${results.length} search results for query: "${query}"`);
      }
      
      return results;
    } catch (error) {
      console.error('[youtubeAPI] Error in searchChannels:', error);
      throw error; // Propager l'erreur
    }
  },

  // Helper method to get latest video for a single channel
  getChannelLatestVideo: async (channelId: string): Promise<Video | null> => {
    console.log(`[youtubeAPI] Processing channel ID: ${channelId}`);
    try {
      // 1. Get the uploads playlist ID for the channel
      console.log(`[youtubeAPI] Fetching channel details for ID: ${channelId}`);
      const channelDetailsResponse = await fetch(
        `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
      );

      if (!channelDetailsResponse.ok) {
        const errorText = await channelDetailsResponse.text();
        console.warn(`[youtubeAPI] Failed to fetch channel details for ${channelId}. Status: ${channelDetailsResponse.status} ${channelDetailsResponse.statusText}. Response: ${errorText}`);
        return null;
      }

      const channelData = await channelDetailsResponse.json();
      if (!channelData.items || channelData.items.length === 0 || !channelData.items[0].contentDetails?.relatedPlaylists?.uploads) {
        console.warn(`[youtubeAPI] Could not find uploads playlist for channel ${channelId}. Data:`, channelData);
        return null;
      }
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      console.log(`[youtubeAPI] Found uploads playlist ID ${uploadsPlaylistId} for channel ${channelId}`);

      // 2. Get multiple recent videos to ensure we find at least one valid video after filtering
      // Récupération des 10 vidéos les plus récentes pour gérer les cas où les premières sont filtrées
      console.log(`[youtubeAPI] Fetching recent videos from playlist ID: ${uploadsPlaylistId}`);
      const playlistItemsResponse = await fetch(
        `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${API_KEY}`
      );

      if (!playlistItemsResponse.ok) {
        const errorText = await playlistItemsResponse.text();
        console.warn(`[youtubeAPI] Failed to fetch videos for playlist ${uploadsPlaylistId} (channel ${channelId}). Status: ${playlistItemsResponse.status} ${playlistItemsResponse.statusText}. Response: ${errorText}`);
        return null;
      }

      const playlistData = await playlistItemsResponse.json();

      if (!playlistData.items || playlistData.items.length === 0) {
        console.warn(`[youtubeAPI] No videos found in uploads playlist for channel ${channelId}`);
        return null;
      }

      console.log(`[youtubeAPI] Found ${playlistData.items.length} recent videos for channel ${channelId}, filtering...`);

      // 3. Itérer sur les vidéos récentes pour trouver la première qui respecte nos critères
      for (let i = 0; i < playlistData.items.length; i++) {
        const videoItem = playlistData.items[i].snippet;
        const videoId = videoItem.resourceId.videoId;
        
        console.log(`[youtubeAPI] Checking video ${i + 1}/${playlistData.items.length}: "${videoItem.title}" (ID: ${videoId})`);
        
        // Filtrer les Shorts
        const isShort =
          videoItem.title.toLowerCase().includes('shorts') ||
          videoItem.title.toLowerCase().includes('#shorts') ||
          videoItem.description.toLowerCase().includes('shorts') ||
          videoItem.description.toLowerCase().includes('#shorts') ||
          (videoItem.thumbnails &&
            (videoItem.thumbnails.high?.url?.includes('/shorts/') ||
             videoItem.thumbnails.medium?.url?.includes('/shorts/') ||
             videoItem.thumbnails.default?.url?.includes('/shorts/')));
        
        if (isShort) {
          console.log(`[youtubeAPI] Video "${videoItem.title}" ignorée car c'est un Short.`);
          continue; // Passer à la vidéo suivante
        }

        // Récupérer la durée de la vidéo
        const videoDetailsResponse = await fetch(
          `${BASE_URL}/videos?part=contentDetails&id=${videoId}&key=${API_KEY}`
        );
        
        if (!videoDetailsResponse.ok) {
          const errorText = await videoDetailsResponse.text();
          console.warn(`[youtubeAPI] Failed to fetch video details for ${videoId}. Status: ${videoDetailsResponse.status} ${videoDetailsResponse.statusText}. Response: ${errorText}`);
          continue; // Passer à la vidéo suivante en cas d'erreur
        }
        
        const videoDetailsData = await videoDetailsResponse.json();
        if (!videoDetailsData.items || videoDetailsData.items.length === 0) {
          console.warn(`[youtubeAPI] No details found for video ${videoId}`);
          continue; // Passer à la vidéo suivante
        }
        
        const durationISO = videoDetailsData.items[0].contentDetails.duration;
        const durationSeconds = youtubeAPI.parseISODurationToSeconds(durationISO);
        
        // Filtrer les vidéos <= 3 minutes (180 secondes)
        if (durationSeconds <= 180) {
          console.log(`[youtubeAPI] Video "${videoItem.title}" ignorée car durée <= 3min (${durationSeconds}s = ${Math.floor(durationSeconds / 60)}m${durationSeconds % 60}s)`);
          continue; // Passer à la vidéo suivante
        }

        // Cette vidéo respecte tous nos critères !
        console.log(`[youtubeAPI] ✅ Video "${videoItem.title}" acceptée (durée: ${Math.floor(durationSeconds / 60)}m${durationSeconds % 60}s)`);
        
        return {
          id: videoId,
          title: videoItem.title,
          description: videoItem.description,
          thumbnail: videoItem.thumbnails.high?.url || videoItem.thumbnails.default?.url,
          channelId: videoItem.channelId,
          channelTitle: videoItem.channelTitle,
          publishedAt: videoItem.publishedAt,
          channelThumbnail: '', // Sera rempli par le contexte
        };
      }

      // Aucune vidéo valide trouvée dans les 10 plus récentes
      console.log(`[youtubeAPI] Aucune vidéo valide trouvée dans les ${playlistData.items.length} vidéos récentes de la chaîne ${channelId} (toutes filtrées)`);
      return null;
      
    } catch (channelError: any) {
      console.warn(`[youtubeAPI] Error processing channel ${channelId}:`, channelError.message || channelError);
      return null;
    }
  },

  // Utility function to parse ISO 8601 duration to seconds
  parseISODurationToSeconds: (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  },

  // Get latest videos from each channel (Optimized with parallel processing)
  getLatestVideos: async (channelIds: string[]): Promise<Video[]> => {
    console.info(`[youtubeAPI] Fetching latest videos for channel IDs: ${channelIds.join(', ')}`);
    if (channelIds.length === 0) {
      console.log('[youtubeAPI] No channel IDs provided to getLatestVideos.');
      return [];
    }
    
    // Check cache first
    const cacheKey = cacheKeys.latestVideos(channelIds);
    const cachedVideos = cache.get<Video[]>(cacheKey);
    if (cachedVideos) {
      console.info(`[youtubeAPI] Using cached videos for channels: ${channelIds.join(', ')}`);
      return cachedVideos;
    }
    
    try {
      // Optimisation: Traitement parallèle des chaînes
      console.info(`[youtubeAPI] Starting parallel processing of ${channelIds.length} channels`);
      const startTime = performance.now();
      
      const videoPromises = channelIds.map(channelId => 
        youtubeAPI.getChannelLatestVideo(channelId)
      );
      
      const videoResults = await Promise.allSettled(videoPromises);
      const allVideos: Video[] = [];
      
      videoResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allVideos.push(result.value);
        } else if (result.status === 'rejected') {
          console.warn(`[youtubeAPI] Failed to fetch video for channel ${channelIds[index]}:`, result.reason);
        }
      });

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);
      console.info(`[youtubeAPI] Parallel processing completed in ${processingTime}ms. Successfully fetched ${allVideos.length}/${channelIds.length} videos.`);

      // Sort videos by publication date
      const sortedVideos = allVideos.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      // Cache the results
      cache.set(cacheKey, sortedVideos, CACHE_TTL.VIDEOS);
      console.info(`[youtubeAPI] Cached ${sortedVideos.length} videos for channels: ${channelIds.join(', ')}`);
      
      return sortedVideos;
    } catch (error: any) {
      console.error('[youtubeAPI] Error in getLatestVideos:', error.message || error);
      throw error;
    }
  },

  // Récupère les infos détaillées d'une chaîne (dont la vraie miniature)
  getChannelDetails: async (channelId: string): Promise<Channel | null> => {
    console.info(`[youtubeAPI] Fetching channel details for: ${channelId}`);
    
    // Check cache first
    const cacheKey = cacheKeys.channelDetails(channelId);
    const cachedChannel = cache.get<Channel>(cacheKey);
    if (cachedChannel) {
      console.info(`[youtubeAPI] Using cached channel details for: ${channelId}`);
      return cachedChannel;
    }
    
    try {
      const response = await fetch(
        `${BASE_URL}/channels?part=snippet&id=${channelId}&key=${API_KEY}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[youtubeAPI] Failed to fetch channel details for ${channelId}. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
        return null;
      }

      const data = await response.json();
      console.log(`[youtubeAPI] Channel details raw response for ${channelId}:`, JSON.stringify(data, null, 2));
      
      if (!data.items || data.items.length === 0) {
        console.warn(`[youtubeAPI] No channel found for ID: ${channelId}`);
        return null;
      }
      
      const channelData = data.items[0];
      
      // Construire manuellement l'objet Channel comme dans searchChannels
      const channelDetails: Channel = {
        id: channelData.id,
        title: channelData.snippet?.title || '',
        description: channelData.snippet?.description || '',
        thumbnail: channelData.snippet?.thumbnails?.high?.url || 
                  channelData.snippet?.thumbnails?.medium?.url || 
                  channelData.snippet?.thumbnails?.default?.url || 
                  '',
      };
      
      console.log(`[youtubeAPI] Successfully created channel details for ${channelData.snippet?.title}:`, channelDetails);
      
      // Cache the channel details
      cache.set(cacheKey, channelDetails, CACHE_TTL.CHANNEL_DETAILS);
      console.info(`[youtubeAPI] Cached channel details for: ${channelId}`);
      
      return channelDetails;
    } catch (error) {
      console.error(`[youtubeAPI] Error in getChannelDetails for ${channelId}:`, error);
      return null;
    }
  },
};

// Mock data functions for development (peuvent être supprimées si plus utilisées)
/* // Commenter ou supprimer si getMockChannels n'est plus utilisé
function getMockChannels(query: string): Channel[] {
  // ... (contenu original)
}
*/

/* // Commenter ou supprimer si getMockVideos n'est plus utilisé
function getMockVideos(channelIds: string[]): Video[] {
  // ... (contenu original)
}
*/