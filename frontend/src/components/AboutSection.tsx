import { motion } from 'framer-motion';
import FloatingCoffeeBean from './FloatingCoffeeBean';
import { API_BASE_URL } from '../services/db';
import { usePerformance } from '../hooks/usePerformance';

export default function AboutSection() {
  const { isLowEnd } = usePerformance();
  return (
    <section
      id="about"
      className="pt-16 md:pt-24 pb-8 md:pb-12 bg-gradient-about w-full relative z-10 overflow-hidden border-t border-warm-gold/5"
    >
      {/* Decorative background ambient glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full filter blur-[180px] bg-warm-gold/5 opacity-40" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full filter blur-[150px] bg-bean/10 opacity-30" />
      </div>

      {/* Floating Gold Particles */}
      <div className="absolute top-1/4 left-10 w-2 h-2 gold-dust-particle" style={{ animationDelay: '2s', opacity: 0.12 }} />
      <div className="absolute bottom-1/3 right-10 w-3 h-3 gold-dust-particle" style={{ animationDelay: '5s', opacity: 0.15 }} />
      <div className="absolute bottom-10 left-1/4 w-2.5 h-2.5 gold-dust-particle" style={{ animationDelay: '1s', opacity: 0.1 }} />

      {/* Atmospheric Floating Coffee Beans (4) */}
      <FloatingCoffeeBean
        size={75}
        mobileSize={48}
        top="12%"
        left="5%"
        depth="midground"
        rotation={45}
        animationDelay="2s"
        animationDuration="15s"
        seed={3}
      />
      <FloatingCoffeeBean
        size={60}
        mobileSize={38}
        top="82%"
        right="28%"
        depth="background"
        rotation={-15}
        animationDelay="1s"
        animationDuration="14s"
        seed={1}
      />
      <FloatingCoffeeBean
        size={85}
        mobileSize={55}
        top="30%"
        right="45%"
        depth="foreground"
        rotation={85}
        animationDelay="4s"
        animationDuration="18s"
        seed={5}
      />
      <FloatingCoffeeBean
        size={50}
        mobileSize={30}
        top="65%"
        left="32%"
        depth="midground"
        rotation={120}
        animationDelay="0s"
        animationDuration="21s"
        seed={2}
      />

      <div className="max-w-[1650px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Image with interactive reveal & hover lift */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative group rounded-[30px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-warm-gold/15"
            id="about-image-container"
          >
            {/* Ambient gold glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-transparent to-transparent z-10 pointer-events-none" />
            
            {/* The image itself */}
            <img
              loading="lazy"
              src={`${API_BASE_URL}/images/b43c0ab3-fe3a-48b1-8640-12cf74c1a706.opt.webp`}
              alt="Artisanal Coffee Roasting Process"
              className="w-full h-[400px] md:h-[550px] object-cover object-center transform group-hover:scale-105 transition-transform duration-1000 ease-out"
            />

            {/* Float badge overlay */}
            <div className={`absolute bottom-8 left-8 right-8 z-20 glass-premium-card ${isLowEnd ? 'none-blur' : ''} p-6 border border-warm-gold/25 max-w-sm text-left hover:translate-y-0`}>
              <span className="text-[10px] font-sans tracking-[0.2em] text-warm-gold font-bold uppercase mb-1.5 block">
                Roasting Temperature
              </span>
              <p className="font-bebas text-3xl text-cream-latte tracking-wider leading-none">
                210°C • Micro-Batches
              </p>
              <p className="text-xs text-cream-latte/65 font-sans leading-relaxed mt-2.5">
                Slowly flame-roasted in solid copper drums to seal in delicate aromatic compounds.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Narrative Storytelling */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 text-left"
            id="about-content"
          >
            <span className="text-xs font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-3 block">
              The Heritage of Tribal Coffee
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-cream-latte leading-tight mb-8">
              Crafted With Devotion, Roasted For The Obsessed
            </h2>

            <div className="w-12 h-[2px] bg-warm-gold/60 mb-8" />

            <p className="text-sm md:text-base text-cream-latte/70 font-sans leading-relaxed mb-6 max-w-xl">
              At Tribal Coffee India, we view coffee not as a simple morning beverage, but as a celebratory tribute to the rich heritage of the Araku Valley. Our journey begins in high-altitude forest canopies, where organic Arabica beans are cultivated in harmony with nature by local tribal farmers.
            </p>

            <p className="text-sm md:text-base text-cream-latte/70 font-sans leading-relaxed mb-8 max-w-xl">
              By buying directly from indigenous grower cooperatives, we support local livelihood, forest protection, and sustainable agricultural traditions. Our master roasters then roast in custom micro-batches to carefully control caramelization curves, ensuring that every cup delivers an authentic, full-bodied coffee ritual.
            </p>

            {/* Luxury Stats List */}
            <div className="grid grid-cols-2 gap-6 border-t border-warm-gold/10 pt-8 mb-8">
              <div className={`p-5 glass-premium-card ${isLowEnd ? 'none-blur' : ''} border-warm-gold/5 hover:border-warm-gold/20 hover:translate-y-0 text-left`}>
                <span className="text-[10px] font-sans tracking-widest text-warm-gold/60 uppercase block mb-1 font-bold">
                  Estate Elevation
                </span>
                <p className="font-bebas text-3xl text-cream-latte tracking-widest leading-none mt-1">
                  1,200m+
                </p>
                <p className="text-[10px] text-cream-latte/50 font-sans leading-normal mt-1.5">
                  High-altitude slow maturation
                </p>
              </div>

              <div className={`p-5 glass-premium-card ${isLowEnd ? 'none-blur' : ''} border-warm-gold/5 hover:border-warm-gold/20 hover:translate-y-0 text-left`}>
                <span className="text-[10px] font-sans tracking-widest text-warm-gold/60 uppercase block mb-1 font-bold">
                  Ethically Sourced
                </span>
                <p className="font-bebas text-3xl text-cream-latte tracking-widest leading-none mt-1">
                  100% Tribal Co-Op
                </p>
                <p className="text-[10px] text-cream-latte/50 font-sans leading-normal mt-1.5">
                  Fair trade & direct partnerships
                </p>
              </div>
            </div>

            {/* Custom CTA */}
            <a
              href="#shop"
              id="about-cta-link"
              className="inline-flex items-center gap-3 text-xs font-sans font-bold tracking-[0.2em] text-warm-gold uppercase group hover:text-cream-latte transition-colors duration-300"
            >
              Our Roasting Heritage
              <span className="transform group-hover:translate-x-2 transition-transform duration-300">
                →
              </span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
