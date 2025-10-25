/**
 * Mobile Detection Hook
 *
 * Detects mobile devices, screen size, and touch capabilities
 */

import { useState, useEffect } from 'react';

export interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
}

export function useMobileDetect(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isLandscape: false,
    isPortrait: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
  });

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0;

      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isChrome = /chrome/.test(userAgent);

      setDetection({
        isMobile: width < 600,
        isTablet: width >= 600 && width < 900,
        isDesktop: width >= 900,
        isTouchDevice,
        isLandscape: width > height,
        isPortrait: height >= width,
        screenWidth: width,
        screenHeight: height,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
      });
    };

    updateDetection();

    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return detection;
}

/**
 * Simpler hook for just checking if mobile
 */
export function useIsMobile(): boolean {
  const { isMobile } = useMobileDetect();
  return isMobile;
}

/**
 * Hook for checking touch capability
 */
export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useMobileDetect();
  return isTouchDevice;
}
