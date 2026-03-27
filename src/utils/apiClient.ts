// Enhanced API client with compression support

import { API_CONFIG } from '../config/api';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10 seconds
  private defaultRetries: number = 2;

  constructor() {
    this.baseURL = API_CONFIG.getCurrentUrl();
  }

  async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      ...fetchOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    
    // Enhanced headers for compression support
    const headers = {
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...fetchOptions.headers
    };

    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check if response is compressed
        const contentEncoding = response.headers.get('content-encoding');
        console.log(`🗜️ Response compression: ${contentEncoding || 'none'}`);

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`🔄 Retry ${attempt + 1}/${retries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // HTTP methods with compression support
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload (no compression for binary data)
  async upload<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Health check to verify compression is working
  async checkCompression(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'application/json'
        }
      });

      const contentEncoding = response.headers.get('content-encoding');
      const isCompressed = !!contentEncoding && ['gzip', 'deflate', 'br'].includes(contentEncoding);
      
      console.log(`🗜️ Health check - Compression: ${isCompressed ? '✅' : '❌'} (${contentEncoding || 'none'})`);
      return isCompressed;
    } catch (error) {
      console.error('❌ Compression check failed:', error);
      return false;
    }
  }
}

// Global API client instance
export const apiClient = new APIClient();

// Export convenience methods
export const { get, post, patch, delete: del, upload, checkCompression } = apiClient;
