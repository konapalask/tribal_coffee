import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Trash2, Edit3, X, ChevronRight,
  TrendingUp, Layers, Send, Truck, FileText, PlusCircle, LogOut,
  Users, CheckCircle2, UserPlus, Search, AlertCircle,
  HelpCircle, Shield, RefreshCw
} from 'lucide-react';
import {
  TRIBAL_PRODUCTS, addProduct, updateProduct, deleteProduct,
  resetDB, type RealProduct, API_BASE_URL
} from '../services/db';

// Interfaces for mock structures
interface ShipmentOrder {
  id: string;
  customerName: string;
  email: string;
  city: string;
  pincode: string;
  productName: string;
  amount: number;
  status: 'Pending' | 'Ready to Ship' | 'Dispatched' | 'Delivered';
  awb?: string;
  courier?: string;
  date?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  time: string;
}

interface ActiveChat {
  id: string;
  customerName: string;
  avatarColor: string;
  lastMessage: string;
  messages: ChatMessage[];
  topic: string;
  status: 'active' | 'resolved';
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Lounge Manager' | 'Dispatcher';
  status: 'Active' | 'Pending';
}export default function AdminDashboard({ onClose, loggedInUser, setLoggedInUser }: { onClose: () => void; loggedInUser?: any; setLoggedInUser?: (user: any) => void }) {
  // Security Portal states
  const [isAuthenticated, setIsAuthenticated] = useState(loggedInUser?.email === 'admin@tribalcoffee.in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [adminName, setAdminName] = useState(loggedInUser?.name || 'Sharmila K');
  // General navigation
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'shiprocket' | 'chat' | 'admins'>('analytics');

  // Product CRUD states
  const [productsList, setProductsList] = useState<RealProduct[]>([...TRIBAL_PRODUCTS]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [currentEditingProduct, setCurrentEditingProduct] = useState<RealProduct | null>(null);

  // Form states for Product CRUD
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'beans' | 'powder' | 'specialty' | 'filter'>('beans');
  const [formTagline, setFormTagline] = useState('');
  const [formRoast, setFormRoast] = useState('');
  const [formRoastLevel, setFormRoastLevel] = useState(3);
  const [formStrength, setFormStrength] = useState(3);
  const [formAcidity, setFormAcidity] = useState(2);
  const [formBody, setFormBody] = useState(3);
  const [formChicory, setFormChicory] = useState('0% Chicory');
  const [formPrice, setFormPrice] = useState(399);
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formTastingNotes, setFormTastingNotes] = useState('');
  const [formImage, setFormImage] = useState('/images/Arabica Coffee Beans.webp');
  const [formDescription, setFormDescription] = useState('');
  const [formAromaDescription, setFormAromaDescription] = useState('');
  const [formBgGradient, setFormBgGradient] = useState('radial-gradient(circle at 50% 40%, rgba(43, 24, 16, 0.45) 0%, rgba(17, 17, 17, 1) 70%)');
  const [formGlowColor, setFormGlowColor] = useState('rgba(74, 44, 29, 0.45)');

  // Shiprocket states
  const [shipments, setShipments] = useState<ShipmentOrder[]>([
    { id: 'TRB-8729', customerName: 'Aravind Swamy', email: 'aravind@gmail.com', city: 'Hyderabad', pincode: '500001', productName: 'Just Arabica Coffee Beans', amount: 449, status: 'Dispatched', awb: 'SR99201948', courier: 'Delhivery Express' }
  ]);
  const [calcSource, setCalcSource] = useState('530003'); // Visakhapatnam Araku dispatch hub
  const [calcDest, setCalcDest] = useState('560001'); // Bengaluru central hub
  const [calcWeight, setCalcWeight] = useState('0.5'); // kg
  const [shippingRates, setShippingRates] = useState<any[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedLabelShipment, setSelectedLabelShipment] = useState<ShipmentOrder | null>(null);
  const [selectedTrackingShipment, setSelectedTrackingShipment] = useState<ShipmentOrder | null>(null);
  // Live Chat states
  const [chats, setChats] = useState<ActiveChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [typedMessage, setTypedMessage] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Multi-Admin states
  const [admins, setAdmins] = useState<AdminUser[]>([
    { id: 'adm-1', name: 'Sharmila K', email: 'admin@tribalcoffee.in', role: 'Super Admin', status: 'Active' }
  ]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Super Admin' | 'Lounge Manager' | 'Dispatcher'>('Lounge Manager');

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  // --- Real-time Dynamic Analytics Calculations ---
  const totalRevenue = shipments.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalOrders = shipments.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const activeShipmentsCount = shipments.filter(s => s.status === 'Pending' || s.status === 'Ready to Ship').length;

  // Monthly Sales performance (Jan to Jun viewport matching UI axes)
  const monthlyRevenue = Array(12).fill(0);
  shipments.forEach(s => {
    if (s.date) {
      const slashParts = s.date.split('/');
      let month = -1;
      if (slashParts.length >= 2) {
        month = parseInt(slashParts[1], 10) - 1;
      } else {
        const dashParts = s.date.split('-');
        if (dashParts.length >= 2) {
          month = parseInt(dashParts[1], 10) - 1;
        }
      }
      if (month >= 0 && month < 12) {
        monthlyRevenue[month] += s.amount || 0;
      }
    }
  });

  const getLineChartPaths = () => {
    const displayedMonths = monthlyRevenue.slice(0, 6);
    const maxRev = Math.max(...displayedMonths, 1000);
    const points = displayedMonths.map((rev, idx) => {
      const x = idx * 120;
      const y = 220 - ((rev / maxRev) * 180);
      return { x, y };
    });
    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L 600,240 L 0,240 Z`;
    return { linePath, areaPath };
  };

  const { linePath, areaPath } = getLineChartPaths();

  // Coffee Category Sales breakdown for Donut Chart
  let beansQty = 0;
  let powderQty = 0;
  let specialtyQty = 0;
  shipments.forEach(s => {
    const prodName = (s.productName || '').toLowerCase();
    const qtyMatch = prodName.match(/x(\d+)/g) || [];
    let qty = 1;
    if (qtyMatch.length > 0) {
      qty = qtyMatch.reduce((sum, m) => sum + parseInt(m.replace('x', ''), 10), 0);
    }
    if (prodName.includes('beans')) {
      beansQty += qty;
    } else if (prodName.includes('powder') || prodName.includes('filter')) {
      powderQty += qty;
    } else {
      specialtyQty += qty;
    }
  });

  const totalQty = beansQty + powderQty + specialtyQty;
  const beansPercent = totalQty > 0 ? Math.round((beansQty / totalQty) * 100) : 0;
  const powderPercent = totalQty > 0 ? Math.round((powderQty / totalQty) * 100) : 0;
  const specialtyPercent = totalQty > 0 ? Math.round((specialtyQty / totalQty) * 100) : 0;

  // Synchronize Super Admin name in admins list with adminName
  useEffect(() => {
    setAdmins(prev => prev.map(a => a.email.toLowerCase() === 'admin@tribalcoffee.in' ? { ...a, name: adminName } : a));
  }, [adminName]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/users`);
        if (res.ok) {
          const data = await res.json();
          
          // Separate admins and customers dynamically
          const adminsList = data.filter((u: any) => u.role === 'Super Admin' || u.role === 'Lounge Manager' || u.role === 'Dispatcher');
          const customersList = data.filter((u: any) => u.role !== 'Super Admin' && u.role !== 'Lounge Manager' && u.role !== 'Dispatcher');
          
          setRegisteredUsers(customersList);
          
          if (adminsList.length > 0) {
            setAdmins(adminsList.map((a: any) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              role: a.role,
              status: 'Active'
            })));
          }

          // Dynamically sync active Super Admin name from backend JSON database
          const activeAdmin = data.find((u: any) => u.email.toLowerCase() === 'admin@tribalcoffee.in');
          if (activeAdmin) {
            setAdminName(activeAdmin.name);
            if (setLoggedInUser) {
              setLoggedInUser({
                name: activeAdmin.name,
                email: 'admin@tribalcoffee.in',
                role: 'Super Admin'
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, setLoggedInUser]);

  // Load and subscribe to persistent bookings for Shiprocket Logistics
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings`);
        if (res.ok) {
          const data = await res.json();
          // Map persistent backend bookings to Shiprocket interface structure
          const mapped: ShipmentOrder[] = data.map((b: any) => ({
            id: b.id,
            customerName: b.customerName || 'Connoisseur',
            email: b.email,
            city: b.city || 'Visakhapatnam',
            pincode: b.pincode || '530003',
            productName: b.items ? b.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') : 'Gourmet Selection',
            amount: b.amount || 0,
            status: b.status || 'Pending',
            awb: b.awb,
            courier: b.courier,
            date: b.date
          }));
          setShipments(mapped);
        }
      } catch (err) {
        console.error('Failed to load shipments registry:', err);
      }
    };
    if (isAuthenticated) {
      fetchShipments();
    }
  }, [isAuthenticated]);

  // Load and subscribe to database updates
  useEffect(() => {
    const handleDbChange = () => {
      setProductsList([...TRIBAL_PRODUCTS]);
    };
    window.addEventListener('tribal-db-changed', handleDbChange);
    return () => window.removeEventListener('tribal-db-changed', handleDbChange);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  // Handle administrative login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both administrative fields.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        if (setLoggedInUser) {
          setLoggedInUser({ name: data.user?.name || 'Sharmila K', email: email });
        }
      } else {
        setAuthError(data.message || 'Authentication rejected. Access denied.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Hardcoded fallback for offline/development mode
      if (email === 'admin@tribalcoffee.in' && password === 'password123') {
        setIsAuthenticated(true);
        if (setLoggedInUser) {
          setLoggedInUser({ name: 'Sharmila K', email: email });
        }
      } else {
        setAuthError('Backend system offline. Failed to establish connection.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // CRUD handlers
  const handleOpenAddModal = () => {
    setFormId(`product-${Date.now()}`);
    setFormName('');
    setFormCategory('beans');
    setFormTagline('');
    setFormRoast('Medium-Dark Roast');
    setFormRoastLevel(4);
    setFormStrength(4);
    setFormAcidity(2);
    setFormBody(4);
    setFormChicory('0% Chicory');
    setFormPrice(449);
    setFormOriginalPrice('');
    setFormTastingNotes('Sweet Caramel, Dark Cacao, Fruit Compote');
    setFormImage('/images/Arabica Coffee Beans.webp');
    setFormDescription('');
    setFormAromaDescription('');
    setFormBgGradient('radial-gradient(circle at 50% 40%, rgba(55, 30, 20, 0.45) 0%, rgba(17, 17, 17, 1) 70%)');
    setFormGlowColor('rgba(95, 60, 40, 0.45)');
    setCurrentEditingProduct(null);
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (product: RealProduct) => {
    setFormId(product.id);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormTagline(product.tagline);
    setFormRoast(product.roast);
    setFormRoastLevel(product.roastLevel);
    setFormStrength(product.strength);
    setFormAcidity(product.acidity);
    setFormBody(product.body);
    setFormChicory(product.chicory);
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setFormTastingNotes(product.tastingNotes.join(', '));
    setFormImage(product.image);
    setFormDescription(product.description);
    setFormAromaDescription(product.aromaDescription);
    setFormBgGradient(product.bgGradient);
    setFormGlowColor(product.glowColor);
    setCurrentEditingProduct(product);
    setIsEditingModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formId || !formPrice) return;

    const parsedNotes = formTastingNotes.split(',').map(n => n.trim()).filter(Boolean);
    const savedProd: RealProduct = {
      id: formId,
      name: formName,
      category: formCategory,
      tagline: formTagline || 'MICRO-BATCH RESERVE',
      roast: formRoast,
      roastLevel: Number(formRoastLevel),
      strength: Number(formStrength),
      acidity: Number(formAcidity),
      body: Number(formBody),
      chicory: formChicory,
      tastingNotes: parsedNotes.length ? parsedNotes : ['Chocolate notes'],
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      image: formImage,
      description: formDescription || 'Custom batch roasted to perfection in our volcanic wood furnaces.',
      aromaDescription: formAromaDescription || 'Inviting earthy chocolate undertones.',
      bgGradient: formBgGradient,
      glowColor: formGlowColor
    };

    if (currentEditingProduct) {
      updateProduct(savedProd);
    } else {
      addProduct(savedProd);
    }
    setIsEditingModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this organic blend from your vaults?')) {
      deleteProduct(id);
    }
  };

  // Shiprocket Rate Calculator
  const handleCalculateShipping = () => {
    setIsCalculating(true);
    setShippingRates(null);

    setTimeout(() => {
      setIsCalculating(false);
      // Realistic India courier rates through Shiprocket integrations
      setShippingRates([
        { partner: 'Delhivery Express', transit: '2-3 Days', rate: 72, rating: '4.8/5', badge: 'Fastest' },
        { partner: 'Xpressbees Prime', transit: '3-4 Days', rate: 58, rating: '4.5/5', badge: 'Best Value' },
        { partner: 'Shadowfax Local', transit: '4-5 Days', rate: 49, rating: '4.2/5', badge: 'Economy' }
      ]);
    }, 1200);
  };

  const handleDispatchShipment = async (id: string, courierName: string) => {
    const awbNum = `SR${Math.floor(10000000 + Math.random() * 90000000)}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/dispatch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier: courierName, awb: awbNum })
      });
      if (res.ok) {
        setShipments(prev => prev.map(s => {
          if (s.id === id) {
            return {
              ...s,
              status: 'Dispatched',
              awb: awbNum,
              courier: courierName
            };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error('Failed to dispatch shipment in backend:', e);
    }
  };

  // Chat message send handler
  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const newMsg: ChatMessage = {
      id: `admin-msg-${Date.now()}`,
      sender: 'admin',
      text: typedMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...activeChat.messages, newMsg];

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: typedMessage,
          messages: updatedMessages
        };
      }
      return c;
    }));

    const userTyped = typedMessage;
    setTypedMessage('');

    // Simulated responsive customer reply
    setTimeout(() => {
      let replyText = "Perfect! That sounds exceptional. Let me know when the tracking starts.";
      if (userTyped.toLowerCase().includes('roast') || userTyped.toLowerCase().includes('queue')) {
        replyText = "Fascinating! I love wood-roasted coffee. I look forward to smelling the freshly roasted batch!";
      } else if (userTyped.toLowerCase().includes('track') || userTyped.toLowerCase().includes('dispatch') || userTyped.toLowerCase().includes('awb')) {
        replyText = "Got it! Thanks for looking into the Shiprocket dispatch. I will track the package now.";
      } else if (userTyped.toLowerCase().includes('acid') || userTyped.toLowerCase().includes('sensitive')) {
        replyText = "That is super reassuring! I will order the Cold Brew concentrate right now. Thank you!";
      }

      const responseMsg: ChatMessage = {
        id: `user-msg-${Date.now()}`,
        sender: 'user',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMessage: replyText,
            messages: [...updatedMessages, responseMsg]
          };
        }
        return c;
      }));
    }, 1500);
  };

  // Multi-Admin Invite Handler
  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          password: 'password123', // Default passcode for newly invited administrative accounts
          role: inviteRole
        })
      });

      if (res.ok) {
        // Fetch fresh users to update UI states
        const fetchRes = await fetch(`${API_BASE_URL}/api/auth/users`);
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          const adminsList = data.filter((u: any) => u.role === 'Super Admin' || u.role === 'Lounge Manager' || u.role === 'Dispatcher');
          const customersList = data.filter((u: any) => u.role !== 'Super Admin' && u.role !== 'Lounge Manager' && u.role !== 'Dispatcher');
          
          setAdmins(adminsList.map((a: any) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            role: a.role,
            status: 'Active'
          })));
          setRegisteredUsers(customersList);
        }
        setIsInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to authorize administrative profile in backend database.');
      }
    } catch (err) {
      console.error('Failed to authorize/invite admin:', err);
      alert('Network failure connecting to administrative security vault.');
    }
  };

  // Sync active sidebar adminName with Multi-Admin admins database
  useEffect(() => {
    setAdmins(prev => prev.map(a => a.email.toLowerCase() === 'admin@tribalcoffee.in' ? { ...a, name: adminName } : a));
  }, [adminName]);

  const handleDeleteAdmin = async (id: string) => {
    const targetAdmin = admins.find(a => a.id === id);
    if (!targetAdmin) return;
    
    if (targetAdmin.email.toLowerCase() === 'admin@tribalcoffee.in') {
      alert(`You cannot revoke Super Admin ${targetAdmin.name}!`);
      return;
    }

    if (confirm(`Are you sure you want to revoke administrative access for ${targetAdmin.name}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          // Fetch fresh users to update UI states
          const fetchRes = await fetch(`${API_BASE_URL}/api/auth/users`);
          if (fetchRes.ok) {
            const data = await fetchRes.json();
            const adminsList = data.filter((u: any) => u.role === 'Super Admin' || u.role === 'Lounge Manager' || u.role === 'Dispatcher');
            const customersList = data.filter((u: any) => u.role !== 'Super Admin' && u.role !== 'Lounge Manager' && u.role !== 'Dispatcher');
            
            setAdmins(adminsList.map((a: any) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              role: a.role,
              status: 'Active'
            })));
            setRegisteredUsers(customersList);
          }
        } else {
          const errorData = await res.json();
          alert(errorData.message || 'Failed to delete administrative access in backend database.');
        }
      } catch (err) {
        console.error('Failed to delete administrative access:', err);
        alert('Network failure connecting to administrative security vault.');
      }
    }
  };
  const filteredProducts = productsList.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.roast.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.tagline.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter === 'all' || prod.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/90 backdrop-blur-xl text-cream-latte font-sans flex flex-col items-center justify-start min-h-screen">
      
      {/* 1. PASSCODE GATE SCREEN */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0F0A07] flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Elegant Background elements */}
            <div className="absolute w-[500px] h-[500px] rounded-full filter blur-[150px] bg-warm-gold/5 top-1/4 left-1/4 -z-10" />
            <div className="absolute w-[400px] h-[400px] rounded-full filter blur-[120px] bg-bean/10 bottom-1/4 right-1/4 -z-10" />

            <div className="w-full max-w-md glassmorphism border border-warm-gold/20 p-8 rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-latte/5 text-cream-latte/50 hover:text-warm-gold transition-colors cursor-pointer"
                aria-label="Exit Portal"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-full bg-warm-gold/10 border border-warm-gold/20 flex items-center justify-center mx-auto mb-6 text-warm-gold">
                <Lock size={26} className="stroke-[1.5]" />
              </div>

              <span className="text-[10px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-2 block">
                Tribal Coffee India
              </span>
              <h2 className="text-2xl font-playfair font-bold mb-1">
                Admin Control Vault
              </h2>
              <p className="text-xs text-cream-latte/65 mb-8">
                Enter secure administrative credentials to access products, logistics, and chats.
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
                <div>
                  <label className="text-[10px] text-cream-latte/60 font-sans uppercase tracking-wider mb-2 block font-bold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@tribalcoffee.in"
                    className="w-full bg-[#1A110B]/80 border border-warm-gold/20 rounded-xl px-4 py-3 text-sm text-cream-latte focus:outline-none focus:border-warm-gold transition-colors placeholder-cream-latte/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cream-latte/60 font-sans uppercase tracking-wider mb-2 block font-bold">
                    Passcode / Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-[#1A110B]/80 border border-warm-gold/20 rounded-xl px-4 py-3 text-sm text-cream-latte focus:outline-none focus:border-warm-gold transition-colors placeholder-cream-latte/20"
                  />
                </div>

                {authError && (
                  <div className="bg-red-950/40 border border-red-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs text-red-300 font-sans">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-warm-gold hover:bg-cream-latte text-espresso font-sans text-xs font-bold tracking-[0.2em] uppercase py-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(200,169,126,0.2)] hover:shadow-none disabled:opacity-50"
                >
                  {isAuthLoading ? 'Verifying Credentials...' : 'Authenticate Vault'}
                </button>
              </form>

              <div className="mt-8 text-[9px] text-cream-latte/30 tracking-wider">
                Authorized administrative personnel access only.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ADMIN DASHBOARD WORKSPACE */}
      {isAuthenticated && (
        <div className="w-full max-w-[1550px] px-4 md:px-8 py-6 md:py-10 flex flex-col gap-6 md:gap-8 flex-grow">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-warm-gold/15">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-warm-gold/15 border border-warm-gold/20 rounded-2xl text-warm-gold">
                <Shield size={24} className="stroke-[1.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-warm-gold uppercase">
                    Tribal Coffee Lounge Portal
                  </span>
                  <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[8px] font-sans px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                    Connected
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-playfair font-bold text-cream-latte mt-1">
                  Administrator Control Center
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm('Sync all storage matrices back to factory values?')) {
                    resetDB();
                    setProductsList([...TRIBAL_PRODUCTS]);
                  }
                }}
                className="px-4 py-2.5 bg-cream-latte/5 hover:bg-cream-latte/15 border border-cream-latte/10 rounded-xl font-sans text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer text-cream-latte/70 hover:text-cream-latte"
                title="Reset local storage values to defaults"
              >
                <RefreshCw size={14} />
                Reset Defaults
              </button>
              
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  if (setLoggedInUser) {
                    setLoggedInUser(null);
                  }
                }}
                className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/45 rounded-xl font-sans text-xs text-red-300 tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut size={14} />
                Lock Vault
              </button>

            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
            <div className="lg:col-span-3 flex flex-col gap-4 text-left">
              <div className="glassmorphism border border-warm-gold/15 p-4 rounded-3xl">
                <div className="flex items-center gap-3 p-3 bg-espresso/50 border border-warm-gold/10 rounded-2xl mb-4 group relative">
                  <div className="w-10 h-10 rounded-full bg-warm-gold text-espresso flex items-center justify-center font-playfair font-black text-sm shadow-[0_0_10px_#D6B27A] shrink-0 uppercase">
                    {adminName ? adminName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'TC'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-playfair font-bold text-xs truncate" title={adminName}>{adminName}</h4>
                      <button 
                        onClick={async () => {
                          const newName = prompt('Enter new Admin Name:', adminName);
                          if (newName && newName.trim()) {
                            const trimmed = newName.trim();
                            setAdminName(trimmed);
                            try {
                              const res = await fetch(`${API_BASE_URL}/api/auth/users/update`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: 'admin@tribalcoffee.in', name: trimmed })
                              });
                              if (res.ok && setLoggedInUser) {
                                const data = await res.json();
                                setLoggedInUser(data.user);
                              }
                            } catch (e) {
                              console.error('Failed to save admin name in backend:', e);
                            }
                          }
                        }}
                        className="text-cream-latte/40 hover:text-warm-gold transition-colors p-0.5 rounded cursor-pointer shrink-0"
                        title="Edit Admin Name"
                      >
                        <Edit3 size={10} />
                      </button>
                    </div>
                    <p className="text-[9px] text-warm-gold font-sans font-bold uppercase tracking-widest mt-0.5">Owner / Super Admin</p>
                  </div>
                </div>                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                      activeTab === 'analytics'
                        ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                        : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp size={16} />
                      Overview & Analytics
                    </div>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                      activeTab === 'products'
                        ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                        : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers size={16} />
                      Product Database
                    </div>
                    <span className="bg-cream-latte/15 px-2 py-0.5 rounded-md text-[9px] font-sans font-bold">
                      {productsList.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('shiprocket')}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                      activeTab === 'shiprocket'
                        ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                        : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck size={16} />
                      Shiprocket Logistics
                    </div>
                    <span className="bg-amber-950 text-warm-gold border border-warm-gold/25 px-2 py-0.5 rounded-md text-[9px] font-sans font-bold">
                      Syncing
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                      activeTab === 'chat'
                        ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                        : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Send size={16} />
                      Live Chat Desk
                    </div>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-sans font-bold animate-pulse">
                      Live
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('admins')}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between font-sans text-xs tracking-wider uppercase font-bold transition-all cursor-pointer ${
                      activeTab === 'admins'
                        ? 'bg-warm-gold text-espresso shadow-[0_4px_16px_rgba(200,169,126,0.2)]'
                        : 'bg-transparent text-cream-latte/70 hover:bg-cream-latte/5 hover:text-cream-latte'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users size={16} />
                      Multi-Admin Hub
                    </div>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: WORKSPACE VIEWS */}
            <div className="lg:col-span-9 w-full">
              
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="flex flex-col gap-8 text-left">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Revenue Card */}
                    <div className="glass-premium-card p-6 border border-warm-gold/15 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] bg-warm-gold/5 -z-10" />
                      <span className="text-[10px] font-sans text-warm-gold uppercase tracking-[0.2em] font-bold block mb-1">Total Revenue</span>
                      <h3 className="font-bebas text-3xl md:text-4xl text-[#F8E8D2] tracking-wider leading-none">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                      <div className="flex items-center gap-1.5 mt-3 text-cream-latte/40 font-sans text-[11px]">
                        <span>Based on historical bookings</span>
                      </div>
                    </div>

                    {/* Orders Card */}
                    <div className="glass-premium-card p-6 border border-warm-gold/15 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] bg-bean/10 -z-10" />
                      <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-[0.2em] font-bold block mb-1">Total Orders</span>
                      <h3 className="font-bebas text-3xl md:text-4xl text-[#F8E8D2] tracking-wider leading-none">{totalOrders} Sales</h3>
                      <div className="flex items-center gap-1.5 mt-3 text-cream-latte/40 font-sans text-[11px]">
                        <span>Orders logged in system</span>
                      </div>
                    </div>

                    {/* Avg Value Card */}
                    <div className="glass-premium-card p-6 border border-warm-gold/15 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] bg-warm-gold/5 -z-10" />
                      <span className="text-[10px] font-sans text-warm-gold uppercase tracking-[0.2em] font-bold block mb-1">Average Order</span>
                      <h3 className="font-bebas text-3xl md:text-4xl text-[#F8E8D2] tracking-wider leading-none">₹{Math.round(averageOrderValue)}</h3>
                      <div className="flex items-center gap-1.5 mt-3 text-cream-latte/40 font-sans text-[11px]">
                        <span>Average ticket size per order</span>
                      </div>
                    </div>

                    {/* Active Dispatch Card */}
                    <div className="glass-premium-card p-6 border border-warm-gold/15 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] bg-emerald-500/5 -z-10" />
                      <span className="text-[10px] font-sans text-cream-latte/50 uppercase tracking-[0.2em] font-bold block mb-1">Active Shipments</span>
                      <h3 className="font-bebas text-3xl md:text-4xl text-[#F8E8D2] tracking-wider leading-none">{activeShipmentsCount} Active</h3>
                      <div className="flex items-center gap-1.5 mt-3 text-cream-latte/40 font-sans text-[11px]">
                        <span>Awaiting dispatch actions</span>
                      </div>
                    </div>
                  </div>
                  {/* Dynamic Custom Charting (Line & Donut SVGs) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Line Chart */}
                    <div className="lg:col-span-8 glassmorphism border border-warm-gold/15 p-6 rounded-[30px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <span className="text-[10px] font-sans text-warm-gold uppercase tracking-widest font-bold">Monthly Sales Performance</span>
                            <h4 className="font-playfair font-bold text-xl text-cream-latte mt-1">Revenue Matrix (₹)</h4>
                          </div>
                          <span className="bg-warm-gold/15 border border-warm-gold/20 text-warm-gold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            Year 2026
                          </span>
                        </div>
                        {/* Interactive Responsive SVG Area Chart */}
                        <div className="h-64 w-full relative">
                          <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D6B27A" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#D6B27A" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            
                            {/* Grid Lines */}
                            <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(214,178,122,0.08)" strokeDasharray="5,5" />
                            <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(214,178,122,0.08)" strokeDasharray="5,5" />
                            <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(214,178,122,0.08)" strokeDasharray="5,5" />
                            
                            {/* SVG Path Area */}
                            <path
                              d={areaPath}
                              fill="url(#chartGrad)"
                            />

                            {/* SVG Line path */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke="rgba(214,178,122,0.3)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>

                          {/* Chart Tooltip Overlay */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-espresso/95 border border-warm-gold/20 p-4 rounded-2xl text-[10px] font-sans uppercase tracking-[0.2em] text-center shadow-2xl backdrop-blur-md">
                            <span className="text-warm-gold block font-bold mb-1">Peak Sales (May)</span>
                            <span className="text-cream-latte/50 block font-normal text-[8px] tracking-wide normal-case mt-1">May sales logged: ₹{monthlyRevenue[4].toLocaleString('en-IN')}</span>
                          </div>
                        </div>                      </div>

                      {/* X-Axis labels */}
                      <div className="flex justify-between items-center px-2 mt-4 text-[10px] text-cream-latte/45 tracking-widest uppercase font-bold">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May (Current)</span>
                      </div>
                    </div>
                    {/* Donut Chart */}
                    <div className="lg:col-span-4 glassmorphism border border-warm-gold/15 p-6 rounded-[30px] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-sans text-warm-gold uppercase tracking-widest font-bold block mb-1">Volume by Blend</span>
                        <h4 className="font-playfair font-bold text-lg text-cream-latte">Category Sales</h4>
                        
                        <div className="relative w-36 h-36 mx-auto my-8 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Empty Track */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(214,178,122,0.08)" strokeWidth="8" />
                            
                            {/* Beans Segment */}
                            {beansPercent > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#D6B27A"
                                strokeWidth="8"
                                strokeDasharray={`${(beansPercent / 100) * 251.2} 251.2`}
                                strokeDashoffset="0"
                              />
                            )}
                            
                            {/* Powder Segment */}
                            {powderPercent > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#8B5E3C"
                                strokeWidth="8"
                                strokeDasharray={`${(powderPercent / 100) * 251.2} 251.2`}
                                strokeDashoffset={-((beansPercent / 100) * 251.2)}
                              />
                            )}
                            
                            {/* Specialty Segment */}
                            {specialtyPercent > 0 && (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#4A2B1D"
                                strokeWidth="8"
                                strokeDasharray={`${(specialtyPercent / 100) * 251.2} 251.2`}
                                strokeDashoffset={-(((beansPercent + powderPercent) / 100) * 251.2)}
                              />
                            )}
                          </svg>
                          <div className="absolute text-center px-4">
                            <span className="font-playfair font-bold text-xl text-[#F8E8D2] block">
                              {totalOrders > 0 ? `${beansPercent}%` : '0%'}
                            </span>
                            <span className="text-[7px] font-sans text-cream-latte/45 tracking-wider uppercase block leading-tight">
                              {totalOrders > 0 ? 'Araku Beans dominant' : 'No Sales Yet'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="flex flex-col gap-2 font-sans text-[10px] uppercase tracking-widest font-bold text-cream-latte/50">
                        <div className="flex items-center justify-between text-cream-latte">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-warm-gold" />
                            <span>Araku Beans</span>
                          </div>
                          <span>{beansPercent}%</span>
                        </div>
                        <div className="flex items-center justify-between text-cream-latte">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C]" />
                            <span>Fine/Coarse Powder</span>
                          </div>
                          <span>{powderPercent}%</span>
                        </div>
                        <div className="flex items-center justify-between text-cream-latte">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4A2B1D]" />
                            <span>Cold Brew / Special</span>
                          </div>
                          <span>{specialtyPercent}%</span>
                        </div>
                      </div>
                    </div>                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS CRUD */}
              {activeTab === 'products' && (
                <div className="flex flex-col gap-6 text-left">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/30 border border-cream-latte/5 p-4 rounded-2xl backdrop-blur-md">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-latte/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search products database..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-espresso/50 border border-cream-latte/10 rounded-xl font-sans text-xs focus:outline-none focus:border-warm-gold/50 text-cream-latte"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-espresso/50 border border-cream-latte/10 rounded-xl px-4 py-2 text-xs font-sans text-cream-latte focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        <option value="beans">Organic Beans</option>
                        <option value="powder">Ground Powder</option>
                        <option value="filter">Filter Coffee</option>
                        <option value="specialty">Specialty / Brews</option>
                      </select>

                      <button
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 bg-warm-gold text-espresso font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-cream-latte hover:text-espresso transition-colors cursor-pointer flex items-center gap-2 shadow-[0_4px_16px_rgba(200,169,126,0.15)]"
                      >
                        <PlusCircle size={14} className="stroke-[2.5]" />
                        Add Product
                      </button>
                    </div>
                  </div>

                  {/* Products List Table */}
                  <div className="glassmorphism border border-warm-gold/15 rounded-3xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-warm-gold/10 text-[10px] text-warm-gold uppercase tracking-[0.2em] bg-espresso/60 font-bold">
                            <th className="py-4 px-6 text-left">Product Details</th>
                            <th className="py-4 px-6 text-left">Category</th>
                            <th className="py-4 px-6 text-left">Roast & Blend</th>
                            <th className="py-4 px-6 text-left">Price (₹)</th>
                            <th className="py-4 px-6 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-warm-gold/5 font-sans text-xs">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((prod) => (
                              <tr key={prod.id} className="hover:bg-cream-latte/[0.02] transition-colors">
                                <td className="py-4 px-6 text-left flex items-center gap-3">
                                  <div className="w-12 h-12 bg-espresso/50 border border-warm-gold/10 rounded-xl p-1 flex items-center justify-center">
                                    <img src={prod.image.startsWith('http') ? prod.image : `${API_BASE_URL}${prod.image}`} alt={prod.name} className="h-full w-full object-contain" />
                                  </div>
                                  <div>
                                    <h4 className="font-playfair font-bold text-sm text-cream-latte">{prod.name}</h4>
                                    <span className="text-[9px] text-cream-latte/45 tracking-widest uppercase font-bold">{prod.tagline}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-left uppercase text-[10px] tracking-wider text-cream-latte/70">
                                  {prod.category}
                                </td>
                                <td className="py-4 px-6 text-left">
                                  <div className="font-bold text-cream-latte">{prod.roast}</div>
                                  <div className="text-[10px] text-warm-gold/60 mt-0.5">{prod.chicory}</div>
                                </td>
                                <td className="py-4 px-6 text-left font-bold text-[#F8E8D2]">
                                  ₹{prod.price}
                                  {prod.originalPrice && (
                                    <span className="text-[10px] text-cream-latte/30 line-through ml-2 font-normal">
                                      ₹{prod.originalPrice}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleOpenEditModal(prod)}
                                      className="p-2 bg-cream-latte/5 hover:bg-warm-gold/20 text-cream-latte hover:text-warm-gold rounded-lg border border-cream-latte/10 hover:border-warm-gold/30 transition-colors cursor-pointer"
                                      title="Edit Product"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="p-2 bg-red-950/10 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg border border-transparent transition-colors cursor-pointer"
                                      title="Delete Product"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-cream-latte/40">
                                <HelpCircle className="mx-auto mb-3 text-cream-latte/20" size={32} />
                                No product matrices match your filter queries.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SHIPROCKET LOGISTICS */}
              {activeTab === 'shiprocket' && (
                <div className="flex flex-col gap-8 text-left">
                  
                  {/* Shipping rates calculator */}
                  <div className="glassmorphism border border-warm-gold/15 p-6 rounded-[30px]">
                    <span className="text-[10px] font-sans text-warm-gold uppercase tracking-[0.25em] font-bold block mb-1">
                      Shiprocket API Integration
                    </span>
                    <h3 className="font-playfair font-bold text-xl text-cream-latte mb-6">
                      Real-time Courier Routing & Rate Calculator
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                      <div>
                        <label className="text-[10px] text-cream-latte/60 font-sans uppercase tracking-wider mb-2 block font-bold">Source Pincode</label>
                        <input
                          type="text"
                          value={calcSource}
                          onChange={(e) => setCalcSource(e.target.value)}
                          className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-xs font-sans text-cream-latte focus:outline-none focus:border-warm-gold/30"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream-latte/60 font-sans uppercase tracking-wider mb-2 block font-bold">Destination Pincode</label>
                        <input
                          type="text"
                          value={calcDest}
                          onChange={(e) => setCalcDest(e.target.value)}
                          className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-xs font-sans text-cream-latte focus:outline-none focus:border-warm-gold/30"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cream-latte/60 font-sans uppercase tracking-wider mb-2 block font-bold">Package Weight (KG)</label>
                        <select
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(e.target.value)}
                          className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-xs font-sans text-cream-latte focus:outline-none cursor-pointer"
                        >
                          <option value="0.25">0.25 kg (1 Standard pouch)</option>
                          <option value="0.5">0.5 kg (2 Pouches)</option>
                          <option value="1.0">1.0 kg (4 Pouches)</option>
                          <option value="2.0">2.0 kg (Co-op Bulk)</option>
                        </select>
                      </div>
                      <button
                        onClick={handleCalculateShipping}
                        className="w-full py-2.5 bg-warm-gold text-espresso font-sans text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-cream-latte transition-colors cursor-pointer"
                      >
                        {isCalculating ? 'Computing Rates...' : 'Get Shiprocket Rates'}
                      </button>
                    </div>

                    {/* Computed Shipping Rates display */}
                    <AnimatePresence>
                      {shippingRates && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-warm-gold/10 pt-6"
                        >
                          {shippingRates.map((r, i) => (
                            <div key={i} className="bg-espresso/60 border border-warm-gold/15 p-4 rounded-2xl flex flex-col justify-between hover:border-warm-gold/45 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <span className="bg-warm-gold/10 border border-warm-gold/20 text-warm-gold text-[9px] px-2 py-0.5 rounded font-sans font-bold uppercase tracking-wider">
                                  {r.badge}
                                </span>
                                <span className="text-[10px] text-cream-latte/50 font-sans">Rating: {r.rating}</span>
                              </div>
                              <h4 className="font-playfair font-bold text-sm text-cream-latte">{r.partner}</h4>
                              <p className="text-[10px] text-cream-latte/60 font-sans mt-0.5">Estimated transit: {r.transit}</p>
                              
                              <div className="flex justify-between items-center mt-5 border-t border-warm-gold/5 pt-3">
                                <span className="font-bebas text-lg text-warm-gold tracking-widest">₹{r.rate}.00</span>
                                <span className="text-[9px] font-sans text-emerald-400 font-bold uppercase tracking-widest">Serviceable</span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Shiprocket Shipments list */}
                  <div className="glassmorphism border border-warm-gold/15 rounded-3xl overflow-hidden shadow-lg">
                    <div className="bg-espresso/60 border-b border-warm-gold/10 px-6 py-4 flex items-center justify-between">
                      <h4 className="font-playfair font-bold text-base text-cream-latte">Order Shipments Matrices</h4>
                      <span className="text-[10px] text-warm-gold font-sans font-bold uppercase tracking-widest">Auto-linked to frontend</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-warm-gold/10 text-[10px] text-warm-gold uppercase tracking-[0.2em] bg-espresso/30 font-bold">
                            <th className="py-4 px-6 text-left">Order Details</th>
                            <th className="py-4 px-6 text-left">Customer</th>
                            <th className="py-4 px-6 text-left">AWB Code / Logistics</th>
                            <th className="py-4 px-6 text-left">Status</th>
                            <th className="py-4 px-6 text-center">AWB Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-warm-gold/5 font-sans text-xs">
                          {shipments.map((s) => (
                            <tr key={s.id} className="hover:bg-cream-latte/[0.02] transition-colors">
                              <td className="py-4 px-6 text-left">
                                <div className="font-bold text-cream-latte">{s.id}</div>
                                <div className="text-[10px] text-cream-latte/50 mt-0.5">{s.productName}</div>
                              </td>
                              <td className="py-4 px-6 text-left">
                                <div className="font-bold text-cream-latte">{s.customerName}</div>
                                <div className="text-[10px] text-cream-latte/45 mt-0.5">{s.city} (PIN: {s.pincode})</div>
                              </td>
                              <td className="py-4 px-6 text-left">
                                {s.awb ? (
                                  <div>
                                    <div className="font-bold text-warm-gold tracking-widest">{s.awb}</div>
                                    <div className="text-[10px] text-cream-latte/45 mt-0.5">{s.courier}</div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-cream-latte/30 uppercase tracking-widest">Not Dispatched</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-left">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider border ${
                                  s.status === 'Pending' ? 'bg-red-950/20 border-red-500/20 text-red-300' :
                                  s.status === 'Ready to Ship' ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' :
                                  s.status === 'Dispatched' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300' :
                                  'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">                                <div className="flex items-center justify-center gap-2">
                                  {s.status === 'Pending' || s.status === 'Ready to Ship' ? (
                                    <button
                                      onClick={() => handleDispatchShipment(s.id, 'Delhivery Prime - Express')}
                                      className="px-4 py-2 bg-warm-gold text-espresso font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-cream-latte transition-all cursor-pointer shadow-md font-bold"
                                    >
                                      Generate AWB
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setSelectedLabelShipment(s)}
                                        className="px-3 py-2 bg-cream-latte/5 hover:bg-cream-latte/15 border border-cream-latte/10 rounded-lg font-sans text-[10px] font-bold uppercase tracking-wider text-cream-latte hover:text-warm-gold transition-all cursor-pointer flex items-center gap-1 font-bold"
                                      >
                                        <FileText size={10} />
                                        Label
                                      </button>
                                      <button
                                        onClick={() => setSelectedTrackingShipment(s)}
                                        className="px-3 py-2 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/25 rounded-lg font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 font-bold"
                                      >
                                        <TrendingUp size={10} />
                                        Track Live
                                      </button>
                                    </>
                                  )}
                                </div>                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE CHAT DESK */}
              {activeTab === 'chat' && (
                <div className="glassmorphism border border-warm-gold/15 rounded-[30px] overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-12 h-[600px] text-left">
                  
                  {/* Chat Inbox panel (sidebar) */}
                  <div className="md:col-span-4 border-r border-warm-gold/10 flex flex-col h-full bg-espresso/40">
                    <div className="p-4 border-b border-warm-gold/10 bg-espresso/50">
                      <span className="text-[9px] font-sans text-warm-gold uppercase tracking-[0.2em] font-bold block mb-1">
                        Active Messaging Vault
                      </span>
                      <h4 className="font-playfair font-bold text-base text-cream-latte">Customer Conversations</h4>
                    </div>

                    <div className="flex-grow overflow-y-auto divide-y divide-warm-gold/5">
                      {chats.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveChatId(c.id)}
                          className={`w-full p-4 flex gap-3 text-left transition-colors cursor-pointer hover:bg-cream-latte/[0.02] ${
                            activeChatId === c.id ? 'bg-cream-latte/[0.04]' : ''
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full ${c.avatarColor} flex items-center justify-center font-playfair font-black text-xs shrink-0 shadow-inner`}>
                            {c.customerName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-grow overflow-hidden relative">
                            <div className="flex justify-between items-center">
                              <h5 className="font-playfair font-bold text-xs text-cream-latte">{c.customerName}</h5>
                              <span className="text-[8px] font-sans text-cream-latte/30">Active</span>
                            </div>
                            <span className="text-[9px] text-warm-gold font-sans font-bold uppercase tracking-wider block mt-0.5">{c.topic}</span>
                            <p className="text-[10px] text-cream-latte/60 truncate mt-1 leading-normal pr-4">{c.lastMessage}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Chat Conversation window */}
                  <div className="md:col-span-8 flex flex-col h-full justify-between bg-espresso/25">
                    {activeChat ? (
                      <>
                        {/* Conversational Partner details */}
                        <div className="p-4 bg-espresso/60 border-b border-warm-gold/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${activeChat.avatarColor} flex items-center justify-center font-playfair font-black text-xs shadow-inner`}>
                              {activeChat.customerName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h5 className="font-playfair font-bold text-sm text-cream-latte">{activeChat.customerName}</h5>
                              <span className="text-[9px] text-warm-gold font-sans font-bold uppercase tracking-wider block mt-0.5">{activeChat.topic}</span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded text-[8px] font-sans tracking-widest font-bold uppercase border ${
                            activeChat.status === 'active' 
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                              : 'bg-cream-latte/5 border-cream-latte/10 text-cream-latte/40'
                          }`}>
                            {activeChat.status}
                          </span>
                        </div>

                        {/* Message list */}
                        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
                          {activeChat.messages.map((m) => {
                            const isAdmin = m.sender === 'admin';
                            return (
                              <div
                                key={m.id}
                                className={`flex flex-col max-w-[75%] ${
                                  isAdmin ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'
                                }`}
                              >
                                <div className={`p-4.5 rounded-2xl text-xs leading-relaxed ${
                                  isAdmin 
                                    ? 'bg-warm-gold text-espresso rounded-tr-none shadow-md font-sans font-bold' 
                                    : 'glassmorphism border border-cream-latte/10 text-cream-latte rounded-tl-none'
                                }`}>
                                  {m.text}
                                </div>
                                <span className="text-[8px] text-cream-latte/30 font-sans mt-1.5">{m.time}</span>
                              </div>
                            );
                          })}
                          <div ref={chatMessagesEndRef} />
                        </div>

                        {/* Interactive Message input form */}
                        <div className="p-4 border-t border-warm-gold/10 bg-espresso/50 flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Type premium response matrices..."
                            value={typedMessage}
                            onChange={(e) => setTypedMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendMessage();
                            }}
                            className="w-full px-4 py-3 bg-espresso border border-cream-latte/10 rounded-xl text-xs font-sans focus:outline-none focus:border-warm-gold/30 text-cream-latte"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="p-3 bg-warm-gold hover:bg-cream-latte text-espresso rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            <Send size={14} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-grow p-12 text-cream-latte/30">
                        <AlertCircle size={36} className="text-cream-latte/10 mb-4" />
                        Select a customer conversation tab on the left to start live chats.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: MULTI-ADMIN ACCESS CONTROL */}
              {activeTab === 'admins' && (
                <div className="flex flex-col gap-6 text-left">
                  
                  {/* Actions Header */}
                  <div className="flex items-center justify-between bg-black/30 border border-cream-latte/5 p-4 rounded-2xl backdrop-blur-md">
                    <div>
                      <h4 className="font-playfair font-bold text-sm text-cream-latte">Active Roasting Admins</h4>
                      <p className="text-[10px] text-cream-latte/45 font-sans mt-0.5">Control operational credentials and lounge permissions.</p>
                    </div>

                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-5 py-2.5 bg-warm-gold text-espresso font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-cream-latte transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <UserPlus size={14} className="stroke-[2.5]" />
                      Invite Admin
                    </button>
                  </div>

                  {/* Admin Grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {admins.map((a) => (
                      <div key={a.id} className="glass-premium-card p-6 border border-warm-gold/15 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[35px] bg-warm-gold/5 -z-10" />
                        
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-sans font-bold tracking-widest uppercase border ${
                              a.status === 'Active' 
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                            }`}>
                              {a.status}
                            </span>
                            <span className="text-[9px] font-sans font-bold text-warm-gold uppercase tracking-widest">{a.role}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-cream-latte/5 border border-cream-latte/15 flex items-center justify-center font-playfair font-black text-sm text-cream-latte">
                              {a.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-playfair font-bold text-sm text-cream-latte">{a.name}</h4>
                                {a.id === 'adm-1' && (
                                  <button 
                                    onClick={async () => {
                                      const newName = prompt('Enter new Super Admin Name:', adminName);
                                      if (newName && newName.trim()) {
                                        const trimmed = newName.trim();
                                        setAdminName(trimmed);
                                        try {
                                          const res = await fetch(`${API_BASE_URL}/api/auth/users/update`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: 'admin@tribalcoffee.in', name: trimmed })
                                          });
                                          if (res.ok && setLoggedInUser) {
                                            const data = await res.json();
                                            setLoggedInUser(data.user);
                                          }
                                        } catch (e) {
                                          console.error('Failed to save admin name in backend:', e);
                                        }
                                      }
                                    }}
                                    className="text-cream-latte/40 hover:text-warm-gold transition-colors cursor-pointer p-0.5 rounded"
                                    title="Edit Super Admin Name"
                                  >
                                    <Edit3 size={10} />
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-cream-latte/50 font-sans mt-0.5">{a.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-warm-gold/10 pt-4 flex justify-between items-center mt-4">
                          <span className="text-[9px] font-sans text-cream-latte/30 uppercase">ID: {a.id}</span>
                          <button
                            onClick={() => handleDeleteAdmin(a.id)}
                            className="text-[10px] font-sans text-red-400 hover:text-red-300 uppercase font-bold cursor-pointer"
                          >
                            Revoke Access
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Connoisseur Registry Panel */}
                  <div className="bg-black/30 border border-warm-gold/15 p-6 rounded-3xl mt-8 backdrop-blur-md">
                    <div className="mb-6">
                      <h4 className="font-playfair font-bold text-sm text-warm-gold">Registered Connoisseur Registry</h4>
                      <p className="text-[10px] text-cream-latte/45 font-sans mt-0.5">Real-time trace of authenticated gourmet coffee consumers.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs">
                        <thead>
                          <tr className="border-b border-warm-gold/10 text-warm-gold/60 text-[9px] uppercase tracking-wider font-bold">
                            <th className="pb-3">Initials</th>
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Email Address</th>
                            <th className="pb-3">Contact Number</th>
                            <th className="pb-3">Physical Address</th>
                            <th className="pb-3">Account ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-warm-gold/5 text-cream-latte/85">
                          {registeredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-cream-latte/30 font-medium italic">
                                No registered connoisseur profiles logged in yet.
                              </td>
                            </tr>
                          ) : (
                            registeredUsers.map((user) => {
                              const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
                              
                              // Format mixed address field (supporting custom JSON objects or pure address strings)
                              let formattedAddress = 'No address recorded';
                              if (user.address) {
                                if (typeof user.address === 'object') {
                                  formattedAddress = `${user.address.doorNo || ''}, ${user.address.area || ''}, ${user.address.city || ''} - ${user.address.pinCode || ''}`.replace(/^,\s*|,\s*$/, '').trim();
                                } else {
                                  formattedAddress = user.address;
                                }
                              }

                              return (
                                <tr key={user.id || user.email} className="hover:bg-cream-latte/[0.02] transition-colors">
                                  <td className="py-4">
                                    <div className="w-8 h-8 rounded-full bg-warm-gold/10 border border-warm-gold/25 text-warm-gold flex items-center justify-center font-playfair font-black text-xs">
                                      {initials}
                                    </div>
                                  </td>
                                  <td className="py-4 font-bold font-playfair">{user.name}</td>
                                  <td className="py-4 font-mono text-cream-latte/65">{user.email}</td>
                                  <td className="py-4 font-mono text-cream-latte/75">{user.phone || <span className="text-cream-latte/30">N/A</span>}</td>
                                  <td className="py-4 text-cream-latte/65 max-w-[250px] truncate" title={formattedAddress}>{formattedAddress}</td>
                                  <td className="py-4 text-cream-latte/40 text-[10px] uppercase font-mono">{user.id || 'N/A'}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. CRUD ADD/EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {isEditingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-3xl glassmorphism rounded-[35px] border border-warm-gold/25 p-8 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-latte/5 text-cream-latte/50 hover:text-warm-gold transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <span className="text-[10px] font-sans tracking-[0.25em] text-warm-gold font-bold uppercase mb-2 block text-left">
                Vault Product Editor
              </span>
              <h3 className="font-playfair font-bold text-2xl text-cream-latte mb-8 text-left">
                {currentEditingProduct ? `Edit Organic Blend: ${currentEditingProduct.name}` : 'Synthesize Rare New Organic Blend'}
              </h3>

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans text-xs">
                
                {/* ID */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Product ID / Key</label>
                  <input
                    type="text"
                    required
                    disabled={!!currentEditingProduct}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30 disabled:opacity-50"
                    placeholder="e.g. cold-brew-reserve"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. Mount Araku Volcanic Dark Roast"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none cursor-pointer"
                  >
                    <option value="beans">Artisanal Whole Beans</option>
                    <option value="powder">Organic Arabica Powder</option>
                    <option value="filter">Traditional Filter Coffee</option>
                    <option value="specialty">24-Hour Cold Brew Concentrate</option>
                  </select>
                </div>

                {/* Tagline */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Tagline</label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. 100% SHADE-GROWN MOUNTAIN LOT"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. 449"
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Original Price (₹ Optional)</label>
                  <input
                    type="number"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. 499"
                  />
                </div>

                {/* Roast details */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Roast Level Profile</label>
                  <input
                    type="text"
                    value={formRoast}
                    onChange={(e) => setFormRoast(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. Dark Wood-Fired Roast"
                  />
                </div>

                {/* Chicory */}
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Chicory Ratio</label>
                  <input
                    type="text"
                    value={formChicory}
                    onChange={(e) => setFormChicory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. 0% Chicory or 40% Chicory"
                  />
                </div>

                {/* Tasting Notes */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Tasting Notes (Comma Separated)</label>
                  <input
                    type="text"
                    value={formTastingNotes}
                    onChange={(e) => setFormTastingNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. Roasted Hazelnut, Milk Chocolate, Vanilla Flower"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Immersive Story Narrative</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30 font-sans text-xs resize-none"
                    placeholder="Describe the elevation, co-op harvesting, and volcanic notes..."
                  />
                </div>

                {/* Sliders for roast levels */}
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="text-[10px] text-cream-latte/60 uppercase mb-1 font-bold">Roast level ({formRoastLevel}/5)</label>
                    <input
                      type="range" min={1} max={5} value={formRoastLevel}
                      onChange={(e) => setFormRoastLevel(Number(e.target.value))}
                      className="w-full accent-warm-gold cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cream-latte/60 uppercase mb-1 font-bold">Strength ({formStrength}/5)</label>
                    <input
                      type="range" min={1} max={5} value={formStrength}
                      onChange={(e) => setFormStrength(Number(e.target.value))}
                      className="w-full accent-warm-gold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Image asset url */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Asset Image Path</label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. /images/Arabica Coffee Beans.webp"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-6 border-t border-warm-gold/10 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-6 py-3 bg-cream-latte/5 hover:bg-cream-latte/10 border border-cream-latte/10 rounded-xl font-sans text-xs tracking-wider uppercase font-bold text-cream-latte transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-warm-gold text-espresso font-sans text-xs tracking-wider uppercase font-bold rounded-xl hover:bg-cream-latte hover:text-espresso transition-all cursor-pointer shadow-[0_4px_20px_rgba(200,169,126,0.3)]"
                  >
                    Save Matrix
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MULTI-ADMIN INVITE MODAL */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-md glassmorphism rounded-[35px] border border-warm-gold/25 p-8 relative text-left"
            >
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-latte/5 text-cream-latte/50 hover:text-warm-gold transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <span className="text-[10px] font-sans tracking-[0.25em] text-warm-gold font-bold uppercase mb-2 block">
                Access Security Vault
              </span>
              <h3 className="font-playfair font-bold text-2xl text-cream-latte mb-6">
                Authorize New Administrator
              </h3>

              <form onSubmit={handleInviteAdmin} className="flex flex-col gap-5 font-sans text-xs">
                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Admin Full Name</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. Saikiran Yerramsetty"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. saikiran@tribalcoffee.in"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Access Privilege Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none cursor-pointer"
                  >
                    <option value="Lounge Manager">Lounge Manager (CRUD Access)</option>
                    <option value="Dispatcher">Dispatcher (Shiprocket Only)</option>
                    <option value="Super Admin">Super Admin (All Privileges)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-warm-gold/10 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-6 py-2.5 bg-cream-latte/5 hover:bg-cream-latte/10 border border-cream-latte/10 rounded-xl font-sans text-xs tracking-wider uppercase font-bold text-cream-latte transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-warm-gold text-espresso font-sans text-xs tracking-wider uppercase font-bold rounded-xl hover:bg-cream-latte hover:text-espresso transition-all cursor-pointer shadow-md"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. GORGEOUS PRINTABLE SHIPROCKET SHIPPING CARGO LABEL MODAL */}
      <AnimatePresence>
        {selectedLabelShipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-lg bg-white text-black rounded-3xl p-8 relative shadow-2xl flex flex-col justify-between"
            >
              <button
                onClick={() => setSelectedLabelShipment(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Printable Area starts */}
              <div className="text-left font-sans text-xs border-2 border-black p-4 rounded-xl relative">
                {/* Header branding */}
                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                  <div>
                    <h2 className="font-bebas text-2xl tracking-[0.05em] leading-none text-black">SHIPROCKET EXPRESS</h2>
                    <span className="text-[8px] font-sans font-bold uppercase tracking-wider block mt-1 text-black/60">Araku Valley Co-op Direct</span>
                  </div>
                  
                  {/* Mock barcode */}
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-28 bg-black flex items-center justify-center text-white text-[8px] tracking-[3px] select-none pointer-events-none">
                      ||||| | ||||| | ||
                    </div>
                    <span className="text-[8px] mt-1 font-mono tracking-widest">{selectedLabelShipment.awb}</span>
                  </div>
                </div>

                {/* Shipping matrices */}
                <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-4">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-black/60 block mb-0.5">SHIP TO:</span>
                    <h4 className="font-sans font-bold text-sm leading-tight">{selectedLabelShipment.customerName}</h4>
                    <p className="text-[10px] leading-relaxed mt-1">
                      Pincode: <span className="font-bold">{selectedLabelShipment.pincode}</span><br />
                      Hub Location: {selectedLabelShipment.city}, India
                    </p>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase text-black/60 block mb-0.5">SHIPPED FROM:</span>
                    <h4 className="font-sans font-bold text-sm leading-tight">Tribal Coffee Warehouse</h4>
                    <p className="text-[10px] leading-relaxed mt-1">
                      Co-op Dispatch Vault, Pincode: 530003<br />
                      Araku Valley Co-operative, Visakhapatnam
                    </p>
                  </div>
                </div>

                {/* Package details */}
                <div className="grid grid-cols-3 gap-2 text-center border-b-2 border-black pb-4 mb-4 font-mono text-[10px] uppercase">
                  <div className="border-r border-black/20">
                    <span className="text-[8px] font-sans font-bold text-black/60 block mb-0.5">WEIGHT</span>
                    <span className="font-bold">0.5 KG</span>
                  </div>
                  <div className="border-r border-black/20">
                    <span className="text-[8px] font-sans font-bold text-black/60 block mb-0.5">AWB CODE</span>
                    <span className="font-bold">{selectedLabelShipment.awb}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-sans font-bold text-black/60 block mb-0.5">COURIER</span>
                    <span className="font-bold">DELHIVERY</span>
                  </div>
                </div>

                {/* QR Code and signatures */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-black/60 block mb-1">ROAST QUALITY SEAL:</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold uppercase">
                      <CheckCircle2 size={12} />
                      100% Wood-Roasted Organic
                    </div>
                  </div>

                  {/* Mock QR Code */}
                  <div className="w-12 h-12 border-2 border-black flex items-center justify-center p-1 bg-white select-none">
                    <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                      {[...Array(16)].map((_, idx) => (
                        <div key={idx} className={`w-full h-full ${Math.random() > 0.45 ? 'bg-black' : 'bg-transparent'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setSelectedLabelShipment(null)}
                  className="w-1/2 py-3 border border-black/25 rounded-xl text-black/80 font-bold hover:bg-black/5 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="w-1/2 py-3 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  Print Cargo Label
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. IMMERSIVE RAPIDO-STYLE LIVE PARCEL DELIVERY TRACKING MODAL */}
      <AnimatePresence>
        {selectedTrackingShipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl"
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
                onClick={() => setSelectedTrackingShipment(null)}
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
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[9px] font-sans tracking-[0.25em] text-emerald-400 font-bold uppercase">
                      Live Telemetry Sourced
                    </span>
                  </div>
                  <span className="bg-[#1C1612] border border-warm-gold/20 text-warm-gold font-sans text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedTrackingShipment.courier || 'DELHIVERY EXPRESS'}
                  </span>
                </div>

                {/* Simulated GPS SVG Map Routing */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <svg className="w-full h-full max-h-[300px]" viewBox="0 0 400 240" fill="none">
                    {/* Topological map contour lines background */}
                    <path d="M -50,60 Q 100,20 200,90 T 450,40" stroke="rgba(214,178,122,0.03)" strokeWidth="1" />
                    <path d="M -50,140 Q 120,80 240,160 T 450,110" stroke="rgba(214,178,122,0.03)" strokeWidth="1" />

                    {/* Dotted Connection Route Path */}
                    <path
                      id="liveRoute"
                      d="M 60,160 C 140,130 200,70 320,80"
                      stroke="rgba(214,178,122,0.15)"
                      strokeWidth="2.5"
                      strokeDasharray="4,4"
                    />

                    {/* Active Pulsing Glowing route coverage line */}
                    <path
                      d="M 60,160 C 140,130 200,70 320,80"
                      stroke="url(#mapGrad)"
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

                    {/* Custom Map Gradients */}
                    <defs>
                      <linearGradient id="mapGrad" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4A2B1D" />
                        <stop offset="60%" stopColor="#D6B27A" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>

                    {/* Source: Araku Valley marker */}
                    <g transform="translate(60, 160)">
                      <circle r="14" fill="rgba(74,43,29,0.25)" className="animate-pulse" />
                      <circle r="7" fill="#4A2B1D" stroke="#D6B27A" strokeWidth="1.5" />
                      <text y="-18" className="text-[8px] font-sans font-black tracking-widest text-cream-latte/50 uppercase text-center" textAnchor="middle">
                        ARAKU CO-OP
                      </text>
                    </g>

                    {/* Destination Hub marker */}
                    <g transform="translate(320, 80)">
                      <circle r="16" fill="rgba(214,178,122,0.15)" className="animate-pulse-slow" />
                      <circle r="8" fill="#D6B27A" stroke="#120D0A" strokeWidth="2" />
                      {/* Pulse ring */}
                      <circle r="12" fill="none" stroke="#D6B27A" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
                      <text y="-18" className="text-[8px] font-sans font-black tracking-widest text-warm-gold uppercase text-center animate-bounce" textAnchor="middle">
                        {selectedTrackingShipment.city}
                      </text>
                    </g>

                    {/* RAPIDO VEHICLE POSITION - Custom animated bike rider trace along path */}
                    <g className="animate-ride">
                      <path d="M 0,0 L 4,4 L -4,4 Z" fill="none" />
                      {/* Floating glowing vehicle dot */}
                      <circle r="9" fill="rgba(16,185,129,0.3)" />
                      <circle r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" className="animate-pulse" />
                    </g>

                    <style>{`
                      @keyframes dash {
                        to {
                          stroke-dashoffset: -600;
                        }
                      }
                      .animate-ride {
                        animation: rideEffect 15s ease-in-out infinite alternate;
                      }
                      @keyframes rideEffect {
                        0% { transform: translate(60px, 160px); }
                        25% { transform: translate(110px, 142px); }
                        50% { transform: translate(175px, 108px); }
                        75% { transform: translate(245px, 76px); }
                        100% { transform: translate(320px, 80px); }
                      }
                    `}</style>
                  </svg>
                </div>

                {/* Map Footer status */}
                <div className="p-6 bg-black/40 border-t border-warm-gold/10 relative z-10 flex justify-between items-center text-left">
                  <div>
                    <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase font-bold block">Current Coordinates</span>
                    <span className="text-[10px] font-mono text-cream-latte/75 font-semibold block mt-0.5">18.0461° N, 79.0125° E (En Route)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase font-bold block">Delhivery speed</span>
                    <span className="text-sm font-bebas text-emerald-400 tracking-wider font-bold block mt-0.5 animate-pulse">42 KM/H</span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: LOGISTICS DETAILS AND REAL-TIME MILESTONES */}
              <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between text-left">
                
                {/* Rider Details Profile */}
                <div>
                  <span className="text-[8px] font-sans tracking-[0.3em] text-warm-gold font-bold uppercase mb-2 block">
                    Delhivery Express Partner
                  </span>
                  <div className="flex items-center justify-between p-4 bg-espresso/50 border border-warm-gold/15 rounded-2xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full filter blur-[25px] bg-warm-gold/5 -z-10" />
                    
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
                  </div>

                  {/* Parcel Metadata details */}
                  <div className="grid grid-cols-2 gap-4 bg-espresso/25 border border-warm-gold/10 p-4 rounded-2xl mb-6 text-xs">
                    <div>
                      <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase block font-bold">Consignment ID</span>
                      <span className="font-semibold text-cream-latte mt-1 block">{selectedTrackingShipment.id}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase block font-bold">AWB Reference</span>
                      <span className="font-semibold text-warm-gold mt-1 block tracking-wider font-mono uppercase">{selectedTrackingShipment.awb}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-warm-gold/5">
                      <span className="text-[8px] font-sans text-cream-latte/45 tracking-widest uppercase block font-bold">Sourced Blends</span>
                      <span className="font-semibold text-cream-latte mt-1 block text-[11px] truncate leading-normal">{selectedTrackingShipment.productName}</span>
                    </div>
                  </div>

                  {/* Real-time Logistics Milestones Tracker */}
                  <h5 className="text-[9px] font-sans tracking-[0.25em] text-warm-gold font-bold uppercase mb-4">
                    Logistical Progress Track
                  </h5>

                  <div className="relative pl-6 space-y-5">
                    {/* Vertical connector line */}
                    <div className="absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-warm-gold/20" />
                    <div className="absolute left-[7px] top-[8px] h-[72px] w-[1.5px] bg-emerald-500" />

                    {/* Milestone 1 */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={10} className="stroke-[2.5]" />
                      </div>
                      <div className="text-xs">
                        <h6 className="font-bold text-cream-latte flex items-center gap-2">
                          Roasting & Custom Packaging
                          <span className="text-[8px] bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-sans px-1.5 py-0.5 rounded font-bold">DONE</span>
                        </h6>
                        <p className="text-[10px] text-cream-latte/50 mt-0.5">Wood-fired micro-lot roasting complete in Araku Valley.</p>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={10} className="stroke-[2.5]" />
                      </div>
                      <div className="text-xs">
                        <h6 className="font-bold text-cream-latte flex items-center gap-2">
                          Picked up by Delhivery Courier
                          <span className="text-[8px] bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-sans px-1.5 py-0.5 rounded font-bold">DONE</span>
                        </h6>
                        <p className="text-[10px] text-cream-latte/50 mt-0.5">Cargo loaded at Visakhapatnam Dispatch Vaults.</p>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-[#201610] border border-warm-gold/40 flex items-center justify-center text-warm-gold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      </div>
                      <div className="text-xs">
                        <h6 className="font-bold text-warm-gold flex items-center gap-2">
                          In Transit - On the Way
                          <span className="text-[8px] bg-[#2C1F15] border border-warm-gold/20 text-warm-gold font-sans px-1.5 py-0.5 rounded font-bold animate-pulse">ACTIVE</span>
                        </h6>
                        <p className="text-[10px] text-cream-latte/50 mt-0.5">En route to regional sorting hub. Transit tracking active.</p>
                      </div>
                    </div>

                    {/* Milestone 4 */}
                    <div className="relative opacity-40">
                      <div className="absolute -left-[23px] top-[1.5px] w-4 h-4 rounded-full bg-[#1A130E] border border-cream-latte/15 flex items-center justify-center text-cream-latte/30">
                        <circle r="2" />
                      </div>
                      <div className="text-xs">
                        <h6 className="font-bold text-cream-latte">Out for Delivery</h6>
                        <p className="text-[10px] text-cream-latte/50 mt-0.5">Awaiting local sorting arrival.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer close option */}
                <div className="mt-8 border-t border-warm-gold/15 pt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedTrackingShipment(null)}
                    className="px-8 py-3.5 bg-warm-gold text-espresso font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-cream-latte hover:text-espresso transition-all cursor-pointer shadow-[0_4px_20px_rgba(200,169,126,0.3)] w-full text-center"
                  >
                    Acknowledge Live Telemetry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
