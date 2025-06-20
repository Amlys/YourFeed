import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { youtubeAPI } from '../services/youtubeAPI';

// Test de debug pour diagnostiquer les problèmes
describe('Debug - Application Problems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have YouTube API key configured', () => {
    expect(import.meta.env.VITE_YOUTUBE_API_KEY).toBeDefined();
    expect(import.meta.env.VITE_YOUTUBE_API_KEY).not.toBe('');
    console.log('YouTube API Key:', import.meta.env.VITE_YOUTUBE_API_KEY);
  });

  it('should be able to call YouTube API search function', async () => {
    // Mock fetch pour éviter les vraies requêtes API dans les tests
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            id: { channelId: 'test-channel-id' },
            snippet: {
              title: 'Test Channel',
              description: 'Test Description',
              thumbnails: {
                high: { url: 'https://test.com/thumbnail.jpg' }
              }
            }
          }
        ]
      }),
    });

    try {
      const result = await youtubeAPI.searchChannels('test');
      console.log('Search result:', result);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      console.error('API Search Error:', error);
      throw error;
    }
  });

  it('should handle API errors gracefully', async () => {
    // Mock fetch pour simuler une erreur API
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      await youtubeAPI.searchChannels('test');
    } catch (error) {
      console.log('Expected error caught:', error);
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should test cache functionality', async () => {
    const { cache } = await import('../utils/cache');
    
    // Test basic cache operations
    cache.set('test-key', { data: 'test' }, 1000);
    const result = cache.get('test-key');
    
    console.log('Cache test result:', result);
    expect(result).toEqual({ data: 'test' });
  });
}); 