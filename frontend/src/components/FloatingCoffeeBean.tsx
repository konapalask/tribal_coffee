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
  seed?: number;
}

export default function FloatingCoffeeBean(_props: FloatingCoffeeBeanProps) {
  // Completely disabled globally per user request
  return null;
}
