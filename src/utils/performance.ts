// Performance optimization utilities

export class PerformanceOptimizer {
  private static animationFrameId: number | null = null;
  private static pendingWrites: Array<() => void> = [];
  
  // Batch DOM reads and writes to prevent forced reflows
  static batchDOMUpdate(reads: () => void, writes: () => void) {
    // Perform all reads first
    reads();
    
    // Schedule writes for next frame and batch them
    this.scheduleWrite(writes);
  }
  
  private static scheduleWrite(write: () => void) {
    // Add to pending writes
    this.pendingWrites.push(write);
    
    // Cancel any existing animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Schedule new animation frame
    this.animationFrameId = requestAnimationFrame(() => {
      // Execute all pending writes in order
      this.pendingWrites.forEach(write => write());
      this.pendingWrites = [];
      this.animationFrameId = null;
    });
  }
  
  // Force immediate DOM update (use sparingly)
  static forceDOMUpdate(writes: () => void) {
    // Execute immediately without batching
    writes();
  }
  
  // Debounced function to prevent excessive calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  // Throttled function to limit call frequency
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
  
  // Optimized resize handler
  static createOptimizedResizeHandler(callback: () => void) {
    return this.debounce(() => {
      // Use requestAnimationFrame to smooth out resize operations
      requestAnimationFrame(callback);
    }, 100);
  }
  
  // Measure performance
  static measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  }
  
  // Detect and prevent forced reflows
  static preventForcedReflow<T>(fn: () => T): T {
    // Force layout calculation before running function
    document.body.offsetHeight;
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    // Log if function took too long (potential forced reflow)
    if (end - start > 16) { // More than one frame
      console.warn(`Potential forced reflow detected: ${fn.name || 'anonymous'} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }
  
  // Batch multiple DOM operations
  static batchDOMOperations(operations: Array<() => void>) {
    // Separate reads and writes
    const reads: Array<() => any> = [];
    const writes: Array<() => void> = [];
    
    operations.forEach(op => {
      // Simple heuristic: if operation accesses DOM properties, it's a read
      if (op.toString().includes('offset') || 
          op.toString().includes('client') || 
          op.toString().includes('scroll') ||
          op.toString().includes('getBoundingClientRect')) {
        reads.push(op);
      } else {
        writes.push(op);
      }
    });
    
    // Execute all reads first
    const readResults = reads.map(read => read());
    
    // Then execute all writes
    this.scheduleWrite(() => {
      writes.forEach(write => write());
    });
    
    return readResults;
  }
}

// CSS custom property utilities
export class CSSCustomProperties {
  private static cachedHeight: number;
  private static cachedWidth: number;
  
  static setViewportHeight(height?: number) {
    const vh = (height || CSSCustomProperties.cachedHeight) * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  static setViewportWidth(width?: number) {
    const vw = (width || CSSCustomProperties.cachedWidth) * 0.01;
    document.documentElement.style.setProperty('--vw', `${vw}px`);
  }
  
  static updateViewportUnits() {
    PerformanceOptimizer.batchDOMUpdate(
      () => {
        // Reads - batch all reads together and cache values
        CSSCustomProperties.cachedHeight = window.innerHeight;
        CSSCustomProperties.cachedWidth = window.innerWidth;
      },
      () => {
        // Writes - batch all writes together using cached values
        CSSCustomProperties.setViewportHeight(CSSCustomProperties.cachedHeight);
        CSSCustomProperties.setViewportWidth(CSSCustomProperties.cachedWidth);
      }
    );
  }
}
