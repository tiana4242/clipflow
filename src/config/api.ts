// API configuration for ClipFlow
export const API_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  getCurrentUrl: () => {
    // FORCE LOCALHOST - Ignore any environment variables
    console.log('🔧 API Config - Current hostname:', window.location.hostname);
    console.log('🔧 API Config - Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
    
    // ALWAYS use localhost in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const apiUrl = 'http://localhost:3001';
      console.log('🔧 FORCED: Using local backend:', apiUrl);
      console.log('🔧 Ignoring environment variables for development');
      return apiUrl;
    }
    
    // Production fallback (should not be used in dev)
    const prodUrl = 'http://localhost:3001'; // Force localhost even in prod for now
    console.log('🔧 Using fallback URL:', prodUrl);
    return prodUrl;
  }
};
