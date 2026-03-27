// Performance optimization utilities

export class PerformanceOptimizer {
  private static animationFrameId: number | null = null;
  
  // Batch DOM reads and writes to prevent forced reflows
  static batchDOMUpdate(reads: () => void, writes: () => void) {
    // Perform all reads first
    reads();
    
    // Schedule writes for next frame
    this.scheduleWrite(writes);
  }
  
  private static scheduleWrite(write: () => void) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      write();
      this.animationFrameId = null;
    });
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
}

// CSS custom property utilities
export class CSSCustomProperties {
  static setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  static setViewportWidth() {
    const vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--vw', `${vw}px`);
  }
  
  static updateViewportUnits() {
    PerformanceOptimizer.batchDOMUpdate(
      () => {
        // Reads - batch all reads together
        window.innerHeight;
        window.innerWidth;
      },
      () => {
        // Writes - batch all writes together
        CSSCustomProperties.setViewportHeight();
        CSSCustomProperties.setViewportWidth();
      }
    );
  }
}
