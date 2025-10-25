/**
 * Mobile Performance Optimizations
 *
 * Utilities for improving mobile performance
 */

/**
 * Prevent default touch behaviors (bounce, zoom on double-tap)
 */
export function preventMobileBehaviors() {
  // Prevent pinch-to-zoom on iOS
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.scale && e.scale !== 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
}

/**
 * Detect if running as PWA (installed to home screen)
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Vibrate device (for feedback on card selection, attacks, etc.)
 */
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Haptic feedback patterns
 */
export const HapticFeedback = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  heavy: () => vibrate(30),
  cardSelect: () => vibrate([10, 5, 10]),
  attack: () => vibrate([20, 10, 20, 10, 20]),
  victory: () => vibrate([50, 50, 50, 50, 100]),
  error: () => vibrate([30, 10, 30]),
};

/**
 * Check if device prefers reduced motion (accessibility)
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lock screen orientation (for full-screen gameplay)
 */
export async function lockOrientation(orientation: OrientationLockType): Promise<void> {
  try {
    if ('lock' in screen.orientation) {
      await screen.orientation.lock(orientation);
    }
  } catch (error) {
    console.warn('Screen orientation lock not supported:', error);
  }
}

/**
 * Unlock screen orientation
 */
export function unlockOrientation(): void {
  try {
    if ('unlock' in screen.orientation) {
      screen.orientation.unlock();
    }
  } catch (error) {
    console.warn('Screen orientation unlock failed:', error);
  }
}

/**
 * Request fullscreen mode
 */
export async function requestFullscreen(): Promise<void> {
  const elem = document.documentElement;
  try {
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      await (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen request failed:', error);
  }
}

/**
 * Exit fullscreen mode
 */
export function exitFullscreen(): void {
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  } catch (error) {
    console.warn('Exit fullscreen failed:', error);
  }
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(selector: string = 'img[data-src]'): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll(selector).forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers without Intersection Observer
    document.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
  }
}

/**
 * Throttle function for scroll/resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function for input events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Get network speed (for adaptive loading)
 */
export function getNetworkSpeed(): 'slow' | 'medium' | 'fast' {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;

  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g') return 'medium';
  return 'slow';
}

/**
 * Check if device has enough memory for high-quality assets
 */
export function hasEnoughMemory(): boolean {
  // @ts-ignore
  const memory = navigator.deviceMemory;
  return memory === undefined || memory >= 4; // 4GB+
}

/**
 * Preload critical assets
 */
export function preloadAssets(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          if (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.webp')) {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
          } else {
            // For other assets, use fetch
            fetch(url)
              .then(() => resolve())
              .catch(reject);
          }
        })
    )
  );
}
