import { motion } from 'framer-motion';
import { Flame, Leaf, Wind, Zap } from 'lucide-react';
import FloatingCoffeeBean from './FloatingCoffeeBean';
import { usePerformance } from '../hooks/usePerformance';

const ADVANTAGES = [
  {
    id: 'fresh-roasted',
    icon: Flame,
    title: 'Freshly Roasted',
    description: 'Slow micro-batches roasted on demand and shipped within 24 hours to guarantee maximum freshness.',
  },
  {
    id: 'organic-beans',
    icon: Leaf,
    title: '100% Organic',
    description: 'Directly sourced, certified organic Arabica beans cultivated without chemicals or synthetic fertilizers.',
  },
  {
    id: 'rich-aroma',
    icon: Wind,
    title: 'Rich Complex Aroma',
    description: 'A delicate maturation process locks in dynamic flavor compounds, yielding an intense, unforgettable bloom.',
  },
  {
    id: 'fast-delivery',
    icon: Zap,
    title: 'Fast & Secure Delivery',
    description: 'Luxury vacuum-sealed nitrogen packaging shipped with express tracking directly to your coffee lounge.',
  },
];

export default function WhyChooseUs() {
  const { isLowEnd } = usePerformance();
  return (
    <section
      id="collections"
      className="pt-8 md:pt-12 pb-8 md:pb-12 bg-gradient-whyus w-full relative z-10 overflow-hidden border-t border-warm-gold/5"
    >
      {/* Decorative backing glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full filter blur-[150px] bg-bean/10 opacity-30" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full filter blur-[180px] bg-warm-gold/5 opacity-40" />
      </div>

      {/* Floating Gold Particles */}
      <div className="absolute top-10 right-10 w-2 h-2 gold-dust-particle" style={{ animationDelay: '3s', opacity: 0.14 }} />
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 gold-dust-particle" style={{ animationDelay: '6s', opacity: 0.18 }} />
      <div className="absolute bottom-10 right-1/4 w-2.5 h-2.5 gold-dust-particle" style={{ animationDelay: '2s', opacity: 0.12 }} />

      {/* Atmospheric Floating Coffee Beans (1) */}
      <FloatingCoffeeBean
        size={65}
        mobileSize={40}
        top="6%"
        left="6%"
        depth="background"
        rotation={-20}
        animationDelay="1.5s"
        animationDuration="15s"
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-3 block">
            Why Terra Noir
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-cream-latte leading-tight">
            Uncompromising Standards, Unequaled Flavor
          </h2>
          <div className="w-16 h-[2px] bg-warm-gold/60 mx-auto mt-6" />
        </div>

        {/* Advantage Cards */}
        <div 
          id="why-choose-us-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {ADVANTAGES.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                id={`advantage-card-${item.id}`}
                className={`group relative glass-premium-card ${isLowEnd ? 'none-blur' : ''} p-8 flex flex-col items-center text-center h-full`}
              >
                {/* Gold Highlight backing circle */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full filter blur-[35px] bg-warm-gold/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Animated Icon Container */}
                <div className="w-16 h-16 rounded-full bg-warm-gold/5 border border-warm-gold/25 flex items-center justify-center mb-6 text-warm-gold transform group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-warm-gold group-hover:to-caramel group-hover:text-espresso transition-all duration-500 shadow-[0_0_15px_rgba(200,169,126,0.1)] group-hover:shadow-[0_0_20px_rgba(200,169,126,0.4)]">
                  <IconComponent size={24} className="stroke-[1.5] transition-transform duration-500" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-playfair font-bold text-cream-latte mb-3 group-hover:text-warm-gold transition-colors duration-300">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-cream-latte/60 font-sans leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
