import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';

interface NavbarProps {
  onCartToggle?: () => void;
  cartCount?: number;
  onAdminToggle?: () => void;
  userInitials?: string;
}

export default function Navbar({ onCartToggle, cartCount = 2, onAdminToggle, userInitials }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Synchronous ref to lock Intersection Observer updates during custom navigation clicks
  const isClickingNavRef = useRef(false);

  const handleNavLinkClick = (id: string) => {
    isClickingNavRef.current = true;
    setActiveSection(id);
    
    // Smoothly release the lock after smooth scroll completes (usually ~900ms)
    setTimeout(() => {
      isClickingNavRef.current = false;
    }, 950);
  };

  // Smooth scroll styling trigger & ultra-precise mathematical section active tracking (RAF throttled)
  useEffect(() => {
    const sections = ['home', 'shop', 'about', 'collections', 'contact'];
    let ticking = false;

    const handleScroll = () => {
      // 1. Shrunk navbar state
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // 2. Active Section Highlighting
      if (isClickingNavRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + 180; // Offset for optical navbar/focus line
          const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

          if (isAtBottom) {
            setActiveSection('contact');
          } else if (window.scrollY < 80) {
            setActiveSection('home');
          } else {
            for (const id of sections) {
              const el = document.getElementById(id);
              if (el) {
                const top = el.offsetTop;
                const height = el.offsetHeight;

                if (scrollPosition >= top && scrollPosition < top + height) {
                  setActiveSection(id);
                  break;
                }
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial evaluation
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      id="top-navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out py-3 md:py-8 ${
        isScrolled
          ? 'py-2 md:py-4 shadow-[0_4px_20px_rgba(0,0,0,0.18)]'
          : ''
      }`}
      style={{
        background: isScrolled ? 'rgba(15, 10, 7, 0.25)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(8px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(214,178,122,0.1)' : '1px solid transparent',
        willChange: 'background, backdrop-filter, padding, border-bottom',
      }}
    >
      {/* Cinematic Golden Ambient border outline line */}
      <div 
        className={`absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-warm-gold/20 to-transparent transition-opacity duration-500 ${
          isScrolled ? 'opacity-80' : 'opacity-0'
        }`} 
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* LOGO - Gold Embossed Accents & Parallax glows */}
        <a 
          href="#" 
          id="navbar-logo"
          onClick={() => handleNavLinkClick('home')}
          className="flex items-center gap-3 group relative select-none"
        >
          {/* Subtle Glow behind logo */}
          <div className="absolute -inset-2 bg-warm-gold/15 rounded-full filter blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          
          <div className="relative p-1 rounded-xl bg-gradient-to-br from-warm-gold/20 via-transparent to-warm-gold/5 border border-warm-gold/20 group-hover:border-warm-gold/45 group-hover:scale-105 transition-all duration-500 shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]">
            <img 
              src="/images/Logo-Registered.webp" 
              alt="Tribal Coffee Logo" 
              className="h-6 md:h-9 w-auto object-contain filter invert brightness-110 group-hover:rotate-[12deg] transition-all duration-500"
            />
          </div>
          <span className="font-bebas text-base md:text-lg tracking-[0.18em] text-cream-latte group-hover:text-warm-gold transition-colors duration-500">
            TRIBAL COFFEE
          </span>
        </a>

        {/* CENTER LINKS - Desktop Luxury sliding coffee-bean nav */}
        <div className="hidden md:flex items-center gap-4 font-sans text-[11.5px] font-bold tracking-[0.2em] uppercase relative bg-black/30 border border-cream-latte/5 px-4 py-2.5 rounded-full backdrop-blur-md">
          {['Home', 'Shop', 'About', 'Collections', 'Contact'].map((link) => {
            const id = link.toLowerCase();
            const isActive = activeSection === id;
            return (
              <a
                key={link}
                href={`#${id}`}
                onClick={() => handleNavLinkClick(id)}
                id={`nav-link-${id}`}
                className={`relative py-1.5 px-5 z-10 transition-colors duration-500 font-sans tracking-[0.22em] uppercase ${
                  isActive ? 'text-[#F8E8D2] font-black' : 'text-cream-latte/70 hover:text-warm-gold'
                }`}
              >
                {link}
                {isActive && (
                  <motion.span
                    layoutId="nav-bean"
                    className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none w-full h-[125%]"
                    style={{ willChange: 'transform, opacity' }}
                    transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
                  >
                    <svg viewBox="0 0 100 45" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]" preserveAspectRatio="none">
                      <defs>
                        {/* Rich roasted espresso gradient */}
                        <linearGradient id="navBeanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A2B1D" />
                          <stop offset="50%" stopColor="#3B2117" />
                          <stop offset="100%" stopColor="#2A140D" />
                        </linearGradient>
                        {/* Subtle golden top reflection highlight */}
                        <linearGradient id="navBeanHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#D6B27A" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#8B5E3C" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Main Organic Asymmetrical Bean Shape with tapered ends */}
                      <path 
                        d="M 6,22.5 C 6,10 16,3 50,3 C 84,3 94,10 94,22.5 C 94,35 84,42 50,42 C 16,42 6,35 6,22.5 Z" 
                        fill="url(#navBeanGrad)" 
                        stroke="rgba(214,178,122,0.35)"
                        strokeWidth="0.75"
                      />
                      
                      {/* Highlight layer */}
                      <path 
                        d="M 10,22.5 C 12,11.5 22,5.5 50,6.5 C 78,5.5 88,11.5 90,22.5 C 88,33.5 78,39.5 50,38.5 C 22,39.5 12,33.5 10,22.5 Z" 
                        fill="url(#navBeanHighlight)" 
                        opacity="0.6"
                      />

                      {/* Natural Split center groove split with deep shadow contrast */}
                      <path 
                        d="M 12,23 Q 32,20 50,24.5 T 88,22" 
                        stroke="#D6B27A" 
                        strokeWidth="1.2" 
                        fill="none" 
                        strokeLinecap="round"
                        opacity="0.7"
                        className="blur-[0.2px]"
                      />
                      <path 
                        d="M 12,23 Q 32,20 50,24.5 T 88,22" 
                        stroke="#1C0E0A" 
                        strokeWidth="0.6" 
                        fill="none" 
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                    </svg>
                  </motion.span>
                )}
              </a>
            );
          })}
        </div>

        {/* RIGHT ICONS - Circular Glassmorphic slot containers */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* User Account Profile slot */}
          <button
            id="nav-user-btn"
            onClick={onAdminToggle}
            className="p-2 md:p-2.5 bg-cream-latte/5 hover:bg-warm-gold/15 border border-cream-latte/10 hover:border-warm-gold/30 rounded-full transition-all duration-300 relative group cursor-pointer shadow-md hover:scale-105"
            aria-label="User Account Login"
            title={userInitials ? "Logged In (Click to Logout)" : "User Account Login"}
          >
            {userInitials ? (
              <span className="text-[10px] font-sans font-black text-warm-gold uppercase tracking-wider h-4 w-4 flex items-center justify-center">
                {userInitials}
              </span>
            ) : (
              <User size={16} className="stroke-[2.5] text-cream-latte group-hover:text-warm-gold transition-colors" />
            )}
          </button>

          {/* Search Trigger slot */}
          <button
            id="nav-search-btn"
            className="p-2 md:p-2.5 bg-cream-latte/5 hover:bg-warm-gold/15 border border-cream-latte/10 hover:border-warm-gold/30 rounded-full transition-all duration-300 relative group cursor-pointer shadow-md hover:scale-105"
            aria-label="Search Shop"
          >
            <Search size={16} className="stroke-[2.5] text-cream-latte group-hover:text-warm-gold transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-warm-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_6px_#D6B27A]" />
          </button>

          {/* Cart Trigger slot */}
          <button
            id="nav-cart-btn"
            onClick={onCartToggle}
            className="p-2 md:p-2.5 bg-cream-latte/5 hover:bg-warm-gold/15 border border-cream-latte/10 hover:border-warm-gold/30 rounded-full transition-all duration-300 relative group cursor-pointer shadow-md hover:scale-105"
            aria-label="Open Shopping Cart"
          >
            <ShoppingBag size={16} className="stroke-[2.5] text-cream-latte group-hover:text-warm-gold transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-warm-gold text-espresso font-bebas text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-espresso shadow-[0_3px_8px_rgba(214,178,122,0.4)] animate-pulse-slow">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu trigger slot */}
          <button
            id="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 bg-cream-latte/5 hover:bg-warm-gold/15 border border-cream-latte/10 hover:border-warm-gold/30 rounded-full transition-all duration-300 cursor-pointer text-cream-latte hover:text-warm-gold shadow-md"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* MOBILE NAV DRAWER Redesign */}
      <div
        id="mobile-nav-drawer"
        className={`fixed inset-x-0 top-[70px] z-40 bg-espresso/98 backdrop-blur-xl border-t border-warm-gold/15 flex flex-col justify-center items-center gap-6 md:hidden transition-all duration-500 ease-in-out shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
          isMobileMenuOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto h-[60vh]' 
            : 'opacity-0 -translate-y-10 pointer-events-none h-0'
        }`}
      >
        {['Home', 'Shop', 'About', 'Collections', 'Contact'].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavLinkClick(link.toLowerCase());
            }}
            id={`mobile-nav-link-${link.toLowerCase()}`}
            className={`text-xl font-playfair font-bold transition-all duration-300 tracking-wider py-1 ${
              activeSection === link.toLowerCase() ? 'text-warm-gold scale-105' : 'text-cream-latte/80 hover:text-warm-gold'
            }`}
          >
            {link}
          </a>
        ))}
        
        {/* Decorative divider line for mobile */}
        <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent via-warm-gold/30 to-transparent my-2" />
        
        <p className="text-[10px] font-sans tracking-[0.2em] text-cream-latte/40 uppercase">
          Crafted For True Coffee Lovers
        </p>
      </div>
    </nav>
  );
}
