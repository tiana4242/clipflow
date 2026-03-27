// Back/Forward Cache (bfcache) optimization utilities

import React from 'react';

interface BFCacheManager {
  isSupported: boolean;
  webSocketConnections: Set<WebSocket>;
  cleanupCallbacks: Array<() => void>;
}

class BFCacheManagerImpl implements BFCacheManager {
  public isSupported: boolean;
  public webSocketConnections: Set<WebSocket>;
  public cleanupCallbacks: Array<() => void>;

  constructor() {
    this.isSupported = this.checkBFCacheSupport();
    this.webSocketConnections = new Set();
    this.cleanupCallbacks = [];
    this.initialize();
  }

  private checkBFCacheSupport(): boolean {
    // Check if bfcache is supported
    return 'performance' in window && 
           'getEntriesByType' in performance &&
           'navigation' in performance;
  }

  private initialize(): void {
    if (!this.isSupported) {
      console.warn('BFCache not supported in this browser');
      return;
    }

    // Handle page visibility changes for bfcache
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Handle page unload events
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Handle page show/hide events for bfcache
    window.addEventListener('pageshow', this.handlePageShow.bind(this));
    window.addEventListener('pagehide', this.handlePageHide.bind(this));

    // Monitor bfcache restoration
    this.monitorBFCacheRestoration();
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // Page is hidden, prepare for potential bfcache storage
      this.prepareForBFCache();
    } else if (document.visibilityState === 'visible') {
      // Page is visible, check if restored from bfcache
      this.restoreFromBFCache();
    }
  }

  private handleBeforeUnload(): void {
    // Clean up resources before page unload to enable bfcache
    this.cleanupForBFCache();
  }

  private handlePageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      // Page was restored from bfcache
      console.log('📄 Page restored from bfcache');
      this.restoreFromBFCache();
    }
  }

  private handlePageHide(event: PageTransitionEvent): void {
    if (event.persisted) {
      // Page is entering bfcache
      console.log('📄 Page entering bfcache');
      this.prepareForBFCache();
    }
  }

  private prepareForBFCache(): void {
    // Close WebSocket connections to allow bfcache
    this.closeAllWebSockets();
    
    // Execute cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in bfcache cleanup callback:', error);
      }
    });

    // Clear timers
    this.clearAllTimers();
    
    // Pause ongoing operations
    this.pauseOngoingOperations();
  }

  private restoreFromBFCache(): void {
    // Restore WebSocket connections
    this.restoreWebSocketConnections();
    
    // Resume operations
    this.resumeOperations();
    
    // Re-initialize components that need restoration
    this.reinitializeComponents();
    
    // Notify app about restoration
    window.dispatchEvent(new CustomEvent('bfcacheRestore', {
      detail: { timestamp: Date.now() }
    }));
  }

  private cleanupForBFCache(): void {
    // Final cleanup before page unload
    this.closeAllWebSockets();
    this.clearAllTimers();
    this.cleanupCallbacks.forEach(callback => callback());
  }

  private closeAllWebSockets(): void {
    this.webSocketConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Page entering bfcache');
      }
    });
    this.webSocketConnections.clear();
  }

  private restoreWebSocketConnections(): void {
    // WebSocket connections will be re-established by the application
    // This is a placeholder for restoration logic
    console.log('🔄 WebSocket connections ready for restoration');
  }

  private clearAllTimers(): void {
    // Clear all timeouts and intervals
    const maxTimerId = setTimeout(() => {}, 0);
    for (let i = 0; i < maxTimerId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  }

  private pauseOngoingOperations(): void {
    // Pause any ongoing operations
    document.querySelectorAll('video, audio').forEach(media => {
      if (!media.paused) {
        media.pause();
        (media as any).bfCachePaused = true;
      }
    });
  }

  private resumeOperations(): void {
    // Resume paused operations
    document.querySelectorAll('video, audio').forEach(media => {
      if ((media as any).bfCachePaused) {
        media.play().catch(() => {
          // Autoplay might be blocked, that's okay
        });
        delete (media as any).bfCachePaused;
      }
    });
  }

  private reinitializeComponents(): void {
    // Re-initialize components that might need restoration
    // This will be handled by individual components listening for bfcacheRestore event
  }

  private monitorBFCacheRestoration(): void {
    // Monitor navigation entries for bfcache usage
    if ('getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('🧭 Navigation type:', navEntry.type);
            console.log('🧭 Transfer size:', navEntry.transferSize);
            
            if (navEntry.transferSize === 0 && navEntry.type === 'back_forward') {
              console.log('✅ BFCache restoration successful');
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  // Public API
  public registerWebSocket(ws: WebSocket): void {
    this.webSocketConnections.add(ws);
  }

  public unregisterWebSocket(ws: WebSocket): void {
    this.webSocketConnections.delete(ws);
  }

  public addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  public removeCleanupCallback(callback: () => void): void {
    const index = this.cleanupCallbacks.indexOf(callback);
    if (index > -1) {
      this.cleanupCallbacks.splice(index, 1);
    }
  }

  public isBFCacheRestored(): boolean {
    return performance.getEntriesByType('navigation').some(entry => 
      (entry as PerformanceNavigationTiming).type === 'back_forward' &&
      (entry as PerformanceNavigationTiming).transferSize === 0
    );
  }
}

// Global bfcache manager instance
export const bfcacheManager = new BFCacheManagerImpl();

// WebSocket wrapper for bfcache compatibility
export class BFCacheWebSocket extends WebSocket {
  private isManaged: boolean = false;

  constructor(url: string, protocols?: string | string[]) {
    super(url, protocols);
    this.setupBFCacheHandling();
  }

  private setupBFCacheHandling(): void {
    if (!this.isManaged) {
      bfcacheManager.registerWebSocket(this);
      this.isManaged = true;

      // Clean up on close
      this.addEventListener('close', () => {
        bfcacheManager.unregisterWebSocket(this);
        this.isManaged = false;
      });
    }
  }

  // Override close to handle bfcache cleanup
  close(code?: number, reason?: string): void {
    bfcacheManager.unregisterWebSocket(this);
    super.close(code, reason);
    this.isManaged = false;
  }
}

// Utility for creating bfcache-compatible WebSockets
export const createBFCacheWebSocket = (url: string, protocols?: string | string[]): WebSocket => {
  return new BFCacheWebSocket(url, protocols);
};

// React hook for bfcache handling
export const useBFCache = () => {
  const [isRestored, setIsRestored] = React.useState(false);

  React.useEffect(() => {
    const handleRestore = () => {
      setIsRestored(true);
    };

    window.addEventListener('bfcacheRestore', handleRestore);
    
    return () => {
      window.removeEventListener('bfcacheRestore', handleRestore);
    };
  }, []);

  return {
    isRestored,
    isSupported: bfcacheManager.isSupported,
    registerWebSocket: bfcacheManager.registerWebSocket.bind(bfcacheManager),
    unregisterWebSocket: bfcacheManager.unregisterWebSocket.bind(bfcacheManager),
    addCleanupCallback: bfcacheManager.addCleanupCallback.bind(bfcacheManager),
    removeCleanupCallback: bfcacheManager.removeCleanupCallback.bind(bfcacheManager)
  };
};
