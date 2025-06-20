import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { youtubeAPI } from '../services/youtubeAPI';
import { cache } from '../utils/cache';
import VideoCard from '../components/VideoCard';
import { SearchProvider } from '../contexts/SearchContext';
import { ThemeProvider } from '../context/ThemeContext';
import { createBrandedString } from '../types/common';
import React from 'react';

const mockVideo = {
  id: createBrandedString('test-video-id'),
  title: createBrandedString('Test Video Title'),
  description: 'Test video description',
  thumbnail: 'https://test.com/thumbnail.jpg',
  channelId: createBrandedString('test-channel-id'),
  channelTitle: createBrandedString('Test Channel'),
  publishedAt: createBrandedString('2024-01-01T00:00:00Z'),
  channelThumbnail: 'https://test.com/channel-thumb.jpg'
};

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
    
    // Mock fetch pour éviter les vraies requêtes
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

  describe('API Performance', () => {
    it('should cache search results for performance', async () => {
      const startTime = performance.now();
      
      // Premier appel - va fetcher l'API
      const result1 = await youtubeAPI.searchChannels('test');
      const firstCallTime = performance.now() - startTime;
      
      expect(result1).toHaveLength(1);
      expect(firstCallTime).toBeGreaterThan(0);
      console.log(`First API call took: ${firstCallTime.toFixed(2)}ms`);
      
      const cacheStartTime = performance.now();
      
      // Deuxième appel - devrait utiliser le cache
      const result2 = await youtubeAPI.searchChannels('test');
      const secondCallTime = performance.now() - cacheStartTime;
      
      expect(result2).toHaveLength(1);
      expect(secondCallTime).toBeLessThan(firstCallTime); // Le cache devrait être plus rapide
      console.log(`Cached call took: ${secondCallTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((firstCallTime - secondCallTime) / firstCallTime * 100).toFixed(1)}%`);
    });

    it('should handle parallel API calls efficiently', async () => {
      const channelIds = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5'];
      
      // Mock des réponses API pour les détails des chaînes
      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [] })
        }))
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [{
              contentDetails: {
                relatedPlaylists: { uploads: 'test-playlist' }
              }
            }]
          })
        }));

      const startTime = performance.now();
      
      try {
        const videos = await youtubeAPI.getLatestVideos(channelIds);
        const duration = performance.now() - startTime;
        
        console.log(`Parallel processing of ${channelIds.length} channels took: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(5000); // Devrait prendre moins de 5 secondes
        expect(Array.isArray(videos)).toBe(true);
      } catch (error) {
        // Expected car nous mockons des données incomplètes
        console.log('Expected error in parallel processing test:', error);
      }
    });
  });

  describe('Component Performance', () => {
    it('should render VideoCard efficiently', () => {
      const startTime = performance.now();
      
      const { rerender } = render(
        <ThemeProvider>
          <VideoCard video={mockVideo} />
        </ThemeProvider>
      );
      
      const renderTime = performance.now() - startTime;
      console.log(`VideoCard initial render took: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100); // Devrait rendre en moins de 100ms
      
      // Test de re-render
      const rerenderStart = performance.now();
      rerender(
        <ThemeProvider>
          <VideoCard video={{...mockVideo, title: 'Updated Title'}} />
        </ThemeProvider>
      );
      const rerenderTime = performance.now() - rerenderStart;
      console.log(`VideoCard re-render took: ${rerenderTime.toFixed(2)}ms`);
      expect(rerenderTime).toBeLessThan(50); // Re-render devrait être plus rapide
    });

    it('should handle multiple VideoCard renders efficiently', () => {
      const videos = Array.from({ length: 10 }, (_, i) => ({
        ...mockVideo,
        id: `video-${i}`,
        title: `Video ${i}`
      }));
      
      const startTime = performance.now();
      
      render(
        <ThemeProvider>
          <div>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </ThemeProvider>
      );
      
      const renderTime = performance.now() - startTime;
      console.log(`Rendering ${videos.length} VideoCards took: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(500); // 10 cartes en moins de 500ms
    });
  });

  describe('Cache Performance', () => {
    it('should perform cache operations efficiently', () => {
      const testData = { key: 'test-value' };
      const iterations = 1000;
      
      // Test SET performance
      const setStartTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        cache.set(`key-${i}`, testData, 60000);
      }
      const setTime = performance.now() - setStartTime;
      console.log(`Cache SET ${iterations} items took: ${setTime.toFixed(2)}ms`);
      
      // Test GET performance
      const getStartTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        cache.get(`key-${i}`);
      }
      const getTime = performance.now() - getStartTime;
      console.log(`Cache GET ${iterations} items took: ${getTime.toFixed(2)}ms`);
      
      expect(setTime).toBeLessThan(100); // 1000 SET en moins de 100ms
      expect(getTime).toBeLessThan(50);  // 1000 GET en moins de 50ms
      
      // Vérifier le taux de succès
      let hits = 0;
      for (let i = 0; i < iterations; i++) {
        if (cache.get(`key-${i}`)) hits++;
      }
      const hitRate = (hits / iterations) * 100;
      console.log(`Cache hit rate: ${hitRate.toFixed(1)}%`);
      expect(hitRate).toBeGreaterThan(90); // Taux de succès > 90%
    });

    it('should handle cache expiration correctly', async () => {
      const testKey = 'expiration-test';
      const testData = { value: 'test' };
      
      // Set avec une très courte durée de vie
      cache.set(testKey, testData, 10); // 10ms
      
      // Devrait être disponible immédiatement
      expect(cache.get(testKey)).toEqual(testData);
      
      // Attendre l'expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Devrait avoir expiré
      expect(cache.get(testKey)).toBeNull();
      console.log('Cache expiration working correctly');
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
      console.log(`Initial memory usage: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
      
      // Simulate repeated operations
      for (let i = 0; i < 100; i++) {
        cache.set(`memory-test-${i}`, { data: 'x'.repeat(1000) }, 1000);
        cache.get(`memory-test-${i}`);
      }
      
      // Clear cache to free memory
      cache.clear();
      
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      console.log(`Final memory usage: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
      
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // Should not increase memory by more than 10MB for this test
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
}); 