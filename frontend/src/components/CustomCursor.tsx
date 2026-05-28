import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePerformance } from '../hooks/usePerformance';

export default function CustomCursor({ isAdminActive = false }: { isAdminActive?: boolean }) {
  const { isLowEnd } = usePerformance();
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdminActive || isLowEnd) return;
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Center starting point
    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

    // Highly optimized GSAP quickTo setters for zero-allocation animation
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.4, ease: 'power2.out' });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.4, ease: 'power2.out' });

    const onMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    let isHovered = false;
    const onMouseOverInteractive = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const shouldHover = !!(
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('a') || 
        target.closest('button') ||
        target.closest('[data-hover-glow]')
      );

      if (shouldHover === isHovered) return;
      isHovered = shouldHover;

      if (shouldHover) {
        gsap.to(cursor, {
          width: 60,
          height: 60,
          backgroundColor: 'rgba(200, 169, 126, 0.15)',
          borderColor: 'rgba(200, 169, 126, 0.8)',
          duration: 0.3,
          overwrite: 'auto',
        });
      } else {
        gsap.to(cursor, {
          width: 30,
          height: 30,
          backgroundColor: 'rgba(200, 169, 126, 0.05)',
          borderColor: 'rgba(200, 169, 126, 0.4)',
          duration: 0.3,
          overwrite: 'auto',
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOverInteractive, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOverInteractive);
    };
  }, [isAdminActive]);

  if (isAdminActive || isLowEnd) return null;

  return (
    <div 
      ref={cursorRef} 
      className="glow-cursor hidden md:block" 
      id="custom-glow-cursor"
    />
  );
}
