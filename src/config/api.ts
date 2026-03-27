// API configuration for ClipFlow
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  getCurrentUrl: () => {
    // Check deployment environment
    const hostname = window.location.hostname;
    
    if (hostname.includes('localhost')) {
      // Development: Use local backend
      return import.meta.env.VITE_API_URL || 'http://localhost:3001';
    } else {
      // Production: Use environment variable or fallback
      return import.meta.env.VITE_API_URL || 'http://localhost:3001';
    }
  }
};
