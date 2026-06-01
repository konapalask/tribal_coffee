import { motion } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, CreditCard } from 'lucide-react';
import { type RealProduct, API_BASE_URL } from '../services/db';

export interface CartItem {
  product: RealProduct;
  quantity: number;
  weight: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, weight: string, delta: number) => void;
  onRemoveItem: (productId: string, weight: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  // Parse subtotal
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.weight === (item.product.size2Name || '750g') && item.product.price750g ? item.product.price750g : item.product.price;
    return acc + price * item.quantity;
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      className={`fixed inset-0 z-[100] overflow-hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      id="cart-drawer-wrapper"
    >
      {/* Dark backdrop blur overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
      />

      {/* Cart Sliding Container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-espresso/98 border-l border-warm-gold/10 glassmorphism shadow-[-15px_0_40px_rgba(0,0,0,0.8)] flex flex-col justify-between"
        id="cart-drawer-panel"
      >
        {/* Header */}
        <div className="p-6 border-b border-warm-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-cream-latte">
            <ShoppingBag size={20} className="text-warm-gold" />
            <h3 className="font-playfair font-bold text-lg tracking-wider">Your Selection</h3>
            <span className="text-xs font-sans bg-bean/60 border border-warm-gold/15 px-2.5 py-0.5 rounded-full text-warm-gold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          </div>
          <button 
            onClick={onClose}
            id="close-cart-btn"
            className="p-2 hover:bg-cream-latte/5 rounded-full text-cream-latte/70 hover:text-warm-gold transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag size={48} className="text-warm-gold/25 stroke-[1.2] mb-4 animate-bounce" />
              <p className="font-playfair text-lg text-cream-latte mb-2">Your lounge bag is empty</p>
              <p className="text-xs text-cream-latte/45 font-sans max-w-[200px] leading-relaxed">
                Add premium artisanal roasts and blends to begin your luxury ritual.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={`${item.product.id}-${item.weight}`} 
                id={`cart-item-${item.product.id}-${item.weight}`}
                className="flex gap-4 border-b border-warm-gold/5 pb-6 last:border-none"
              >
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl bg-espresso border border-warm-gold/5 flex items-center justify-center p-2">
                  <img
                    src={item.product.image.startsWith('http') ? item.product.image : `${API_BASE_URL}${item.product.image}`}
                    alt={item.product.name}
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  />
                </div>

                {/* Info & Quantity controls */}
                <div className="flex-grow flex flex-col justify-between text-left">
                  <div>
                    <h4 className="font-playfair font-bold text-sm text-cream-latte mb-1 leading-snug">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-warm-gold font-sans uppercase tracking-wider mb-2">
                      {item.product.roast} &bull; {item.weight}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-warm-gold/20 rounded-lg overflow-hidden bg-espresso/45">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.weight, -1)}
                        id={`cart-minus-${item.product.id}-${item.weight}`}
                        className="px-2.5 py-1 text-cream-latte/60 hover:text-warm-gold hover:bg-cream-latte/5 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 font-bebas text-sm text-cream-latte">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.weight, 1)}
                        id={`cart-plus-${item.product.id}-${item.weight}`}
                        className="px-2.5 py-1 text-cream-latte/60 hover:text-warm-gold hover:bg-cream-latte/5 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex items-center gap-3">
                      <span className="font-bebas text-lg text-warm-gold tracking-widest">
                        ₹{((item.weight === (item.product.size2Name || '750g') && item.product.price750g ? item.product.price750g : item.product.price) * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.weight)}
                        id={`cart-remove-${item.product.id}-${item.weight}`}
                        className="text-[10px] font-sans text-cream-latte/45 hover:text-red-400 transition-colors uppercase tracking-widest cursor-pointer"
                        aria-label="Remove item"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-warm-gold/10 glassmorphism-light space-y-4">
            {/* Total breakdown */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between text-xs text-cream-latte/65 font-sans">
                <span>Lounge Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-cream-latte/65 font-sans">
                <span>Premium Priority Courier</span>
                <span className="text-warm-gold uppercase font-bold text-[9px] tracking-widest bg-bean/30 border border-warm-gold/10 px-2 py-0.5 rounded">
                  Complimentary
                </span>
              </div>
              <div className="w-full h-[1px] bg-warm-gold/10 my-2" />
              <div className="flex items-center justify-between">
                <span className="font-playfair font-bold text-sm text-cream-latte">Total Order Value</span>
                <span className="font-bebas text-2xl text-warm-gold tracking-widest">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={onCheckout}
              id="cart-checkout-btn"
              className="w-full bg-warm-gold hover:bg-cream-latte text-espresso font-sans text-xs font-bold tracking-[0.2em] uppercase py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(200,169,126,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(231,216,201,0.3)]"
            >
              <CreditCard size={14} />
              Secure Checkout
            </button>

            <p className="text-[9px] text-cream-latte/45 font-sans tracking-wider uppercase text-center mt-2">
              🔒 256-bit encrypted premium transaction SSL
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
