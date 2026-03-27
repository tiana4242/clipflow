// Batched API client to reduce network dependency chains

import { requestCache, CACHE_KEYS, CACHE_TTL } from './requestCache';

interface BatchedRequest {
  url: string;
  options: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  priority: 'high' | 'normal' | 'low';
}

class BatchedAPIClient {
  private batchQueue: BatchedRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms batching window
  private readonly MAX_BATCH_SIZE = 10;
  
  constructor() {
    // Process batches periodically
    this.startBatchProcessor();
  }
  
  async fetch(url: string, options: RequestInit = {}, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<Response> {
    // High priority requests skip batching
    if (priority === 'high') {
      return this.executeRequest(url, options);
    }
    
    return new Promise<Response>((resolve, reject) => {
      this.batchQueue.push({
        url,
        options,
        resolve,
        reject,
        priority
      });
      
      // Trigger batch processing if queue is getting full
      if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
        this.processBatch();
      }
    });
  }
  
  private startBatchProcessor() {
    // Process batched requests periodically
    this.batchTimeout = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }, this.BATCH_DELAY);
  }
  
  private async processBatch() {
    if (this.batchQueue.length === 0) return;
    
    // Take a batch of requests
    const batch = this.batchQueue.splice(0, this.MAX_BATCH_SIZE);
    
    // Sort by priority
    batch.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Execute requests in parallel
    const promises = batch.map(({ url, options, resolve, reject }) =>
      this.executeRequest(url, options)
        .then(resolve)
        .catch(reject)
    );
    
    await Promise.allSettled(promises);
  }
  
  private async executeRequest(url: string, options: RequestInit): Promise<Response> {
    const cacheKey = `request:${url}:${JSON.stringify(options)}`;
    
    // Try cache first for GET requests
    if (!options.method || options.method === 'GET') {
      try {
        const cachedResponse = await requestCache.get(cacheKey, () => 
          fetch(url, options), CACHE_TTL.CLIP_DETAIL
        );
        return cachedResponse;
      } catch (error) {
        // Cache miss, proceed with network request
      }
    }
    
    // Make network request
    const response = await fetch(url, options);
    
    // Cache successful GET responses
    if (!options.method || options.method === 'GET') {
      if (response.ok) {
        // Clone response for caching
        const clonedResponse = response.clone();
        requestCache.get(cacheKey, () => Promise.resolve(clonedResponse), CACHE_TTL.CLIP_DETAIL);
      }
    }
    
    return response;
  }
  
  // Utility methods for common API patterns
  async getClips(userId: string, token: string): Promise<any> {
    const cacheKey = CACHE_KEYS.CLIPS(userId);
    
    return requestCache.get(cacheKey, async () => {
      const response = await this.fetch('/api/clips', {
        headers: { 'Authorization': `Bearer ${token}` }
      }, 'normal');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch clips: ${response.statusText}`);
      }
      
      return response.json();
    }, CACHE_TTL.CLIPS);
  }
  
  async updateClip(clipId: string, updates: any, token: string): Promise<any> {
    // Invalidate cache for this clip and clips list
    requestCache.invalidatePattern(new RegExp(`clips:|clip:${clipId}`));
    
    const response = await this.fetch(`/api/clips/${clipId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    }, 'high');
    
    if (!response.ok) {
      throw new Error(`Failed to update clip: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async deleteClip(clipId: string, token: string): Promise<void> {
    // Invalidate cache
    requestCache.invalidatePattern(new RegExp(`clips:|clip:${clipId}`));
    
    const response = await this.fetch(`/api/clips/${clipId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }, 'high');
    
    if (!response.ok) {
      throw new Error(`Failed to delete clip: ${response.statusText}`);
    }
  }
  
  // Cleanup method
  destroy() {
    if (this.batchTimeout) {
      clearInterval(this.batchTimeout);
    }
    this.batchQueue = [];
  }
}

// Global batched API client instance
export const batchedAPI = new BatchedAPIClient();

// React hook for using batched API
export function useBatchedAPI() {
  return {
    getClips: batchedAPI.getClips.bind(batchedAPI),
    updateClip: batchedAPI.updateClip.bind(batchedAPI),
    deleteClip: batchedAPI.deleteClip.bind(batchedAPI),
    fetch: batchedAPI.fetch.bind(batchedAPI)
  };
}
