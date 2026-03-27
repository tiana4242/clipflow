// Lazy loading utilities for reducing unused JavaScript

import { lazy } from 'react';

// Lazy load heavy components that actually exist
export const LazyErrorBoundary = lazy(() => import('../components/ErrorBoundary').then(module => ({ 
  default: module.ErrorBoundary 
})));

export const LazyPWAInstallPrompt = lazy(() => import('../components/PWAInstallPrompt').then(module => ({ 
  default: module.PWAInstallPrompt 
})));

export const LazyShareModal = lazy(() => import('../components/ShareModal').then(module => ({ 
  default: module.ShareModal 
})));

export const LazyVideoProcessor = lazy(() => import('../components/VideoProcessor').then(module => ({ 
  default: module.VideoProcessor 
})));

// Dynamic import utilities
export const loadModule = async (modulePath: string) => {
  try {
    // Use @vite-ignore to suppress dynamic import warning
    const module = await import(/* @vite-ignore */ modulePath);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load module ${modulePath}:`, error);
    return null;
  }
};

// Preload utilities
export const preloadComponent = (componentPath: string) => {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = componentPath;
  document.head.appendChild(link);
};

// Intersection Observer for lazy loading
export const createLazyLoader = (callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Lazy load images
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = src;
        observer.unobserve(img);
      }
    });
  });
  
  observer.observe(img);
  return observer;
};

// Dynamic script loading
export const loadScript = (src: string, async = true): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// Chunk loading utilities
export const preloadChunk = (chunkName: string) => {
  // Preload specific chunks when needed
  const chunks = {
    'share-modal': () => import('../components/ShareModal'),
    'video-processor': () => import('../components/VideoProcessor'),
    'pwa-install': () => import('../components/PWAInstallPrompt'),
    'error-boundary': () => import('../components/ErrorBoundary'),
  };

  const loadChunk = chunks[chunkName as keyof typeof chunks];
  if (loadChunk) {
    loadChunk().catch(error => {
      console.warn(`Failed to preload chunk ${chunkName}:`, error);
    });
  }
};

// Route-based chunk loading
export const loadRouteChunks = (route: string) => {
  const routeChunks: Record<string, string[]> = {
    '/': ['react-vendor', 'ui-vendor'],
    '/upload': ['video-processor'],
    '/share': ['share-modal'],
    '/settings': ['pwa-install'],
  };

  const chunks = routeChunks[route];
  if (chunks) {
    chunks.forEach(chunk => preloadChunk(chunk));
  }
};
