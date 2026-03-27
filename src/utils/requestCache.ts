// Request caching and batching utilities

interface CachedRequest {
  data: any;
  timestamp: number;
  ttl: number;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class RequestCache {
  private cache = new Map<string, CachedRequest>();
  private pending = new Map<string, PendingRequest[]>();
  
  // Cache TTL in milliseconds
  private static readonly DEFAULT_TTL = 5000; // 5 seconds
  private static readonly CLIPS_TTL = 10000; // 10 seconds for clips
  
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = RequestCache.DEFAULT_TTL
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    
    // Check if there's already a pending request for this key
    const pending = this.pending.get(key);
    if (pending) {
      return new Promise<T>((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    }
    
    // Create new pending request
    const pendingRequests: PendingRequest[] = [];
    this.pending.set(key, pendingRequests);
    
    try {
      const data = await fetcher();
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      // Resolve all pending requests
      pendingRequests.forEach(({ resolve }) => resolve(data));
      return data;
    } catch (error) {
      // Reject all pending requests
      pendingRequests.forEach(({ reject }) => reject(error));
      throw error;
    } finally {
      // Clean up pending requests
      this.pending.delete(key);
    }
  }
  
  invalidate(key: string) {
    this.cache.delete(key);
  }
  
  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear() {
    this.cache.clear();
    this.pending.clear();
  }
  
  // Get cache stats
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pending.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// Global request cache instance
export const requestCache = new RequestCache();

// Specific cache keys
export const CACHE_KEYS = {
  CLIPS: (userId: string) => `clips:${userId}`,
  CLIP_DETAIL: (clipId: string) => `clip:${clipId}`,
  USER_SESSION: () => 'user:session'
} as const;

// Cache TTL constants
export const CACHE_TTL = {
  CLIPS: RequestCache.CLIPS_TTL,
  CLIP_DETAIL: RequestCache.DEFAULT_TTL,
  USER_SESSION: RequestCache.DEFAULT_TTL
} as const;
