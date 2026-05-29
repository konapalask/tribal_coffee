import { usePerformance } from '../hooks/usePerformance';
import FloatingCoffeeBean from './FloatingCoffeeBean';

const generateBeans = () => {
  const beans = [];
  const sectionsCount = 5;
  const beansPerSection = 102; // Guarantees at least 100 seeds in every single section (510 total global seeds)

  for (let s = 0; s < sectionsCount; s++) {
    // Each section s spans s * 20% to (s + 1) * 20% vertical scroll depth of the site
    const sectionStart = s * 20;

    for (let i = 0; i < beansPerSection; i++) {
      // Deterministic pseudo-random generation based on index variables to avoid state recalculations
      const topOffset = sectionStart + ((i * 17 + s * 13) % 19); 
      const isLeft = (i % 2 === 0);
      const sideOffset = (i * 23 + s * 7) % 95; // Horizontal position
      
      // Sizes: 75% background (10-25px, lightweight & blurred), 20% midground (25-45px), 5% foreground (50-70px)
      let size = 15 + ((i * 11) % 12);
      let depth: 'background' | 'midground' | 'foreground' = 'background';
      
      if (i % 20 === 0) {
        size = 50 + (i % 15);
        depth = 'foreground';
      } else if (i % 5 === 0) {
        size = 25 + (i % 18);
        depth = 'midground';
      }

      const rotation = (i * 37) % 360;
      const delay = `${((i * 3) % 60) / 10}s`; // Animation delay
      const duration = `${12 + (i % 12)}s`; // Animation duration
      const seed = 1 + (i % 6); // Animation seed 1 to 6

      beans.push({
        top: `${topOffset}%`,
        left: isLeft ? `${sideOffset}%` : undefined,
        right: !isLeft ? `${sideOffset}%` : undefined,
        size,
        depth,
        rotation,
        delay,
        duration,
        seed
      });
    }
  }

  return beans;
};

const GLOBAL_BEANS = generateBeans();

export default function AtmosphericVolume() {
  const { isLowEnd } = usePerformance();

  if (isLowEnd) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
      {GLOBAL_BEANS.map((b, idx) => (
        <FloatingCoffeeBean
          key={`global-bean-${idx}`}
          size={b.size}
          top={b.top}
          left={b.left}
          right={b.right}
          depth={b.depth}
          rotation={b.rotation}
          animationDelay={b.delay}
          animationDuration={b.duration}
          seed={b.seed}
        />
      ))}
    </div>
  );
}
