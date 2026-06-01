import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TRIBAL_PRODUCTS, type RealProduct, API_BASE_URL } from '../services/db';
import FloatingCoffeeBean from './FloatingCoffeeBean';
import { usePerformance } from '../hooks/usePerformance';

interface HeroProps {
  onAddToBag: (product: RealProduct) => void;
  onViewDetails: (product: RealProduct) => void;
}

export default function Hero({ onAddToBag, onViewDetails }: HeroProps) {
  const { isLowEnd } = usePerformance();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Reset text expansion when product changes
  useEffect(() => {
    setIsTextExpanded(false);
  }, [activeIndex]);
  
  // Real-time mouse tilt properties
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)' });
  const [glowOffset, setGlowOffset] = useState({ x: 0, y: 0 });
  const mousePos = { x: 0, y: 0 };


  // Circular offset function to determine 3D positions of the 5 products
  const getOffset = (idx: number) => {
    const N = TRIBAL_PRODUCTS.length;
    let offset = (idx - activeIndex + N) % N;
    if (offset > N / 2) {
      offset -= N;
    }
    return offset;
  };

  const activeProduct = TRIBAL_PRODUCTS[activeIndex];
  
  if (!activeProduct) {
    return (
      <section
        id="home"
        className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden pt-20 pb-16 bg-[#0a0705] z-10 text-center"
      >
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 rounded-full bg-warm-gold/10 border border-warm-gold/20 flex items-center justify-center mx-auto text-warm-gold">
            <div className="w-8 h-8 rounded-full border-2 border-warm-gold border-t-transparent animate-spin" />
          </div>
          <span className="text-[10px] tracking-[0.2em] font-sans font-bold text-warm-gold uppercase block">
            Preparing Organic Infusions...
          </span>
        </div>
      </section>
    );
  }
  
  const autoPlayTimerRef = useRef<any>(null);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % TRIBAL_PRODUCTS.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + TRIBAL_PRODUCTS.length) % TRIBAL_PRODUCTS.length);
  };

  // Preload all high-res product images on initial mount to eliminate loading latency and cache textures
  useEffect(() => {
    TRIBAL_PRODUCTS.forEach((product) => {
      const img = new Image();
      img.src = product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`;
    });
  }, []);

  // Auto-play selector with pause-on-hover triggers
  useEffect(() => {
    if (!isHovered) {
      autoPlayTimerRef.current = setInterval(() => {
        nextSlide();
      }, 4500);
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isHovered, activeIndex]);

  // Safeguard: Ensure activeIndex stays in bounds if TRIBAL_PRODUCTS length changes dynamically (e.g., deletions)
  useEffect(() => {
    if (TRIBAL_PRODUCTS.length > 0 && activeIndex >= TRIBAL_PRODUCTS.length) {
      setActiveIndex(0);
    }
  }, [TRIBAL_PRODUCTS.length, activeIndex]);


  // 3D Card Hover Rotation Effect - optimized with translate3d
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLowEnd) return;
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rotateX = -y / (box.height / 15);
    const rotateY = x / (box.width / 15);
    
    // Smooth 3D tilt transition
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02) translate3d(0, 0, 0)`
    });

    // Opposite parallax shifts on the active backing light - restricted to GPU translation
    setGlowOffset({
      x: -x / 6,
      y: -y / 6
    });
  };

  const handleMouseLeave = () => {
    if (isLowEnd) return;
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translate3d(0, 0, 0)'
    });
    setGlowOffset({ x: 0, y: 0 });
  };

  // Section-wide mouse tracker for parallax coffee beans - completely bypassed since floating beans are disabled
  const handleSectionMouseMove = (_e: React.MouseEvent<HTMLElement>) => {
    return;
  };

  const handleSectionMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <section
      id="home"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleSectionMouseLeave}
      onMouseMove={handleSectionMouseMove}
      className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden pt-20 md:pt-24 pb-16 transition-colors duration-1000 ease-in-out z-10 bg-gradient-hero-to-shop"
    >
      {/* GPU-Composited Custom keyframes to animate coffee beans and smoke on the GPU thread with 0% CPU cost */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gpuSlowFloat1 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(6px, -12px, 0) rotate(4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }
        @keyframes gpuSlowFloat2 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-6px, -14px, 0) rotate(-4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }
        .animate-gpu-float-1 {
          animation: gpuSlowFloat1 18s ease-in-out infinite;
          will-change: transform;
        }
        .animate-gpu-float-2 {
          animation: gpuSlowFloat2 22s ease-in-out infinite;
          will-change: transform;
        }
      `}} />

      {/* 1. Cinematic Ambiance Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Layer A: Base Rich Dark Roasted Espresso Background Color */}
        <div 
          className="absolute inset-0 transition-all duration-1000 ease-in-out"
          style={{ background: '#0a0705' }}
        />

        {/* Layer A-2: Cinematic Coffee Lounge Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-20 mix-blend-overlay"
          style={{ 
            backgroundImage: `url('${API_BASE_URL}/images/luxury_coffee_hero_bg.opt.webp')`,
          }}
        />

        {/* Layer B: Dark Smoky Gradient with Product Tint - Dynamic transition */}
        <div 
          className="absolute inset-0 transition-all duration-1000 ease-in-out opacity-85"
          style={{ 
            background: `radial-gradient(circle at 50% 45%, ${activeProduct?.glowColor || 'rgba(74, 44, 29, 0.45)'} 0%, rgba(10, 7, 5, 0.98) 70%)`
          }}
        />

        {/* Layer C: Premium Warm Backing Amber Light behind the active product */}
        <div 
          className="absolute inset-0 transition-all duration-1000 opacity-60 animate-pulse-slow pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 45%, rgba(200, 169, 126, 0.15) 0%, transparent 60%)`,
          }}
        />

        {/* Layer D: Cinematic Vignette to keep corners rich, dark, and highly immersive */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at center, transparent 35%, rgba(10, 7, 5, 0.98) 100%)'
        }} />
        
        {/* Layer E: Soft Ambient Smoke/Steam (Cinematic depth) - static transitions with 0% javascript overhead */}
        <div className="coffee-steam-element left-1/4 animate-smoke opacity-10" style={{ animationDelay: '0s', width: '160px', willChange: 'opacity' }} />
        <div className="coffee-steam-element right-1/4 animate-smoke opacity-8" style={{ animationDelay: '3s', width: '200px', willChange: 'opacity' }} />
      </div>

      {/* 2. GIANT BACKING TYPOGRAPHY */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.h1
            key={activeProduct?.id || 'empty'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.02, scale: 1.02 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
            className="text-[12vw] font-bebas font-extrabold text-cream-latte tracking-[0.15em] text-center select-none whitespace-nowrap outline-text leading-none uppercase"
            style={{
              willChange: 'transform, opacity',
              WebkitTextStroke: '1px rgba(231, 216, 201, 0.12)',
              color: 'transparent'
            }}
          >
            {activeProduct?.category === 'beans' ? 'ORGANIC BEANS' : activeProduct?.category === 'filter' ? 'SOUTH FILTER' : 'ARAKU POWDER'}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* 3. DYNAMIC PARALLAX FLOATING COFFEE BEANS - Multi-layered 3D depth-of-field focus */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <FloatingCoffeeBean
          size={90}
          mobileSize={60}
          top="82%"
          left="6%"
          depth="foreground"
          parallaxFactor={-0.06}
          rotation={35}
          animationDelay="0s"
          animationDuration="15s"
          mousePos={mousePos}
          seed={1}
        />
        <FloatingCoffeeBean
          size={60}
          mobileSize={40}
          top="16%"
          left="26%"
          depth="midground"
          parallaxFactor={-0.04}
          rotation={75}
          animationDelay="1s"
          animationDuration="18s"
          mousePos={mousePos}
          seed={2}
        />
        <FloatingCoffeeBean
          size={40}
          mobileSize={25}
          top="50%"
          left="42%"
          depth="background"
          parallaxFactor={-0.015}
          rotation={12}
          animationDelay="3s"
          animationDuration="22s"
          mousePos={mousePos}
          seed={3}
        />
        {/* Right column balanced floating beans */}
        <FloatingCoffeeBean
          size={70}
          mobileSize={45}
          top="22%"
          right="15%"
          depth="midground"
          parallaxFactor={-0.035}
          rotation={125}
          animationDelay="1.5s"
          animationDuration="20s"
          mousePos={mousePos}
          seed={4}
        />
        <FloatingCoffeeBean
          size={45}
          mobileSize={30}
          top="68%"
          right="35%"
          depth="background"
          parallaxFactor={-0.02}
          rotation={45}
          animationDelay="4.5s"
          animationDuration="24s"
          mousePos={mousePos}
          seed={5}
        />
        <FloatingCoffeeBean
          size={80}
          mobileSize={50}
          top="85%"
          left="62%"
          depth="foreground"
          parallaxFactor={-0.05}
          rotation={90}
          animationDelay="2.5s"
          animationDuration="16s"
          mousePos={mousePos}
          seed={6}
        />
      </div>

      {/* 4. MAIN SPLIT CONTENT GRID CONTAINER */}
      <div className="w-full max-w-[1650px] mx-auto px-6 md:px-12 flex flex-col md:grid md:grid-cols-[0.95fr_1.05fr] gap-12 md:gap-8 items-center justify-center flex-grow z-10 relative">
        
        {/* LEFT COLUMN: Product information & navigation selector */}
        <div className="order-2 md:order-1 text-left flex flex-col justify-center min-h-[340px] md:min-h-[450px] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProduct?.id || 'empty'}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              style={{ willChange: 'transform, opacity' }}
              id={`hero-content-${activeProduct?.id || 'empty'}`}
              className="flex flex-col text-left justify-center w-full max-w-[540px]"
            >
              {/* Tagline */}
              <span className="text-xs font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-2 block">
                {activeProduct?.tagline || ''}
              </span>

              {/* Product Title */}
              <h2 className="text-3xl md:text-5xl font-playfair font-bold text-cream-latte leading-tight mb-4">
                {activeProduct?.name || ''}
              </h2>

              {/* Specifications & Price */}
              <div className="flex items-center gap-4 mb-4 text-sm text-cream-latte/70 font-sans">
                <span className="bg-bean/60 border border-warm-gold/20 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
                  {activeProduct?.roast || ''}
                </span>
                <span className="bg-cream-latte/5 border border-cream-latte/15 px-3 py-1 rounded-full text-xs tracking-wide uppercase">
                  {activeProduct?.chicory || ''}
                </span>
                <span className="font-bebas text-2xl text-warm-gold tracking-widest">
                  ₹{activeProduct?.price || 0}.00
                </span>
              </div>

              {/* Description */}
              <div className="mb-6 max-w-md">
                <p className={`text-sm md:text-base text-cream-latte/70 font-sans leading-relaxed ${isTextExpanded ? '' : 'line-clamp-2'}`}>
                  {activeProduct?.description || ''}
                </p>
                {activeProduct?.description && activeProduct.description.length > 120 && (
                  <button 
                    onClick={() => setIsTextExpanded(!isTextExpanded)} 
                    className="text-xs text-warm-gold mt-1.5 font-bold hover:text-white transition-colors cursor-pointer"
                  >
                    {isTextExpanded ? 'Read Less' : 'Read More...'}
                  </button>
                )}
              </div>

              {/* Tasting Notes */}
              <div className="flex flex-wrap gap-2 mb-8">
                {activeProduct?.tastingNotes?.map((note) => (
                  <span 
                    key={note} 
                    className="text-xs font-sans font-medium px-3 py-1.5 rounded-md glassmorphism text-cream-latte/90 flex items-center gap-1.5 border border-warm-gold/5"
                  >
                    <span className="w-1.5 h-1.5 bg-warm-gold rounded-full" />
                    {note}
                  </span>
                )) || null}
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-4 mb-8">
                <button
                  id={`hero-buy-now-${activeProduct?.id || 'empty'}`}
                  onClick={() => activeProduct && onAddToBag(activeProduct)}
                  className="bg-warm-gold text-espresso font-sans text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-full border border-warm-gold hover:bg-transparent hover:text-warm-gold hover:shadow-[0_0_20px_rgba(200,169,126,0.35)] transition-all duration-300 cursor-pointer"
                >
                  Buy Now
                </button>
                <button
                  id={`hero-view-details-${activeProduct?.id || 'empty'}`}
                  onClick={() => activeProduct && onViewDetails(activeProduct)}
                  className="text-cream-latte hover:text-warm-gold bg-transparent font-sans text-xs font-bold tracking-widest uppercase px-6 py-4 border border-cream-latte/20 hover:border-warm-gold rounded-full transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                >
                  View Details
                  <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interactive Glassmorphic Thumbnail Selector - containing ALL 5 products inside left content area */}
          <div className="flex items-center gap-3 flex-wrap mt-4 md:mt-2">
            {TRIBAL_PRODUCTS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveIndex(idx)}
                id={`carousel-thumbnail-${p.id}`}
                className={`relative w-14 h-14 p-2 rounded-2xl cursor-pointer transition-all duration-500 flex items-center justify-center glassmorphism overflow-hidden ${
                  activeIndex === idx 
                    ? 'border-2 border-warm-gold shadow-[0_0_15px_rgba(214,178,122,0.4)] blur-none brightness-110 scale-105 z-10' 
                    : 'opacity-40 hover:opacity-80 blur-[0.5px] hover:blur-none border border-cream-latte/10 scale-95 hover:scale-100 hover:z-10'
                }`}
                aria-label={`Select Product ${p.name}`}
              >
                {activeIndex === idx && (
                  <div className="absolute inset-0 bg-warm-gold/10 rounded-2xl pointer-events-none animate-pulse" />
                )}
                <img
                  src={p.image.startsWith('http') ? p.image : `${API_BASE_URL}${p.image}`}
                  alt={p.name}
                  loading="eager"
                  decoding="async"
                  className="h-10 w-auto object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Premium 3D Rotating Carousel */}
        <div className="order-1 md:order-2 w-full h-[380px] sm:h-[460px] md:h-[580px] lg:h-[700px] relative flex items-center justify-center overflow-visible">
          {/* Floating Left Navigation Button */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:-left-16 lg:-left-24 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full backdrop-blur-md bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-warm-gold/40 hover:scale-110 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer group"
            aria-label="Previous Product"
          >
            <ArrowLeft size={20} className="stroke-[2] group-hover:-translate-x-0.5 transition-transform duration-300" />
          </button>

          {/* Unified 3D Carousel container */}
          <div className="relative w-full h-full flex items-center justify-center select-none overflow-visible">
            {TRIBAL_PRODUCTS.map((product, idx) => {
              const offset = getOffset(idx);
              const isActive = offset === 0;
              const isLeft = offset === -1;
              const isRight = offset === 1;

              // Strict percentage spacing rules: LEFT BACK: 22%, LEFT SIDE: 34%, CENTER: 50%, RIGHT SIDE: 66%, RIGHT BACK: 78%
              const leftPos = isMobile
                ? "50%"
                : offset === -2 
                  ? "22%" 
                  : offset === -1 
                    ? "34%" 
                    : offset === 0 
                      ? "50%" 
                      : offset === 1 
                        ? "66%" 
                        : "78%";

              const scaleVal = isActive 
                ? (isMobile ? 1.0 : 1.15) 
                : Math.abs(offset) === 1 
                  ? 0.82 
                  : 0.60;

              const opacityVal = isActive 
                ? 1.0 
                : isMobile
                  ? 0.0 // Completely hide non-active offset cards on mobile to prevent ugly horizontal overflow!
                  : Math.abs(offset) === 1 
                    ? 0.7 
                    : 0.25;

              const zIndexVal = isActive 
                ? 40 
                : Math.abs(offset) === 1 
                  ? 20 
                  : 10;

              const blurVal = isActive 
                ? "blur(0px)" 
                : Math.abs(offset) === 1 
                  ? "blur(2px)" 
                  : "blur(5px)";

              const zTranslate = isActive 
                ? 120 
                : Math.abs(offset) === 1 
                  ? -60 
                  : -180;

              return (
                <motion.div
                  key={product.id}
                  style={{
                    position: 'absolute',
                    willChange: 'transform, opacity, filter',
                    backfaceVisibility: 'hidden',
                    transformStyle: 'preserve-3d',
                    zIndex: zIndexVal,
                    pointerEvents: isActive || isLeft || isRight ? 'auto' : 'none',
                    x: "-50%", // Keep the card centered on the percentage-based left anchor
                    ...(isActive ? tiltStyle : {})
                  }}
                  animate={{
                    left: leftPos,
                    scale: scaleVal,
                    opacity: opacityVal,
                    filter: blurVal,
                    z: zTranslate,
                    rotateY: isActive ? 0 : offset * -12
                  }}
                  transition={{
                    duration: 0.65,
                    ease: [0.4, 0, 0.2, 1] // Premium Framer transition curve
                  }}
                  onMouseMove={isActive ? handleMouseMove : undefined}
                  onMouseLeave={isActive ? handleMouseLeave : undefined}
                  onClick={() => {
                    if (isActive) {
                      onViewDetails(product);
                    } else if (isLeft) {
                      prevSlide();
                    } else if (isRight) {
                      nextSlide();
                    }
                  }}
                  id={`carousel-card-${product.id}`}
                  className="absolute flex flex-col items-center justify-center w-[250px] h-[330px] sm:w-[280px] sm:h-[360px] md:w-[380px] md:h-[520px] lg:w-[500px] lg:h-[680px] cursor-pointer select-none"
                >
                  {/* Gold Ambient Backing Light - shifting dynamically in opposite parallax direction */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-full filter blur-[100px] opacity-75 -z-10 mix-blend-screen transition-transform duration-300 ease-out"
                      style={{ 
                        background: `radial-gradient(circle, ${product.glowColor} 0%, transparent 70%)`,
                        transform: `translate3d(${glowOffset.x}px, ${glowOffset.y}px, -60px)`
                      }}
                    />
                  )}

                  {/* Texture overlay */}
                  <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 60%, rgba(17,17,17,0.3) 100%) pointer-events-none" />

                  {/* Float & Motion Interaction Layer */}
                  <motion.div
                    animate={isActive ? {
                      y: [0, -16, 0]
                    } : { y: 0 }}
                    transition={{
                      y: isActive ? {
                        repeat: Infinity,
                        duration: 6.5,
                        ease: "easeInOut"
                      } : { duration: 0.5 }
                    }}
                    className="flex flex-col items-center relative"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(50px)'
                    }}
                  >
                    {/* Uniform Aspect-Locked Product Package Image Container */}
                    <div className="w-[250px] h-[330px] sm:w-[280px] sm:h-[360px] md:w-[380px] md:h-[500px] lg:w-[520px] lg:h-[650px] flex items-center justify-center relative overflow-visible">
                      <img
                        src={product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`}
                        alt={product.name}
                        loading="eager"
                        decoding="async"
                        id={`product-image-${product.id}`}
                        className="w-full h-full object-contain object-center drop-shadow-[0_50px_70px_rgba(0,0,0,0.9)] filter brightness-105 transition-transform duration-500"
                        style={{ imageRendering: '-webkit-optimize-contrast', willChange: 'transform' }}
                      />
                    </div>

                    {/* Ground Shadow - dynamically scaling shadow bloom base */}
                    <div 
                      className="w-40 h-5 bg-black/75 rounded-full filter blur-xl absolute -bottom-5 left-1/2 -translate-x-1/2 -z-10 transition-all duration-700 ease-out"
                      style={{ 
                        transform: isActive ? 'translate3d(0, 0, -10px) scale(1.15)' : 'translate3d(0, 0, -10px) scale(0.7)',
                        opacity: isActive ? 0.8 : 0.15
                      }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          {/* Floating Right Navigation Button */}
          <button
            onClick={nextSlide}
            className="absolute right-2 md:-right-16 lg:-right-24 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full backdrop-blur-md bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-warm-gold/40 hover:scale-110 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer group"
            aria-label="Next Product"
          >
            <ArrowRight size={20} className="stroke-[2] group-hover:translate-x-0.5 transition-transform duration-300" />
          </button>        </div>

      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-50">
        <a 
          href="#shop" 
          className="text-[9px] font-sans tracking-[0.3em] text-warm-gold/50 hover:text-warm-gold uppercase font-bold flex flex-col items-center gap-2 transition-colors group"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>To Shop</span>
          <div className="w-6 h-10 border border-warm-gold/30 rounded-full flex justify-center p-1 group-hover:border-warm-gold/80 transition-colors">
            <div className="w-1 h-2 bg-warm-gold rounded-full animate-bounce mt-1" />
          </div>
        </a>
      </div>

    </section>
  );
}
