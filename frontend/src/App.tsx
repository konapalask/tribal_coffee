import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductShowcase from './components/ProductShowcase';
import AboutSection from './components/AboutSection';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import CartDrawer from './components/CartDrawer';
import ProductPage from './components/ProductPage';
import { TRIBAL_PRODUCTS, type RealProduct, API_BASE_URL } from './services/db';
import type { CartItem } from './components/CartDrawer';
import { CheckCircle2, ShieldCheck, X, TrendingUp, Send, Mail, Lock, User, AlertCircle, Heart, Package, Edit3, LogOut, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeDetailProduct, setActiveDetailProduct] = useState<RealProduct | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'success'>('idle');
  const [dbVersion, setDbVersion] = useState(0);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showCustomerTracker, setShowCustomerTracker] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [loggedInUser, setLoggedInUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tribal_coffee_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (loggedInUser) {
        localStorage.setItem('tribal_coffee_user', JSON.stringify(loggedInUser));
      } else {
        localStorage.removeItem('tribal_coffee_user');
      }
    }
  }, [loggedInUser]);

  // Real-time Connoisseur Wishlist State
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Effect to load the wishlist whenever the loggedInUser changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = loggedInUser 
        ? `tribal_coffee_wishlist_${loggedInUser.id || loggedInUser.email || loggedInUser.username}`
        : 'tribal_coffee_wishlist_guest';
      
      const saved = localStorage.getItem(storageKey);
      setWishlist(saved ? JSON.parse(saved) : []);
    }
  }, [loggedInUser]);
  // Effect to save the wishlist whenever it or the loggedInUser changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = loggedInUser 
        ? `tribal_coffee_wishlist_${loggedInUser.id || loggedInUser.email || loggedInUser.username}`
        : 'tribal_coffee_wishlist_guest';
      
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    }
  }, [wishlist, loggedInUser]);

  const toggleWishlist = (id: string) => {
    if (!loggedInUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Simple client-side router
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    const handleHashChange = () => {
      if (window.location.hash === '#/admin') {
        setCurrentPath('/admin');
      } else if (window.location.hash === '#/') {
        setCurrentPath('/');
      } else if (window.location.hash !== '#products') {
        // If the hash changes to something other than #products (e.g., user hits back button),
        // we should ensure the product detail page is closed.
        setActiveDetailProduct(null);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleHashChange);

    // Initial load hash check
    if (window.location.hash === '#/admin') {
      setCurrentPath('/admin');
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Handle scroll to top on reload
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Safely seed default items once products are fetched from the backend API
  useEffect(() => {
    // Starting with clean empty cart state for production readiness
    setCartItems([]);
  }, [dbVersion]);

  // Listen to product database changes to trigger seamless react re-renders
  useEffect(() => {
    const handleDbChange = () => {
      setDbVersion(prev => prev + 1);
    };
    window.addEventListener('tribal-db-changed', handleDbChange);
    return () => window.removeEventListener('tribal-db-changed', handleDbChange);
  }, []);

  // Guarantee administrative accounts are restricted to the admin panel
  useEffect(() => {
    if (loggedInUser?.email?.toLowerCase() === 'admin@tribalcoffee.in') {
      if (currentPath !== '/admin') {
        window.history.pushState({}, '', '/admin');
        setCurrentPath('/admin');
      }
    }
  }, [loggedInUser, currentPath]);

  const handleAddToBag = (product: RealProduct, weight: string = product.size1Name || '350g') => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.weight === weight);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.weight === weight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, weight }];
    });
    // Open drawer automatically for high-end e-commerce flow
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, weight: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.weight === weight) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string, weight: string) => {
    setCartItems((prev) => prev.filter((item) => !(item.product.id === productId && item.weight === weight)));
  };

  const handleCheckout = async () => {
    if (!loggedInUser) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    if (loggedInUser.email.toLowerCase() === 'admin@tribalcoffee.in') {
      alert('Administrative accounts are strictly prohibited from placing gourmet lounge bookings.');
      setIsCartOpen(false);
      return;
    }

    if (!isAddressComplete(loggedInUser.address)) {
      alert('Please complete all required fields of your Shipping Details (Door No, Area, City, State, Pin Code) in the Connoisseur Lounge before checking out.');
      setIsCartOpen(false);
      setIsProfileModalOpen(true);
      return;
    }

    const parsedAddr = parseAddress(loggedInUser.address);
    // Save user booking/order history in backend persistent file
    try {
      await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loggedInUser.email,
          customerName: loggedInUser.name,
          city: parsedAddr.city || 'Visakhapatnam',
          pincode: parsedAddr.pinCode || '530003',
          items: cartItems.map(item => ({
            name: `${item.product.name} (${item.weight})`,
            quantity: item.quantity,
            price: item.weight === (item.product.size2Name || '750g') && item.product.price750g ? item.product.price750g : item.product.price
          })),
          amount: cartItems.reduce((acc, item) => {
            const price = item.weight === (item.product.size2Name || '750g') && item.product.price750g ? item.product.price750g : item.product.price;
            return acc + price * item.quantity;
          }, 0)
        })
      });
    } catch (e) {
      console.error('Failed to save booking history:', e);
    }

    setIsCartOpen(false);
    setCheckoutStatus('success');
  };

  const getUserInitials = () => {
    if (!loggedInUser || !loggedInUser.name) return undefined;
    return loggedInUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // If path is /admin, render the admin dashboard as a full, dedicated page
  if (currentPath === '/admin') {
    return (
      <div className="relative min-h-screen w-full bg-espresso text-cream-latte grain-overlay">
        <CustomCursor isAdminActive={true} />
        <AdminDashboard
          onClose={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-espresso text-cream-latte grain-overlay">
      {/* 3D Glow Cursor Follower */}
      <CustomCursor isAdminActive={false} />

      {/* Branded Top Navbar */}
      <Navbar
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        cartCount={cartCount}
        userInitials={getUserInitials()}
        onAdminToggle={() => {
          if (loggedInUser) {
            setIsProfileModalOpen(true);
          } else {
            setIsAuthModalOpen(true);
          }
        }}
      />

      {/* Cinematic Hero & Dynamic Carousel */}
      <Hero
        key={`hero-${dbVersion}`}
        onAddToBag={handleAddToBag}
        onViewDetails={(p) => {
          setActiveDetailProduct(p);
          window.history.pushState(null, '', '#products');
        }}
      />

      {/* Curated Product Showcase */}
      <ProductShowcase
        key={`showcase-${dbVersion}`}
        onAddToBag={handleAddToBag}
        onViewDetails={(p) => {
          setActiveDetailProduct(p);
          window.history.pushState(null, '', '#products');
        }}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
      />

      {/* Heritage Narrative Segment */}
      <AboutSection />

      {/* Elite Advantages Grid */}
      <WhyChooseUs />

      {/* Connoisseur Testimonials */}
      <Testimonials />

      {/* Luxury Branded Footer */}
      <Footer />

      {/* Sliding Glassmorphism Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* IMMERSIVE APPLE-LEVEL PRODUCT PAGE ROUTE OVERLAY */}
      <AnimatePresence>
        {activeDetailProduct && (
          <ProductPage
            product={activeDetailProduct}
            onClose={() => {
              setActiveDetailProduct(null);
              // Clean up the URL hash if it's #products
              if (window.location.hash === '#products') {
                window.history.pushState(null, '', window.location.pathname);
              }
            }}
            onAddToBag={handleAddToBag}
            isWishlisted={wishlist.includes(activeDetailProduct.id)}
            onToggleWishlist={toggleWishlist}
          />
        )}
      </AnimatePresence>

      {/* BRANDED HIGH-END CHECKOUT SUCCESS DIALOG OVERLAY */}
      <AnimatePresence>
        {checkoutStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
            id="checkout-success-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-lg glassmorphism rounded-[30px] p-8 md:p-10 border border-warm-gold/25 text-center relative overflow-hidden"
            >
              {/* Gold light burst */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full filter blur-[50px] bg-warm-gold/20 -z-10" />

              <button
                onClick={() => {
                  setCheckoutStatus('idle');
                  setCartItems([]);
                }}
                id="close-success-btn"
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-latte/5 text-cream-latte/50 hover:text-warm-gold transition-colors cursor-pointer"
                aria-label="Close dialogue"
              >
                <X size={18} />
              </button>

              <OrderPlacedSuccessAnimation 
                onTrackLive={() => setShowCustomerTracker(true)}
                onExitLounge={() => {
                  setCheckoutStatus('idle');
                  setCartItems([]);
                }}
              />            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. CUSTOMER LIVE DELIVERY PARCEL TRACKING OVERLAY */}
      <AnimatePresence>
        {showCustomerTracker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl text-cream-latte font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 40 }}
              transition={{ type: 'spring', damping: 22 }}
              className="w-full max-w-4xl glassmorphism rounded-[40px] border border-warm-gold/25 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col md:flex-row relative"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowCustomerTracker(false);
                  setCheckoutStatus('idle');
                  setCartItems([]);
                }}
                className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-black/60 hover:bg-cream-latte/15 border border-cream-latte/10 hover:border-warm-gold/30 text-cream-latte/70 hover:text-warm-gold transition-all cursor-pointer"
                title="Close Tracker"
              >
                <X size={16} />
              </button>

              {/* LEFT SIDE: LIVE SIMULATED GPS INTERACTIVE ROUTE MAP */}
              <div className="w-full md:w-[55%] h-64 md:h-[520px] bg-[#120D0A] relative overflow-hidden border-b md:border-b-0 md:border-r border-warm-gold/15 flex flex-col justify-between">
                
                {/* Tech grid texture overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(214,178,122,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(214,178,122,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(18,13,10,0.85)_100%) pointer-events-none" />

                {/* Map Header */}
                <div className="p-6 relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${activeTrackingOrder?.status === 'Dispatched' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span className={`text-[9px] font-sans tracking-[0.25em] font-bold uppercase ${activeTrackingOrder?.status === 'Dispatched' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeTrackingOrder?.status === 'Dispatched' ? 'Live Telemetry Sourced' : 'Awaiting Dispatch Vault'}
                    </span>
                  </div>
                  <span className="bg-[#1C1612] border border-warm-gold/20 text-warm-gold font-sans text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    DELHIVERY EXPRESS
                  </span>
                </div>

                {/* Simulated GPS SVG Map Routing */}
                {activeTrackingOrder?.status === 'Dispatched' ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <svg className="w-full h-full max-h-[300px]" viewBox="0 0 400 240" fill="none">
                      <path d="M -50,60 Q 100,20 200,90 T 450,40" stroke="rgba(214,178,122,0.03)" strokeWidth="1" />
                      <path d="M -50,140 Q 120,80 240,160 T 450,110" stroke="rgba(214,178,122,0.03)" strokeWidth="1" />

                      <path
                        id="liveRoute"
                        d="M 60,160 C 140,130 200,70 320,80"
                        stroke="rgba(214,178,122,0.15)"
                        strokeWidth="2.5"
                        strokeDasharray="4,4"
                      />

                    <path
                      d="M 60,160 C 140,130 200,70 320,80"
                      stroke="url(#customerMapGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="250"
                      strokeDashoffset="120"
                      className="animate-dash"
                      style={{
                        strokeDasharray: '300',
                        animation: 'dash 6s linear infinite'
                      }}
                    />

                    <defs>
                      <linearGradient id="customerMapGrad" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4A2B1D" />
                        <stop offset="60%" stopColor="#D6B27A" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>

                    <g transform="translate(60, 160)">
                      <circle r="14" fill="rgba(74,43,29,0.25)" className="animate-pulse" />
                      <circle r="7" fill="#4A2B1D" stroke="#D6B27A" strokeWidth="1.5" />
                      <text y="-18" className="text-[8px] font-sans font-black tracking-widest text-cream-latte/50 uppercase text-center" textAnchor="middle">
                        ARAKU CO-OP
                      </text>
                    </g>

                    <g transform="translate(320, 80)">
                      <circle r="16" fill="rgba(214,178,122,0.15)" className="animate-pulse-slow" />
                      <circle r="8" fill="#D6B27A" stroke="#120D0A" strokeWidth="2" />
                      <circle r="12" fill="none" stroke="#D6B27A" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
                      <text y="-18" className="text-[8px] font-sans font-black tracking-widest text-warm-gold uppercase text-center animate-bounce" textAnchor="middle">
                        YOUR LOUNGE
                      </text>
                    </g>

                    <g className="animate-ride">
                      <circle r="9" fill="rgba(16,185,129,0.3)" />
                      <circle r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" className="animate-pulse" />
                    </g>
                  </svg>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40">
                    <div className="w-32 h-32 mb-6 rounded-2xl overflow-hidden border border-warm-gold/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
                      <div className="absolute inset-0 bg-warm-gold/10 mix-blend-overlay z-10"></div>
                      <img loading="lazy" src={`${API_BASE_URL}/images/dispatch_vault.opt.webp`} alt="Dispatch Vault" className="w-full h-full object-cover filter contrast-125 sepia-[.2]" />
                    </div>
                    <h5 className="font-playfair text-xl text-cream-latte mb-1 animate-pulse">Pre-Dispatch Stage</h5>
                    <p className="text-[10px] text-cream-latte/50 max-w-[220px] leading-relaxed">
                      Your order is currently being prepared at our Araku Co-Op Vaults. Live telemetry will activate upon courier allocation.
                    </p>
                  </div>
                )}

                <div className="p-6 bg-black/40 border-t border-warm-gold/10 relative z-10 flex justify-between items-center text-left">
                  <div>
                    <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase font-bold block">Current Coordinates</span>
                    <span className="text-[10px] font-mono text-cream-latte/75 font-semibold block mt-0.5">
                      {activeTrackingOrder?.status === 'Dispatched' ? '18.0461° N, 79.0125° E (En Route)' : '18.3273° N, 82.8775° E (Araku)'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase font-bold block">Delhivery speed</span>
                    <span className={`text-sm font-bebas tracking-wider font-bold block mt-0.5 ${activeTrackingOrder?.status === 'Dispatched' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}>
                      {activeTrackingOrder?.status === 'Dispatched' ? '42 KM/H' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: LOGISTICS DETAILS AND REAL-TIME MILESTONES */}
              <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between text-left">
                
                <div>
                  <span className="text-[8px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-2 block">
                    Delhivery Express Partner
                  </span>
                  <div className="flex items-center justify-between p-4 bg-espresso/50 border border-warm-gold/15 rounded-2xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full filter blur-[25px] bg-warm-gold/5 -z-10" />
                    
                    {activeTrackingOrder?.status === 'Dispatched' ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-warm-gold text-espresso flex items-center justify-center font-playfair font-black text-base shadow-[0_0_12px_rgba(214,178,122,0.35)] shrink-0">
                            VK
                          </div>
                          <div>
                            <h4 className="font-playfair font-bold text-sm text-cream-latte">Vijay Kumar</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold text-emerald-400">4.9 ★</span>
                              <span className="text-cream-latte/20">|</span>
                              <span className="text-[9px] font-sans text-cream-latte/50 uppercase tracking-widest">Priority Cargo</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href="tel:+919848022338"
                          className="p-3 bg-warm-gold hover:bg-cream-latte text-espresso rounded-xl transition-all cursor-pointer shadow-md"
                          title="Contact Dispatcher Rider"
                        >
                          <Send size={14} className="stroke-[2.5] rotate-45 translate-x-[2px] -translate-y-[1px]" />
                        </a>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-11 h-11 rounded-full bg-black/40 border border-warm-gold/10 text-cream-latte/30 flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                        <div>
                          <h4 className="font-playfair font-bold text-sm text-cream-latte/70">Awaiting Allocation</h4>
                          <p className="text-[9px] font-sans text-cream-latte/40 uppercase tracking-widest mt-1">Rider Details Pending</p>
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="grid grid-cols-2 gap-4 bg-espresso/25 border border-warm-gold/10 p-4 rounded-2xl mb-6 text-xs">
                    <div>
                      <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase block font-bold">Consignment ID</span>
                      <span className="font-semibold text-cream-latte mt-1 block">{activeTrackingOrder?.id || 'TRB-8729'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase block font-bold">AWB Reference</span>
                      <span className="font-semibold text-warm-gold mt-1 block tracking-wider font-mono uppercase">{activeTrackingOrder?.awb || 'Awaiting Allocation'}</span>
                    </div>
                  </div>

                  <h5 className="text-[9px] font-sans tracking-[0.25em] text-warm-gold font-bold uppercase mb-4">
                    Your Logistical Progress
                  </h5>
                  {/* Render dynamic logistical progress milestones based on dispatch status */}
                  {(() => {
                    const isDispatched = activeTrackingOrder?.status === 'Dispatched';

                    return (
                      <div className="relative pl-6 space-y-5">
                        <div className="absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-warm-gold/20" />
                        <div className={`absolute left-[7px] top-[8px] w-[1.5px] bg-emerald-500 transition-all duration-700 ${
                          isDispatched ? 'h-[105px]' : 'h-[20px]'
                        }`} />

                        {/* Milestone 1: Order Placed */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 size={10} className="stroke-[2.5]" />
                          </div>
                          <div className="text-xs">
                            <h6 className="font-bold text-cream-latte flex items-center gap-2">
                              Order Placed
                              <span className="text-[8px] bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-sans px-1.5 py-0.5 rounded font-bold">DONE</span>
                            </h6>
                            <p className="text-[10px] text-cream-latte/50 mt-0.5">Your luxury coffee order has been securely placed.</p>
                          </div>
                        </div>

                        {/* Milestone 2: Order Dispatched */}
                        <div className={`relative transition-opacity duration-500 ${isDispatched ? '' : 'opacity-40'}`}>
                          {isDispatched ? (
                            <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                              <CheckCircle2 size={10} className="stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-[#1A130E] border border-cream-latte/15 flex items-center justify-center text-cream-latte/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-cream-latte/20" />
                            </div>
                          )}
                          <div className="text-xs">
                            <h6 className="font-bold text-cream-latte flex items-center gap-2">
                              Order Dispatched
                              <span className={`text-[8px] font-sans px-1.5 py-0.5 rounded font-bold border ${
                                isDispatched 
                                  ? 'bg-emerald-950 border-emerald-500/20 text-emerald-400' 
                                  : 'bg-black/40 border-cream-latte/10 text-cream-latte/40'
                              }`}>
                                {isDispatched ? 'DONE' : 'PENDING'}
                              </span>
                            </h6>
                            <p className="text-[10px] text-cream-latte/50 mt-0.5">
                              {isDispatched 
                                ? 'Your order has been dispatched from our administrative vault.' 
                                : 'Awaiting admin dispatch and courier allocation.'}
                            </p>
                          </div>
                        </div>

                        {/* Milestone 3: In Transit */}
                        <div className={`relative transition-opacity duration-500 ${isDispatched ? '' : 'opacity-40'}`}>
                          {isDispatched ? (
                            <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-[#201610] border border-warm-gold/40 flex items-center justify-center text-warm-gold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                            </div>
                          ) : (
                            <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-[#1A130E] border border-cream-latte/15 flex items-center justify-center text-cream-latte/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-cream-latte/20" />
                            </div>
                          )}
                          <div className="text-xs">
                            <h6 className={`font-bold flex items-center gap-2 ${isDispatched ? 'text-warm-gold' : 'text-cream-latte'}`}>
                              In Transit - On the Way
                              {isDispatched && (
                                <span className="text-[8px] bg-[#2C1F15] border border-warm-gold/20 text-warm-gold font-sans px-1.5 py-0.5 rounded font-bold animate-pulse">ACTIVE</span>
                              )}
                            </h6>
                            <p className="text-[10px] text-cream-latte/50 mt-0.5">
                              {isDispatched 
                                ? 'Your premium Araku wood-fired crop had dispatched.'
                                : 'En route tracking will activate upon courier collection.'}
                            </p>
                          </div>
                        </div>

                        {/* Milestone 4: Out for Delivery */}
                        <div className="relative opacity-40">
                          <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-[#1A130E] border border-cream-latte/15 flex items-center justify-center text-cream-latte/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-cream-latte/10" />
                          </div>
                          <div className="text-xs">
                            <h6 className="font-bold text-cream-latte">Out for Delivery</h6>
                            <p className="text-[10px] text-cream-latte/50 mt-0.5">Awaiting local sorting arrival.</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-8 border-t border-warm-gold/15 pt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setShowCustomerTracker(false);
                      setCheckoutStatus('idle');
                      setCartItems([]);
                    }}
                    className="px-8 py-3.5 bg-warm-gold text-espresso font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-cream-latte hover:text-espresso transition-all cursor-pointer shadow-[0_4px_20px_rgba(200,169,126,0.3)] w-full text-center font-bold"
                  >
                    Return to Lounge
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER LOGIN & REGISTRATION PORTAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            id="auth-modal"
          >
            <AuthPortal
              onClose={() => setIsAuthModalOpen(false)}
              onLoginSuccess={(user) => {
                setLoggedInUser(user);
                setIsAuthModalOpen(false);
                if (user.email === 'admin@tribalcoffee.in') {
                  window.history.pushState({}, '', '/admin');
                  setCurrentPath('/admin');
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONNOISSEUR PROFILE LOUNGE DASHBOARD MODAL */}
      <AnimatePresence>
        {isProfileModalOpen && loggedInUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md text-cream-latte"
            id="profile-modal"
          >
            <motion.div
              initial={{ scale: 0.93, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 30 }}
              transition={{ type: 'spring', damping: 22 }}
              className="w-full max-w-4xl glassmorphism rounded-[40px] border border-warm-gold/25 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col md:flex-row relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-black/60 hover:bg-cream-latte/15 border border-cream-latte/10 hover:border-warm-gold/30 text-cream-latte/70 hover:text-warm-gold transition-all cursor-pointer"
                title="Close Dashboard"
              >
                <X size={16} />
              </button>

              <ConnoisseurLounge
                user={loggedInUser}
                onUpdateUser={(updatedUser) => {
                  setLoggedInUser(updatedUser);
                }}
                onSignOut={() => {
                  setLoggedInUser(null);
                  setIsProfileModalOpen(false);
                }}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                onAddToBag={(prod) => {
                  handleAddToBag(prod);
                  setIsProfileModalOpen(false);
                }}
                onTrackDelivery={(order) => {
                  setActiveTrackingOrder(order);
                  setIsProfileModalOpen(false);
                  setShowCustomerTracker(true);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AuthPortalProps {
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

function AuthPortal({ onClose, onLoginSuccess }: AuthPortalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp: otpCode })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid verification code.');
        setLoading(false);
        return;
      }

      // OTP is valid! Register the user in the backend
      const regRes = await fetch(`${API_BASE_URL}/api/auth/register-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail,
          password: password,
          name,
          phone: phone.trim() || null,
          address: regAddress.trim() ? { area: regAddress.trim(), city: regCity.trim() } : null,
          dob: dob || null,
          gender: gender || null
        })
      });
      const regData = await regRes.json();
      if (regRes.ok && regData.success) {
        setSuccess('Profile verified and registered successfully!');
        setTimeout(() => onLoginSuccess(regData.user), 1200);
      } else {
        setError('Failed to save profile details.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error verifying code.');
    }
    setLoading(false);
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp: otpCode, newPassword: password })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid verification code.');
        setLoading(false);
        return;
      }

      setSuccess('Password reset successfully! You can now log in.');
      setVerificationPending(false);
      setMode('login');
      setPassword('');
      setOtpCode('');
      setLoading(false);
    } catch (err: any) {
      console.error("Reset error:", err);
      setError('Failed to reset password.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const emailLower = email.toLowerCase().trim();
    const isAdmin = emailLower === 'admin@tribalcoffee.in';

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setError('Please provide your email and password.');
        setLoading(false);
        return;
      }

      if (isAdmin && password === 'password123') {
        setSuccess('Commander Sharmila Authenticated (Dev Mode). Synchronizing secure console.');
        setTimeout(() => {
          onLoginSuccess({ name: 'Sharmila K', email: emailLower, role: 'Super Admin' });
        }, 1200);
        setLoading(false);
        return;
      }

      // -----------------------------
      // LOCAL LOGIN FLOW
      // -----------------------------
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, password })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          setSuccess('Logged in successfully!');
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 1200);
        } else {
          setError(data.message || 'Invalid email or password.');
        }
      } catch (err: any) {
        console.error("Login error:", err);
        setError('Backend system offline. Failed to establish connection.');
      }
      setLoading(false);

    } else if (mode === 'forgot-password') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, type: 'reset' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPendingEmail(emailLower);
          setVerificationPending(true);
        } else {
          setError(data.message || 'Failed to send reset code.');
        }
      } catch (err: any) {
        console.error("OTP send error:", err);
        setError('Failed to request password reset.');
      }
      setLoading(false);

    } else {
      // -----------------------------
      // CUSTOMER REGISTER FLOW
      // -----------------------------
      if (isAdmin) {
        setError('This administrative credentials block cannot be registered.');
        setLoading(false);
        return;
      }
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Please complete all required field parameters.');
        setLoading(false);
        return;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email format.');
        setLoading(false);
        return;
      }

      try {
        // Don't create Firebase account yet. First send OTP.
        const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, type: 'register' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPendingEmail(emailLower);
          setVerificationPending(true);
        } else {
          setError(data.message || 'Failed to send verification code.');
        }
      } catch (err: any) {
        console.error("OTP send error:", err);
        setError('Failed to initialize profile verification.');
      }
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.92, y: 25 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.92, y: 25 }}
      transition={{ type: 'spring', damping: 22 }}
      className="w-full max-w-md max-h-[90vh] overflow-y-auto glassmorphism border border-warm-gold/25 p-8 rounded-[35px] text-center relative shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
    >
      {/* Golden spotlight ambient aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full filter blur-[40px] bg-warm-gold/15 -z-10" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-latte/5 text-cream-latte/50 hover:text-warm-gold transition-colors cursor-pointer"
        aria-label="Close auth portal"
      >
        <X size={18} />
      </button>

      {/* Email Verification Pending Screen (OTP Input) */}
      {verificationPending ? (
        <form onSubmit={mode === 'forgot-password' ? handleResetVerify : handleOtpVerify} className="flex flex-col items-center justify-center py-4 gap-5">
          <div className="w-16 h-16 rounded-full bg-warm-gold/10 border border-warm-gold/25 flex items-center justify-center text-warm-gold animate-pulse">
            <Mail size={28} className="stroke-[1.5]" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-cream-latte tracking-tight">
              {mode === 'forgot-password' ? 'Reset Password' : 'Enter Verification Code'}
            </h3>
            <p className="text-xs text-cream-latte/70 max-w-[250px] leading-relaxed mx-auto">
              We've sent a 6-digit code to <span className="font-bold text-warm-gold">{pendingEmail}</span>.
              Please enter it below to {mode === 'forgot-password' ? 'reset your password' : 'verify your profile'}.
            </p>
          </div>

          <div className="w-full mt-2">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl text-center tracking-[0.5em] text-2xl py-3 text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors font-medium"
              required
            />
          </div>

          {mode === 'forgot-password' && (
            <div className="w-full text-left">
              <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cream-latte/30">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter a new password"
                  className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] text-red-300 font-bold leading-normal w-full">
              <AlertCircle size={14} className="shrink-0" />
              <p className="text-left">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-950/40 border border-green-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] text-green-300 font-bold leading-normal w-full">
              <CheckCircle2 size={14} className="shrink-0" />
              <p className="text-left">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full mt-2 bg-warm-gold/90 hover:bg-warm-gold text-dark-roast font-bold py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] text-xs tracking-wider"
          >
            {loading ? 'Verifying...' : 'Complete Authentication'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setVerificationPending(false);
              setMode('login');
              setError('');
              setSuccess('');
            }}
            className="text-[10px] text-warm-gold/70 hover:text-warm-gold font-semibold uppercase tracking-wider transition-colors mt-2"
          >
            Return to Login
          </button>
        </form>
      ) : (<>

      {/* Brand Icon Block */}
      <div className="w-14 h-14 bg-warm-gold/10 border border-warm-gold/20 rounded-full flex items-center justify-center mx-auto mb-5 text-warm-gold">
        <User size={22} className="stroke-[1.5]" />
      </div>

      <span className="text-[9px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-1.5 block">
        Tribal Coffee Lounge
      </span>
      
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-cream-latte tracking-tight mb-2">
          {mode === 'login' ? 'Connoisseur Sign In' : mode === 'register' ? 'Create Connoisseur Account' : 'Recover Account'}
        </h2>
        <p className="text-[11px] text-cream-latte/70 max-w-[280px] leading-relaxed mx-auto">
          {mode === 'login' 
            ? 'Enter your connoisseur details to access your custom blends and dispatch routes.' 
            : mode === 'register'
            ? 'Unlock wood-fired micro-lot priorities and trace real-time Araku Valley dispatches.'
            : 'Enter your registered email address and we will send you a secure link to reset your passcode.'}
        </p>
      </div>

      <div className="flex bg-[#1A110B]/50 p-1 rounded-xl mb-6 border border-warm-gold/10">
        <button
          onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2.5 text-[11px] font-bold tracking-wider rounded-lg transition-all ${
            mode === 'login' || mode === 'forgot-password'
              ? 'bg-warm-gold text-espresso shadow-[0_2px_10px_rgba(200,169,126,0.2)]'
              : 'text-cream-latte/50 hover:text-cream-latte'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2.5 text-[11px] font-bold tracking-wider rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-warm-gold text-espresso shadow-[0_2px_10px_rgba(200,169,126,0.2)]'
              : 'text-cream-latte/50 hover:text-cream-latte'
          }`}
        >
          Register
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
        {mode === 'register' && (
          <div>
            <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
              Connoisseur Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cream-latte/30">
                <User size={14} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
              />
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cream-latte/30">
                <Phone size={14} />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
              />
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl px-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl px-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors font-medium appearance-none"
              >
                <option value="" disabled className="text-cream-latte/50">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
                City
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cream-latte/30">
                  <MapPin size={14} />
                </span>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Your city"
                  className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
                Area / Street
              </label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Street / area"
                className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl px-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 block font-bold">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cream-latte/30">
              <Mail size={14} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
            />
          </div>
        </div>

        {mode !== 'forgot-password' && (
          <div>
            <label className="text-[9px] text-cream-latte/55 uppercase tracking-wider mb-1.5 flex justify-between font-bold">
              <span>Passcode / Password</span>
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setMode('forgot-password')}
                  className="text-warm-gold/80 hover:text-warm-gold transition-colors underline-offset-2 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cream-latte/30">
                <Lock size={14} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={mode === 'login' ? "Enter your password" : "Create a password"}
                className="w-full bg-[#1A110B]/70 border border-warm-gold/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream-latte focus:outline-none focus:border-warm-gold/50 transition-colors placeholder-cream-latte/20 font-medium"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] text-red-300 font-bold leading-normal">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/45 border border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] text-emerald-300 font-bold leading-normal animate-pulse-slow">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-warm-gold hover:bg-cream-latte text-espresso font-sans text-[10px] font-black tracking-[0.2em] uppercase py-3.5 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(200,169,126,0.18)] hover:shadow-none disabled:opacity-40"
        >
          {loading 
            ? 'Processing Request...' 
            : mode === 'login' 
              ? 'Sign In'
              : mode === 'forgot-password'
              ? 'Send Reset Code'
              : 'Register & Send OTP'
          }
        </button>
      </form>

      <div className="mt-6 text-[8px] text-cream-latte/35 tracking-wider font-medium">
        Secured by Tribal Coffee Co. Volcanic Roasting Cryptography
      </div>
    </>)}
    </motion.div>
  );
}

// Helper functions for parsing, formatting, and validating connoisseur address objects
const parseAddress = (addressInput: any) => {
  const defaultAddress = { doorNo: '', area: '', landmark: '', city: '', state: '', pinCode: '' };
  if (!addressInput) return defaultAddress;
  if (typeof addressInput === 'object') {
    return { ...defaultAddress, ...addressInput };
  }
  if (typeof addressInput === 'string') {
    try {
      const parsed = JSON.parse(addressInput);
      if (parsed && typeof parsed === 'object') {
        return { ...defaultAddress, ...parsed };
      }
    } catch (e) {
      const parts = addressInput.split(',').map((s: string) => s.trim());
      return {
        doorNo: parts[0] || '',
        area: parts[1] || '',
        landmark: parts[2] || '',
        city: parts[3] || '',
        state: parts[4] || '',
        pinCode: parts[5] || ''
      };
    }
  }
  return defaultAddress;
};

const formatAddress = (addressInput: any): string => {
  if (!addressInput) return '';
  if (typeof addressInput === 'string') {
    try {
      const parsed = JSON.parse(addressInput);
      if (parsed && typeof parsed === 'object') {
        addressInput = parsed;
      } else {
        return addressInput;
      }
    } catch (e) {
      return addressInput;
    }
  }
  if (typeof addressInput === 'object') {
    const { doorNo, area, landmark, city, state, pinCode } = addressInput;
    const parts = [
      doorNo && `Door No: ${doorNo}`,
      area,
      landmark && `Landmark: ${landmark}`,
      city,
      state,
      pinCode && `PIN: ${pinCode}`
    ].filter(Boolean);
    return parts.join(', ');
  }
  return '';
};

const isAddressComplete = (addressInput: any): boolean => {
  if (!addressInput) return false;
  let addrObj = addressInput;
  if (typeof addressInput === 'string') {
    try {
      const parsed = JSON.parse(addressInput);
      if (parsed && typeof parsed === 'object') {
        addrObj = parsed;
      } else {
        return addressInput.trim().length > 5;
      }
    } catch (e) {
      return addressInput.trim().length > 5;
    }
  }
  if (typeof addrObj === 'object') {
    const { doorNo, area, city, state, pinCode } = addrObj;
    return !!(
      doorNo?.trim() &&
      area?.trim() &&
      city?.trim() &&
      state?.trim() &&
      pinCode?.trim()
    );
  }
  return false;
};

interface ConnoisseurLoungeProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
  onSignOut: () => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  onAddToBag: (product: RealProduct) => void;
  onTrackDelivery: (order: any) => void;
}

function ConnoisseurLounge({ user, onUpdateUser, onSignOut, wishlist, toggleWishlist, onAddToBag, onTrackDelivery }: ConnoisseurLoungeProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  const parsedAddress = parseAddress(user.address);
  const [editDoorNo, setEditDoorNo] = useState(parsedAddress.doorNo);
  const [editArea, setEditArea] = useState(parsedAddress.area);
  const [editLandmark, setEditLandmark] = useState(parsedAddress.landmark);
  const [editCity, setEditCity] = useState(parsedAddress.city);
  const [editState, setEditState] = useState(parsedAddress.state);
  const [editPinCode, setEditPinCode] = useState(parsedAddress.pinCode);

  useEffect(() => {
    const parsed = parseAddress(user.address);
    setEditDoorNo(parsed.doorNo);
    setEditArea(parsed.area);
    setEditLandmark(parsed.landmark);
    setEditCity(parsed.city);
    setEditState(parsed.state);
    setEditPinCode(parsed.pinCode);
  }, [user.address]);

  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch past bookings on tab load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings`);
        if (res.ok) {
          const data = await res.json();
          // Filter by active connoisseur's email address
          const filtered = data.filter((o: any) => o.email.toLowerCase() === user.email.toLowerCase());
          setOrders(filtered);
        }
      } catch (err) {
        console.error('Failed to load connoisseur bookings:', err);
      }
    };
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, user.email]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: editName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpdateSuccess('Connoisseur profile name updated successfully!');
        onUpdateUser(data.user);
        setIsEditingName(false);
      } else {
        setUpdateError(data.message || 'Failed to update name.');
      }
    } catch (err) {
      console.error('Update name error:', err);
      setUpdateError('Backend down. Failed to update name parameters.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);

    const addressObject = {
      doorNo: editDoorNo.trim(),
      area: editArea.trim(),
      landmark: editLandmark.trim(),
      city: editCity.trim(),
      state: editState.trim(),
      pinCode: editPinCode.trim()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, address: addressObject })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpdateSuccess('Connoisseur shipping address updated successfully!');
        onUpdateUser(data.user);
        setIsEditingAddress(false);
      } else {
        setUpdateError(data.message || 'Failed to update address.');
      }
    } catch (err) {
      console.error('Update address error:', err);
      setUpdateError('Backend down. Failed to update address parameters.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Find the real wishlisted products
  const wishlistedProducts = wishlist
    .map(id => TRIBAL_PRODUCTS.find(p => p.id === id))
    .filter(Boolean) as RealProduct[];

  return (
    <>
      {/* LEFT SIDEBAR: PROFILE OVERVIEW & TAB PILLS */}
      <div className="w-full md:w-[35%] bg-[#120D0A] border-b md:border-b-0 md:border-r border-warm-gold/15 p-8 flex flex-col justify-between text-left relative overflow-hidden">
        
        {/* Spot light burst */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[35px] bg-warm-gold/5 -z-10" />

        <div className="space-y-8">
          {/* Brand Heading */}
          <div>
            <span className="text-[8px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-1.5 block">
              Connoisseur Lounge
            </span>
            <h3 className="font-playfair font-bold text-xl text-cream-latte">Welcome, {user.name}</h3>
          </div>

          {/* User initials large circle avatar */}
          <div className="flex items-center gap-4 p-4 bg-espresso/50 border border-warm-gold/15 rounded-3xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-warm-gold text-espresso flex items-center justify-center font-playfair font-black text-lg shadow-[0_0_15px_rgba(214,178,122,0.3)] shrink-0">
              {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-playfair font-bold text-sm text-cream-latte truncate">{user.name}</h4>
              <p className="text-[10px] text-cream-latte/50 font-sans truncate mt-0.5">{user.email}</p>
              <span className="bg-warm-gold/10 border border-warm-gold/25 text-warm-gold text-[7px] font-sans px-2 py-0.5 rounded-full uppercase tracking-widest font-black inline-block mt-2">
                Connoisseur Lounge
              </span>
            </div>
          </div>

          {/* Navigation Tab options */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                  : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={16} className="stroke-[2.5]" />
                Profile Settings
              </div>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                  : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={16} className="stroke-[2.5]" />
                My Order History
              </div>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                  : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart size={16} className="stroke-[2.5]" />
                My Curated Wishlist
              </div>
              <span className="bg-cream-latte/15 px-2 py-0.5 rounded-md text-[9px] font-sans font-bold">
                {wishlist.length}
              </span>
            </button>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="mt-8 pt-6 border-t border-warm-gold/15">
          <button
            onClick={() => {
              if (confirm('Acknowledge exit from Connoisseur Lounge?')) {
                onSignOut();
              }
            }}
            className="w-full px-4 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/45 rounded-xl font-sans text-xs text-red-300 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            Exit Lounge (Sign Out)
          </button>
        </div>

      </div>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="w-full md:w-[65%] p-8 flex flex-col justify-between text-left h-[580px] overflow-y-auto">
        
        {/* TAB 1: PROFILE MANAGEMENT */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <span className="text-[8px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-1.5 block animate-pulse">
                Trace Account Credentials
              </span>
              <h4 className="font-playfair font-bold text-xl text-cream-latte">Connoisseur Profile Data</h4>
              <p className="text-[10px] text-cream-latte/45 font-sans mt-1">Manage gourmet profile parameters and access security.</p>
            </div>

            {/* Profile information table */}
            <div className="glassmorphism border border-warm-gold/15 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-warm-gold/10">
                <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-widest font-bold">Account Name</span>
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-espresso border border-warm-gold/30 rounded px-2.5 py-1 text-xs text-cream-latte focus:outline-none focus:border-warm-gold"
                    />
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-3 py-1 bg-warm-gold text-espresso rounded font-sans text-[10px] font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditingName(false); setEditName(user.name); }}
                      className="p-1 hover:bg-cream-latte/5 text-cream-latte/40 hover:text-red-400 rounded cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-playfair">{user.name}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-cream-latte/40 hover:text-warm-gold transition-colors cursor-pointer"
                      title="Edit Profile Name"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center py-2 border-b border-warm-gold/10">
                <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-widest font-bold">Lounge Email</span>
                <span className="text-xs font-mono text-cream-latte/80">{user.email}</span>
              </div>

              {isEditingAddress ? (
                <div className="py-4 border-b border-warm-gold/10 animate-fade-in">
                  <form onSubmit={handleUpdateAddress} className="w-full space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-warm-gold/5">
                      <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-widest font-bold">Edit Shipping Details</span>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="px-3 py-1 bg-warm-gold text-espresso rounded-lg font-sans text-[10px] font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-cream-latte transition-colors"
                        >
                          Save Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingAddress(false);
                            const parsed = parseAddress(user.address);
                            setEditDoorNo(parsed.doorNo);
                            setEditArea(parsed.area);
                            setEditLandmark(parsed.landmark);
                            setEditCity(parsed.city);
                            setEditState(parsed.state);
                            setEditPinCode(parsed.pinCode);
                          }}
                          className="p-1 hover:bg-cream-latte/5 text-cream-latte/40 hover:text-red-400 rounded cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[8px] text-cream-latte/40 uppercase tracking-wider mb-1 block font-bold">Door No / Flat / House No</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Flat 4B, Volcanic Block"
                          value={editDoorNo}
                          onChange={(e) => setEditDoorNo(e.target.value)}
                          className="w-full bg-[#1A110B] border border-warm-gold/20 rounded-lg px-3 py-2 text-cream-latte focus:outline-none focus:border-warm-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-cream-latte/40 uppercase tracking-wider mb-1 block font-bold">Area / Street / Locality</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Araku Valley Hills"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="w-full bg-[#1A110B] border border-warm-gold/20 rounded-lg px-3 py-2 text-cream-latte focus:outline-none focus:border-warm-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-cream-latte/40 uppercase tracking-wider mb-1 block font-bold">Landmark (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Near Coffee Museum"
                          value={editLandmark}
                          onChange={(e) => setEditLandmark(e.target.value)}
                          className="w-full bg-[#1A110B] border border-warm-gold/20 rounded-lg px-3 py-2 text-cream-latte focus:outline-none focus:border-warm-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-cream-latte/40 uppercase tracking-wider mb-1 block font-bold">City</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Visakhapatnam"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full bg-[#1A110B] border border-warm-gold/20 rounded-lg px-3 py-2 text-cream-latte focus:outline-none focus:border-warm-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-cream-latte/40 uppercase tracking-wider mb-1 block font-bold">State</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Andhra Pradesh"
                          value={editState}
                          onChange={(e) => setEditState(e.target.value)}
                          className="w-full bg-[#1A110B] border border-warm-gold/20 rounded-lg px-3 py-2 text-cream-latte focus:outline-none focus:border-warm-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-cream-latte/40 uppercase tracking-wider mb-1 block font-bold">Pin / Zip Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 530003"
                          value={editPinCode}
                          onChange={(e) => setEditPinCode(e.target.value)}
                          className="w-full bg-[#1A110B] border border-warm-gold/20 rounded-lg px-3 py-2 text-cream-latte focus:outline-none focus:border-warm-gold transition-colors"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex justify-between items-center py-2 border-b border-warm-gold/10">
                  <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-widest font-bold">Shipping Details</span>
                  <div className="flex items-center gap-2 max-w-[280px]">
                    <span className="text-xs font-mono text-cream-latte/80 truncate" title={formatAddress(user.address) || 'No Address Provided'}>
                      {formatAddress(user.address) || 'No Address Provided'}
                    </span>
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="p-1 text-cream-latte/40 hover:text-warm-gold transition-colors cursor-pointer shrink-0"
                      title="Edit Shipping Details"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-warm-gold/10">
                <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-widest font-bold">Connoisseur Role</span>
                <span className="text-xs text-warm-gold font-bold font-sans uppercase tracking-widest">{user.role || 'Connoisseur'}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-widest font-bold">Lounge Security Status</span>
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <ShieldCheck size={14} className="stroke-[2.5]" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">256-bit Persistent Key</span>
                </div>
              </div>
            </div>

            {updateError && (
              <div className="bg-red-950/40 border border-red-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] text-red-300 font-bold leading-normal">
                <AlertCircle size={14} className="shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div className="bg-emerald-950/45 border border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] text-emerald-300 font-bold leading-normal">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERSISTENT ORDER HISTORY */}
        {activeTab === 'orders' && (() => {
          const completedDeliveries = orders.filter(o => o.status === 'Delivered');
          const remainingDeliveries = orders.filter(o => o.status !== 'Delivered');

          return (
            <div className="space-y-6 flex-grow flex flex-col">
              <div>
                <span className="text-[8px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-1.5 block">
                  Real-time Cargo Dispatch
                </span>
                <h4 className="font-playfair font-bold text-xl text-cream-latte">Your Past Order History</h4>
                <p className="text-[10px] text-cream-latte/45 font-sans mt-1">Trace high-altitude micro-batch dispatches wood-roasted on demand.</p>
              </div>

              <div className="overflow-y-auto max-h-[360px] flex-grow space-y-6 pr-2">
                {orders.length === 0 ? (
                  <div className="glassmorphism border border-warm-gold/15 p-12 rounded-3xl h-full flex flex-col items-center justify-center text-cream-latte/30">
                    <Package size={36} className="text-cream-latte/15 stroke-[1.2] mb-3" />
                    <p className="text-sm font-playfair font-bold mb-1">No past orders tracked</p>
                    <p className="text-[10px] text-cream-latte/45 max-w-xs font-sans text-center">Add our organic mountain crops to your bag and secure checkout to begin roasting.</p>
                  </div>
                ) : (
                  <>
                    {/* 1. Remaining Deliveries */}
                    <div className="space-y-3.5">
                      <span className="text-[9px] font-sans tracking-widest text-warm-gold uppercase font-bold bg-warm-gold/5 border border-warm-gold/15 px-3 py-1 rounded-md inline-block">
                        Remaining Deliveries ({remainingDeliveries.length})
                      </span>
                      {remainingDeliveries.length === 0 ? (
                        <p className="text-[10px] text-cream-latte/35 italic pl-1">No orders currently en route.</p>
                      ) : (
                        <div className="space-y-3">
                          {remainingDeliveries.map((o) => (
                            <div key={o.id} className="p-4 bg-espresso/50 border border-warm-gold/10 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs hover:border-warm-gold/25 transition-all">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="font-bebas text-sm text-warm-gold tracking-widest uppercase">{o.id}</span>
                                  <span className="text-[9px] bg-amber-950/40 border border-amber-500/20 text-amber-300 font-sans px-1.5 py-0.5 rounded font-black tracking-wider uppercase">{o.status || 'In Transit'}</span>
                                </div>
                                <p className="text-[10px] text-cream-latte/50 font-sans">Placed: {o.date || 'Today'}</p>
                                
                                <div className="mt-3 space-y-1 text-[11px] text-cream-latte/75 font-sans text-left">
                                  {o.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-2">
                                      <span className="font-bold text-warm-gold">x{item.quantity}</span>
                                      <span>{item.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col items-start sm:items-end gap-3.5 shrink-0 border-t sm:border-t-0 border-warm-gold/5 pt-3 sm:pt-0">
                                <div>
                                  <span className="text-[8px] text-cream-latte/45 uppercase tracking-widest block mb-0.5">Total Amount</span>
                                  <span className="font-bebas text-lg text-warm-gold tracking-widest font-black block">₹{o.amount ? o.amount.toFixed(2) : '0.00'}</span>
                                </div>
                                <button
                                  onClick={() => onTrackDelivery(o)}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1"
                                >
                                  <TrendingUp size={10} />
                                  Track Delivery
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Completed Deliveries */}
                    <div className="space-y-3.5 pt-2">
                      <span className="text-[9px] font-sans tracking-widest text-cream-latte/55 uppercase font-bold bg-cream-latte/5 border border-cream-latte/15 px-3 py-1 rounded-md inline-block">
                        Completed Deliveries ({completedDeliveries.length})
                      </span>
                      {completedDeliveries.length === 0 ? (
                        <p className="text-[10px] text-cream-latte/35 italic pl-1">No completed transactions on record.</p>
                      ) : (
                        <div className="space-y-3">
                          {completedDeliveries.map((o) => (
                            <div key={o.id} className="p-4 bg-[#14100D]/40 border border-cream-latte/5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs opacity-80">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="font-bebas text-sm text-cream-latte/60 tracking-widest uppercase">{o.id}</span>
                                  <span className="text-[9px] bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-sans px-1.5 py-0.5 rounded font-black tracking-wider uppercase">Delivered</span>
                                </div>
                                <p className="text-[10px] text-cream-latte/45 font-sans">Delivered: {o.date || 'Completed'}</p>
                                
                                <div className="mt-3 space-y-1 text-[11px] text-cream-latte/50 font-sans text-left">
                                  {o.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-2">
                                      <span className="font-bold text-cream-latte/50">x{item.quantity}</span>
                                      <span>{item.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="text-left sm:text-right shrink-0">
                                <span className="text-[8px] text-cream-latte/40 uppercase tracking-widest block mb-0.5">Total Paid</span>
                                <span className="font-bebas text-lg text-cream-latte/70 tracking-widest font-black block">₹{o.amount ? o.amount.toFixed(2) : '0.00'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: CURATED WISHLIST GRID */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6 flex-grow flex flex-col">
            <div>
              <span className="text-[8px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-1.5 block">
                Your Flavor Curations
              </span>
              <h4 className="font-playfair font-bold text-xl text-cream-latte">My Gourmet Wishlist</h4>
              <p className="text-[10px] text-cream-latte/45 font-sans mt-1">Intricate whole bean roasts and concentrates saved for priority selection.</p>
            </div>

            <div className="glassmorphism border border-warm-gold/15 p-6 rounded-3xl overflow-y-auto max-h-[350px] flex-grow">
              {wishlistedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cream-latte/30 py-12">
                  <Heart size={36} className="text-cream-latte/15 stroke-[1.2] mb-3" />
                  <p className="text-sm font-playfair font-bold mb-1">Your wishlist is pristine</p>
                  <p className="text-[10px] text-cream-latte/45 max-w-xs font-sans text-center">Tap the heart insignia inside the product pages to secure allocation of rare blends.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedProducts.map((p) => (
                    <div key={p.id} className="p-4 bg-espresso/50 border border-warm-gold/10 rounded-2xl flex flex-col justify-between gap-3 text-xs text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#120D0A] border border-warm-gold/10 flex items-center justify-center p-1.5 shrink-0">
                          <img
                            src={p.image.startsWith('http') ? p.image : `${API_BASE_URL}${p.image}`}
                            alt={p.name}
                            className="w-full h-full object-contain filter drop-shadow"
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-playfair font-bold text-cream-latte truncate leading-tight">{p.name}</h5>
                          <span className="text-[9px] text-warm-gold font-sans uppercase tracking-widest block mt-0.5">{p.roast}</span>
                          <span className="font-bebas text-sm text-warm-gold tracking-widest block mt-1">₹{p.price}.00</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-t border-warm-gold/5 pt-2.5">
                        <button
                          onClick={() => onAddToBag(p)}
                          className="flex-grow py-2 bg-warm-gold hover:bg-cream-latte text-espresso font-sans text-[9px] font-black tracking-widest uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Add to Bag
                        </button>
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded-lg cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ==========================================
// PREMIUM COFFEE SUCCESS ANIMATION & SOUND
// ==========================================

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Coffee pour / steam sound (soft white noise filtered)
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.5);
    filter.Q.setValueAtTime(3, ctx.currentTime);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    
    // Success chime (beautiful resonant major pentatonic chord)
    const playTone = (freq: number, delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.1);
    };
    
    // Play sweet café success arpeggio
    playTone(523.25, 0.4, 1.2); // C5
    playTone(659.25, 0.5, 1.2); // E5
    playTone(783.99, 0.6, 1.2); // G5
    playTone(1046.50, 0.75, 1.5); // C6
  } catch (e) {
    console.error('Web Audio API is blocked or failed:', e);
  }
};

interface OrderPlacedSuccessAnimationProps {
  onTrackLive: () => void;
  onExitLounge: () => void;
}

function OrderPlacedSuccessAnimation({ onTrackLive, onExitLounge }: OrderPlacedSuccessAnimationProps) {
  const [stage, setStage] = useState<'falling' | 'cup' | 'success' | 'text'>('falling');

  // Trigger sound and transition stages
  useEffect(() => {
    // Stage timings:
    // 0.0s: Beans falling
    // 1.8s: Beans gather & transform into Cup
    // 3.2s: Success chime & checkmark pop
    // 4.2s: Full text & actions fade in
    
    const soundTimeout = setTimeout(() => {
      playSuccessSound();
    }, 1400);

    const cupTimeout = setTimeout(() => {
      setStage('cup');
    }, 1800);

    const successTimeout = setTimeout(() => {
      setStage('success');
    }, 3200);

    const textTimeout = setTimeout(() => {
      setStage('text');
    }, 4200);

    return () => {
      clearTimeout(soundTimeout);
      clearTimeout(cupTimeout);
      clearTimeout(successTimeout);
      clearTimeout(textTimeout);
    };
  }, []);

  // 12 Falling Beans spread across the center width
  const fallingBeans = Array.from({ length: 12 }).map((_, idx) => {
    const startX = -110 + idx * 20;
    const delay = idx * 0.11;
    const duration = 1.1 + Math.random() * 0.3;
    const rotate = Math.random() * 360;
    return { id: idx, startX, delay, duration, rotate };
  });

  // Background floating particles
  const bgParticles = Array.from({ length: 8 }).map((_, idx) => {
    const delay = idx * 0.5;
    const duration = 8 + Math.random() * 4;
    const size = 3 + Math.random() * 5;
    const startX = 10 + Math.random() * 80;
    const startY = 20 + Math.random() * 60;
    return { id: idx, delay, duration, size, startX, startY };
  });

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[380px] overflow-hidden select-none">
      
      {/* Floating background particles */}
      {bgParticles.map((p) => (
        <motion.div
          key={`bg-part-${p.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 0.25, 0.25, 0],
            y: [0, -60],
            x: [0, Math.sin(p.id) * 20]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-warm-gold/20"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* STAGE 1: FALLING COFFEE BEANS */}
      {stage === 'falling' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {fallingBeans.map((bean) => (
            <motion.div
              key={`bean-${bean.id}`}
              initial={{ y: -200, x: bean.startX, rotate: bean.rotate, opacity: 0, scale: 0.8 }}
              animate={{
                y: [-200, 100],
                x: [bean.startX, 0],
                rotate: [bean.rotate, bean.rotate + 360],
                opacity: [0, 1, 1, 0],
                scale: [0.8, 1, 0.8, 0.4]
              }}
              transition={{
                duration: bean.duration,
                delay: bean.delay,
                ease: 'easeInOut'
              }}
              className="absolute"
            >
              <svg width="24" height="24" viewBox="0 0 100 100" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                <path d="M 30,50 C 30,25 70,25 70,50 C 70,75 30,75 30,50 Z" fill="#5C3A21" />
                <path d="M 35,50 Q 50,55 65,50" fill="none" stroke="#D6B27A" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </motion.div>
          ))}
        </div>
      )}

      {/* STAGE 2: COFFEE CUP & STEAM */}
      <AnimatePresence>
        {(stage === 'cup' || stage === 'success' || stage === 'text') && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            className="relative flex flex-col items-center justify-center mb-6"
          >
            {/* Ambient glow behind cup */}
            <motion.div 
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-32 h-32 rounded-full filter blur-[20px] bg-warm-gold/10 -z-10" 
            />

            {/* Coffee Cup SVG */}
            <svg viewBox="0 0 100 100" className="w-28 h-28 text-warm-gold relative z-10">
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                d="M 28,35 L 72,35 C 72,35 69,68 50,68 C 31,68 28,35 28,35 Z" 
                fill="rgba(28, 22, 18, 0.4)" 
                stroke="#D6B27A" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
                d="M 72,42 C 82,42 82,58 72,58" 
                fill="none" 
                stroke="#D6B27A" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
                d="M 22,76 L 78,76" 
                fill="none" 
                stroke="#D6B27A" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
              <motion.path
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                style={{ originY: "68px" }}
                d="M 31,40 C 31,40 33,65 50,65 C 67,65 69,40 69,40 Z"
                fill="#4A2B1D"
              />
            </svg>

            {/* Rising Steam */}
            <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-16 h-8 flex justify-around pointer-events-none">
              {[0, 1, 2].map((idx) => (
                <motion.svg
                  key={`steam-${idx}`}
                  custom={idx}
                  variants={{
                    animate: (i: number) => ({
                      y: [ 4, -14 ],
                      opacity: [ 0, 0.6, 0.6, 0 ],
                      scaleY: [ 0.8, 1.2, 0.8 ],
                      transition: {
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5
                      }
                    })
                  }}
                  animate="animate"
                  viewBox="0 0 20 40"
                  className="w-3 h-8 text-cream-latte/45"
                >
                  <path 
                    d="M 10,38 C 6,30 14,20 10,12 C 6,4 14,-4 10,-12" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                </motion.svg>
              ))}
            </div>

            {/* STAGE 3: SUCCESS CHECKMARK POP */}
            {(stage === 'success' || stage === 'text') && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="absolute -bottom-2 -right-2 bg-[#0F0A07] border border-emerald-500/35 rounded-full p-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center"
              >
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-emerald-400">
                  <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="6" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.path 
                    d="M 28,52 L 45,69 L 72,36" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
                  />
                </svg>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 4: TEXT & SUBTEXT & ACTIONS */}
      <AnimatePresence>
        {stage === 'text' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full flex flex-col items-center z-10"
          >
            <span className="text-[10px] font-sans tracking-[0.35em] text-warm-gold font-bold uppercase mb-2 block animate-pulse">
              Araku Ritual Initiated
            </span>
            <h3 className="font-playfair font-bold text-2xl md:text-3xl text-cream-latte mb-2">
              Order Placed Successfully
            </h3>
            <p className="text-xs text-cream-latte/65 mb-6 font-sans">
              Your fresh coffee beans are being prepared.
            </p>

            <div className="w-12 h-[1px] bg-warm-gold/20 mb-6" />

            <p className="text-[11px] text-cream-latte/50 font-sans leading-relaxed mb-6 max-w-sm mx-auto">
              Your selections have been securely transmitted to our flagship Araku roasting vaults. Micro-batch wood-fire roasting has officially commenced.
            </p>

            <div className="bg-espresso/50 border border-warm-gold/10 p-3.5 rounded-2xl flex items-center justify-center gap-3 max-w-xs mx-auto mb-8 text-left">
              <ShieldCheck className="text-warm-gold shrink-0" size={16} />
              <span className="text-[9px] font-sans text-cream-latte/60 uppercase tracking-widest leading-normal">
                Guaranteed packaging dispatch within 48 hours. India-wide priority shipping.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-sm mx-auto">
              <button
                onClick={onTrackLive}
                className="w-full sm:w-1/2 bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-500 font-sans text-[10px] font-bold tracking-[0.15em] uppercase py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(16,185,129,0.2)] hover:shadow-none font-bold"
              >
                <TrendingUp size={12} />
                Track Live
              </button>
              <button
                onClick={onExitLounge}
                className="w-full sm:w-1/2 bg-warm-gold text-espresso border border-warm-gold hover:bg-transparent hover:text-warm-gold font-sans text-[10px] font-bold tracking-[0.15em] uppercase py-3.5 rounded-xl transition-all duration-300 cursor-pointer shadow-[0_4px_16px_rgba(200,169,126,0.2)] hover:shadow-none font-bold"
              >
                Exit Lounge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
