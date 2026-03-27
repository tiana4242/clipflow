// API configuration for ClipFlow
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  getCurrentUrl: () => {
    // Force localhost for development to avoid CORS issues
    console.log('🔧 API Config - Current hostname:', window.location.hostname);
    
    // Always use localhost in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const apiUrl = 'http://localhost:3001';
      console.log('🔧 Using local backend:', apiUrl);
      return apiUrl;
    }
    
    // Production fallback
    const prodUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    console.log('🔧 Using production URL:', prodUrl);
    return prodUrl;
  }
};
