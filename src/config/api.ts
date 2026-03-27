// API configuration for ClipFlow - Single Backend
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  PROD_URL: 'https://api.clipflow.app', // Replace with your deployed backend URL
  
  getCurrentUrl: () => {
    console.log('🔧 API Config - Current hostname:', window.location.hostname);
    
    // Use local backend in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const apiUrl = API_CONFIG.LOCAL_URL;
      console.log('🔧 Using local backend:', apiUrl);
      return apiUrl;
    }
    
    // Use production backend in production
    const prodUrl = API_CONFIG.PROD_URL;
    console.log('🔧 Using production backend:', prodUrl);
    return prodUrl;
  }
};
