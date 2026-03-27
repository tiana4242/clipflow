// API configuration for ClipFlow
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  RENDER_URL: 'https://clip-flow-529p.onrender.com',
  getCurrentUrl: () => {
    // Check deployment environment
    const hostname = window.location.hostname;
    
    if (hostname.includes('localhost')) {
      // Development: Use local backend
      return import.meta.env.VITE_API_URL || 'http://localhost:3001';
    } else {
      // Production: Use Render backend
      return import.meta.env.VITE_API_URL || 'https://clip-flow-529p.onrender.com';
    }
  }
};
