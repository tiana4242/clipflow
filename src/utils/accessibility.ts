// Accessibility utilities for ClipFlow

export class AccessibilityManager {
  private static liveRegion: HTMLElement | null = null;
  private static alertRegion: HTMLElement | null = null;
  
  // Initialize accessibility features
  static init() {
    this.liveRegion = document.getElementById('sr-live-region');
    this.alertRegion = document.getElementById('sr-alert-region');
    this.checkColorContrast();
  }
  
  // Announce messages to screen readers (polite)
  static announce(message: string) {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
      // Clear after announcement to allow repeat announcements
      setTimeout(() => {
        if (this.liveRegion) this.liveRegion.textContent = '';
      }, 1000);
    }
  }
  
  // Announce urgent messages (assertive)
  static alert(message: string) {
    if (this.alertRegion) {
      this.alertRegion.textContent = message;
      setTimeout(() => {
        if (this.alertRegion) this.alertRegion.textContent = '';
      }, 1000);
    }
  }
  
  // Check color contrast ratio
  static checkColorContrast() {
    if (typeof window === 'undefined') return;
    
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const ratio = this.getContrastRatio(color, backgroundColor);
        if (ratio < 4.5) {
          console.warn(`⚠️ Low contrast detected: ${ratio.toFixed(2)}:1`, element);
          this.suggestContrastFix(element, color, backgroundColor);
        }
      }
    });
  }
  
  // Calculate contrast ratio between two colors
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1) || this.parseRgb(color1);
    const rgb2 = this.hexToRgb(color2) || this.parseRgb(color2);
    
    if (!rgb1 || !rgb2) return 21; // Default to high contrast if parsing fails
    
    const luminance1 = this.getLuminance(rgb1);
    const luminance2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  // Convert hex color to RGB
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  // Parse RGB color string
  static parseRgb(rgb: string): { r: number; g: number; b: number } | null {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  }
  
  // Calculate relative luminance
  static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  // Suggest contrast fix for low contrast elements
  static suggestContrastFix(element: Element, textColor: string, bgColor: string) {
    const rgbText = this.hexToRgb(textColor) || this.parseRgb(textColor);
    const rgbBg = this.hexToRgb(bgColor) || this.parseRgb(bgColor);
    
    if (!rgbText || !rgbBg) return;
    
    const textLuminance = this.getLuminance(rgbText);
    const bgLuminance = this.getLuminance(rgbBg);
    
    // Suggest better colors based on WCAG guidelines
    if (bgLuminance > 0.5) {
      // Light background, suggest dark text
      console.log(`💡 Suggestion: Use darker text on light background`);
    } else {
      // Dark background, suggest light text
      console.log(`💡 Suggestion: Use lighter text on dark background`);
    }
  }
  
  // Get accessible text color for given background
  static getAccessibleTextColor(backgroundColor: string): string {
    const rgb = this.hexToRgb(backgroundColor) || this.parseRgb(backgroundColor);
    if (!rgb) return '#ffffff'; // Default to white
    
    const luminance = this.getLuminance(rgb);
    // Use white text on dark backgrounds, black text on light backgrounds
    return luminance < 0.5 ? '#ffffff' : '#000000';
  }
  
  // Manage focus trap for modals
  static trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    firstFocusable.focus();
    
    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }
  
  // Set focus to element with announcement
  static setFocusWithAnnouncement(element: HTMLElement, announcement?: string) {
    element.focus();
    if (announcement) {
      this.announce(announcement);
    }
  }
  
  // Generate unique IDs for ARIA relationships
  static generateId(prefix: string = 'clipflow'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Check if element is visible for screen readers
  static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null;
  }
  
  // Hide element from screen readers
  static hideFromScreenReaders(element: HTMLElement) {
    element.setAttribute('aria-hidden', 'true');
    element.classList.add('sr-only');
  }
  
  // Show element to screen readers
  static showToScreenReaders(element: HTMLElement) {
    element.removeAttribute('aria-hidden');
    element.classList.remove('sr-only');
  }
}

// Accessibility hooks for React
export const useAccessibility = () => {
  const announce = AccessibilityManager.announce;
  const alert = AccessibilityManager.alert;
  const trapFocus = AccessibilityManager.trapFocus;
  const setFocusWithAnnouncement = AccessibilityManager.setFocusWithAnnouncement;
  const generateId = AccessibilityManager.generateId;
  
  return {
    announce,
    alert,
    trapFocus,
    setFocusWithAnnouncement,
    generateId
  };
};

// ARIA label generators
export const ARIALabels = {
  videoPlayer: (title: string) => `Video player: ${title}`,
  clipCard: (title: string, duration: number) => 
    `Video clip: ${title}, Duration: ${duration} seconds`,
  uploadButton: () => 'Upload video file for processing',
  playButton: (title: string) => `Play video: ${title}`,
  shareButton: (platform: string) => `Share to ${platform}`,
  deleteButton: (title: string) => `Delete clip: ${title}`,
  editButton: (title: string) => `Edit clip: ${title}`,
  closeButton: () => 'Close dialog or return to previous view',
  menuButton: () => 'Open menu with additional options',
  searchInput: () => 'Search clips by title or content',
  volumeSlider: (level: number) => `Volume level: ${level}%`,
  progressBar: (currentTime: number, duration: number) => 
    `Video progress: ${currentTime} of ${duration} seconds`
};

// Focus management utilities
export const FocusManager = {
  // Store last focused element before opening modal
  lastFocusedElement: null as HTMLElement | null,
  
  // Save current focus
  saveFocus() {
    this.lastFocusedElement = document.activeElement as HTMLElement;
  },
  
  // Restore focus to previously focused element
  restoreFocus() {
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
  },
  
  // Move focus to first interactive element in container
  focusFirst(container: HTMLElement) {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusable) {
      focusable.focus();
    }
  }
};
