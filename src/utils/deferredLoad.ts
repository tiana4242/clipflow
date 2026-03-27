// Deferred loading utilities for optimizing critical path

import React from 'react';

export class DeferredLoader {
  private static loadedModules = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();
  
  // Load module after initial render
  static async loadAfterRender<T>(modulePath: string, delay = 0): Promise<T> {
    if (this.loadedModules.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }
    
    const promise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const module = await import(/* @vite-ignore */ modulePath);
          this.loadedModules.add(modulePath);
          resolve(module.default || module);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
    
    this.loadingPromises.set(modulePath, promise);
    return promise;
  }
  
  // Load module when idle
  static async loadWhenIdle<T>(modulePath: string): Promise<T> {
    if (this.loadedModules.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }
    
    const promise = new Promise<T>((resolve, reject) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            const module = await import(/* @vite-ignore */ modulePath);
            this.loadedModules.add(modulePath);
            resolve(module.default || module);
          } catch (error) {
            reject(error);
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          try {
            const module = await import(/* @vite-ignore */ modulePath);
            this.loadedModules.add(modulePath);
            resolve(module.default || module);
          } catch (error) {
            reject(error);
          }
        }, 100);
      }
    });
    
    this.loadingPromises.set(modulePath, promise);
    return promise;
  }
  
  // Load module when user interacts
  static async loadOnInteraction<T>(modulePath: string, trigger: 'click' | 'scroll' | 'hover'): Promise<T> {
    if (this.loadedModules.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }
    
    const promise = new Promise<T>((resolve, reject) => {
      const handler = async () => {
        try {
          const module = await import(/* @vite-ignore */ modulePath);
          this.loadedModules.add(modulePath);
          resolve(module.default || module);
          
          // Remove event listener after loading
          if (trigger === 'click') {
            document.removeEventListener('click', handler, { once: true });
          } else if (trigger === 'scroll') {
            document.removeEventListener('scroll', handler, { once: true });
          }
        } catch (error) {
          reject(error);
        }
      };
      
      if (trigger === 'click') {
        document.addEventListener('click', handler, { once: true });
      } else if (trigger === 'scroll') {
        document.addEventListener('scroll', handler, { once: true });
      }
    });
    
    this.loadingPromises.set(modulePath, promise);
    return promise;
  }
  
  // Preload module without executing
  static preload(modulePath: string): void {
    if (!this.loadedModules.has(modulePath)) {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = modulePath;
      document.head.appendChild(link);
    }
  }
  
  // Batch load multiple modules
  static async batchLoad<T>(modules: Array<{ path: string; delay?: number }>): Promise<T[]> {
    const promises = modules.map(({ path, delay = 0 }) => 
      this.loadAfterRender<T>(path, delay)
    );
    return Promise.all(promises);
  }
  
  // Load critical modules first
  static async loadCritical<T>(modules: string[]): Promise<T[]> {
    const promises = modules.map(path => this.loadAfterRender<T>(path, 0));
    return Promise.all(promises);
  }
  
  // Load non-critical modules later
  static async loadNonCritical<T>(modules: string[]): Promise<T[]> {
    const promises = modules.map(path => this.loadWhenIdle<T>(path));
    return Promise.all(promises);
  }
}

// Deferred component loader for React
export const useDeferredLoader = (modulePath: string, options?: { 
  delay?: number; 
  trigger?: 'render' | 'idle' | 'interaction'; 
  interactionType?: 'click' | 'scroll' | 'hover';
}) => {
  const [module, setModule] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    const loadModule = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let loadedModule;
        
        if (options?.trigger === 'idle') {
          loadedModule = await DeferredLoader.loadWhenIdle(modulePath);
        } else if (options?.trigger === 'interaction' && options.interactionType) {
          loadedModule = await DeferredLoader.loadOnInteraction(modulePath, options.interactionType);
        } else {
          loadedModule = await DeferredLoader.loadAfterRender(modulePath, options?.delay);
        }
        
        setModule(loadedModule);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    loadModule();
  }, [modulePath, options?.delay, options?.trigger, options?.interactionType]);
  
  return { module, loading, error };
};

// Critical path optimization utilities
export const CriticalPathOptimizer = {
  // Identify and load critical modules first
  async optimizeCriticalPath(): Promise<void> {
    // Critical modules that should load immediately
    const criticalModules = [
      '../components/ErrorBoundary',
      '../utils/performance',
      '../utils/accessibility'
    ];
    
    // Load critical modules first
    await DeferredLoader.loadCritical(criticalModules);
    
    // Non-critical modules to load later
    const nonCriticalModules = [
      '../components/PWAInstallPrompt',
      '../components/ShareModal',
      '../utils/lazyLoad',
      '../utils/bfcache'
    ];
    
    // Load non-critical modules when idle
    DeferredLoader.loadNonCritical(nonCriticalModules);
  },
  
  // Preload important resources
  preloadCriticalResources(): void {
    // Preload critical chunks
    DeferredLoader.preload('/src/utils/performance.ts');
    DeferredLoader.preload('/src/utils/accessibility.ts');
    DeferredLoader.preload('/src/components/ErrorBoundary.tsx');
    
    // Preload vendor chunks
    DeferredLoader.preload('/node_modules/react/index.js');
    DeferredLoader.preload('/node_modules/react-dom/index.js');
  },
  
  // Optimize loading sequence
  async optimizeLoadingSequence(): Promise<void> {
    // Step 1: Preload critical resources
    this.preloadCriticalResources();
    
    // Step 2: Load critical modules
    await this.optimizeCriticalPath();
    
    // Step 3: Load remaining modules when idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        console.log('🚀 Critical path optimization completed');
      });
    }
  }
};
