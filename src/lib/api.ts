// Unified API client for ClipFlow single backend
import { API_CONFIG } from '../config/api';

const API_BASE = API_CONFIG.getCurrentUrl();

// Types
export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface Clip {
  id: string;
  user_id: string;
  title: string;
  original_url: string;
  processed_url?: string;
  thumbnail_url?: string;
  duration: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  viral_score?: number;
  color_grade?: ColorGrade;
  captions?: Caption[];
}

export interface ColorGrade {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: number;
}

export interface Caption {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  confidence?: number;
}

// API Client
export const api = {
  // Authentication
  async signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }
    
    const data = await response.json();
    return data;
  },

  async signUp(email: string, password: string, username: string) {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign up failed');
    }
    
    const data = await response.json();
    return data;
  },

  async signOut(token: string) {
    const response = await fetch(`${API_BASE}/api/auth/signout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign out failed');
    }
    
    return await response.json();
  },

  async getCurrentUser(token: string): Promise<User | null> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  },

  // Clips
  async getClips(token: string): Promise<Clip[]> {
    const response = await fetch(`${API_BASE}/api/clips`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch clips');
    }
    
    const data = await response.json();
    return data.clips || [];
  },

  async getClip(clipId: string, token: string): Promise<Clip | null> {
    const response = await fetch(`${API_BASE}/api/clips/${clipId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  },

  async deleteClip(clipId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/clips/${clipId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete clip');
    }
  },

  async deleteAllClips(token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/clips`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete all clips');
    }
  },

  // Video Processing
  async uploadVideo(file: File, token: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload video');
    }
    
    return await response.json();
  },

  async processClip(videoUrl: string, options: any, token: string): Promise<Clip> {
    const response = await fetch(`${API_BASE}/api/process-clip`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoUrl, ...options })
    });
    
    if (!response.ok) {
      throw new Error('Failed to process clip');
    }
    
    return await response.json();
  },

  async analyzeVideo(videoUrl: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoUrl })
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze video');
    }
    
    return await response.json();
  },

  async getClipPreview(clipId: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/clips/${clipId}/preview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get clip preview');
    }
    
    return await response.json();
  },

  // AI Features
  async generateTitles(topic: string, token: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/generate-titles`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topic })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate titles');
    }
    
    const data = await response.json();
    return data.titles || [];
  },

  async generateHashtags(content: string, token: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/api/generate-hashtags`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate hashtags');
    }
    
    const data = await response.json();
    return data.hashtags || [];
  },

  // Import/Export
  async importFromUrl(url: string, token: string): Promise<Clip> {
    const response = await fetch(`${API_BASE}/api/import-url`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error('Failed to import from URL');
    }
    
    return await response.json();
  },

  async exportClip(clipId: string, format: string, quality: string, token: string): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE}/api/export`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clipId, format, quality })
    });
    
    if (!response.ok) {
      throw new Error('Failed to export clip');
    }
    
    return await response.json();
  },

  // Clip Features
  async colorGradeClip(clipId: string, colorGrade: ColorGrade, token: string): Promise<Clip> {
    const response = await fetch(`${API_BASE}/api/clips/${clipId}/color-grade`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ colorGrade })
    });
    
    if (!response.ok) {
      throw new Error('Failed to color grade clip');
    }
    
    return await response.json();
  },

  async reframeClip(clipId: string, options: any, token: string): Promise<Clip> {
    const response = await fetch(`${API_BASE}/api/clips/${clipId}/reframe`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error('Failed to reframe clip');
    }
    
    return await response.json();
  },

  async burnCaptions(clipId: string, captions: Caption[], token: string): Promise<Clip> {
    const response = await fetch(`${API_BASE}/api/clips/${clipId}/burn-captions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ captions })
    });
    
    if (!response.ok) {
      throw new Error('Failed to burn captions');
    }
    
    return await response.json();
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE}/api/health`);
    
    if (!response.ok) {
      throw new Error('Backend is not available');
    }
    
    return await response.json();
  }
};

// Token management
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem('clipflow_token');
  },

  setToken(token: string): void {
    localStorage.setItem('clipflow_token', token);
  },

  removeToken(): void {
    localStorage.removeItem('clipflow_token');
  },

  // Helper to add token to headers
  getAuthHeaders(): { Authorization: string } {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
  }
};
