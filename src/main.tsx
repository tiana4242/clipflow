import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { LazyErrorBoundary } from './utils/lazyLoad'
import { loadRouteChunks } from './utils/lazyLoad'
import { bfcacheManager } from './utils/bfcache'
import { AccessibilityManager } from './utils/accessibility'

// Initialize performance optimizations
const initializePerformance = () => {
  // Initialize bfcache manager
  bfcacheManager;
  
  // Initialize accessibility manager
  AccessibilityManager.init();
  
  // Preload initial chunks
  loadRouteChunks('/');
  
  // Register Service Worker for PWA (only in production, deferred)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    // Defer SW registration to not block initial render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
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
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          type: 'classic'
        });
      }, 1000);
    }
  }
  
  // Optimize initial paint
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload non-critical resources
      console.log('🚀 Performance optimizations initialized');
    });
  }
};

// Start performance initialization immediately
initializePerformance();

// Loading fallback component with skeleton
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 animate-pulse"></div>
      <div className="text-white text-lg font-medium">Loading Clip Flow...</div>
      <div className="text-slate-400 text-sm mt-2">Preparing your video workspace</div>
    </div>
  </div>
);

// Render with performance optimizations
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <LazyErrorBoundary>
        <App />
      </LazyErrorBoundary>
    </Suspense>
  </React.StrictMode>,
)