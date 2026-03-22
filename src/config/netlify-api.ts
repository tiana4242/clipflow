// Netlify Functions API configuration
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  NETLIFY_URL: '/.netlify/functions',
  getCurrentUrl: () => {
    // Check if we're on Netlify
    if (window.location.hostname.includes('netlify.app')) {
      return import.meta.env.VITE_API_URL || '/.netlify/functions';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }
};
