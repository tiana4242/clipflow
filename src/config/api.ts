// Local API configuration
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  getCurrentUrl: () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }
};
