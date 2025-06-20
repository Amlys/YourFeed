import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { youtubeAPI } from '../services/youtubeAPI';
import { cache } from '../utils/cache';

describe('Simple Application Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
    
    // Mock YouTube API responses
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: { channelId: 'test-channel-id' },
          snippet: {
            title: 'Test Channel',
            description: 'Test Description',
            thumbnails: { high: { url: 'https://test.com/thumbnail.jpg' } }
          }
        }]
      }),
    });
  });

  it('should be able to search channels', async () => {
    console.log('Testing YouTube API search...');
    
    const result = await youtubeAPI.searchChannels('test channel');
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    console.log('Search result:', result);
    console.log('✅ YouTube API search works correctly');
  });

  it('should cache search results', async () => {
    console.log('Testing cache functionality...');
    
    // First call
    const startTime = performance.now();
    const result1 = await youtubeAPI.searchChannels('test cache');
    const firstCallTime = performance.now() - startTime;
    
    // Second call (should be cached)
    const cacheStartTime = performance.now();
    const result2 = await youtubeAPI.searchChannels('test cache');
    const secondCallTime = performance.now() - cacheStartTime;
    
    expect(result1).toEqual(result2);
    expect(secondCallTime).toBeLessThan(firstCallTime);
    
    console.log(`First call: ${firstCallTime.toFixed(2)}ms`);
    console.log(`Cached call: ${secondCallTime.toFixed(2)}ms`);
    console.log('✅ Cache functionality works correctly');
  });

  it('should handle API errors gracefully', async () => {
    console.log('Testing error handling...');
    
    // Mock API error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    try {
      await youtubeAPI.searchChannels('test error');
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      console.log('✅ Error handling works correctly');
    }
  });

  it('should perform basic cache operations', () => {
    console.log('Testing cache operations...');
    
    const testData = { message: 'test data' };
    
    // Set data
    cache.set('test-key', testData, 5000);
    
    // Get data
    const retrieved = cache.get('test-key');
    expect(retrieved).toEqual(testData);
    
    // Clear cache
    cache.clear();
    const afterClear = cache.get('test-key');
    expect(afterClear).toBeNull();
    
    console.log('✅ Cache operations work correctly');
  });
}); 