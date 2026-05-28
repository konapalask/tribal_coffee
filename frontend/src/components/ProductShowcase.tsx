import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { TRIBAL_PRODUCTS, type RealProduct, API_BASE_URL } from '../services/db';
import FloatingCoffeeBean from './FloatingCoffeeBean';
import { usePerformance } from '../hooks/usePerformance';

interface ProductShowcaseProps {
  onAddToBag: (product: RealProduct) => void;
  onViewDetails: (product: RealProduct) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
}

export default function ProductShowcase({ onAddToBag, onViewDetails, wishlist, onToggleWishlist }: ProductShowcaseProps) {
  const { isLowEnd } = usePerformance();
  return (
    <section
      id="shop"
      className="py-16 md:py-24 bg-gradient-shop w-full relative z-10 overflow-hidden border-t border-warm-gold/5"
    >
      {/* Decorative backing text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <h2 
          className="font-bebas text-[8vw] md:text-[10vw] tracking-[0.25em] text-cream-latte select-none pointer-events-none leading-none uppercase"
          style={{
            opacity: 0.05,
            willChange: 'transform, opacity',
            WebkitTextStroke: '1px rgba(231, 216, 201, 0.15)',
            color: 'transparent'
          }}
        >
          ARAKU VALLEY
        </h2>
      </div>

      {/* Cinematic Ambient Glow Backing */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full filter blur-[150px] bg-warm-gold/5 opacity-40" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full filter blur-[180px] bg-bean/10 opacity-30" />
      </div>

      {/* Floating Gold Particles */}
      <div className="absolute top-10 left-10 w-2 h-2 gold-dust-particle" style={{ animationDelay: '0s', opacity: 0.15 }} />
      <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 gold-dust-particle" style={{ animationDelay: '4s', opacity: 0.2 }} />
      <div className="absolute bottom-10 left-1/3 w-2.5 h-2.5 gold-dust-particle" style={{ animationDelay: '2s', opacity: 0.1 }} />
      <div className="absolute bottom-1/4 right-10 w-3 h-3 gold-dust-particle" style={{ animationDelay: '7s', opacity: 0.18 }} />

      {/* Atmospheric Floating Coffee Beans (1) */}
      <FloatingCoffeeBean
        size={70}
        mobileSize={45}
        top="8%"
        left="4%"
        depth="midground"
        rotation={25}
        animationDelay="1s"
        animationDuration="15s"
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* SECTION HEADER */}
        <div className="text-center md:text-left mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl text-left">
            <span className="text-xs font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-3 block">
              100% Certified Organic & Fair-Trade
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-cream-latte leading-tight">
              Shade-Grown Tribal Treasures
            </h2>
            <div className="w-16 h-[2px] bg-warm-gold/60 mt-6" />
          </div>
          <p className="text-sm md:text-base text-cream-latte/60 md:max-w-xs text-left font-sans leading-relaxed">
            Ethically sourced from tribal coffee growers in Araku Valley, roasted custom to order to lock in pure organic complexity.
          </p>
        </div>

        {/* PRODUCTS GRID */}
        <div 
          id="product-showcase-grid"
          className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8"
        >
          {TRIBAL_PRODUCTS.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              id={`showcase-card-${product.id}`}
              className={`group relative glass-premium-card ${isLowEnd ? 'none-blur' : ''} p-8 flex flex-col justify-between overflow-hidden text-left h-full`}
            >
              {/* Backing Warm Light Overlay */}
              <div 
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full filter blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
                style={{ background: product.glowColor }}
              />

              {/* Texture overlay */}
              <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 60%, rgba(17,17,17,0.3) 100%) pointer-events-none" />

              {/* Product Image & Float Animation */}
              <div 
                className="relative h-72 w-full flex items-center justify-center mb-6 cursor-pointer"
              >
                {/* Immersive Floating Heart Wishlist Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(product.id);
                  }}
                  className={`absolute top-0 right-0 p-2.5 rounded-full border transition-all duration-300 z-20 cursor-pointer ${
                    wishlist.includes(product.id)
                      ? 'bg-warm-gold border-warm-gold text-espresso shadow-[0_0_12px_rgba(214,178,122,0.45)]'
                      : 'bg-black/60 border-cream-latte/15 text-cream-latte hover:text-warm-gold hover:border-warm-gold/40'
                  }`}
                  title={wishlist.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  aria-label="Toggle Wishlist"
                >
                  <Heart size={14} className={wishlist.includes(product.id) ? "fill-current" : ""} />
                </button>

                {/* Image Soft Shadow Glow Base */}
                <div className="absolute w-44 h-8 rounded-full bg-black/60 filter blur-xl bottom-4 opacity-80 group-hover:scale-x-95 transition-all duration-700" />
                
                <img
                  loading="lazy"
                  onClick={() => onViewDetails(product)}
                  src={product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`}
                  alt={product.name}
                  className="h-64 object-contain transform scale-110 group-hover:scale-120 group-hover:-translate-y-6 group-hover:rotate-1 transition-all duration-700 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* Content */}
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  {/* Category & Specifications */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-sans tracking-widest text-warm-gold uppercase font-bold bg-bean/30 border border-warm-gold/15 px-2.5 py-0.5 rounded-md inline-block">
                      {product.roast}
                    </span>
                    <span className="text-[8px] font-sans tracking-widest text-cream-latte/50 uppercase border border-cream-latte/15 px-2 py-0.5 rounded-md inline-block">
                      {product.chicory}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 
                    onClick={() => onViewDetails(product)}
                    className="text-xl font-playfair font-bold text-cream-latte mb-3 group-hover:text-warm-gold transition-colors duration-300 cursor-pointer line-clamp-1"
                  >
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-cream-latte/55 font-sans leading-relaxed mb-6 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div>
                  {/* Tasting Notes */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {product.tastingNotes.slice(0, 3).map((note) => (
                      <span
                        key={note}
                        className="text-[9px] font-sans text-cream-latte/75 bg-cream-latte/5 px-2.5 py-1 rounded-md border border-cream-latte/5"
                      >
                        {note}
                      </span>
                    ))}
                  </div>

                  {/* Price and Action Buttons */}
                  <div className="flex items-center justify-between border-t border-warm-gold/10 pt-5 mt-auto">
                    <div className="flex flex-col text-left">
                      <span className="font-bebas text-2xl text-warm-gold tracking-widest leading-none">
                        ₹{product.price}.00
                      </span>
                      {product.originalPrice && (
                        <span className="font-bebas text-sm text-cream-latte/30 line-through tracking-widest mt-1">
                          ₹{product.originalPrice}.00
                        </span>
                      )}
                    </div>
                    
                    {/* Compact Interactive CTAs */}
                    <div className="flex items-center gap-2.5">
                      <button
                        id={`showcase-view-${product.id}`}
                        onClick={() => onViewDetails(product)}
                        className="p-2.5 bg-cream-latte/5 hover:bg-cream-latte/15 border border-cream-latte/10 rounded-full transition-colors cursor-pointer text-cream-latte/80 hover:text-warm-gold"
                        title="View Product Page"
                        aria-label="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        id={`showcase-buy-btn-${product.id}`}
                        onClick={() => onAddToBag(product)}
                        className="px-5 py-3 bg-warm-gold hover:bg-cream-latte text-espresso rounded-full font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-500 cursor-pointer shadow-[0_4px_16px_rgba(200,169,126,0.25)] hover:shadow-[0_0_20px_rgba(231,216,201,0.45)] hover:-translate-y-0.5 flex items-center gap-1.5"
                      >
                        <ShoppingBag size={12} className="stroke-[2.5]" />
                        Add To Bag
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
