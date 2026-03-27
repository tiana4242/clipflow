// Performance optimization utilities

export class PerformanceOptimizer {
  private static animationFrameId: number | null = null;
  private static pendingWrites: Array<() => void> = [];
  private static isReading = false;
  private static isWriting = false;
  
  // Batch DOM reads and writes to prevent forced reflows
  static batchDOMUpdate(reads: () => void, writes: () => void) {
    // Prevent nested batching
    if (this.isReading || this.isWriting) {
      console.warn('Nested batchDOMUpdate detected - potential forced reflow');
      return;
    }
    
    // Perform all reads first
    this.isReading = true;
    reads();
    this.isReading = false;
    
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
      this.isWriting = true;
      // Execute all pending writes in order
      this.pendingWrites.forEach(write => write());
      this.pendingWrites = [];
      this.animationFrameId = null;
      this.isWriting = false;
    });
  }
  
  // Force immediate DOM update (use sparingly)
  static forceDOMUpdate(writes: () => void) {
    console.warn('forceDOMUpdate called - this may cause forced reflow');
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
  
  // Measure performance without causing reflows
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
  
  // Safe DOM read that doesn't cause reflow
  static safeRead<T>(readFn: () => T): T {
    if (this.isWriting) {
      console.warn('safeRead called during write phase - potential forced reflow');
    }
    return readFn();
  }
  
  // Safe DOM write that batches properly
  static safeWrite(writeFn: () => void): void {
    this.scheduleWrite(writeFn);
  }
  
  // Batch multiple DOM operations with proper read/write separation
  static batchDOMOperations(operations: Array<() => void>) {
    // Separate reads and writes
    const reads: Array<() => any> = [];
    const writes: Array<() => void> = [];
    
    operations.forEach(op => {
      // More comprehensive heuristic for detecting reads
      const opStr = op.toString();
      if (opStr.includes('offset') || 
          opStr.includes('client') || 
          opStr.includes('scroll') ||
          opStr.includes('getBoundingClientRect') ||
          opStr.includes('getComputedStyle') ||
          opStr.includes('innerHeight') ||
          opStr.includes('innerWidth') ||
          opStr.includes('height') ||
          opStr.includes('width')) {
        reads.push(op);
      } else {
        writes.push(op);
      }
    });
    
    // Execute all reads first
    this.isReading = true;
    const readResults = reads.map(read => {
      try {
        return read();
      } catch (error) {
        console.error('Error during read operation:', error);
        return null;
      }
    });
    this.isReading = false;
    
    // Then execute all writes
    if (writes.length > 0) {
      this.scheduleWrite(() => {
        this.isWriting = true;
        writes.forEach(write => {
          try {
            write();
          } catch (error) {
            console.error('Error during write operation:', error);
          }
        });
        this.isWriting = false;
      });
    }
    
    return readResults;
  }
  
  // Layout-aware DOM operations
  static layoutAwareOperation<T>(operation: () => T): T {
    // Force layout sync before operation
    const layoutBefore = performance.now();
    document.body.offsetHeight; // Force layout
    const layoutTime = performance.now() - layoutBefore;
    
    // Execute operation
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    // Check for layout thrashing
    if (end - start > 16 || layoutTime > 4) {
      console.warn(`Layout thrashing detected: layout=${layoutTime.toFixed(2)}ms, operation=${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }
  
  // Optimized element measurement
  static measureElement(element: Element): DOMRect {
    // Use getBoundingClientRect which is more efficient than offset properties
    return element.getBoundingClientRect();
  }
  
  // Batch style updates
  static batchStyleUpdates(element: Element, styles: Record<string, string>) {
    this.scheduleWrite(() => {
      const htmlElement = element as HTMLElement;
      Object.assign(htmlElement.style, styles);
    });
  }
}

// CSS custom property utilities with optimized updates
export class CSSCustomProperties {
  private static cachedHeight: number = 0;
  private static cachedWidth: number = 0;
  private static lastUpdate: number = 0;
  private static updateThreshold: number = 100; // ms
  
  static setViewportHeight(height?: number) {
    const actualHeight = height || CSSCustomProperties.cachedHeight;
    const vh = actualHeight * 0.01;
    PerformanceOptimizer.safeWrite(() => {
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  }
  
  static setViewportWidth(width?: number) {
    const actualWidth = width || CSSCustomProperties.cachedWidth;
    const vw = actualWidth * 0.01;
    PerformanceOptimizer.safeWrite(() => {
      document.documentElement.style.setProperty('--vw', `${vw}px`);
    });
  }
  
  static updateViewportUnits() {
    const now = performance.now();
    
    // Throttle updates to prevent excessive DOM writes
    if (now - CSSCustomProperties.lastUpdate < CSSCustomProperties.updateThreshold) {
      return;
    }
    
    CSSCustomProperties.lastUpdate = now;
    
    PerformanceOptimizer.batchDOMUpdate(
      () => {
        // Reads - batch all reads together and cache values
        CSSCustomProperties.cachedHeight = PerformanceOptimizer.safeRead(() => window.innerHeight);
        CSSCustomProperties.cachedWidth = PerformanceOptimizer.safeRead(() => window.innerWidth);
      },
      () => {
        // Writes - batch all writes together using cached values
        CSSCustomProperties.setViewportHeight(CSSCustomProperties.cachedHeight);
        CSSCustomProperties.setViewportWidth(CSSCustomProperties.cachedWidth);
      }
    );
  }
  
  // Get cached viewport dimensions without causing reflow
  static getViewportDimensions(): { height: number; width: number } {
    return {
      height: CSSCustomProperties.cachedHeight,
      width: CSSCustomProperties.cachedWidth
    };
  }
  
  // Initialize viewport units with proper caching
  static initialize() {
    // Initial measurement
    CSSCustomProperties.cachedHeight = window.innerHeight;
    CSSCustomProperties.cachedWidth = window.innerWidth;
    
    // Set initial values
    CSSCustomProperties.setViewportHeight(CSSCustomProperties.cachedHeight);
    CSSCustomProperties.setViewportWidth(CSSCustomProperties.cachedWidth);
    
    // Set up optimized resize handler
    const resizeHandler = PerformanceOptimizer.createOptimizedResizeHandler(() => {
      CSSCustomProperties.updateViewportUnits();
    });
    
    window.addEventListener('resize', resizeHandler, { passive: true });
  }
}
