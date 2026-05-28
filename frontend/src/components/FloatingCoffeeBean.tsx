import { useId, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePerformance } from '../hooks/usePerformance';

interface FloatingCoffeeBeanProps {
  size: number;
  mobileSize?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  depth: 'foreground' | 'midground' | 'background';
  parallaxFactor?: number;
  rotation?: number;
  animationDelay?: string;
  animationDuration?: string;
  mousePos?: { x: number; y: number };
  className?: string;
}

// 12 pre-defined luxury coffee powder particles for deterministic and premium dispersion
const POWDER_PARTICLES = [
  { id: 1, x: -22, y: -15, size: 4, color: '#4A2C1D', delay: 0 },
  { id: 2, x: 18, y: -22, size: 5, color: '#C8A97E', delay: 0.05 },
  { id: 3, x: -12, y: 26, size: 3, color: '#2B1D15', delay: 0.02 },
  { id: 4, x: 24, y: 18, size: 5, color: '#9A6B42', delay: 0.07 },
  { id: 5, x: -26, y: 10, size: 4, color: '#110A07', delay: 0.04 },
  { id: 6, x: 14, y: 24, size: 3, color: '#C8A97E', delay: 0.09 },
  { id: 7, x: -10, y: -26, size: 5, color: '#4A2C1D', delay: 0.03 },
  { id: 8, x: 28, y: -6, size: 4, color: '#2B1D15', delay: 0.06 },
  { id: 9, x: -18, y: -18, size: 3, color: '#9A6B42', delay: 0.01 },
  { id: 10, x: 10, y: -30, size: 4, color: '#110A07', delay: 0.08 },
  { id: 11, x: -6, y: 18, size: 5, color: '#C8A97E', delay: 0.05 },
  { id: 12, x: 26, y: -14, size: 3, color: '#4A2C1D', delay: 0.07 }
];

export default function FloatingCoffeeBean({
  size,
  mobileSize,
  top,
  left,
  right,
  bottom,
  depth,
  parallaxFactor = 0,
  rotation = 0,
  animationDelay = '0s',
  animationDuration = '12s',
  mousePos = { x: 0, y: 0 },
  className = ''
}: FloatingCoffeeBeanProps) {
  const { isLowEnd } = usePerformance();
  const gradientId = useId();

  if (isLowEnd) {
    return null;
  }
  // Safe CSS selector name from useId (which contains colons like :r1:)
  const safeClassName = `bean-${gradientId.replace(/:/g, '')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPowder, setIsPowder] = useState(false);
  const isPowderRef = useRef(false);
  const lastTriggerTime = useRef(0);

  // Proximity mouse-coordinate trigger listener
  useEffect(() => {
    // Disable proximity particle triggers on mobile/tablet or background blurred beans to maximize compositor speed
    if (typeof window !== 'undefined' && (window.innerWidth < 768 || depth === 'background')) {
      return;
    }

    let lastMoveTime = 0;
    let lastRectTime = 0;
    let cachedRect: DOMRect | null = null;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const now = Date.now();
      // Throttle mousemove execution to roughly 12fps (~80ms) to significantly reduce CPU cycles
      if (now - lastMoveTime < 80) {
        return;
      }
      lastMoveTime = now;

      // Cache getBoundingClientRect to completely eliminate layout thrashing. Refresh only every 1.5 seconds
      if (!cachedRect || now - lastRectTime > 1500) {
        cachedRect = containerRef.current.getBoundingClientRect();
        lastRectTime = now;
      }
      
      const beanCenterX = cachedRect.left + cachedRect.width / 2;
      const beanCenterY = cachedRect.top + cachedRect.height / 2;
      
      // Calculate Euclidean distance to detect when cursor is near the bean
      const distance = Math.sqrt(
        Math.pow(e.clientX - beanCenterX, 2) +
        Math.pow(e.clientY - beanCenterY, 2)
      );

      // Interactive proximity threshold (120px)
      const PROXIMITY_RADIUS = 120;
      
      if (distance < PROXIMITY_RADIUS) {
        // Cooldown period (2.5 seconds total: 1s active + 1.5s delay) to maintain elegant aesthetic
        if (isPowderRef.current || now - lastTriggerTime.current < 2500) {
          return;
        }
        isPowderRef.current = true;
        setIsPowder(true);
        lastTriggerTime.current = now;

        // Disperse powder for 1 second, then reform back into bean smoothly
        setTimeout(() => {
          setIsPowder(false);
          isPowderRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [depth]);

  // Depth parameters mapping
  let blurStyle = '';
  let opacityStyle = '';
  let shadowClass = '';

  if (depth === 'foreground') {
    blurStyle = 'blur-[0px]'; // Sharp foreground focus
    opacityStyle = 'opacity-[0.8]';
    shadowClass = 'drop-shadow-[0_15px_30px_rgba(0,0,0,0.65)]';
  } else if (depth === 'midground') {
    blurStyle = 'blur-[1.5px]'; // Medium soft focus
    opacityStyle = 'opacity-[0.55]';
    shadowClass = 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]';
  } else if (depth === 'background') {
    blurStyle = 'blur-[3.5px]'; // Deep background focus
    opacityStyle = 'opacity-[0.25]';
    shadowClass = 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]';
  }

  // Parallax offsets based on cursor coordinates relative to center
  const tx = mousePos.x * parallaxFactor;
  const ty = mousePos.y * parallaxFactor;

  // Determine mobile size
  const currentMobileSize = mobileSize || Math.round(size * 0.65);

  return (
    <div
      ref={containerRef}
      className={`absolute pointer-events-none select-none z-0 transition-transform duration-500 ease-out ${className}`}
      style={{
        top,
        left,
        right,
        bottom,
        transform: `translate3d(${tx}px, ${ty}px, 0)`,
        willChange: 'transform'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .${safeClassName} {
          width: ${currentMobileSize}px;
          height: ${currentMobileSize}px;
        }
        @media (min-width: 768px) {
          .${safeClassName} {
            width: ${size}px;
            height: ${size}px;
          }
        }
      `}} />
      <div
        className={`${blurStyle} ${opacityStyle} ${safeClassName} relative`}
        style={{
          animation: `float ${animationDuration} ease-in-out infinite`,
          animationDelay,
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        <div
          className="w-full h-full relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Normal Coffee Bean vector path */}
          <motion.div
            animate={{
              opacity: isPowder ? 0 : 1,
              scale: isPowder ? 0.3 : 1,
              filter: isPowder ? "blur(4px)" : "blur(0px)"
            }}
            transition={{
              duration: isPowder ? 0.4 : 0.5,
              ease: "easeInOut"
            }}
            className="w-full h-full absolute inset-0"
          >
            <svg
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`w-full h-full ${shadowClass}`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A2C1D" />
                  <stop offset="50%" stopColor="#2B1D15" />
                  <stop offset="100%" stopColor="#110A07" />
                </linearGradient>
              </defs>
              {/* Roasted bean shell */}
              <path
                d="M32 4C18 4 8 14 8 28C8 42 18 60 32 60C46 60 56 42 56 28C56 14 46 4 32 4Z"
                fill={`url(#${gradientId})`}
              />
              {/* Center crease outline */}
              <path
                d="M32 4C28 16 26 32 32 44C38 32 36 16 32 4Z"
                fill="rgba(214, 178, 122, 0.22)"
              />
            </svg>
          </motion.div>

          {/* Coffee Powder Particles overlay (morphs on proximity hover) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
            {POWDER_PARTICLES.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
                animate={isPowder ? {
                  x: particle.x,
                  y: particle.y,
                  opacity: 0.95,
                  scale: [0.2, 1.25, 0.9],
                  rotate: 360
                } : {
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0.2,
                  rotate: 0
                }}
                transition={{
                  duration: isPowder ? 0.7 : 0.5,
                  delay: isPowder ? particle.delay : 0,
                  ease: isPowder ? "easeOut" : "easeIn"
                }}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 6px ${particle.color}`,
                  willChange: 'transform, opacity'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
