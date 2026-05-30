import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingBag, ShieldCheck, HelpCircle, Star, Award, Layers, Heart, Check } from 'lucide-react';
import { type RealProduct, API_BASE_URL } from '../services/db';

interface ProductPageProps {
  product: RealProduct;
  onClose: () => void;
  onAddToBag: (product: RealProduct, size: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export default function ProductPage({ product, onClose, onAddToBag, isWishlisted = false, onToggleWishlist }: ProductPageProps) {
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(product.size1Name || '350g');
  const [isAdding, setIsAdding] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement>(null);

  const handleAddToBagWithAnim = () => {
    onAddToBag(product, selectedSize);
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 2000);
  };

  const currentPrice = selectedSize === (product.size2Name || '750g') && product.price750g ? product.price750g : product.price;
  
  // Handle mouse move for Apple-style high-end Zoom-on-Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  // Listen to scroll to display the Sticky Add to Cart bar
  useEffect(() => {
    // Reset scroll to top when opening product page
    const container = document.getElementById('product-page-container');
    if (container) container.scrollTo(0, 0);

    let lastScrollTime = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < 60) return;
      lastScrollTime = now;

      if (!mainCtaRef.current || !container) return;
      const ctaBottom = mainCtaRef.current.getBoundingClientRect().bottom;
      
      // If primary CTA scrolls out of viewport, show sticky bar
      if (ctaBottom < 100) {
        setIsStickyVisible(true);
      } else {
        setIsStickyVisible(false);
      }
    };

    container?.addEventListener('scroll', handleScroll, { passive: true });
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [product]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      id="product-page-container"
      className="fixed inset-0 z-50 bg-espresso overflow-y-auto grain-overlay h-full w-full"
    >
      {/* Background spotlights */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-40 filter blur-[120px]"
          style={{ background: `radial-gradient(circle, ${product.glowColor} 0%, transparent 70%)` }}
        />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-bean/10 filter blur-[150px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-28 pb-20 relative z-10 text-left">
        
        {/* ESCAPE BUTTON */}
        <button
          onClick={onClose}
          id="product-close-btn"
          className="absolute top-8 right-6 md:right-12 p-3 bg-espresso/60 hover:bg-espresso border border-warm-gold/20 hover:border-warm-gold rounded-full text-cream-latte hover:text-warm-gold transition-all duration-300 cursor-pointer flex items-center gap-2 group backdrop-blur-sm z-50"
        >
          <span className="text-xs font-sans font-bold tracking-widest uppercase hidden md:inline-block pl-2 group-hover:text-warm-gold">
            Return to Lounge
          </span>
          <X size={16} />
        </button>

        {/* BREADCRUMB */}
        <div className="mb-8 text-xs font-sans tracking-widest text-cream-latte/55 uppercase flex items-center gap-2">
          <span className="hover:text-warm-gold cursor-pointer" onClick={onClose}>Lounge</span>
          <span>/</span>
          <span className="hover:text-warm-gold cursor-pointer" onClick={onClose}>{product.category}</span>
          <span>/</span>
          <span className="text-warm-gold">{product.name}</span>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* LEFT: IMAGE COLUMN WITH ZOOM-ON-HOVER */}
          <div className="lg:col-span-6 flex flex-col items-center lg:sticky lg:top-32 lg:self-start">
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full max-w-lg aspect-square rounded-[30px] glassmorphism border border-warm-gold/15 flex items-center justify-center p-8 overflow-hidden group cursor-zoom-in"
              id="zoom-hover-box"
            >
              {/* Core Image */}
              <img
                src={product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`}
                alt={product.name}
                className="w-full h-full object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-[0.98]"
              />

              {/* Magnifier glass lens portal */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[30px] border border-warm-gold/45"
                style={{
                  ...zoomStyle,
                  backgroundImage: `url(${product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '200%',
                  mixBlendMode: 'normal',
                }}
              />

              {/* Badge Overlay */}
              <div className="absolute top-6 left-6 glassmorphism-light rounded-xl px-4 py-2 border border-warm-gold/10 flex items-center gap-2">
                <Award size={14} className="text-warm-gold" />
                <span className="text-[10px] font-sans tracking-wider text-cream-latte font-bold uppercase">
                  Araku Origin
                </span>
              </div>
            </div>

            <p className="text-[10px] font-sans tracking-widest text-cream-latte/40 uppercase mt-4">
              🔍 Hover cursor over packaging to magnify details
            </p>
          </div>

          {/* RIGHT: PROFILE COLUMN */}
          <div className="lg:col-span-6 flex flex-col gap-8">
            <div>
              {/* Tagline */}
              <span className="text-xs font-sans tracking-[0.25em] text-warm-gold font-bold uppercase mb-2 block">
                {product.tagline}
              </span>
              
              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-playfair font-bold text-cream-latte leading-tight mb-4">
                {product.name}
              </h1>

              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-xs font-sans bg-bean/60 border border-warm-gold/20 px-3 py-1 rounded-full text-warm-gold">
                  {product.roast}
                </span>
                <span className="text-xs font-sans bg-cream-latte/5 border border-cream-latte/15 px-3 py-1 rounded-full text-cream-latte/80">
                  {product.chicory}
                </span>
                <div className="flex items-center gap-1 text-warm-gold ml-2">
                  <Star size={14} className="fill-warm-gold stroke-none" />
                  <Star size={14} className="fill-warm-gold stroke-none" />
                  <Star size={14} className="fill-warm-gold stroke-none" />
                  <Star size={14} className="fill-warm-gold stroke-none" />
                  <Star size={14} className="fill-warm-gold stroke-none" />
                  <span className="text-xs font-sans text-cream-latte/65 font-bold ml-1">(48 Reviews)</span>
                </div>
              </div>

              {/* Size Selector */}
              <div className="mb-6">
                <span className="text-[10px] font-sans tracking-[0.2em] text-cream-latte/60 font-bold uppercase mb-3 block">
                  Select Size
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedSize(product.size1Name || '350g')}
                    className={`px-6 py-2.5 rounded-full font-sans text-xs font-bold tracking-widest uppercase transition-all duration-300 border cursor-pointer ${
                      selectedSize === (product.size1Name || '350g')
                        ? 'bg-warm-gold text-espresso border-warm-gold shadow-[0_0_12px_rgba(214,178,122,0.3)]'
                        : 'bg-espresso/50 text-cream-latte border-cream-latte/15 hover:border-warm-gold/50'
                    }`}
                  >
                    {product.size1Name || '350g'}
                  </button>
                  <button
                    onClick={() => setSelectedSize(product.size2Name || '750g')}
                    className={`px-6 py-2.5 rounded-full font-sans text-xs font-bold tracking-widest uppercase transition-all duration-300 border cursor-pointer ${
                      selectedSize === (product.size2Name || '750g')
                        ? 'bg-warm-gold text-espresso border-warm-gold shadow-[0_0_12px_rgba(214,178,122,0.3)]'
                        : 'bg-espresso/50 text-cream-latte border-cream-latte/15 hover:border-warm-gold/50'
                    }`}
                  >
                    {product.size2Name || '750g'}
                  </button>
                </div>
              </div>

              {/* Price block */}
              <div className="flex items-baseline gap-4 border-b border-warm-gold/10 pb-6 mb-6">
                <span className="font-bebas text-4xl text-warm-gold tracking-widest transition-all">
                  ₹{currentPrice}.00
                </span>
                {product.originalPrice && selectedSize === (product.size1Name || '350g') && (
                  <span className="font-bebas text-xl text-cream-latte/40 line-through tracking-widest">
                    ₹{product.originalPrice}.00
                  </span>
                )}
                <span className="text-xs font-sans text-cream-latte/50 uppercase ml-2">Inclusive of all taxes</span>
              </div>

              {/* Description */}
              <p className="text-sm md:text-base text-cream-latte/75 font-sans leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            {/* ROAST & PROFILE SCALE GRAPHS */}
            <div className="glassmorphism rounded-2xl p-6 border border-warm-gold/10 space-y-5 text-left">
              <h3 className="text-xs font-sans tracking-[0.2em] text-warm-gold font-bold uppercase border-b border-warm-gold/5 pb-2">
                Organoleptic Signature
              </h3>

              {/* Coffee strength */}
              <div>
                <div className="flex justify-between text-xs font-sans mb-1.5 text-cream-latte/85">
                  <span>Intensity / Strength</span>
                  <span className="font-bold text-warm-gold">{product.strength} / 5</span>
                </div>
                <div className="w-full h-1 bg-espresso/50 rounded-full overflow-hidden flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-grow rounded-full transition-all duration-1000 ${
                        i < product.strength ? 'bg-warm-gold' : 'bg-cream-latte/15'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="flex justify-between text-xs font-sans mb-1.5 text-cream-latte/85">
                  <span>Body & Viscosity</span>
                  <span className="font-bold text-warm-gold">{product.body} / 5</span>
                </div>
                <div className="w-full h-1 bg-espresso/50 rounded-full overflow-hidden flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-grow rounded-full transition-all duration-1000 ${
                        i < product.body ? 'bg-warm-gold' : 'bg-cream-latte/15'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Acidity */}
              <div>
                <div className="flex justify-between text-xs font-sans mb-1.5 text-cream-latte/85">
                  <span>Vibrant Acidity</span>
                  <span className="font-bold text-warm-gold">{product.acidity} / 5</span>
                </div>
                <div className="w-full h-1 bg-espresso/50 rounded-full overflow-hidden flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-grow rounded-full transition-all duration-1000 ${
                        i < product.acidity ? 'bg-warm-gold' : 'bg-cream-latte/15'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* AROMA DESCRIPTION */}
            <div className="bg-bean/20 border border-warm-gold/10 p-6 rounded-2xl flex gap-4 text-left">
              <Layers className="text-warm-gold shrink-0 mt-1 stroke-[1.5]" size={20} />
              <div>
                <h4 className="text-xs font-sans font-bold text-warm-gold tracking-widest uppercase mb-1">
                  Aromatic Bouquet
                </h4>
                <p className="text-xs text-cream-latte/80 font-sans leading-relaxed">
                  {product.aromaDescription}
                </p>
              </div>
            </div>

            {/* TASTING NOTES */}
            <div>
              <span className="text-xs font-sans tracking-wider text-warm-gold font-bold uppercase mb-3 block text-left">
                Tasting Notes Profile
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.tastingNotes.map((note) => (
                  <span
                    key={note}
                    className="text-xs font-sans font-bold px-4 py-2.5 rounded-xl glassmorphism border border-warm-gold/15 text-cream-latte hover:border-warm-gold/50 transition-all"
                  >
                    ✦ {note}
                  </span>
                ))}
              </div>
            </div>

            {/* PRIMARY CTA SECTION */}
            <div 
              ref={mainCtaRef}
              className="flex flex-col sm:flex-row gap-4 border-t border-warm-gold/10 pt-8 mt-4"
            >
              <button
                id={`detail-add-bag-${product.id}`}
                onClick={handleAddToBagWithAnim}
                className={`flex-grow font-sans text-xs font-bold tracking-[0.2em] uppercase py-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(200,169,126,0.2)] hover:shadow-none ${
                  isAdding 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-warm-gold text-espresso hover:bg-cream-latte hover:text-espresso'
                }`}
              >
                {isAdding ? (
                  <>
                    <Check size={14} className="animate-in zoom-in" />
                    Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} />
                    Add to Bag
                  </>
                )}
              </button>

              <button
                id={`detail-buy-now-${product.id}`}
                onClick={handleAddToBagWithAnim}
                className="flex-grow bg-transparent hover:bg-warm-gold text-warm-gold hover:text-espresso border border-warm-gold/40 hover:border-warm-gold font-sans text-xs font-bold tracking-[0.2em] uppercase py-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center"
              >
                Buy Now
              </button>

              <button
                id={`detail-wishlist-${product.id}`}
                onClick={() => onToggleWishlist?.(product.id)}
                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isWishlisted 
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 hover:bg-rose-950/40' 
                    : 'bg-transparent border-warm-gold/30 text-warm-gold/70 hover:border-warm-gold hover:text-warm-gold'
                }`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={18} className={isWishlisted ? "fill-rose-400 stroke-rose-400" : "stroke-[2]"} />
              </button>
            </div>

            {/* SECURITY & TRUST BADGES */}
            <div className="grid grid-cols-2 gap-4 border-t border-warm-gold/10 pt-6">
              <div className="flex items-center gap-3 text-cream-latte/60">
                <ShieldCheck size={16} className="text-warm-gold" />
                <span className="text-[10px] font-sans uppercase tracking-widest">Vacuum Sealed Nitros</span>
              </div>
              <div className="flex items-center gap-3 text-cream-latte/60">
                <HelpCircle size={16} className="text-warm-gold" />
                <span className="text-[10px] font-sans uppercase tracking-widest">24/7 Priority Support</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* APPLE-LEVEL STICKY ADD TO CART BAR */}
      <div
        id="sticky-cart-strip"
        className={`fixed bottom-0 left-0 w-full z-40 bg-espresso/95 backdrop-blur-md border-t border-warm-gold/10 p-4 transition-all duration-500 ease-in-out transform ${
          isStickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`}
              alt={product.name}
              className="w-10 h-10 object-contain hidden md:block filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            />
            <div className="text-left">
              <h4 className="font-playfair font-bold text-sm text-cream-latte leading-none">
                {product.name}
              </h4>
              <span className="text-[10px] text-warm-gold font-sans uppercase tracking-widest mt-1 block">
                {product.roast}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-bebas text-2xl text-warm-gold tracking-widest hidden sm:inline-block">
              ₹{currentPrice}.00
            </span>
            <button
              onClick={handleAddToBagWithAnim}
              id={`sticky-add-bag-${product.id}`}
              className={`font-sans text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg transition-all duration-300 ${
                isAdding 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-warm-gold hover:bg-cream-latte text-espresso'
              }`}
            >
              {isAdding ? (
                <>
                  <Check size={12} className="animate-in zoom-in" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingBag size={12} />
                  Add to Bag
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
