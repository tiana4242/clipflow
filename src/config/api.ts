// Hybrid API configuration - Netlify frontend + Render backend
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  RENDER_URL: 'https://clip-flow-529p.onrender.com',
  NETLIFY_URL: '/.netlify/functions',
  getCurrentUrl: () => {
    // Check deployment environment
    const hostname = window.location.hostname;
    
    if (hostname.includes('netlify.app')) {
      // Production: Use Render backend
      return import.meta.env.VITE_API_URL || 'https://clip-flow-529p.onrender.com';
    } else if (hostname.includes('localhost')) {
      // Development: Use local backend
      return import.meta.env.VITE_API_URL || 'http://localhost:3001';
    } else {
      // Default to Render
      return import.meta.env.VITE_API_URL || 'https://clip-flow-529p.onrender.com';
    }
  }
};
