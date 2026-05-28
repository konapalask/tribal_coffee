import { useState, useEffect } from 'react';

export function usePerformance() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const concurrency = window.navigator.hardwareConcurrency;
      const memory = (window.navigator as any).deviceMemory;
      
      // Classify as low-performance if hardware concurrency is 4 or less,
      // or if device memory is less than 4GB.
      const isLow = (concurrency !== undefined && concurrency <= 4) || (memory !== undefined && memory < 4);
      setIsLowEnd(isLow);
    }
  }, []);

  return {
    isLowEnd,
    // Max floating elements: 0 on low-end, up to 2 per section on high-end
    maxBeans: isLowEnd ? 0 : 2,
    enableGlows: !isLowEnd,
    enableCursorGlow: !isLowEnd,
    blurStrengthClass: isLowEnd ? 'none-blur' : 'glassmorphism',
  };
}
