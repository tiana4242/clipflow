// Accessibility utilities for ClipFlow

export class AccessibilityManager {
  private static liveRegion: HTMLElement | null = null;
  private static alertRegion: HTMLElement | null = null;
  
  // Initialize accessibility features
  static init() {
    this.liveRegion = document.getElementById('sr-live-region');
    this.alertRegion = document.getElementById('sr-alert-region');
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
