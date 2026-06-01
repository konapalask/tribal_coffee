import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Trash2, Edit3, X, ChevronRight,
  TrendingUp, Layers, Send, Truck, FileText, PlusCircle, LogOut,
  Users, CheckCircle2, UserPlus, Search, AlertCircle,
  HelpCircle, Shield, RefreshCw, Database, ShieldAlert, Sliders
} from 'lucide-react';
import {
  TRIBAL_PRODUCTS, addProduct, updateProduct, deleteProduct,
  resetDB, type RealProduct, API_BASE_URL
} from '../services/db';
import * as XLSX from 'xlsx';

// Interfaces for mock structures
interface ShipmentOrder {
  id: string;
  customerName: string;
  email: string;
  city: string;
  pincode: string;
  productName: string;
  amount: number;
  status: string;
  awb?: string;
  courier?: string;
  date?: string;
  phone?: string;
  fullAddress?: any;
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
}

interface AdminDashboardProps {
  onClose: () => void;
  loggedInUser: any;
  setLoggedInUser: (user: any) => void;
  onViewInvoice: (order: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, loggedInUser, setLoggedInUser, onViewInvoice }) => {
  // Security Portal states
  const [isAuthenticated, setIsAuthenticated] = useState(loggedInUser && (loggedInUser.role === 'Super Admin' || loggedInUser.role === 'Lounge Manager' || loggedInUser.role === 'Dispatcher' || loggedInUser.email?.toLowerCase() === 'admin@tribalcoffee.com'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [adminName, setAdminName] = useState(loggedInUser?.name || 'tribalcoffee');
  // General navigation
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'customers' | 'shiprocket' | 'deliveryPartners' | 'chat' | 'admins' | 'audit'>(loggedInUser?.role === 'Dispatcher' ? 'shiprocket' : 'analytics');

  useEffect(() => {
    if (loggedInUser) {
      if (loggedInUser.role === 'Dispatcher') {
        setActiveTab('shiprocket');
      }
      if (loggedInUser.name) {
        setAdminName(loggedInUser.name);
      }
    }
  }, [loggedInUser]);

  // Sidebar collapsible state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('admin_sidebar_collapsed') === 'true');

  // Slide-out customer details drawer state
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Customer registry pagination and filtering
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [customerPage, setCustomerPage] = useState(1);
  const customersPerPage = 7;

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
  const [formPrice750g, setFormPrice750g] = useState(749);
  const [formSize1Name, setFormSize1Name] = useState('350g');
  const [formSize2Name, setFormSize2Name] = useState('750g');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formTastingNotes, setFormTastingNotes] = useState('');
  const [formImage, setFormImage] = useState('/images/Arabica Coffee Beans.webp');
  const [formDescription, setFormDescription] = useState('');
  const [formAromaDescription, setFormAromaDescription] = useState('');
  const [formBgGradient, setFormBgGradient] = useState('radial-gradient(circle at 50% 40%, rgba(43, 24, 16, 0.45) 0%, rgba(17, 17, 17, 1) 70%)');
  const [formGlowColor, setFormGlowColor] = useState('rgba(74, 44, 29, 0.45)');

  // Shiprocket states
  const [shipments, setShipments] = useState<ShipmentOrder[]>([]);
  const [calcSource, setCalcSource] = useState('530003'); // Visakhapatnam Araku dispatch hub
  const [calcDest, setCalcDest] = useState('560001'); // Bengaluru central hub
  const [calcWeight, setCalcWeight] = useState('0.5'); // kg
  const [shippingRates, setShippingRates] = useState<any[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedLabelShipment, setSelectedLabelShipment] = useState<ShipmentOrder | null>(null);

  // Delivery Providers State
  const [deliveryProviders, setDeliveryProviders] = useState<any[]>([]);
  const [isProvidersLoading, setIsProvidersLoading] = useState(false);
  const [providerSaveStatus, setProviderSaveStatus] = useState<string | null>(null);
  
  // Custom Provider Modal State
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
  const [formNewProvider, setFormNewProvider] = useState({
    name: '', id: '', api_base_url: '', api_key: '', secret_key: '',
    tracking_endpoint: '', shipment_endpoint: '', webhook_url: '', logo_url: ''
  });

  // Date and Monthly filtering states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [orderSubTab, setOrderSubTab] = useState<'new_requests' | 'pending_delivery' | 'out_for_delivery' | 'history'>('new_requests');
  const [selectedTrackingShipment, setSelectedTrackingShipment] = useState<ShipmentOrder | null>(null);

  const parseBookingDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const dashParts = dateStr.split('-');
    if (dashParts.length === 3) {
      const year = parseInt(dashParts[0], 10);
      const month = parseInt(dashParts[1], 10) - 1;
      const day = parseInt(dashParts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  const filteredShipments = shipments.filter(s => {
    if (loggedInUser?.role === 'Dispatcher' && (s.status === 'Pending' || s.status === 'Declined')) {
      return false;
    }
    // 1. Month Filter (YYYY-MM)
    if (filterMonth !== 'all' && s.date) {
      const dateObj = parseBookingDate(s.date);
      if (dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const formattedMonth = `${year}-${month}`;
        if (formattedMonth !== filterMonth) return false;
      } else {
        return false;
      }
    }

    // 2. Custom Date Range Filters
    if (s.date) {
      const dateObj = parseBookingDate(s.date);
      if (dateObj) {
        if (filterStartDate) {
          const start = new Date(filterStartDate);
          start.setHours(0, 0, 0, 0);
          if (dateObj < start) return false;
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          if (dateObj > end) return false;
        }
      }
    }

    return true;
  });

  useEffect(() => {
    if (activeTab === 'deliveryPartners') {
      setIsProvidersLoading(true);
      fetch(`${API_BASE_URL}/api/delivery-providers`)
        .then(res => res.json())
        .then(data => {
          setDeliveryProviders(data);
          setIsProvidersLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsProvidersLoading(false);
        });
    }
  }, [activeTab]);
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
  const [invitePassword, setInvitePassword] = useState('');
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

  // --- Dynamic Customer Growth & Product Progression Redesign Mappings ---
  const customerGrowthData = React.useMemo(() => {
    const monthlyCounts = Array(6).fill(0); // Jan to Jun
    registeredUsers.forEach(u => {
      if (u.dateAdded) {
        const parts = u.dateAdded.split('/');
        let month = -1;
        if (parts.length >= 2) {
          month = parseInt(parts[1], 10) - 1;
        } else {
          const dashParts = u.dateAdded.split('-');
          if (dashParts.length >= 2) {
            month = parseInt(dashParts[1], 10) - 1;
          }
        }
        if (month >= 0 && month < 6) {
          monthlyCounts[month] += 1;
        }
      }
    });

    const cumulative = [];
    let runningSum = 0;
    for (let i = 0; i < 6; i++) {
      runningSum += monthlyCounts[i];
      cumulative.push(runningSum);
    }
    return cumulative;
  }, [registeredUsers]);

  const topProductsList = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    shipments.forEach(s => {
      if (s.productName) {
        const items = s.productName.split(',');
        items.forEach(item => {
          const cleanItem = item.trim();
          const qtyMatch = cleanItem.match(/x(\d+)/) || cleanItem.match(/\((\d+)\)/);
          let qty = 1;
          if (qtyMatch) {
            qty = parseInt(qtyMatch[1], 10);
          }
          const name = cleanItem.replace(/\(x\d+\)/, '').replace(/\(x\s*\d+\)/, '').replace(/x\d+/, '').replace(/\(\d+\)/, '').trim();
          if (name) {
            counts[name] = (counts[name] || 0) + qty;
          }
        });
      }
    });

    const list = Object.entries(counts).map(([name, qty]) => ({
      name,
      quantity: qty
    })).sort((a, b) => b.quantity - a.quantity);

    return list.slice(0, 4);
  }, [shipments]);

  const getGrowthSplinePaths = () => {
    const maxVal = Math.max(...customerGrowthData, 10);
    const points = customerGrowthData.map((val, idx) => {
      const x = idx * 120;
      const y = 220 - ((val / maxVal) * 180);
      return { x, y };
    });
    
    let path = '';
    if (points.length > 0) {
      path = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const cpX1 = points[i].x + 40;
        const cpY1 = points[i].y;
        const cpX2 = points[i + 1].x - 40;
        const cpY2 = points[i + 1].y;
        path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${points[i + 1].x},${points[i + 1].y}`;
      }
    }
    const areaPath = `${path} L 600,240 L 0,240 Z`;
    return { growthLinePath: path, growthAreaPath: areaPath };
  };

  const { growthLinePath, growthAreaPath } = getGrowthSplinePaths();

  // Synchronize Super Admin name in admins list and load luxurious fonts
  useEffect(() => {
    setAdmins(prev => prev.map(a => a.email.toLowerCase() === 'admin@tribalcoffee.in' ? { ...a, name: adminName } : a));
    
    // Inject luxurious Google Fonts families Playfair Display & Inter
    const playfairLink = document.createElement('link');
    playfairLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';
    playfairLink.rel = 'stylesheet';
    document.head.appendChild(playfairLink);
    
    return () => {
      document.head.removeChild(playfairLink);
    };
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
            date: b.date,
            phone: b.phone,
            fullAddress: b.fullAddress
          })).reverse(); // Reverse to show newest data at the top
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
          setLoggedInUser(data.user);
        }
      } else {
        setAuthError(data.message || 'Authentication rejected. Access denied.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Hardcoded fallback for offline/development mode
      if (email === 'admin@tribalcoffee.com' && password === 'password123') {
        setIsAuthenticated(true);
        if (setLoggedInUser) {
          setLoggedInUser({ name: 'tribalcoffee', email: email, role: 'Super Admin' });
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
    setFormPrice(499);
    setFormPrice750g(899);
    setFormSize1Name('350g');
    setFormSize2Name('750g');
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
    setFormPrice750g(product.price750g || Math.round(product.price * 1.8));
    setFormSize1Name(product.size1Name || '350g');
    setFormSize2Name(product.size2Name || '750g');
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
      price750g: Number(formPrice750g),
      size1Name: formSize1Name || '350g',
      size2Name: formSize2Name || '750g',
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

  const handleOutForDeliveryShipment = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/out-for-delivery`, {
        method: 'PUT'
      });
      if (res.ok) {
        setShipments(prev => prev.map(s => {
          if (s.id === id) {
            return {
              ...s,
              status: 'Out for Delivery'
            };
          }
          return s;
        }));
      } else {
        alert('Failed to mark out for delivery. Please ensure the backend server was restarted to pick up the new code changes.');
      }
    } catch (e) {
      console.error('Failed to mark out for delivery in backend:', e);
    }
  };

  const handleDeclineShipment = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/decline`, {
        method: 'PUT'
      });
      if (res.ok) {
        setShipments(prev => prev.map(s => {
          if (s.id === id) {
            return {
              ...s,
              status: 'Declined'
            };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error('Failed to decline shipment in backend:', e);
    }
  };

  const handleAcceptShipment = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/accept`, {
        method: 'PUT'
      });
      if (res.ok) {
        setShipments(prev => prev.map(s => {
          if (s.id === id) {
            return {
              ...s,
              status: 'Ready to Ship'
            };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error('Failed to accept shipment in backend:', e);
    }
  };

  // Delivery Providers Handlers
  const handleUpdateProvider = (id: string, field: string, value: any) => {
    setDeliveryProviders(prev => prev.map(p => {
      if (p.id === id) {
        if (field === 'is_default' && value === true) {
          return { ...p, is_default: true, is_enabled: true };
        }
        return { ...p, [field]: value };
      } else {
        if (field === 'is_default' && value === true) {
          return { ...p, is_default: false };
        }
        return p;
      }
    }));
  };

  const handleSaveProviders = () => {
    setProviderSaveStatus('Saving...');
    fetch(`${API_BASE_URL}/api/delivery-providers/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryProviders)
    })
      .then(res => res.json())
      .then(() => {
        setProviderSaveStatus('Saved Successfully ✓');
        setTimeout(() => setProviderSaveStatus(null), 3000);
      })
      .catch(err => {
        console.error(err);
        setProviderSaveStatus('Save Failed ✗');
        setTimeout(() => setProviderSaveStatus(null), 3000);
      });
  };

  const handleTestProvider = (id: string) => {
    fetch(`${API_BASE_URL}/api/delivery-providers/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then(res => res.json())
      .then(data => alert(data.message))
      .catch(err => {
        console.error(err);
        alert('API Test connection error.');
      });
  };

  const handleAddCustomProvider = () => {
    if (!formNewProvider.name || !formNewProvider.api_base_url) {
      alert("Name and API Base URL are required.");
      return;
    }
    
    // Auto-generate ID if not provided
    const newId = formNewProvider.id || formNewProvider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const newProviderObj = {
      ...formNewProvider,
      id: newId,
      is_custom: true,
      is_enabled: false,
      is_default: false
    };

    setDeliveryProviders(prev => [...prev, newProviderObj]);
    setIsAddProviderModalOpen(false);
    setFormNewProvider({
      name: '', id: '', api_base_url: '', api_key: '', secret_key: '',
      tracking_endpoint: '', shipment_endpoint: '', webhook_url: '', logo_url: ''
    });
  };

  const handleDeleteProvider = (id: string) => {
    if (confirm("Are you sure you want to delete this custom provider?")) {
      setDeliveryProviders(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleExportToExcel = () => {
    const activeShipments = filteredShipments.filter(s => 
      orderSubTab === 'new_requests'
        ? (s.status === 'Pending' || s.status === 'Ready to Ship')
        : (s.status === 'Dispatched' || s.status === 'Delivered')
    );

    if (activeShipments.length === 0) {
      alert("No data to export for the selected filters.");
      return;
    }

    const exportData = activeShipments.map(s => ({
      'Order ID': s.id,
      'Date': s.date || 'N/A',
      'Customer Name': s.customerName,
      'Email': s.email,
      'City': s.city,
      'Pincode': s.pincode,
      'Product(s)': s.productName,
      'Amount (₹)': s.amount,
      'Status': s.status,
      'AWB / Logistics': s.awb ? `${s.awb} (${s.courier})` : 'Not Dispatched'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    let fileName = 'Tribal_Coffee_Orders_Report';
    if (filterMonth !== 'all') {
      fileName += `_${filterMonth}`;
    } else if (filterStartDate && filterEndDate) {
      fileName += `_${filterStartDate}_to_${filterEndDate}`;
    } else {
      fileName += `_All_Time`;
    }
    fileName += '.xlsx';

    XLSX.writeFile(workbook, fileName);
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
          password: invitePassword || 'password123', // Uses provided password or falls back to default
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
        setInvitePassword('');
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

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('admin_sidebar_collapsed', String(newState));
  };

  const handleUpdateUserStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
      }
    } catch (e) {
      console.error('Failed to update user status:', e);
    }
  };

  const filteredCustomers = React.useMemo(() => {
    return registeredUsers.filter(u => {
      const nameMatch = (u.name || '').toLowerCase().includes(customerSearchQuery.toLowerCase());
      const emailMatch = (u.email || '').toLowerCase().includes(customerSearchQuery.toLowerCase());
      const phoneMatch = (u.phone || '').toLowerCase().includes(customerSearchQuery.toLowerCase());
      
      const matchesSearch = nameMatch || emailMatch || phoneMatch;

      let matchesStatus = true;
      if (customerStatusFilter === 'verified') {
        matchesStatus = u.status === 'Verified Customer';
      } else if (customerStatusFilter === 'unverified') {
        matchesStatus = u.status !== 'Verified Customer';
      }

      return matchesSearch && matchesStatus;
    });
  }, [registeredUsers, customerSearchQuery, customerStatusFilter]);

  const paginatedCustomers = React.useMemo(() => {
    const startIndex = (customerPage - 1) * customersPerPage;
    return filteredCustomers.slice(startIndex, startIndex + customersPerPage);
  }, [filteredCustomers, customerPage]);

  const totalCustomerPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Reset page on filter changes
  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearchQuery, customerStatusFilter]);

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
        <div className="w-full flex h-screen overflow-hidden bg-[#050505] text-white relative font-sans">
          
          {/* Ambient lighting effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full filter blur-[150px] bg-[#D4AF37]/5 pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full filter blur-[180px] bg-[#D4AF37]/3 pointer-events-none" />
          <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full filter blur-[130px] bg-[#F4E2B8]/2 pointer-events-none" />

          {/* 1. COLLAPSIBLE SIDEBAR */}
          <aside 
            className={`shrink-0 border-r border-[#D4AF37]/15 bg-[#0D0D0D] flex flex-col justify-between h-full sticky top-0 transition-all duration-300 z-30 ${
              isSidebarCollapsed ? 'w-20' : 'w-80'
            }`}
          >
            {/* Sidebar Top: Brand */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className={`p-6 border-b border-[#D4AF37]/15 flex items-center justify-between ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37]">
                      <Shield size={20} className="stroke-[1.5]" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Tribal Coffee
                      </span>
                      <span className="text-xs font-playfair font-bold text-white block -mt-0.5">
                        Lounge Admin
                      </span>
                    </div>
                  </div>
                )}
                {isSidebarCollapsed && (
                  <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37]" title="Tribal Lounge Vault">
                    <Shield size={20} className="stroke-[1.5]" />
                  </div>
                )}
              </div>

              {/* Sidebar Middle: Admin details */}
              <div className="p-4 border-b border-[#D4AF37]/10">
                <div className={`flex items-center gap-3 p-2 bg-[#050505]/60 border border-[#D4AF37]/10 rounded-2xl group relative ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4E2B8] text-[#050505] flex items-center justify-center font-playfair font-black text-sm shadow-[0_0_10px_rgba(212,175,55,0.4)] shrink-0 uppercase">
                    {adminName ? adminName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'TC'}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-grow min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-playfair font-bold text-xs truncate text-white" title={adminName}>{adminName}</h4>
                        <button 
                          onClick={async () => {
                            const newName = prompt('Enter new Admin Name (leave blank to keep current):', adminName);
                            if (newName === null) return;
                            
                            const newPassword = prompt('Enter a new password (leave blank to keep current):');
                            if (newPassword === null) return;

                            const trimmedName = newName.trim() || adminName;
                            setAdminName(trimmedName);
                            
                            const updatePayload: any = { 
                              email: loggedInUser?.email || 'admin@tribalcoffee.com', 
                              name: trimmedName 
                            };
                            
                            if (newPassword && newPassword.trim()) {
                              updatePayload.password = newPassword.trim();
                            }
                            
                            try {
                              const res = await fetch(`${API_BASE_URL}/api/auth/users/update`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatePayload)
                              });
                              if (res.ok && setLoggedInUser) {
                                const data = await res.json();
                                setLoggedInUser(data.user);
                                if (updatePayload.password) {
                                  alert('Profile and password successfully updated in users.json!');
                                }
                              }
                            } catch (e) {
                              console.error('Failed to save admin profile:', e);
                            }
                          }}
                          className="text-gray-400 hover:text-[#D4AF37] transition-colors p-0.5 rounded cursor-pointer shrink-0"
                          title="Edit Admin Name"
                        >
                          <Edit3 size={10} />
                        </button>
                      </div>
                      <p className="text-[9px] text-[#D4AF37] font-sans font-bold uppercase tracking-widest mt-0.5">{loggedInUser?.role || 'Authenticating...'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Menu options */}
              <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
                {loggedInUser?.role === 'Super Admin' && (
                  <>
                    {/* 1. Overview */}
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'analytics'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Overview & Analytics"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Overview</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronRight size={14} className={activeTab === 'analytics' ? 'text-[#050505]' : 'text-gray-500'} />}
                </button>
                  </>
                )}

                {['Super Admin', 'Lounge Manager'].includes(loggedInUser?.role) && (
                  <>

                {/* 2. Product Database */}
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'products'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Product Database"
                >
                  <div className="flex items-center gap-3">
                    <Layers size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Products</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-sans font-bold ${
                      activeTab === 'products' ? 'bg-[#050505]/20 text-[#050505]' : 'bg-white/10 text-white'
                    }`}>
                      {productsList.length}
                    </span>
                  )}
                </button>

                {/* 3. Connoisseurs */}
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'customers'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Registered Connoisseurs"
                >
                  <div className="flex items-center gap-3">
                    <Users size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Connoisseurs</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-sans font-bold ${
                      activeTab === 'customers' ? 'bg-[#050505]/20 text-[#050505]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    }`}>
                      {registeredUsers.length}
                    </span>
                  )}
                </button>

                  </>
                )}

                {/* 4. Shiprocket */}
                <button
                  onClick={() => setActiveTab('shiprocket')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'shiprocket'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Shiprocket Logistics"
                >
                  <div className="flex items-center gap-3">
                    <Truck size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Logistics</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-sans font-bold uppercase tracking-wider ${
                      activeTab === 'shiprocket' ? 'bg-[#050505]/20 text-[#050505]' : 'bg-[#D4AF37]/15 text-[#D4AF37]'
                    }`}>
                      Syncing
                    </span>
                  )}
                </button>

                {['Super Admin', 'Lounge Manager'].includes(loggedInUser?.role) && (
                  <>
                    {/* 4.5. Delivery Partners */}
                <button
                  onClick={() => setActiveTab('deliveryPartners')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'deliveryPartners'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Delivery Partners API"
                >
                  <div className="flex items-center gap-3">
                    <Sliders size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Providers</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronRight size={14} className={activeTab === 'deliveryPartners' ? 'text-[#050505]' : 'text-gray-500'} />}
                </button>
                  </>
                )}

                {loggedInUser?.role === 'Super Admin' && (
                  <>


                {/* 6. Multi-Admin */}
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'admins'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Multi-Admin Control"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Admin Hub</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronRight size={14} className={activeTab === 'admins' ? 'text-[#050505]' : 'text-gray-500'} />}
                </button>

                {/* 7. Data Restoration Audit */}
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`w-full p-3.5 rounded-2xl flex items-center transition-all duration-300 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    activeTab === 'audit'
                      ? 'bg-[#D4AF37] text-[#050505] font-bold shadow-[0_4px_16px_rgba(212,175,55,0.2)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Data Integrity Audit"
                >
                  <div className="flex items-center gap-3">
                    <Database size={16} />
                    {!isSidebarCollapsed && <span className="font-sans text-xs tracking-wider uppercase font-bold">Data Audit</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronRight size={14} className={activeTab === 'audit' ? 'text-[#050505]' : 'text-gray-500'} />}
                </button>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Bottom: Toggle & Lock */}
            <div className="p-4 border-t border-[#D4AF37]/15 flex flex-col gap-2">
              {/* Collapse button */}
              <button
                onClick={toggleSidebar}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-sans text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
              >
                {isSidebarCollapsed ? <ChevronRight size={16} /> : <span className="uppercase text-[9px] tracking-widest font-bold">Collapse Sidebar</span>}
              </button>

              {/* Lock Vault */}
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  if (setLoggedInUser) {
                    setLoggedInUser(null);
                  }
                }}
                className={`w-full p-3 rounded-xl transition-all cursor-pointer bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-300 font-sans text-xs flex items-center gap-2 ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-start'
                }`}
                title="Lock Vault"
              >
                <LogOut size={14} />
                {!isSidebarCollapsed && <span className="font-bold uppercase tracking-wider text-[9px]">Lock Vault</span>}
              </button>
            </div>
          </aside>

          {/* 2. MAIN LAYOUT AREA */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#050505] relative z-10">
            
            {/* TOP NAVIGATION HEADER */}
            <header className="h-20 shrink-0 border-b border-[#D4AF37]/15 bg-[#0D0D0D]/75 backdrop-blur-md flex items-center justify-between px-8 z-20">
              
              {/* Search component */}
              <div className="flex items-center gap-4 text-left flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search transactions, customers, or products..."
                    value={activeTab === 'products' ? searchQuery : customerSearchQuery}
                    onChange={(e) => {
                      if (activeTab === 'products') {
                        setSearchQuery(e.target.value);
                      } else {
                        setCustomerSearchQuery(e.target.value);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-[#D4AF37]/15 rounded-xl font-sans text-xs focus:outline-none focus:border-[#D4AF37] text-white placeholder-gray-500 transition-colors"
                  />
                </div>
              </div>

              {/* Right tools: Notifications & dropdown info */}
              <div className="flex items-center gap-6">
                
                {/* Reset Defaults button */}
                <button
                  onClick={() => {
                    if (confirm('Sync all storage matrices back to factory values?')) {
                      resetDB();
                      setProductsList([...TRIBAL_PRODUCTS]);
                    }
                  }}
                  className="px-4.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-sans text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer text-gray-300 hover:text-white"
                  title="Reset local storage values to defaults"
                >
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline font-bold uppercase tracking-wider text-[9px]">Reset Defaults</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative group cursor-pointer" title="System Alerts">
                  <div className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-[#D4AF37] transition-all">
                    <Shield size={16} className="stroke-[1.5]" />
                  </div>
                  {/* Glowing gold badge */}
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D4AF37] rounded-full border border-[#0D0D0D] animate-pulse shadow-[0_0_8px_#D4AF37]" />
                </div>

                {/* Profile menu dropdown preview */}
                <div className="flex items-center gap-3 border-l border-white/10 pl-6 text-left">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#F4E2B8]/10 border border-[#D4AF37]/30 flex items-center justify-center font-playfair font-black text-xs text-[#D4AF37]">
                    {adminName ? adminName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'TC'}
                  </div>
                  <div className="hidden md:block">
                    <span className="font-playfair font-bold text-xs text-white block leading-tight">{adminName}</span>
                    <span className="text-[8px] text-[#D4AF37] font-sans font-bold uppercase tracking-widest block mt-0.5">{loggedInUser?.role || 'Super Admin'}</span>
                  </div>
                </div>

              </div>
            </header>

            {/* MAIN MAIN VIEWPORT VIEW */}
            <main className="flex-grow overflow-y-auto p-6 md:p-8 relative">
              
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="flex flex-col gap-8 text-left max-w-7xl mx-auto pb-12">
                  
                  {/* Header title */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/15">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Tribal Coffee Lounge Portal
                      </span>
                      <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white mt-1">
                        Overview & Analytics Matrix
                      </h1>
                    </div>
                    <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-sans px-3 py-1 rounded-full uppercase tracking-wider font-bold shrink-0 self-start md:self-auto">
                      Connected Live
                    </span>
                  </div>

                  {/* 5 Statistics cards styled like Stripe / Shopify */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    
                    {/* Stat 1: Gross Revenue */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[130px]">
                      <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full filter blur-[25px] bg-[#D4AF37]/5 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center text-gray-500 font-sans text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span>Gross Revenue</span>
                          <TrendingUp size={12} className="text-[#D4AF37]" />
                        </div>
                        <h3 className="font-sans text-2xl font-semibold text-white tracking-tight">
                          ₹{totalRevenue.toLocaleString('en-IN')}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-3">
                        <span className="font-normal">{totalOrders > 0 ? `${totalOrders} bookings total` : 'No bookings yet'}</span>
                      </div>
                    </div>

                    {/* Stat 2: Volume Sales */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[130px]">
                      <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full filter blur-[25px] bg-[#D4AF37]/5 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center text-gray-500 font-sans text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span>Volume Sales</span>
                          <Layers size={12} className="text-gray-400" />
                        </div>
                        <h3 className="font-sans text-2xl font-semibold text-white tracking-tight">
                          {totalOrders} Bookings
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-3">
                        <span className="font-normal">{activeShipmentsCount} pending dispatch</span>
                      </div>
                    </div>

                    {/* Stat 3: Average Order Value */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[130px]">
                      <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full filter blur-[25px] bg-[#D4AF37]/5 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center text-gray-500 font-sans text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span>Average Order</span>
                          <TrendingUp size={12} className="text-[#D4AF37]" />
                        </div>
                        <h3 className="font-sans text-2xl font-semibold text-white tracking-tight">
                          {totalOrders > 0 ? `₹${Math.round(averageOrderValue)}` : '—'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-3">
                        <span className="font-normal">{totalOrders > 0 ? 'per booking avg' : 'No orders yet'}</span>
                      </div>
                    </div>

                    {/* Stat 4: Verified Connoisseurs */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[130px]">
                      <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full filter blur-[25px] bg-[#D4AF37]/5 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center text-gray-500 font-sans text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span>Connoisseurs</span>
                          <Users size={12} className="text-gray-400" />
                        </div>
                        <h3 className="font-sans text-2xl font-semibold text-white tracking-tight">
                          {registeredUsers.filter(u => u.status === 'Verified Customer').length} Verified
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-3">
                        <span className="font-bold text-gray-400">{registeredUsers.length} total</span>
                        <span>registrations logged</span>
                      </div>
                    </div>

                    {/* Stat 5: Active Shipments */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[130px]">
                      <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full filter blur-[25px] bg-emerald-500/5 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center text-gray-500 font-sans text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span>Active Shipments</span>
                          <Truck size={12} className="text-emerald-400 animate-pulse" />
                        </div>
                        <h3 className="font-sans text-2xl font-semibold text-white tracking-tight">
                          {activeShipmentsCount} Pending
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-3">
                        <span className="bg-emerald-950/45 px-1.5 py-0.5 rounded font-bold">Live sync</span>
                        <span className="text-gray-500 font-normal">awaiting AWB</span>
                      </div>
                    </div>

                  </div>

                  {/* 2X2 GRID OF 4 HIGH-FIDELITY CUSTOM SVG CHARTS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Chart 1: Revenue Performance Chart (Bezier Spline Area) */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <span className="text-[9px] font-sans text-[#D4AF37] uppercase tracking-widest font-bold">Monthly Sales Performance</span>
                            <h4 className="font-playfair font-bold text-lg text-white mt-1">Revenue Matrix (₹)</h4>
                          </div>
                          <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            Current Year
                          </span>
                        </div>

                        {/* Bezier Path Area SVG */}
                        <div className="h-56 w-full relative">
                          <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="revenueGlowGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            
                            {/* Grid Lines */}
                            <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(212,175,55,0.08)" strokeDasharray="5,5" />
                            <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(212,175,55,0.08)" strokeDasharray="5,5" />
                            <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(212,175,55,0.08)" strokeDasharray="5,5" />
                            
                            {/* Line path filled */}
                            <path d={areaPath} fill="url(#revenueGlowGrad)" />
                            
                            {/* SVG Line stroke */}
                            <path d={linePath} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>

                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0D0D0D]/95 border border-[#D4AF37]/30 p-4 rounded-xl text-[10px] font-sans uppercase tracking-[0.2em] text-center shadow-2xl backdrop-blur-md">
                            <span className="text-[#D4AF37] block font-bold mb-1">Peak Sales Month</span>
                            <span className="text-gray-400 block font-normal text-[8px] tracking-wide normal-case mt-1">Highest: May sales registered</span>
                          </div>
                        </div>
                      </div>

                      {/* X-Axis labels */}
                      <div className="flex justify-between items-center px-2 mt-4 text-[9px] text-gray-500 tracking-widest uppercase font-bold">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                      </div>
                    </div>

                    {/* Chart 2: Dispatched Orders Columns Chart */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <span className="text-[9px] font-sans text-gray-400 uppercase tracking-widest font-bold">Sales Dispatches</span>
                            <h4 className="font-playfair font-bold text-lg text-white mt-1">Dispatched Orders Column Chart</h4>
                          </div>
                          <span className="bg-emerald-950/45 border border-emerald-500/20 text-emerald-400 text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            Live Shipments
                          </span>
                        </div>

                        {/* Column bar chart */}
                        <div className="h-56 w-full relative flex items-end justify-between px-4 pb-2">
                          {(() => {
                            // Calculate monthly shipments
                            const monthlyOrders = Array(6).fill(0);
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
                                if (month >= 0 && month < 6) {
                                  monthlyOrders[month] += 1;
                                }
                              }
                            });
                            
                            const maxOrd = Math.max(...monthlyOrders, 4);
                            
                            return monthlyOrders.map((ord, idx) => {
                              const heightPercent = Math.max((ord / maxOrd) * 100, 10);
                              return (
                                <div key={idx} className="flex flex-col items-center flex-1 group">
                                  {/* Tooltip on hover */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-2 bg-[#0D0D0D] border border-[#D4AF37]/30 text-white font-mono text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none mb-1 z-10">
                                    {ord} orders
                                  </div>
                                  <div className="w-8 md:w-12 bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37] hover:from-[#F4E2B8] hover:to-[#D4AF37] rounded-t-lg transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]" style={{ height: `${heightPercent * 1.5}px` }} />
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* X-Axis labels */}
                      <div className="flex justify-between items-center px-4 mt-4 text-[9px] text-gray-500 tracking-widest uppercase font-bold">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                      </div>
                    </div>

                    {/* Chart 3: Customer Growth Spline Chart */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <span className="text-[9px] font-sans text-[#D4AF37] uppercase tracking-widest font-bold">Audience Demographics</span>
                            <h4 className="font-playfair font-bold text-lg text-white mt-1">Customer Growth spline Chart</h4>
                          </div>
                          <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            Cumulative
                          </span>
                        </div>

                        {/* Customer growth curve */}
                        <div className="h-56 w-full relative">
                          <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="growthGlowGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            
                            {/* Grid lines */}
                            <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(212,175,55,0.08)" strokeDasharray="5,5" />
                            <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(212,175,55,0.08)" strokeDasharray="5,5" />
                            <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(212,175,55,0.08)" strokeDasharray="5,5" />
                            
                            {/* Spline Area path */}
                            <path d={growthAreaPath} fill="url(#growthGlowGrad)" />
                            
                            {/* Spline Stroke path */}
                            <path d={growthLinePath} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>

                          <div className="absolute top-6 right-6 bg-[#0D0D0D] border border-white/10 px-3 py-1.5 rounded-lg text-right pointer-events-none">
                            <span className="text-[8px] text-gray-500 block uppercase font-bold">Total registered</span>
                            <span className="text-xs font-semibold text-white font-mono mt-0.5 block">{registeredUsers.length} Connoisseurs</span>
                          </div>
                        </div>
                      </div>

                      {/* X-Axis labels */}
                      <div className="flex justify-between items-center px-2 mt-4 text-[9px] text-gray-500 tracking-widest uppercase font-bold">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                      </div>
                    </div>

                    {/* Chart 4: Top Products Volume Progression Metrics */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-3xl flex flex-col justify-between shadow-xl text-left">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <span className="text-[9px] font-sans text-gray-400 uppercase tracking-widest font-bold">Inventory Despatch Rank</span>
                            <h4 className="font-playfair font-bold text-lg text-white mt-1">Top Products Progression</h4>
                          </div>
                          <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            By Volume
                          </span>
                        </div>

                        {/* Progression bars */}
                        {topProductsList.length > 0 ? (
                          <div className="flex flex-col gap-5 py-2">
                            {topProductsList.map((prod, index) => {
                              const maxQty = Math.max(...topProductsList.map(p => p.quantity), 1);
                              const percent = Math.round((prod.quantity / maxQty) * 100);
                              return (
                                <div key={index} className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-playfair font-bold text-white truncate max-w-[220px]">{prod.name}</span>
                                    <span className="font-sans font-bold text-[#D4AF37]">{prod.quantity} Units Sold</span>
                                  </div>
                                  <div className="w-full bg-[#050505] h-2.5 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percent}%` }}
                                      transition={{ duration: 1, delay: index * 0.1 }}
                                      className="bg-gradient-to-r from-[#D4AF37] to-[#F4E2B8] h-full rounded-full"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <span className="text-gray-600 text-xs font-sans">No historical data available</span>
                            <span className="text-gray-700 text-[10px] font-sans mt-1">Place orders to see product rankings</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[9px] text-gray-500 font-sans tracking-wider text-center mt-4">
                        Volume parsed dynamically from live Shipment registers.
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: PRODUCTS DATABASE (CRUD) */}
              {activeTab === 'products' && (
                <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto pb-12">
                  
                  {/* Title block */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/15">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Inventory Management
                      </span>
                      <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white mt-1">
                        Artisanal Product Database
                      </h1>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search products in database..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-white/10 rounded-xl font-sans text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-xs font-sans text-white focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        <option value="beans">Whole Beans</option>
                        <option value="powder">Organic Ground Powder</option>
                        <option value="filter">Filter Coffee</option>
                        <option value="specialty">Specialty Brews</option>
                      </select>

                      <button
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 bg-[#D4AF37] text-[#050505] font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#F4E2B8] transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        <PlusCircle size={14} className="stroke-[2.5]" />
                        Add Product
                      </button>
                    </div>
                  </div>

                  {/* Spaced Table with Rounded rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-2.5 text-left text-xs">
                      <thead>
                        <tr className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-bold">
                          <th className="py-3 px-6">Product Details</th>
                          <th className="py-3 px-6">Category</th>
                          <th className="py-3 px-6">Roast Profile</th>
                          <th className="py-3 px-6">Price Structure</th>
                          <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((prod) => (
                            <tr 
                              key={prod.id} 
                              className="bg-[#0D0D0D] border border-white/5 rounded-2xl hover:border-[#D4AF37]/40 hover:bg-[#121212] transition-all duration-300 shadow-md group"
                            >
                              <td className="py-4 px-6 rounded-l-2xl border-l border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-[#050505] border border-white/10 rounded-xl p-1 flex items-center justify-center">
                                    <img 
                                      src={prod.image.startsWith('http') ? prod.image : `${API_BASE_URL}${prod.image}`} 
                                      alt={prod.name} 
                                      className="h-full w-full object-contain" 
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-playfair font-bold text-sm text-white group-hover:text-[#F4E2B8] transition-all">{prod.name}</h4>
                                    <span className="text-[9px] text-[#8A8A8A] tracking-widest uppercase font-bold">{prod.tagline}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all uppercase text-[10px] tracking-wider text-gray-400">
                                {prod.category}
                              </td>
                              <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all">
                                <div className="font-bold text-white">{prod.roast}</div>
                                <div className="text-[10px] text-[#D4AF37]/75 mt-0.5">{prod.chicory}</div>
                              </td>
                              <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all font-bold text-[#F4E2B8]">
                                ₹{prod.price}
                                {prod.originalPrice && (
                                  <span className="text-[10px] text-gray-500 line-through ml-2 font-normal">
                                    ₹{prod.originalPrice}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 rounded-r-2xl border-r border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenEditModal(prod)}
                                    className="p-2 bg-white/5 hover:bg-[#D4AF37]/20 text-white hover:text-[#D4AF37] rounded-lg border border-white/10 hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 rounded-lg border border-transparent transition-colors cursor-pointer"
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
                            <td colSpan={5} className="py-12 text-center text-gray-500 bg-[#0D0D0D] rounded-2xl border border-white/5">
                              <HelpCircle className="mx-auto mb-3 text-gray-600" size={32} />
                              No products found matching your catalog query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* TAB 3: REGISTERED CONNOISSEURS (CUSTOMERS REDESIGNED) */}
              {activeTab === 'customers' && (
                <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto pb-12">
                  
                  {/* Title Block */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/15">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Customer Operations
                      </span>
                      <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white mt-1">
                        Connoisseur Registry Registry
                      </h1>
                    </div>
                  </div>

                  {/* Customer Status Filters and Search */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by name, email, or mobile..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-white/10 rounded-xl font-sans text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Filter Status:</span>
                      <div className="flex bg-[#050505] border border-white/10 rounded-xl p-1 gap-1">
                        <button
                          onClick={() => setCustomerStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase transition-all duration-300 cursor-pointer ${
                            customerStatusFilter === 'all' ? 'bg-[#D4AF37] text-[#050505]' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setCustomerStatusFilter('verified')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase transition-all duration-300 cursor-pointer ${
                            customerStatusFilter === 'verified' ? 'bg-[#D4AF37] text-[#050505]' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Verified
                        </button>
                        <button
                          onClick={() => setCustomerStatusFilter('unverified')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase transition-all duration-300 cursor-pointer ${
                            customerStatusFilter === 'unverified' ? 'bg-[#D4AF37] text-[#050505]' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Unverified
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Table with Rounded Rows & spacing & hover glowing */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-2.5 text-left text-xs">
                      <thead>
                        <tr className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-bold">
                          <th className="py-3 px-6">Connoisseur Profile</th>
                          <th className="py-3 px-6">Email Address</th>
                          <th className="py-3 px-6">Contact Number</th>
                          <th className="py-3 px-6">Verified Legitimacy</th>
                          <th className="py-3 px-6">Total Spend (INR)</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCustomers.length > 0 ? (
                          paginatedCustomers.map((user) => {
                            const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
                            
                            // Calculate user metrics
                            const userOrders = shipments.filter(s => s.email?.toLowerCase() === user.email?.toLowerCase());
                            const orderCount = userOrders.length;
                            const totalSpend = userOrders.reduce((sum, o) => sum + o.amount, 0);
                            const lastOrderDate = userOrders.length > 0 ? userOrders[userOrders.length - 1].date || 'N/A' : 'No bookings';

                            const isVerified = user.status === 'Verified Customer' || orderCount > 0;
                            const displayStatus = isVerified ? 'Verified Customer' : 'Unverified Registration';

                            return (
                              <tr 
                                key={user.id || user.email}
                                onClick={() => setSelectedCustomer({ ...user, orderCount, totalSpend, lastOrderDate, isVerified, displayStatus })}
                                className="bg-[#0D0D0D] border border-white/5 rounded-2xl hover:border-[#D4AF37]/50 hover:bg-[#121212] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] group"
                              >
                                <td className="py-4 px-6 rounded-l-2xl border-l border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#F4E2B8]/5 border border-[#D4AF37]/35 text-[#D4AF37] flex items-center justify-center font-playfair font-black text-xs shadow-inner">
                                      {initials}
                                    </div>
                                    <div>
                                      <h4 className="font-playfair font-bold text-sm text-white group-hover:text-[#F4E2B8] transition-all">{user.name}</h4>
                                      <span className="text-[8px] text-[#8A8A8A] tracking-widest uppercase font-mono">{user.id || 'CUST-ID'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all font-mono text-gray-300">
                                  {user.email}
                                </td>
                                <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all font-mono text-gray-300">
                                  {user.phone || <span className="text-gray-600">N/A</span>}
                                </td>
                                <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider border ${
                                      isVerified 
                                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                        : 'bg-red-950/20 border-red-500/20 text-red-300'
                                    }`}>
                                      {displayStatus}
                                    </span>
                                    {isVerified && user.auditStatus && (
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-widest ${
                                        user.auditStatus === 'Original Customer Record' 
                                          ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400' 
                                          : 'bg-purple-950/20 border border-purple-500/20 text-purple-300'
                                      }`}>
                                        {user.auditStatus}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all font-bold text-[#F4E2B8]">
                                  ₹{totalSpend.toLocaleString('en-IN')}
                                  <span className="text-[10px] text-gray-500 font-normal block mt-0.5">{orderCount} order(s)</span>
                                </td>
                                <td className="py-4 px-6 rounded-r-2xl border-r border-t border-b border-white/5 group-hover:border-[#D4AF37]/20 transition-all text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCustomer({ ...user, orderCount, totalSpend, lastOrderDate, isVerified, displayStatus });
                                    }}
                                    className="px-3.5 py-2 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/30 text-white rounded-xl transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider"
                                  >
                                    Inspect Profile
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-500 bg-[#0D0D0D] rounded-2xl border border-white/5">
                              <HelpCircle className="mx-auto mb-3 text-gray-600" size={32} />
                              No gourmet coffee connoisseurs match your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Customer Registry Pagination */}
                  {totalCustomerPages > 1 && (
                    <div className="flex justify-between items-center mt-4 bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl">
                      <span className="text-xs text-gray-400">
                        Showing page <span className="font-bold text-white">{customerPage}</span> of <span className="font-bold text-white">{totalCustomerPages}</span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCustomerPage(prev => Math.max(prev - 1, 1))}
                          disabled={customerPage === 1}
                          className="px-4 py-2 bg-[#050505] border border-white/10 rounded-xl text-xs font-bold transition-all hover:bg-white/5 cursor-pointer disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCustomerPage(prev => Math.min(prev + 1, totalCustomerPages))}
                          disabled={customerPage === totalCustomerPages}
                          className="px-4 py-2 bg-[#050505] border border-white/10 rounded-xl text-xs font-bold transition-all hover:bg-white/5 cursor-pointer disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: SHIPROCKET LOGISTICS */}
              {activeTab === 'shiprocket' && (
                <div className="flex flex-col gap-8 text-left max-w-7xl mx-auto pb-12">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/15">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Shiprocket API Engine
                      </span>
                      <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white mt-1">
                        Logistics & Courier Orchestration
                      </h1>
                    </div>
                  </div>

                  {/* Shipping rates calculator */}
                  <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-[30px] shadow-xl">
                    <span className="text-[10px] font-sans text-[#D4AF37] uppercase tracking-[0.25em] font-bold block mb-1">
                      Direct Hub Services
                    </span>
                    <h3 className="font-playfair font-bold text-xl text-white mb-6">
                      Real-time Courier Routing & Rate Calculator
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                      <div>
                        <label className="text-[10px] text-gray-400 font-sans uppercase tracking-wider mb-2 block font-bold">Source Hub Pincode</label>
                        <input
                          type="text"
                          value={calcSource}
                          onChange={(e) => setCalcSource(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl text-xs font-sans text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-sans uppercase tracking-wider mb-2 block font-bold">Destination Pincode</label>
                        <input
                          type="text"
                          value={calcDest}
                          onChange={(e) => setCalcDest(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl text-xs font-sans text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-sans uppercase tracking-wider mb-2 block font-bold">Package Weight (KG)</label>
                        <select
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#050505] border border-white/10 rounded-xl text-xs font-sans text-white focus:outline-none cursor-pointer"
                        >
                          <option value="0.25">0.25 kg (1 Standard pouch)</option>
                          <option value="0.5">0.5 kg (2 Pouches)</option>
                          <option value="1.0">1.0 kg (4 Pouches)</option>
                          <option value="2.0">2.0 kg (Co-op Bulk)</option>
                        </select>
                      </div>
                      <button
                        onClick={handleCalculateShipping}
                        className="w-full py-2.5 bg-[#D4AF37] text-[#050505] font-sans text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#F4E2B8] transition-colors cursor-pointer"
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
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/10 pt-6"
                        >
                          {shippingRates.map((r, i) => (
                            <div key={i} className="bg-[#050505]/60 border border-[#D4AF37]/20 p-4 rounded-2xl flex flex-col justify-between hover:border-[#D4AF37] transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] px-2 py-0.5 rounded font-sans font-bold uppercase tracking-wider">
                                  {r.badge}
                                </span>
                                <span className="text-[10px] text-gray-500 font-sans">Rating: {r.rating}</span>
                              </div>
                              <h4 className="font-playfair font-bold text-sm text-white">{r.partner}</h4>
                              <p className="text-[10px] text-gray-400 font-sans mt-0.5">Transit: {r.transit}</p>
                              
                              <div className="flex justify-between items-center mt-5 border-t border-white/10 pt-3">
                                <span className="font-sans text-lg font-bold text-[#D4AF37]">₹{r.rate}.00</span>
                                <span className="text-[9px] font-sans text-emerald-400 font-bold uppercase tracking-widest">Serviceable</span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Shiprocket Shipments list */}
                  <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 rounded-3xl overflow-hidden shadow-xl">
                    <div className="bg-[#0D0D0D]/90 border-b border-[#D4AF37]/15 px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        {/* Sub tab switcher inside header */}
                        <div className="flex gap-2 p-1 bg-[#050505] border border-white/5 rounded-xl w-fit">
                          <button
                            onClick={() => setOrderSubTab('new_requests')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              orderSubTab === 'new_requests'
                                ? 'bg-[#D4AF37] text-[#050505]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            New Requests
                          </button>
                          
                          {/* New tabs primarily for Dispatcher workflow */}
                          <button
                            onClick={() => setOrderSubTab('pending_delivery')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              orderSubTab === 'pending_delivery'
                                ? 'bg-[#D4AF37] text-[#050505]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Pending Delivery
                          </button>
                          <button
                            onClick={() => setOrderSubTab('out_for_delivery')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              orderSubTab === 'out_for_delivery'
                                ? 'bg-[#D4AF37] text-[#050505]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Out of Delivery
                          </button>

                          <button
                            onClick={() => setOrderSubTab('history')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              orderSubTab === 'history'
                                ? 'bg-[#D4AF37] text-[#050505]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Archive & History
                          </button>
                        </div>
                      </div>

                      {/* Clean premium date filter controls */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Monthly selector */}
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] text-gray-500 font-sans uppercase tracking-widest font-bold mb-1">Quick Month</span>
                          <select
                            value={filterMonth}
                            onChange={(e) => {
                              setFilterMonth(e.target.value);
                              if (e.target.value !== 'all') {
                                setFilterStartDate('');
                                setFilterEndDate('');
                              }
                            }}
                            className="bg-[#050505] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-sans text-white focus:outline-none cursor-pointer focus:border-[#D4AF37]"
                          >
                            <option value="all">All Months</option>
                            <option value="2026-06">June 2026</option>
                            <option value="2026-05">May 2026</option>
                            <option value="2026-04">April 2026</option>
                            <option value="2026-03">March 2026</option>
                            <option value="2026-02">February 2026</option>
                            <option value="2026-01">January 2026</option>
                            <option value="2025-12">December 2025</option>
                          </select>
                        </div>

                        {/* Start Date */}
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] text-gray-500 font-sans uppercase tracking-widest font-bold mb-1">Start Date</span>
                          <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                              setFilterStartDate(e.target.value);
                              if (e.target.value) setFilterMonth('all');
                            }}
                            className="bg-[#050505] border border-white/10 rounded-xl px-3 py-1 text-xs font-sans text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        {/* End Date */}
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] text-gray-500 font-sans uppercase tracking-widest font-bold mb-1">End Date</span>
                          <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                              setFilterEndDate(e.target.value);
                              if (e.target.value) setFilterMonth('all');
                            }}
                            className="bg-[#050505] border border-white/10 rounded-xl px-3 py-1 text-xs font-sans text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        {/* Reset Filters button */}
                        {(filterMonth !== 'all' || filterStartDate || filterEndDate) && (
                          <button
                            onClick={() => {
                              setFilterMonth('all');
                              setFilterStartDate('');
                              setFilterEndDate('');
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-sans text-white uppercase tracking-wider font-bold transition-all cursor-pointer mt-3"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          onClick={handleExportToExcel}
                          className="px-3 py-1.5 bg-[#D4AF37] text-[#050505] hover:bg-[#F4E2B8] border border-transparent rounded-xl text-[10px] font-sans uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1 mt-3"
                          title="Download Report as Excel"
                        >
                          <FileText size={10} className="stroke-[2.5]" />
                          Export Excel
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#D4AF37]/15 text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] bg-[#0D0D0D] font-bold">
                            <th className="py-4 px-6">Consignment ID</th>
                            <th className="py-4 px-6">Customer Details</th>
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-6">AWB Logistics Code</th>
                            <th className="py-4 px-6">Fulfillment Status</th>
                            <th className="py-4 px-6 text-center">Fulfillment Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans text-xs">
                          {(() => {
                            const filterBySubTab = (s: ShipmentOrder) => {
                              if (orderSubTab === 'new_requests') {
                                return loggedInUser?.role === 'Dispatcher' ? s.status === 'Ready to Ship' : (s.status === 'Pending' || s.status === 'Ready to Ship');
                              }
                              if (orderSubTab === 'pending_delivery') {
                                return s.status === 'Dispatched';
                              }
                              if (orderSubTab === 'out_for_delivery') {
                                return s.status === 'Out for Delivery';
                              }
                              return s.status === 'Delivered' || s.status === 'Declined';
                            };
                            
                            const finalShipments = filteredShipments.filter(filterBySubTab);
                            
                            if (finalShipments.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                                    <HelpCircle className="mx-auto mb-3 text-white/10" size={32} />
                                    No matching shipments or bookings found.
                                  </td>
                                </tr>
                              );
                            }
                            
                            return finalShipments.map((s) => (
                              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-4 px-6 font-bold text-white">
                                  {s.id}
                                  <div className="text-[10px] text-gray-500 font-normal mt-0.5 truncate max-w-[200px]" title={s.productName}>{s.productName}</div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="font-bold text-white mb-0.5">{s.customerName}</div>
                                  <div className="text-[10px] text-gray-500 font-mono tracking-wider">{s.email}</div>
                                  
                                  {(() => {
                                    const matchedUser = registeredUsers.find(u => u.email.toLowerCase() === s.email.toLowerCase());
                                    const displayPhone = s.phone || matchedUser?.phone || 'No phone provided';
                                    const addressObj = s.fullAddress || matchedUser?.address;
                                    
                                    let displayAddress = `${s.city} (PIN: ${s.pincode})`;
                                    if (addressObj) {
                                      if (typeof addressObj === 'string') {
                                        displayAddress = addressObj;
                                      } else {
                                        displayAddress = [
                                          addressObj.doorNo, 
                                          addressObj.area, 
                                          addressObj.landmark, 
                                          addressObj.city, 
                                          addressObj.state, 
                                          addressObj.pinCode || addressObj.pincode
                                        ].filter(Boolean).join(', ');
                                      }
                                    }
                                    
                                    return (
                                      <>
                                        <div className="text-[10px] text-gray-400 mt-1">{displayPhone}</div>
                                        <div className="text-[9px] text-gray-500 mt-1 leading-relaxed max-w-[220px]">
                                          {displayAddress}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </td>
                                <td className="py-4 px-6 text-gray-400 font-medium">
                                  {s.date || 'N/A'}
                                </td>
                                <td className="py-4 px-6">
                                  {s.awb ? (
                                    <div>
                                      <div className="font-bold text-[#D4AF37] tracking-widest">{s.awb}</div>
                                      <div className="text-[10px] text-gray-500 mt-0.5">{s.courier}</div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Awaiting Dispatch</span>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider border ${
                                    s.status === 'Pending' ? 'bg-red-950/20 border-red-500/20 text-red-300' :
                                    s.status === 'Declined' ? 'bg-red-950/40 border-red-500/40 text-red-400' :
                                    s.status === 'Ready to Ship' ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' :
                                    s.status === 'Dispatched' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300' :
                                    'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {s.status === 'Pending' ? (
                                      ['Super Admin', 'Lounge Manager'].includes(loggedInUser?.role) ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleDeclineShipment(s.id)}
                                            className="px-4 py-2 bg-red-950/40 text-red-400 border border-red-500/20 font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-red-900/40 transition-all cursor-pointer shadow-md"
                                          >
                                            Decline
                                          </button>
                                          <button
                                            onClick={() => handleAcceptShipment(s.id)}
                                            className="px-4 py-2 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-900/40 transition-all cursor-pointer shadow-md font-bold"
                                          >
                                            Accept
                                          </button>
                                        </div>
                                      ) : null
                                    ) : s.status === 'Ready to Ship' ? (
                                      loggedInUser?.role === 'Dispatcher' ? (
                                        <button
                                          onClick={() => handleDispatchShipment(s.id, 'Delhivery Prime - Express')}
                                          className="px-4 py-2 bg-[#D4AF37] text-[#050505] font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#F4E2B8] transition-all cursor-pointer shadow-md font-bold"
                                        >
                                          Generate AWB
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-bold uppercase text-amber-500/60 tracking-wider">Awaiting Dispatcher</span>
                                      )
                                    ) : s.status === 'Declined' ? (
                                      <span className="text-[10px] font-bold uppercase text-red-500/60">Declined</span>
                                    ) : s.status === 'Dispatched' ? (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleOutForDeliveryShipment(s.id)}
                                          className="px-4 py-2 bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-900/40 transition-all cursor-pointer shadow-md font-bold"
                                        >
                                          Out of Delivery
                                        </button>
                                        <button
                                          onClick={() => onViewInvoice(s)}
                                          className="px-3 py-2 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/25 hover:bg-[#D4AF37]/40 font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 font-bold"
                                        >
                                          <FileText size={10} />
                                          Invoice
                                        </button>
                                      </div>
                                    ) : s.status === 'Out for Delivery' ? (
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Out for Delivery</span>
                                        <button
                                          onClick={() => onViewInvoice(s)}
                                          className="px-3 py-2 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/25 hover:bg-[#D4AF37]/40 font-sans text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 font-bold"
                                        >
                                          <FileText size={10} />
                                          Invoice
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => onViewInvoice(s)}
                                          className="px-3 py-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 border border-[#D4AF37]/25 rounded-lg font-sans text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1 font-bold"
                                        >
                                          <FileText size={10} />
                                          Invoice
                                        </button>
                                        <button
                                          onClick={() => setSelectedLabelShipment(s)}
                                          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-sans text-[10px] font-bold uppercase tracking-wider text-white hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1 font-bold"
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
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4.5: DELIVERY PARTNERS */}
              {activeTab === 'deliveryPartners' && (
                <div className="flex flex-col gap-8 text-left max-w-7xl mx-auto pb-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/15">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Carrier Routing Engine
                      </span>
                      <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white mt-1">
                        Shipping Provider Configuration
                      </h1>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsAddProviderModalOpen(true)}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold font-sans text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle size={14} /> Add Custom Provider
                      </button>
                      <button
                        onClick={handleSaveProviders}
                        className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F4E2B8] text-[#050505] rounded-xl font-bold font-sans text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                      >
                        {providerSaveStatus || 'Save Settings'}
                      </button>
                    </div>
                  </div>

                  {isProvidersLoading ? (
                    <div className="text-center py-24 text-[#D4AF37] font-sans uppercase tracking-widest font-bold text-xs">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      Loading Active Routing Systems...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deliveryProviders.map(provider => (
                        <div key={provider.id} className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl relative overflow-hidden flex flex-col group hover:border-[#D4AF37]/35 transition-all shadow-xl">
                          {/* Active Glow */}
                          {provider.is_enabled && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
                          )}
                          
                          <div className="flex justify-between items-start mb-6 z-10">
                            <div>
                              <h3 className="font-playfair font-bold text-lg text-white">{provider.name}</h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${provider.is_enabled ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <span className="text-[9px] font-sans uppercase font-bold tracking-wider text-gray-400">
                                  {provider.is_enabled ? 'Active Endpoint' : 'Offline'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Toggle Enable */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={provider.is_enabled}
                                onChange={(e) => handleUpdateProvider(provider.id, 'is_enabled', e.target.checked)}
                              />
                              <div className="w-10 h-5 bg-[#050505] border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#D4AF37] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:border-[#D4AF37]/35"></div>
                            </label>
                          </div>

                          <div className="space-y-4 z-10 flex-grow">
                            <div>
                              <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">API Key credential</label>
                              <input
                                type="text"
                                value={provider.api_key}
                                onChange={(e) => handleUpdateProvider(provider.id, 'api_key', e.target.value)}
                                className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                placeholder="Enter credentials"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Secret Key credential</label>
                              <input
                                type="password"
                                value={provider.secret_key}
                                onChange={(e) => handleUpdateProvider(provider.id, 'secret_key', e.target.value)}
                                className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                placeholder="•••••••••••••••"
                              />
                            </div>
                            {provider.is_custom && (
                              <>
                                <div>
                                  <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">API Base Endpoint</label>
                                  <input
                                    type="text"
                                    value={provider.api_base_url || ''}
                                    onChange={(e) => handleUpdateProvider(provider.id, 'api_base_url', e.target.value)}
                                    className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                    placeholder="https://api.example.com"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Tracking Path</label>
                                    <input
                                      type="text"
                                      value={provider.tracking_endpoint || ''}
                                      onChange={(e) => handleUpdateProvider(provider.id, 'tracking_endpoint', e.target.value)}
                                      className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                      placeholder="/track"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Shipment Path</label>
                                    <input
                                      type="text"
                                      value={provider.shipment_endpoint || ''}
                                      onChange={(e) => handleUpdateProvider(provider.id, 'shipment_endpoint', e.target.value)}
                                      className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                      placeholder="/ship"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between z-10">
                            <label className="flex items-center gap-2 cursor-pointer group/radio">
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${provider.is_default ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/20 group-hover/radio:border-white/40'}`}>
                                {provider.is_default && <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                              </div>
                              <input 
                                type="radio" 
                                name="defaultProvider" 
                                className="hidden"
                                checked={provider.is_default}
                                onChange={() => handleUpdateProvider(provider.id, 'is_default', true)}
                              />
                              <span className={`text-[9px] font-sans font-bold uppercase tracking-wider ${provider.is_default ? 'text-[#D4AF37]' : 'text-gray-500 group-hover/radio:text-gray-400'}`}>
                                Default Engine
                              </span>
                            </label>
                            
                            <div className="flex gap-2">
                              {provider.is_custom && (
                                <button
                                  onClick={() => handleDeleteProvider(provider.id)}
                                  className="p-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded border border-transparent transition-colors cursor-pointer"
                                  title="Delete Provider"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => handleTestProvider(provider.id)}
                                className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#D4AF37] hover:text-[#F4E2B8] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Send size={10} />
                                Connection test
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Provider Modal */}
                  <AnimatePresence>
                    {isAddProviderModalOpen && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left"
                      >
                        <motion.div 
                          initial={{ scale: 0.95, y: 15 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.95, y: 15 }}
                          className="bg-[#0D0D0D] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
                        >
                          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0D0D0D] shrink-0">
                            <h2 className="font-playfair font-bold text-lg text-white">Add Shipping Partner Engine</h2>
                            <button onClick={() => setIsAddProviderModalOpen(false)} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                              <X size={20} />
                            </button>
                          </div>
                          
                          <div className="p-6 overflow-y-auto space-y-5 flex-grow custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Provider Name *</label>
                                <input
                                  type="text"
                                  value={formNewProvider.name}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, name: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="e.g. Bluedart Direct"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Provider Slug ID</label>
                                <input
                                  type="text"
                                  value={formNewProvider.id}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, id: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="Auto generated slug"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Base Endpoint URL *</label>
                              <input
                                type="text"
                                value={formNewProvider.api_base_url}
                                onChange={(e) => setFormNewProvider({...formNewProvider, api_base_url: e.target.value})}
                                className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                placeholder="https://api.bluedart.com/v1"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">API Username / Key</label>
                                <input
                                  type="text"
                                  value={formNewProvider.api_key}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, api_key: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="Optional"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">API Password / Secret</label>
                                <input
                                  type="password"
                                  value={formNewProvider.secret_key}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, secret_key: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Shipment Path</label>
                                <input
                                  type="text"
                                  value={formNewProvider.shipment_endpoint}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, shipment_endpoint: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="/shipments"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Tracking Path</label>
                                <input
                                  type="text"
                                  value={formNewProvider.tracking_endpoint}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, tracking_endpoint: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="/track"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Webhook Webhook Endpoint</label>
                                <input
                                  type="text"
                                  value={formNewProvider.webhook_url}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, webhook_url: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold font-sans text-gray-500 uppercase tracking-widest mb-1.5">Logo Link URL</label>
                                <input
                                  type="text"
                                  value={formNewProvider.logo_url}
                                  onChange={(e) => setFormNewProvider({...formNewProvider, logo_url: e.target.value})}
                                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none transition-colors"
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6 border-t border-white/5 bg-[#050505] flex justify-end shrink-0 gap-3">
                            <button
                              onClick={() => setIsAddProviderModalOpen(false)}
                              className="px-5 py-2.5 rounded-xl font-bold font-sans text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddCustomProvider}
                              className="bg-[#D4AF37] text-[#050505] hover:bg-[#F4E2B8] px-5 py-2.5 rounded-xl font-bold font-sans text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                            >
                              <PlusCircle size={14} /> Add Provider
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* TAB 5: LIVE CHAT DESK */}
              {activeTab === 'chat' && (
                <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto h-[calc(100vh-140px)]">
                  <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 rounded-[30px] overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12 h-full text-left">
                    
                    {/* Chat list */}
                    <div className="md:col-span-4 border-r border-[#D4AF37]/15 flex flex-col h-full bg-[#050505]">
                      <div className="p-4 border-b border-[#D4AF37]/15 bg-[#0D0D0D]">
                        <span className="text-[9px] font-sans text-[#D4AF37] uppercase tracking-[0.2em] font-bold block mb-1">
                          Live Inboxes
                        </span>
                        <h4 className="font-playfair font-bold text-base text-white">Customer Support</h4>
                      </div>

                      <div className="flex-grow overflow-y-auto divide-y divide-white/5">
                        {chats.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setActiveChatId(c.id)}
                            className={`w-full p-4 flex gap-3 text-left transition-colors cursor-pointer hover:bg-white/5 ${
                              activeChatId === c.id ? 'bg-white/5 border-l-2 border-[#D4AF37]' : ''
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-full ${c.avatarColor} flex items-center justify-center font-playfair font-black text-xs shrink-0 shadow-inner`}>
                              {c.customerName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-grow overflow-hidden relative">
                              <div className="flex justify-between items-center">
                                <h5 className="font-playfair font-bold text-xs text-white">{c.customerName}</h5>
                                <span className="text-[8px] font-sans text-gray-500">Active</span>
                              </div>
                              <span className="text-[9px] text-[#D4AF37] font-sans font-bold uppercase tracking-wider block mt-0.5">{c.topic}</span>
                              <p className="text-[10px] text-gray-400 truncate mt-1 leading-normal pr-4">{c.lastMessage}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active chat window */}
                    <div className="md:col-span-8 flex flex-col h-full justify-between bg-[#0D0D0D]">
                      {activeChat ? (
                        <>
                          {/* Chat header */}
                          <div className="p-4 bg-[#050505] border-b border-[#D4AF37]/15 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${activeChat.avatarColor} flex items-center justify-center font-playfair font-black text-xs shadow-inner`}>
                                {activeChat.customerName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h5 className="font-playfair font-bold text-sm text-white">{activeChat.customerName}</h5>
                                <span className="text-[9px] text-[#D4AF37] font-sans font-bold uppercase tracking-wider block mt-0.5">{activeChat.topic}</span>
                              </div>
                            </div>

                            <span className="px-2.5 py-0.5 rounded text-[8px] font-sans tracking-widest font-bold uppercase border bg-emerald-950/20 border-emerald-500/20 text-emerald-400">
                              {activeChat.status}
                            </span>
                          </div>

                          {/* Message List */}
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
                                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                                    isAdmin 
                                      ? 'bg-[#D4AF37] text-[#050505] rounded-tr-none shadow-md font-sans font-bold' 
                                      : 'bg-[#050505] border border-[#D4AF37]/20 text-white rounded-tl-none'
                                  }`}>
                                    {m.text}
                                  </div>
                                  <span className="text-[8px] text-gray-500 font-sans mt-1.5">{m.time}</span>
                                </div>
                              );
                            })}
                            <div ref={chatMessagesEndRef} />
                          </div>

                          {/* Message inputs */}
                          <div className="p-4 border-t border-white/10 bg-[#050505] flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Type premium response matrices..."
                              value={typedMessage}
                              onChange={(e) => setTypedMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                              }}
                              className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-xs font-sans focus:outline-none focus:border-[#D4AF37] text-white"
                            />
                            <button
                              onClick={handleSendMessage}
                              className="p-3 bg-[#D4AF37] hover:bg-[#F4E2B8] text-[#050505] rounded-xl transition-all cursor-pointer shadow-md"
                            >
                              <Send size={14} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center flex-grow p-12 text-gray-500">
                          <AlertCircle size={36} className="text-gray-600 mb-4" />
                          Select a support session to initiate premium secure communications.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 6: MULTI-ADMIN ACCESS CONTROL */}
              {activeTab === 'admins' && (
                <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto pb-12">
                  
                  {/* Actions Header */}
                  <div className="flex items-center justify-between bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md">
                    <div>
                      <h4 className="font-playfair font-bold text-sm text-white">Active Roasting Admins</h4>
                      <p className="text-[10px] text-gray-400 font-sans mt-0.5">Control operational credentials and lounge permissions.</p>
                    </div>

                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-5 py-2.5 bg-[#D4AF37] text-[#050505] font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#F4E2B8] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <UserPlus size={14} className="stroke-[2.5]" />
                      Invite Admin
                    </button>
                  </div>

                  {/* Admin Grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {admins.map((a) => (
                      <div key={a.id} className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[35px] bg-[#D4AF37]/5 pointer-events-none" />
                        
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-2.5 py-0.5 rounded text-[8px] font-sans font-bold tracking-widest uppercase border bg-emerald-950/20 border-emerald-500/20 text-emerald-400">
                              {a.status}
                            </span>
                            <span className="text-[9px] font-sans font-bold text-[#D4AF37] uppercase tracking-widest">{a.role}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-playfair font-black text-sm text-white">
                              {a.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-playfair font-bold text-sm text-white">{a.name}</h4>
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
                                            body: JSON.stringify({ email: 'admin@tribalcoffee.com', name: trimmed })
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
                                    className="text-gray-400 hover:text-[#D4AF37] transition-colors cursor-pointer p-0.5 rounded"
                                    title="Edit Super Admin Name"
                                  >
                                    <Edit3 size={10} />
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 font-sans mt-0.5">{a.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-[#D4AF37]/10 pt-4 flex justify-between items-center mt-4">
                          <span className="text-[9px] font-sans text-gray-500 uppercase">ID: {a.id}</span>
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

                </div>
              )}

              {/* TAB 7: CUSTOMER RESTORATION & DATA INTEGRITY AUDIT */}
              {activeTab === 'audit' && (
                <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto pb-12">
                  
                  {/* Title & Sync Badge */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/15">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block">
                        Database Administration
                      </span>
                      <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white mt-1">
                        Data Integrity & Restoration Audit
                      </h1>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-2 rounded-xl">
                      <Shield className="text-[#D4AF37]" size={16} />
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                        100% Production Data Synced
                      </span>
                    </div>
                  </div>

                  {/* Sync Details & Status Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Source Table 1 */}
                    <div className="bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-wider block">Source SQL Table</span>
                        <h4 className="font-playfair font-bold text-sm text-white mt-1">wpox_wc_order_stats</h4>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-gray-400 font-sans">935 records</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active</span>
                      </div>
                    </div>

                    {/* Source Table 2 */}
                    <div className="bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-wider block">Metadata Engine</span>
                        <h4 className="font-playfair font-bold text-sm text-white mt-1">wpox_postmeta</h4>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-gray-400 font-sans">72,830 rows</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Mapped</span>
                      </div>
                    </div>

                    {/* Source Table 3 */}
                    <div className="bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-wider block">Item Details</span>
                        <h4 className="font-playfair font-bold text-sm text-white mt-1">wpox_order_items</h4>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-gray-400 font-sans">3,651 items</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Linked</span>
                      </div>
                    </div>

                    {/* DB Sync status */}
                    <div className="bg-[#0D0D0D]/60 border border-[#D4AF37]/15 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-wider block">MongoDB State</span>
                        <h4 className="font-playfair font-bold text-sm text-white mt-1">Consistency Check</h4>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-[#D4AF37] font-bold">169 Users / 935 Bookings</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Consistent</span>
                      </div>
                    </div>
                  </div>

                  {/* Restored Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[35px] bg-[#D4AF37]/5 pointer-events-none" />
                      <span className="text-[10px] tracking-widest font-sans font-bold text-gray-500 uppercase">Restored Orders</span>
                      <h3 className="text-3xl font-playfair font-bold text-white mt-2">{shipments.length}</h3>
                      <p className="text-[9px] font-sans text-gray-400 mt-2">All-time transactions from production dump</p>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[35px] bg-[#D4AF37]/5 pointer-events-none" />
                      <span className="text-[10px] tracking-widest font-sans font-bold text-gray-500 uppercase">Verified Customers</span>
                      <h3 className="text-3xl font-playfair font-bold text-white mt-2">
                        {registeredUsers.filter(u => u.status === 'Verified Customer').length}
                      </h3>
                      <p className="text-[9px] font-sans text-gray-400 mt-2">Reconstructed from direct order history</p>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[35px] bg-[#D4AF37]/5 pointer-events-none" />
                      <span className="text-[10px] tracking-widest font-sans font-bold text-gray-500 uppercase">Gross Revenue</span>
                      <h3 className="text-3xl font-playfair font-bold text-white mt-2">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                      <p className="text-[9px] font-sans text-gray-400 mt-2">Aggregate transaction sales value</p>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 p-6 rounded-2xl relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[35px] bg-[#D4AF37]/5 pointer-events-none" />
                      <span className="text-[10px] tracking-widest font-sans font-bold text-gray-500 uppercase">Average Order Value</span>
                      <h3 className="text-3xl font-playfair font-bold text-white mt-2">₹{Math.round(averageOrderValue).toLocaleString('en-IN')}</h3>
                      <p className="text-[9px] font-sans text-gray-400 mt-2">Average spending per completed order</p>
                    </div>
                  </div>

                  {/* Restored Customer Profiles Log */}
                  <div className="bg-[#0D0D0D] border border-[#D4AF37]/15 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/10 mb-6">
                      <div>
                        <h4 className="font-playfair font-bold text-base text-white">Verified Customer Restoration Logs</h4>
                        <p className="text-[10px] text-gray-400 font-sans mt-0.5">Showing genuine customer profiles reconstructed from SQL order transactions.</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-separate border-spacing-y-2.5 text-left text-xs">
                        <thead>
                          <tr className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-bold">
                            <th className="py-3 px-6">Customer Profile</th>
                            <th className="py-3 px-6">Email Address</th>
                            <th className="py-3 px-6">Phone Number</th>
                            <th className="py-3 px-6">Source Mapped</th>
                            <th className="py-3 px-6">Total Spend (INR)</th>
                            <th className="py-3 px-6">Order Count</th>
                            <th className="py-3 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredUsers.filter(u => u.role === 'Connoisseur').length > 0 ? (
                            registeredUsers
                              .filter(u => u.role === 'Connoisseur')
                              .sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0))
                              .slice(0, 100) // Show top 100 restored profiles
                              .map((u) => {
                                const initials = u.name ? u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
                                return (
                                  <tr 
                                    key={u.id}
                                    className="bg-[#050505]/40 hover:bg-[#D4AF37]/5 transition-all duration-300 border border-[#D4AF37]/10 rounded-xl animate-fade-in"
                                  >
                                    <td className="py-3.5 px-6 font-medium rounded-l-xl">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-playfair font-bold text-xs text-white">
                                          {initials}
                                        </div>
                                        <div>
                                          <h4 className="font-playfair font-bold text-white text-xs">{u.name}</h4>
                                          <span className="text-[8px] font-sans text-gray-500 uppercase tracking-widest">Added: {u.dateAdded || '01/01/2026'}</span>
                                        </div>
                                      </div>
                                    </td>
                                    
                                    <td className="py-3.5 px-6 font-sans text-gray-400 font-medium">
                                      {u.email}
                                    </td>
                                    
                                    <td className="py-3.5 px-6 font-sans text-gray-400 font-medium">
                                      {u.phone || 'No phone recorded'}
                                    </td>
                                    
                                    <td className="py-3.5 px-6 font-sans">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-widest ${
                                        u.source === 'woocommerce' ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]' :
                                        u.source === 'woocommerce_guest' ? 'bg-amber-950/20 border border-amber-500/20 text-amber-400' :
                                        'bg-white/5 border border-white/15 text-gray-400'
                                      }`}>
                                        {u.source || 'opencart'}
                                      </span>
                                    </td>
                                    
                                    <td className="py-3.5 px-6 font-sans font-bold text-white">
                                      ₹{Math.round(u.totalSpend || 0).toLocaleString('en-IN')}
                                    </td>

                                    <td className="py-3.5 px-6 font-sans text-gray-400 font-bold">
                                      {u.orderCount || 0}
                                    </td>
                                    
                                    <td className="py-3.5 px-6 text-right rounded-r-xl">
                                      <button
                                        onClick={() => setSelectedCustomer(u)}
                                        className="px-3.5 py-1.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 text-white hover:text-[#D4AF37] rounded-lg transition-all font-sans text-[10px] uppercase font-bold cursor-pointer"
                                      >
                                        Inspect Profile
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-500 font-sans uppercase tracking-widest text-[10px]">
                                No customers currently restored. Run restoration script to populate.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </main>

          </div>

          {/* SLIDE-OUT CUSTOMER DETAILS DRAWER */}
          <AnimatePresence>
            {selectedCustomer && (
              <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
                
                {/* Backdrop Click Closes Drawer */}
                <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />

                {/* Drawer Container Panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full max-w-[460px] h-screen bg-[#0D0D0D] border-l border-[#D4AF37]/20 shadow-2xl relative flex flex-col justify-between overflow-hidden z-10"
                >
                  {/* Glowing light spot */}
                  <div className="absolute top-0 right-0 w-44 h-44 rounded-full filter blur-[35px] bg-[#D4AF37]/5 pointer-events-none" />

                  {/* Top Bar inside Drawer */}
                  <div className="p-6 border-b border-[#D4AF37]/15 flex items-center justify-between bg-[#050505]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37]">
                        <Users size={18} className="stroke-[1.5]" />
                      </div>
                      <span className="text-[10px] tracking-[0.25em] font-sans font-bold text-[#D4AF37] uppercase block text-left">
                        Connoisseur Profile
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Scrollable details view */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left">
                    
                    {/* Header: Large initials, Name, Verification badge */}
                    <div className="flex flex-col items-center text-center pb-6 border-b border-white/5 relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4E2B8] text-[#050505] flex items-center justify-center font-playfair font-black text-3xl shadow-[0_0_20px_rgba(212,175,55,0.45)] mb-4">
                        {selectedCustomer.name ? selectedCustomer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
                      </div>
                      
                      <h2 className="font-playfair font-bold text-xl text-white">{selectedCustomer.name}</h2>
                      <span className="text-xs text-gray-500 font-mono mt-0.5">{selectedCustomer.email}</span>

                      {/* Large status badge */}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider border mt-3.5 block ${
                        selectedCustomer.isVerified 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                          : 'bg-red-950/20 border-red-500/20 text-red-300'
                      }`}>
                        {selectedCustomer.displayStatus}
                      </span>
                    </div>

                    {/* Toggle user status override */}
                    <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="text-left">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Legitimacy Override</span>
                        <span className="text-[9px] text-gray-500 block mt-0.5">Toggle verification status in database storage</span>
                      </div>
                      <button
                        onClick={() => {
                          const newStatus = selectedCustomer.isVerified ? 'Unverified Registration' : 'Verified Customer';
                          handleUpdateUserStatus(selectedCustomer.id || selectedCustomer.email, newStatus);
                          setSelectedCustomer((prev: any) => ({
                            ...prev,
                            isVerified: !prev.isVerified,
                            displayStatus: newStatus
                          }));
                        }}
                        className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                          selectedCustomer.isVerified 
                            ? 'bg-red-950/20 border-red-500/20 text-red-300 hover:bg-red-950/40' 
                            : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40'
                        }`}
                      >
                        {selectedCustomer.isVerified ? 'Mark Unverified' : 'Mark Verified'}
                      </button>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl text-left shadow-md">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Total Spendings</span>
                        <h4 className="text-lg font-bold text-[#F4E2B8] mt-1 font-sans">
                          ₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}
                        </h4>
                      </div>
                      <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl text-left shadow-md">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Shipment Bookings</span>
                        <h4 className="text-lg font-bold text-white mt-1 font-sans">
                          {selectedCustomer.orderCount} Orders
                        </h4>
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="space-y-4">
                      {/* Billing Address Card */}
                      <div className="bg-[#050505] border border-[#D4AF37]/15 p-4 rounded-2xl text-left relative">
                        <span className="absolute top-3 right-3 text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-wider">
                          Billing
                        </span>
                        <h5 className="font-playfair font-bold text-xs text-white mb-2">Billing Address</h5>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {(() => {
                            if (!selectedCustomer.address) return 'No physical billing address captured in registered profile.';
                            if (typeof selectedCustomer.address === 'object') {
                              return `${selectedCustomer.address.doorNo || ''}, ${selectedCustomer.address.area || ''}, ${selectedCustomer.address.city || ''} - ${selectedCustomer.address.pinCode || ''}`.replace(/^,\s*|,\s*$/, '').trim() || 'No address details';
                            }
                            return selectedCustomer.address;
                          })()}
                        </p>
                      </div>

                      {/* Shipping Address Card */}
                      <div className="bg-[#050505] border border-[#D4AF37]/15 p-4 rounded-2xl text-left relative">
                        <span className="absolute top-3 right-3 text-[8px] bg-white/10 text-white px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-wider">
                          Shipping
                        </span>
                        <h5 className="font-playfair font-bold text-xs text-white mb-2">Shipping Address</h5>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {(() => {
                            if (!selectedCustomer.address) return 'No physical shipping address captured in registered profile.';
                            if (typeof selectedCustomer.address === 'object') {
                              return `${selectedCustomer.address.doorNo || ''}, ${selectedCustomer.address.area || ''}, ${selectedCustomer.address.city || ''} - ${selectedCustomer.address.pinCode || ''}`.replace(/^,\s*|,\s*$/, '').trim() || 'No address details';
                            }
                            return selectedCustomer.address;
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Order History Timeline */}
                    <div className="bg-[#050505] border border-[#D4AF37]/15 p-4 rounded-2xl text-left">
                      <h5 className="font-playfair font-bold text-xs text-[#D4AF37] mb-3 uppercase tracking-wider">
                        Order History Timeline
                      </h5>
                      
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {(() => {
                          const customerOrders = shipments.filter(s => s.email?.toLowerCase() === selectedCustomer.email?.toLowerCase());
                          if (customerOrders.length === 0) {
                            return <p className="text-[10px] text-gray-500 italic">No historical orders recorded for this profile.</p>;
                          }
                          return customerOrders.map((ord, idx) => (
                            <div key={ord.id || idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1.5 hover:border-[#D4AF37]/30 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[10px] font-bold text-white">{ord.id}</span>
                                <span className="text-[9px] text-gray-400 font-sans">{ord.date}</span>
                              </div>
                              
                              <div className="text-[10px] text-gray-300 font-sans line-clamp-2">
                                {ord.productName}
                              </div>
                              
                              <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                                <span className="font-sans font-bold text-[#F4E2B8]">₹{ord.amount.toLocaleString('en-IN')}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-wider border ${
                                  ord.status === 'Delivered' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                                  ord.status === 'Processing' ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' :
                                  'bg-white/5 border border-white/10 text-gray-400'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Metadata contact logs */}
                    <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl text-xs space-y-2 text-left text-gray-400 font-mono">
                      <div className="flex justify-between">
                        <span>Mobile Contact:</span>
                        <span className="text-white">{selectedCustomer.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registry Date:</span>
                        <span className="text-white">{selectedCustomer.dateAdded || 'Feb 2026'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vault Account ID:</span>
                        <span className="text-white text-[10px] uppercase truncate max-w-[150px]">{selectedCustomer.id || 'N/A'}</span>
                      </div>
                      {selectedCustomer.auditStatus && (
                        <div className="flex justify-between items-center">
                          <span>Traceability:</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-widest ${
                            selectedCustomer.auditStatus === 'Original Customer Record' 
                              ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-purple-950/20 border border-purple-500/20 text-purple-300'
                          }`}>
                            {selectedCustomer.auditStatus}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Drawer Footer controls */}
                  <div className="p-6 border-t border-[#D4AF37]/15 bg-[#050505] flex gap-3">
                    <a
                      href={`tel:${selectedCustomer.phone || ''}`}
                      className="w-1/2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-center rounded-xl font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Call Customer
                    </a>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="w-1/2 py-3 bg-[#D4AF37] hover:bg-[#F4E2B8] text-[#050505] text-center rounded-xl font-bold transition-all text-xs uppercase tracking-wider cursor-pointer shadow-lg"
                    >
                      Close Drawer
                    </button>
                  </div>

                </motion.div>
              </div>
            )}
          </AnimatePresence>

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

                {/* Price Sizing Config */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4 border border-[#D4AF37]/15 p-4 rounded-2xl bg-[#050505]/60 text-left">
                  <div>
                    <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Base Size Name</label>
                    <input
                      type="text"
                      required
                      value={formSize1Name}
                      onChange={(e) => setFormSize1Name(e.target.value)}
                      className="w-full px-4 py-2 bg-[#050505] border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30 mb-3 text-xs"
                      placeholder="e.g. 350g"
                    />
                    <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Base Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-[#050505] border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30 text-xs"
                      placeholder="e.g. 449"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Large Size Name</label>
                    <input
                      type="text"
                      required
                      value={formSize2Name}
                      onChange={(e) => setFormSize2Name(e.target.value)}
                      className="w-full px-4 py-2 bg-[#050505] border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30 mb-3 text-xs"
                      placeholder="e.g. 750g"
                    />
                    <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Large Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      value={formPrice750g}
                      onChange={(e) => setFormPrice750g(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-[#050505] border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30 text-xs"
                      placeholder="e.g. 849"
                    />
                  </div>
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
                  <label className="text-[10px] text-cream-latte/60 uppercase tracking-wider mb-2 block font-bold">Admin Password</label>
                  <input
                    type="text"
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-espresso/50 border border-cream-latte/10 rounded-xl text-cream-latte focus:outline-none focus:border-warm-gold/30"
                    placeholder="e.g. securepass123"
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
                    <option value="Dispatcher">Dispatcher</option>
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
