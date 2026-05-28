import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import FloatingCoffeeBean from './FloatingCoffeeBean';
import { usePerformance } from '../hooks/usePerformance';

const TESTIMONIALS = [
  {
    id: 'test-1',
    name: 'Devendra Rajwade',
    role: 'Private Banker & Fine Art Collector',
    comment: 'The Araku Valley reserve is a profound revelation. The exquisite depth of body and intricate dark cocoa tasting notes comfortably rival the rarest specialty coffees I have experienced globally. It has become the exclusive label served in my private lounge.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    id: 'test-2',
    name: 'Ananya Sengupta',
    role: 'Michelin-Starred Patissier & Culinary Director',
    comment: 'The artisanal organic powder has completely elevated our signature desserts. Its delicate caramel undertones and velvety-smooth finish remain perfectly aromatic. It is, without question, liquid gold for discerning culinary artists.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    id: 'test-3',
    name: 'Arjun Mehta',
    role: 'Founding Partner & Creative Director',
    comment: 'As a designer, I am deeply impressed by the harmony between their immaculate brand identity and roasting precision. The premium cold brew is a masterclass in craftsmanship—perfectly balanced, naturally sweet, and exceptionally rich. An indispensable daily ritual.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
  },
];

export default function Testimonials() {
  const { isLowEnd } = usePerformance();
  return (
    <section
      id="testimonials"
      className="pt-8 md:pt-12 pb-16 md:pb-24 bg-gradient-testimonials w-full relative z-10 overflow-hidden border-t border-warm-gold/5"
    >
      {/* Background radial soft lights */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full filter blur-[150px] bg-bean/15 opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full filter blur-[150px] bg-warm-gold/5 opacity-55" />
      </div>

      {/* Floating Gold Particles */}
      <div className="absolute top-1/4 right-12 w-2 h-2 gold-dust-particle" style={{ animationDelay: '1s', opacity: 0.12 }} />
      <div className="absolute bottom-1/3 left-12 w-3.5 h-3.5 gold-dust-particle" style={{ animationDelay: '4s', opacity: 0.18 }} />

      {/* Atmospheric Floating Coffee Beans (1) */}
      <FloatingCoffeeBean
        size={72}
        mobileSize={46}
        top="8%"
        left="4%"
        depth="midground"
        rotation={15}
        animationDelay="2s"
        animationDuration="15s"
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-3 block">
            Client Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-cream-latte leading-tight">
            Accolades From True Connoisseurs
          </h2>
          <div className="w-16 h-[2px] bg-warm-gold/60 mx-auto mt-6" />
        </div>

        {/* Testimonials Deck with micro-drifting animations */}
        <div 
          id="testimonials-deck"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {TESTIMONIALS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-premium-card ${isLowEnd ? 'none-blur' : ''} p-8 md:p-10 flex flex-col justify-between relative h-full transition-all duration-300 hover:-translate-y-2`}
              id={`testimonial-card-${item.id}`}
            >
              {/* Quote Icon styling */}
              <div className="absolute top-6 right-8 text-warm-gold/15">
                <Quote size={40} className="stroke-[1.5]" />
              </div>

              <div>
                {/* Five star rating */}
                <div className="flex items-center gap-1 mb-6 text-warm-gold">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-warm-gold stroke-none" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-sm md:text-base text-cream-latte/70 font-sans leading-relaxed italic mb-8 relative z-10 text-left">
                  "{item.comment}"
                </p>
              </div>

              {/* Customer Avatar & Bio */}
              <div className="flex items-center gap-4 border-t border-warm-gold/10 pt-6 text-left">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover border border-warm-gold/30"
                />
                <div>
                  <h4 className="font-playfair font-bold text-cream-latte text-sm md:text-base tracking-wide">
                    {item.name}
                  </h4>
                  <p className="text-xs font-sans text-warm-gold tracking-widest uppercase">
                    {item.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
