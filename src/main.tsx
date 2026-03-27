import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { LazyErrorBoundary } from './utils/lazyLoad'
import { loadRouteChunks } from './utils/lazyLoad'
import { bfcacheManager } from './utils/bfcache'

// Initialize bfcache manager
bfcacheManager;

// Register Service Worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { 
      scope: '/',
      type: 'classic'
    })
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available - notify user via custom event
                window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('SW registration failed: ', error);
      });
  });
}

// Preload initial chunks
loadRouteChunks('/');

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="text-white">Loading Clip Flow...</div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <LazyErrorBoundary>
        <App />
      </LazyErrorBoundary>
    </Suspense>
  </React.StrictMode>,
)