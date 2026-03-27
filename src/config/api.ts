// API configuration for ClipFlow
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  RENDER_URL: 'https://clip-flow-777x.onrender.com',
  getCurrentUrl: () => {
    // Check deployment environment
    const hostname = window.location.hostname;
    
    if (hostname.includes('localhost')) {
      // Development: Use Render backend for testing
      return import.meta.env.VITE_API_URL || 'https://clip-flow-777x.onrender.com';
    } else {
      // Production: Use Render backend
      return import.meta.env.VITE_API_URL || 'https://clip-flow-777x.onrender.com';
    }
  }
};
