import { useState, useEffect } from 'react';
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
export const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };

    // Initial check
    checkTablet();

    // Add event listener for window resize
    window.addEventListener('resize', checkTablet);

    // Cleanup
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
};
export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Initial check
    checkDesktop();

    // Add event listener for window resize
    window.addEventListener('resize', checkDesktop);

    // Cleanup
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return isDesktop;
};
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return isTouch;
};
export const useResponsive = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isTouch = useIsTouchDevice();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
  };
};