/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  Restaurant,
  RestaurantStatus,
  SubscriptionPlan,
  Branch,
  RestaurantTable,
  TableStatus,
  TableSession,
  MenuCategory,
  MenuItem,
  MenuVariant,
  MenuAddon,
  Order,
  OrderStatus,
  OrderItem,
  ServiceRequestType,
  WaiterRequest,
  PaymentMethod,
  Payment,
  Feedback,
  Coupon,
  Banner,
  UserProfile,
  UserRole,
  Receipt,
  BillPrintLog,
  ReceiptStatus,
  getAuthorizedModulesForRole
} from './types';
import {
  INITIAL_RESTAURANTS,
  INITIAL_BRANCHES,
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_BANNERS,
  INITIAL_COUPONS,
  MOCK_ORDERS
} from './mockData';
import { APP_CONFIG } from './config/app';

const getTableStatusString = (s: TableStatus) => {
  switch (s) {
    case TableStatus.AVAILABLE: return 'Available';
    case TableStatus.OCCUPIED: return 'Occupied';
    case TableStatus.BILL_REQUESTED: return 'Bill Requested';
    case TableStatus.CLEANING: return 'Cleaning';
    case TableStatus.RESERVED: return 'Reserved';
    default: return 'Available';
  }
};

const toUUID = (id: string): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || uuidRegex.test(id)) return id;

  let hex = '';
  for (let i = 0; i < id.length; i++) {
    hex += id.charCodeAt(i).toString(16);
  }

  if (hex.length < 32) {
    hex = hex.padEnd(32, '0');
  } else {
    // FNV-1a 32-bit hash of the entire original string to guarantee uniqueness
    let h = 2166136261 >>> 0;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hashHex = (h >>> 0).toString(16).padStart(8, '0');
    hex = hex.substring(0, 24) + hashHex;
  }

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
};

interface CartItem {
  id: string; // unique cart entry id
  item: MenuItem;
  quantity: number;
  selectedVariant?: MenuVariant;
  selectedAddons: MenuAddon[];
  specialInstructions?: string;
}

interface AppStateContextType {
  restaurants: Restaurant[];
  branches: Branch[];
  tables: RestaurantTable[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  banners: Banner[];
  coupons: Coupon[];
  orders: Order[];
  waiterRequests: WaiterRequest[];
  feedbacks: Feedback[];
  activeSession: TableSession | null;
  tableSessions: TableSession[];
  cart: CartItem[];
  activeCoupon: Coupon | null;
  notifications: string[];
  
  // Billing Module States
  receipts: Receipt[];
  billPrintLogs: BillPrintLog[];
  adminUpdateBillingSettings: (restaurantId: string, settings: Partial<Restaurant>) => void;
  addBillPrintLog: (billNumber: string, action: 'print' | 'reprint') => void;
  generateReceipt: (sessionId: string, discountAmount?: number, couponCode?: string, serviceChargePercent?: number) => Receipt;
  updateReceiptStatus: (receiptId: string, status: ReceiptStatus, paymentMethod?: 'cash' | 'upi' | 'card') => void;
  
  // Navigation / View state
  currentRole: 'customer' | 'staff' | 'admin' | 'superadmin' | 'split';
  selectedRestaurantId: string;
  selectedBranchId: string;
  selectedTableId: string;
  staffSubRole: 'kitchen' | 'waiter' | 'cashier' | 'dashboard';
  isQrModalOpen: boolean;
  
  // Setters/Triggers
  setCurrentRole: (role: 'customer' | 'staff' | 'admin' | 'superadmin' | 'split') => void;
  setStaffSubRole: (subRole: 'kitchen' | 'waiter' | 'cashier' | 'dashboard') => void;
  setSelectedRestaurantId: (id: string) => void;
  setSelectedBranchId: (id: string) => void;
  setSelectedTableId: (id: string) => void;
  setIsQrModalOpen: (open: boolean) => void;
  setTables: React.Dispatch<React.SetStateAction<RestaurantTable[]>>;
  setTableSessions: React.Dispatch<React.SetStateAction<TableSession[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  
  // Simulation methods
  customerScanQR: (restaurantId: string, branchId: string, tableId: string) => void;
  customerEnterDetails: (name: string, phone?: string) => void;
  addToCart: (item: MenuItem, quantity: number, variant?: MenuVariant, addons?: MenuAddon[], instructions?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  customerPlaceOrder: () => void;
  customerRequestService: (type: ServiceRequestType) => void;
  
  // Staff methods
  staffAcceptOrder: (orderId: string) => void;
  staffStartPreparing: (orderId: string) => void;
  staffMarkReady: (orderId: string) => void;
  staffMarkServed: (orderId: string) => void;
  staffCompleteOrder: (orderId: string) => void;
  staffCancelOrder: (orderId: string) => void;
  waiterResolveRequest: (requestId: string) => void;
  cashierSettleTable: (sessionId: string, method: PaymentMethod) => { payment: Payment; invoiceUrl: string };
  staffMarkTableCleaned: (tableId: string) => void;
  
  // Admin methods
  adminAddCategory: (category: Omit<MenuCategory, 'id'>) => void;
  adminUpdateCategory: (categoryId: string, updates: Partial<MenuCategory>) => void;
  adminAddMenuItem: (menuItem: Omit<MenuItem, 'id'>) => void;
  adminUpdateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  adminToggleItemAvailability: (itemId: string) => void;
  adminAddCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  adminAddBanner: (banner: Omit<Banner, 'id'>) => void;
  adminDeleteBanner: (bannerId: string) => void;
  adminToggleBannerActive: (bannerId: string) => void;
  adminUpdateBanner: (bannerId: string, updates: Partial<Banner>) => void;
  adminAddTable: (table: Omit<RestaurantTable, 'id' | 'qrUrl'>) => { success: boolean; error?: string };
  adminUpdateTable: (tableId: string, updates: Partial<RestaurantTable>) => { success: boolean; error?: string };
  adminDeleteTable: (tableId: string) => void;
  adminAddBranch: (branch: Omit<Branch, 'id' | 'restaurantId'>) => { success: boolean; error?: string };
  adminUpdateBranch: (branchId: string, updates: Partial<Branch>) => { success: boolean; error?: string };
  adminDeleteBranch: (branchId: string) => { success: boolean; error?: string };
  
  // Super admin methods
  superAdminToggleRestaurantStatus: (restaurantId: string, status: RestaurantStatus) => void;
  superAdminUpdateRestaurantPlan: (restaurantId: string, plan: SubscriptionPlan) => void;
  superAdminCreateRestaurant: (restaurant: Omit<Restaurant, 'id' | 'rating'>) => { success: boolean; error?: string };
  superAdminDeleteRestaurant: (restaurantId: string) => { success: boolean; error?: string };
  
  // Feedback
  submitFeedback: (rating: number, comment: string) => void;
  
  // System Reset
  resetAllState: () => void;
  addSystemNotification: (message: string) => void;
  clearNotifications: () => void;

  // Authentication & Profiles state
  currentUser: UserProfile | null;
  users: UserProfile[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (params: {
    restaurantName: string;
    ownerName: string;
    email: string;
    phone: string;
    password?: string;
    businessAddress?: string;
    gstNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateOnboardingStep: (step: number) => void;
  verifyOnboardingEmail: () => void;
  onboardingSetupRestaurant: (params: Partial<Restaurant>) => Promise<{ success: boolean; error?: string }>;
  onboardingSetupBranch: (name: string, address: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  onboardingSetupTables: (count: number) => Promise<{ success: boolean; error?: string }>;
  addStaffMember: (fullName: string, email: string, role: string, branchId: string, phone?: string, password?: string, status?: 'active' | 'inactive') => { success: boolean; error?: string };
  updateStaffMember: (id: string, updates: Partial<UserProfile>) => void;
  deleteStaffMember: (id: string) => void;
  staffAddItemsToBill: (
    sessionId: string,
    items: { item: MenuItem; quantity: number; selectedVariant?: MenuVariant; selectedAddons: MenuAddon[]; specialInstructions?: string }[]
  ) => Promise<void>;
  staffUpdateOrderItemQuantity: (
    sessionId: string,
    orderId: string,
    orderItemId: string,
    newQuantity: number
  ) => Promise<void>;
}

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_super',
    email: 'superadmin@sizzlr.com',
    fullName: 'Sizzlr Admin',
    phone: '+1 (555) 019-2831',
    role: UserRole.SUPER_ADMIN,
    createdAt: '2026-01-01T00:00:00.000Z',
    isVerified: true,
    onboardingStep: 5,
    password: 'admin123'
  },
  {
    id: 'user_truffle_admin',
    email: 'admin@trufflebistro.com',
    fullName: 'Marco Silva',
    phone: '+1 (555) 234-5678',
    role: UserRole.RESTAURANT_ADMIN,
    restaurantId: 'rest_1',
    createdAt: '2026-01-02T00:00:00.000Z',
    isVerified: true,
    onboardingStep: 5,
    password: 'truffle123'
  },
  {
    id: 'user_truffle_manager',
    email: 'manager@trufflebistro.com',
    fullName: 'Sophia Ross',
    phone: '+1 (555) 234-1111',
    role: UserRole.MANAGER,
    restaurantId: 'rest_1',
    branchId: 'branch_1a',
    createdAt: '2026-01-03T00:00:00.000Z',
    isVerified: true,
    onboardingStep: 5,
    password: 'manager123'
  },
  {
    id: 'user_truffle_kitchen',
    email: 'kitchen@trufflebistro.com',
    fullName: 'Chef Luigi',
    phone: '+1 (555) 234-2222',
    role: UserRole.KITCHEN,
    restaurantId: 'rest_1',
    branchId: 'branch_1a',
    createdAt: '2026-01-03T00:00:00.000Z',
    isVerified: true,
    onboardingStep: 5,
    password: 'kitchen123'
  },
  {
    id: 'user_truffle_waiter',
    email: 'waiter@trufflebistro.com',
    fullName: 'Gianni Romano',
    phone: '+1 (555) 234-3333',
    role: UserRole.WAITER,
    restaurantId: 'rest_1',
    branchId: 'branch_1a',
    createdAt: '2026-01-03T00:00:00.000Z',
    isVerified: true,
    onboardingStep: 5,
    password: 'waiter123'
  },
  {
    id: 'user_truffle_cashier',
    email: 'cashier@trufflebistro.com',
    fullName: 'Elena Vance',
    phone: '+1 (555) 234-4444',
    role: UserRole.CASHIER,
    restaurantId: 'rest_1',
    branchId: 'branch_1a',
    createdAt: '2026-01-03T00:00:00.000Z',
    isVerified: true,
    onboardingStep: 5,
    password: 'cashier123'
  }
];

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  // Load initial state or defaults
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const saved = localStorage.getItem('qr_restaurants');
    const list: Restaurant[] = saved ? JSON.parse(saved) : INITIAL_RESTAURANTS;
    return list.map(r => ({ ...r, id: toUUID(r.id) }));
  });
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('qr_branches');
    const list: Branch[] = saved ? JSON.parse(saved) : INITIAL_BRANCHES;
    return list.map(b => ({ ...b, id: toUUID(b.id), restaurantId: toUUID(b.restaurantId) }));
  });
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const saved = localStorage.getItem('qr_tables');
    const list: RestaurantTable[] = saved ? JSON.parse(saved) : INITIAL_TABLES;
    return list.map((t) => ({
      ...t,
      id: toUUID(t.id),
      branchId: toUUID(t.branchId),
      restaurantId: toUUID(t.restaurantId),
      isActive: t.isActive !== false,
      qrUrl: `${APP_CONFIG.WEB_URL}/menu/${toUUID(t.restaurantId)}/${toUUID(t.branchId)}/${toUUID(t.id)}`,
    }));
  });

  const tablesRef = useRef<RestaurantTable[]>(tables);
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(() => {
    const saved = localStorage.getItem('qr_categories');
    const list: MenuCategory[] = saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    return list.map(c => ({ ...c, id: toUUID(c.id), restaurantId: toUUID(c.restaurantId) }));
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('qr_menuitems');
    const list: MenuItem[] = saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
    return list.map(item => ({
      ...item,
      id: toUUID(item.id),
      restaurantId: toUUID(item.restaurantId),
      categoryId: toUUID(item.categoryId)
    }));
  });
  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('qr_banners');
    const list: Banner[] = saved ? JSON.parse(saved) : INITIAL_BANNERS;
    return list.map(b => ({ ...b, id: toUUID(b.id), restaurantId: toUUID(b.restaurantId) }));
  });
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('qr_coupons');
    const list: Coupon[] = saved ? JSON.parse(saved) : INITIAL_COUPONS;
    return list.map(c => ({ ...c, id: toUUID(c.id), restaurantId: toUUID(c.restaurantId) }));
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('qr_orders');
    const list: Order[] = saved ? JSON.parse(saved) : MOCK_ORDERS;
    return list.map((o) => ({
      ...o,
      id: toUUID(o.id),
      sessionId: toUUID(o.sessionId),
      restaurantId: toUUID(o.restaurantId),
      branchId: toUUID(o.branchId),
      tableId: toUUID(o.tableId),
      items: o.items.map(it => ({
        ...it,
        id: toUUID(it.id),
        itemId: toUUID(it.itemId)
      }))
    }));
  });
  const [waiterRequests, setWaiterRequests] = useState<WaiterRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('qr_receipts');
    return saved ? JSON.parse(saved) : [];
  });
  const [billPrintLogs, setBillPrintLogs] = useState<BillPrintLog[]>(() => {
    const saved = localStorage.getItem('qr_print_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const getInitialTableSessions = (): TableSession[] => [
    {
      id: toUUID('sess_table_1_2'),
      tableId: toUUID('table_1_2'),
      restaurantId: toUUID('rest_1'),
      branchId: toUUID('branch_1a'),
      customerName: 'Marcus Aurelius',
      customerPhone: '+1 (555) 987-6543',
      joinedAt: new Date(Date.now() - 3600000).toISOString(),
      isActive: true,
      totalBill: 48.00,
      sessionToken: 'session_A1B2C3D4E5F6G7',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'ACTIVE',
      paymentStatus: 'pending',
    },
    {
      id: toUUID('sess_table_1_4'),
      tableId: toUUID('table_1_4'),
      restaurantId: toUUID('rest_1'),
      branchId: toUUID('branch_1a'),
      customerName: 'Sarah Connor',
      customerPhone: '+1 (555) 123-4567',
      joinedAt: new Date(Date.now() - 5400000).toISOString(),
      isActive: true,
      totalBill: 124.50,
      sessionToken: 'session_S8T9U0V1W2X3Y4',
      startedAt: new Date(Date.now() - 5400000).toISOString(),
      status: 'ACTIVE',
      paymentStatus: 'pending',
    },
    {
      id: toUUID('sess_table_2_2'),
      tableId: toUUID('table_2_2'),
      restaurantId: toUUID('rest_2'),
      branchId: toUUID('branch_2a'),
      customerName: 'Kenji Sato',
      customerPhone: '+1 (555) 543-2109',
      joinedAt: new Date(Date.now() - 1800000).toISOString(),
      isActive: true,
      totalBill: 34.00,
      sessionToken: 'session_K5J6I7H8G9F0E1',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      status: 'ACTIVE',
      paymentStatus: 'pending',
    },
    {
      id: toUUID('sess_table_3_2'),
      tableId: toUUID('table_3_2'),
      restaurantId: toUUID('rest_3'),
      branchId: toUUID('branch_3a'),
      customerName: 'John Doe',
      customerPhone: '+1 (555) 111-2222',
      joinedAt: new Date(Date.now() - 2400000).toISOString(),
      isActive: true,
      totalBill: 18.00,
      sessionToken: 'session_J1D2O3E4L5A6B7',
      startedAt: new Date(Date.now() - 2400000).toISOString(),
      status: 'ACTIVE',
      paymentStatus: 'pending',
    }
  ];

  const [tableSessions, setTableSessions] = useState<TableSession[]>(() => {
    const saved = localStorage.getItem('qr_table_sessions');
    return saved ? JSON.parse(saved) : getInitialTableSessions();
  });

  // Active Customer Session State
  const [activeSession, setActiveSession] = useState<TableSession | null>(() => {
    const saved = localStorage.getItem('qr_active_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  
  // Realtime System Notifications
  const [notifications, setNotifications] = useState<string[]>([]);

  // Navigation / View Context
  const [currentRole, setCurrentRole] = useState<'customer' | 'staff' | 'admin' | 'superadmin' | 'split'>('split');
  const [staffSubRole, setStaffSubRole] = useState<'dashboard' | 'kitchen' | 'waiter' | 'cashier'>('dashboard');
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(toUUID('rest_1'));
  const [selectedBranchId, setSelectedBranchId] = useState<string>(toUUID('branch_1a'));
  const [selectedTableId, setSelectedTableId] = useState<string>(toUUID('table_1_2')); // Start with Table 02 occupied
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Auth States
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('qr_users');
    const list: UserProfile[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return list.map(u => ({
      ...u,
      id: toUUID(u.id),
      restaurantId: u.restaurantId ? toUUID(u.restaurantId) : undefined,
      branchId: u.branchId ? toUUID(u.branchId) : undefined
    }));
  });

  const updateAndPersistUsers = (newUsersOrFn: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    setUsers((prev) => {
      const next = typeof newUsersOrFn === 'function' ? newUsersOrFn(prev) : newUsersOrFn;
      localStorage.setItem('qr_users', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('qr_users_updated', { detail: next }));
      return next;
    });
  };
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('qr_current_user');
    if (saved) {
      const user = JSON.parse(saved);
      return {
        ...user,
        id: toUUID(user.id),
        restaurantId: user.restaurantId ? toUUID(user.restaurantId) : undefined,
        branchId: user.branchId ? toUUID(user.branchId) : undefined,
        authorizedModules: getAuthorizedModulesForRole(user.role),
      };
    }
    return null;
  });

  const updateAndPersistCurrentUser = (newUser: UserProfile | null) => {
    setCurrentUser(newUser);
    if (newUser) {
      localStorage.setItem('qr_current_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('qr_current_user');
    }
    window.dispatchEvent(new CustomEvent('qr_current_user_updated', { detail: newUser }));
  };

  // Auto-Persist States
  useEffect(() => {
    localStorage.setItem('qr_restaurants', JSON.stringify(restaurants));
  }, [restaurants]);
  useEffect(() => {
    localStorage.setItem('qr_tables', JSON.stringify(tables));
  }, [tables]);
  useEffect(() => {
    localStorage.setItem('qr_categories', JSON.stringify(menuCategories));
  }, [menuCategories]);
  useEffect(() => {
    localStorage.setItem('qr_menuitems', JSON.stringify(menuItems));
  }, [menuItems]);
  useEffect(() => {
    localStorage.setItem('qr_coupons', JSON.stringify(coupons));
  }, [coupons]);
  useEffect(() => {
    localStorage.setItem('qr_banners', JSON.stringify(banners));
  }, [banners]);
  useEffect(() => {
    localStorage.setItem('qr_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('qr_table_sessions', JSON.stringify(tableSessions));
  }, [tableSessions]);
  useEffect(() => {
    localStorage.setItem('qr_active_session', JSON.stringify(activeSession));
  }, [activeSession]);
  useEffect(() => {
    localStorage.setItem('qr_receipts', JSON.stringify(receipts));
  }, [receipts]);
  useEffect(() => {
    localStorage.setItem('qr_print_logs', JSON.stringify(billPrintLogs));
  }, [billPrintLogs]);
  useEffect(() => {
    localStorage.setItem('qr_branches', JSON.stringify(branches));
  }, [branches]);

  // Sync users and current user dynamically when modified by repository
  useEffect(() => {
    const handleUsersUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setUsers(customEvent.detail);
      } else {
        const saved = localStorage.getItem('qr_users');
        if (saved) setUsers(JSON.parse(saved));
      }
    };

    const handleCurrentUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setCurrentUser(customEvent.detail);
      }
    };

    window.addEventListener('qr_users_updated', handleUsersUpdate);
    window.addEventListener('qr_current_user_updated', handleCurrentUserUpdate);

    return () => {
      window.removeEventListener('qr_users_updated', handleUsersUpdate);
      window.removeEventListener('qr_current_user_updated', handleCurrentUserUpdate);
    };
  }, []);

  // Toast notifier helper
  const addSystemNotification = (message: string) => {
    setNotifications((prev) => [message, ...prev].slice(0, 30));
  };
  const clearNotifications = () => setNotifications([]);

  const syncWithSupabase = async () => {
    try {
      const { data: dbRests, error: errRests } = await supabase.from('restaurants').select('*');
      if (errRests) throw errRests;

      let currentRests = dbRests;
      if (!dbRests || dbRests.length === 0) {
        addSystemNotification("🌱 Supabase is empty. Seeding mock dataset...");
        
        // 1. Seed Restaurants
        const { data: seededRests, error: seedRestErr } = await supabase
          .from('restaurants')
          .insert(INITIAL_RESTAURANTS.map((r) => ({
            id: toUUID(r.id),
            name: r.name,
            description: r.description,
            logo: r.logo,
            banner: r.banner,
            status: r.status,
            subscription_plan: r.plan,
            rating: r.rating || 5,
            cuisine: r.cuisine,
            primary_color: r.primaryColor,
            accent_color: r.accentColor,
            currency: r.currency,
            gst_percent: r.gstPercent,
            service_charge_percent: r.serviceChargePercent,
            phone: r.phone,
            email: r.email,
            address: r.address,
            business_hours: r.businessHours,
            receipt_header: r.receiptHeader,
            receipt_footer: r.receiptFooter,
            auto_print: r.autoPrint,
            printer_type: r.printerType,
            receipt_width: r.receiptWidth,
            logo_url: r.logoUrl,
            gstin: r.gstin,
            fssai: r.fssai
          })))
          .select();
        if (seedRestErr) throw seedRestErr;
        currentRests = seededRests;

        // 2. Seed Branches
        const { error: seedBranchErr } = await supabase
          .from('branches')
          .insert(INITIAL_BRANCHES.map((b) => ({
            id: toUUID(b.id),
            restaurant_id: toUUID(b.restaurantId),
            name: b.name,
            address: b.address,
            phone: b.phone,
            status: b.isActive !== false ? 'active' : 'inactive',
            is_default: b.isDefault || false
          })));
        if (seedBranchErr) throw seedBranchErr;

        // 3. Seed Tables

        const { error: seedTableErr } = await supabase
          .from('restaurant_tables')
          .insert(INITIAL_TABLES.map((t) => ({
            id: toUUID(t.id),
            branch_id: toUUID(t.branchId),
            restaurant_id: toUUID(t.restaurantId),
            table_name: t.tableNumber,
            capacity: t.seatingCapacity,
            status: getTableStatusString(t.status),
            permanent_qr_token: toUUID(t.id)
          })));
        if (seedTableErr) throw seedTableErr;

        // 4. Seed Menu Categories
        const { error: seedCatErr } = await supabase
          .from('menu_categories')
          .insert(INITIAL_CATEGORIES.map((c) => ({
            id: toUUID(c.id),
            restaurant_id: toUUID(c.restaurantId),
            name: c.name,
            icon: c.icon,
            sort_order: c.sortOrder,
            is_active: c.isActive !== false
          })));
        if (seedCatErr) throw seedCatErr;

        // 5. Seed Menu Items
        const { error: seedItemErr } = await supabase
          .from('menu_items')
          .insert(INITIAL_MENU_ITEMS.map((item) => ({
            id: toUUID(item.id),
            restaurant_id: toUUID(item.restaurantId),
            category_id: toUUID(item.categoryId),
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            veg: item.isVeg !== false,
            available: item.isAvailable !== false,
            popular: item.isPopular || false,
            preparation_time: 15
          })));
        if (seedItemErr) throw seedItemErr;

        addSystemNotification("✅ Supabase successfully seeded with default data!");
      }

      const { data: dbBranches } = await supabase.from('branches').select('*');
      const { data: dbTables } = await supabase.from('restaurant_tables').select('*');
      const { data: dbCats } = await supabase.from('menu_categories').select('*');
      const { data: dbItems } = await supabase.from('menu_items').select('*');
      const { data: dbSessions } = await supabase.from('table_sessions').select('*');
      const { data: dbOrders } = await supabase.from('orders').select('*');
      let { data: dbProfiles } = await supabase.from('profiles').select('*');

      if (!dbProfiles || dbProfiles.length === 0) {
        const { error: seedProfileErr } = await supabase
          .from('profiles')
          .insert(INITIAL_USERS.map((u) => ({
            id: toUUID(u.id),
            restaurant_id: u.restaurantId ? toUUID(u.restaurantId) : null,
            branch_id: u.branchId ? toUUID(u.branchId) : null,
            full_name: u.fullName,
            email: u.email.toLowerCase().trim(),
            phone: u.phone,
            role: u.role,
            status: u.status || 'active',
            profile_image: `pwd:${u.password}`
          })));

        if (seedProfileErr) {
          console.warn("Could not seed default profiles:", seedProfileErr.message);
        } else {
          const { data: refetched } = await supabase.from('profiles').select('*');
          if (refetched) {
            dbProfiles = refetched;
            addSystemNotification("👤 Default staff profiles seeded to Supabase!");
          }
        }
      }

      if (currentRests) {
        setRestaurants(currentRests.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          logo: r.logo || '',
          banner: r.banner || '',
          status: r.status,
          plan: r.subscription_plan,
          rating: Number(r.rating || 5),
          cuisine: r.cuisine || '',
          primaryColor: r.primary_color || '#1e1b18',
          accentColor: r.accent_color || '#d4af37',
          currency: r.currency || '₹',
          gstPercent: Number(r.gst_percent || 0),
          serviceChargePercent: Number(r.service_charge_percent || 0),
          phone: r.phone || '',
          email: r.email || '',
          address: r.address || '',
          businessHours: r.business_hours || '11:00 AM - 11:00 PM',
          receiptHeader: r.receipt_header || '',
          receiptFooter: r.receipt_footer || '',
          autoPrint: r.auto_print || false,
          printerType: r.printer_type || 'thermal_80mm',
          receiptWidth: r.receipt_width || '80mm',
          logoUrl: r.logo_url || '',
          gstin: r.gstin || '',
          fssai: r.fssai || '',
          waiterCanAddItems: r.waiter_can_add_items || false
        })));
      }
      if (dbBranches) {
        setBranches(dbBranches.map((b: any) => ({
          id: b.id,
          restaurantId: b.restaurant_id,
          name: b.name,
          address: b.address,
          phone: b.phone || '',
          isActive: b.status === 'active',
          isDefault: b.is_default || false
        })));
      }
      if (dbTables) {
        setTables(dbTables.map((t: any) => ({
          id: t.id,
          branchId: t.branch_id,
          restaurantId: t.restaurant_id,
          tableNumber: t.table_name,
          seatingCapacity: t.capacity,
          status: t.status.toLowerCase().replace(' ', '_') as TableStatus,
          isActive: t.status !== 'Cleaning' && t.status !== 'Reserved',
          qrUrl: `${APP_CONFIG.WEB_URL}/menu/${t.restaurant_id}/${t.branch_id}/${t.id}`
        })));
      }
      if (dbCats) {
        setMenuCategories(dbCats.map((c: any) => ({
          id: c.id,
          restaurantId: c.restaurant_id,
          name: c.name,
          icon: c.icon,
          sortOrder: c.sort_order,
          isActive: c.is_active
        })));
      }
      if (dbItems) {
        setMenuItems(dbItems.map((item: any) => ({
          id: item.id,
          restaurantId: item.restaurant_id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          image: item.image || '',
          isVeg: item.veg !== false,
          isAvailable: item.available !== false,
          isPopular: item.popular || false,
          isSpicy: false,
          isSweet: false,
          isSpecial: false,
          prepTimeMinutes: item.preparation_time || 15,
          variants: [],
          addons: []
        })));
      }
      if (dbSessions) {
        setTableSessions(dbSessions.map((s: any) => ({
          id: s.id,
          tableId: s.table_id,
          restaurantId: s.restaurant_id,
          branchId: s.branch_id,
          customerName: s.customer_name || '',
          customerPhone: s.customer_phone || '',
          joinedAt: s.started_at,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          isActive: s.status === 'Active',
          status: s.status,
          paymentStatus: s.payment_status,
          totalBill: 0 // Will aggregate from orders
        })));
      }
      if (dbOrders) {
        const { data: dbOrderItems } = await supabase.from('order_items').select('*');
        setOrders(dbOrders.map((o: any) => {
          const tbl = dbTables ? dbTables.find((t: any) => t.id === o.table_id) : null;
          const items = dbOrderItems ? dbOrderItems.filter((oi: any) => oi.order_id === o.id).map((oi: any) => {
            const menuItem = dbItems ? dbItems.find((i: any) => i.id === oi.menu_item_id) : null;
            return {
               id: oi.id,
               itemId: oi.menu_item_id,
               name: menuItem ? menuItem.name : 'Unknown Item',
               quantity: oi.quantity,
               price: Number(oi.price),
               selectedVariant: oi.variant ? (typeof oi.variant === 'string' ? JSON.parse(oi.variant) : oi.variant) : undefined,
               selectedAddons: oi.addons ? (typeof oi.addons === 'string' ? JSON.parse(oi.addons) : oi.addons) : [],
               specialInstructions: oi.notes || ''
             };
          }) : [];

          return {
            id: o.id,
            sessionId: o.session_id,
            restaurantId: o.restaurant_id,
            branchId: o.branch_id,
            tableId: o.table_id,
            tableNumber: tbl ? tbl.table_name : '1',
            status: o.status,
            items,
            subtotal: Number(o.subtotal || 0),
            gstAmount: Number(o.tax || 0),
            serviceChargeAmount: Number(o.service_charge || 0),
            discountAmount: Number(o.discount || 0),
            totalAmount: Number(o.grand_total || o.total_amount || 0),
            createdAt: o.created_at,
            updatedAt: o.created_at || new Date().toISOString()
          };
        }));
      }

      if (dbProfiles) {
        const loadedUsers: UserProfile[] = dbProfiles.map((p: any) => {
          let userPassword = 'staff123';
          if (p.profile_image && p.profile_image.startsWith('pwd:')) {
            userPassword = p.profile_image.substring(4);
          }
          return {
            id: p.id,
            email: p.email,
            fullName: p.full_name,
            phone: p.phone || '',
            role: p.role as UserRole,
            restaurantId: p.restaurant_id || undefined,
            branchId: p.branch_id || undefined,
            createdAt: p.created_at,
            isVerified: true,
            onboardingStep: 5,
            status: p.status || 'active',
            password: userPassword,
            profileImage: p.profile_image && p.profile_image.startsWith('pwd:') ? '' : p.profile_image
          };
        });
        setUsers((prev) => {
          const merged = [...prev];
          loadedUsers.forEach((u) => {
            const idx = merged.findIndex((x) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase());
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...u };
            } else {
              merged.push(u);
            }
          });
          localStorage.setItem('qr_users', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err: any) {
      console.error("Supabase load error:", err.message);
    }
  };

  useEffect(() => {
    syncWithSupabase();

    const sessionChannel = supabase
      .channel('realtime:table_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const s = payload.new;
          setTableSessions((prev) => {
            if (prev.some((x) => x.id === s.id)) return prev;
            return [...prev, {
              id: s.id,
              tableId: s.table_id,
              restaurantId: s.restaurant_id,
              branchId: s.branch_id,
              customerName: s.customer_name || '',
              customerPhone: s.customer_phone || '',
              joinedAt: s.started_at,
              startedAt: s.started_at,
              endedAt: s.ended_at,
              isActive: s.status === 'Active',
              status: s.status,
              paymentStatus: s.payment_status,
              totalBill: 0
            }];
          });
        } else if (payload.eventType === 'UPDATE') {
          const s = payload.new;
          const updatedSess = {
            id: s.id,
            tableId: s.table_id,
            restaurantId: s.restaurant_id,
            branchId: s.branch_id,
            customerName: s.customer_name || '',
            customerPhone: s.customer_phone || '',
            joinedAt: s.started_at,
            startedAt: s.started_at,
            endedAt: s.ended_at,
            isActive: s.status === 'Active',
            status: s.status,
            paymentStatus: s.payment_status,
            totalBill: 0
          };
          setTableSessions((prev) => prev.map((x) => x.id === s.id ? updatedSess : x));
          setActiveSession((prev) => prev && prev.id === s.id ? updatedSess : prev);
        } else if (payload.eventType === 'DELETE') {
          setTableSessions((prev) => prev.filter((x) => x.id !== payload.old.id));
        }
      })
      .subscribe();

    const tableChannel = supabase
      .channel('realtime:restaurant_tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const t = payload.new;
          setTables((prev) => prev.map((x) => x.id === t.id ? {
            ...x,
            status: t.status.toLowerCase().replace(' ', '_') as TableStatus,
            isActive: t.status !== 'Cleaning' && t.status !== 'Reserved',
            seatingCapacity: t.capacity,
            tableNumber: t.table_name
          } : x));
        }
      })
      .subscribe();

    const orderChannel = supabase
      .channel('realtime:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const o = payload.new;
          const { data: dbItems } = await supabase.from('order_items').select('*').eq('order_id', o.id);
          const { data: menuItemsData } = await supabase.from('menu_items').select('*');
          const items = dbItems ? dbItems.map((oi: any) => {
            const menuItem = menuItemsData ? menuItemsData.find((i: any) => i.id === oi.menu_item_id) : null;
            return {
              id: oi.id,
              itemId: oi.menu_item_id,
              name: menuItem ? menuItem.name : 'Unknown Item',
              quantity: oi.quantity,
              price: Number(oi.price),
              selectedVariant: oi.variant ? (typeof oi.variant === 'string' ? JSON.parse(oi.variant) : oi.variant) : undefined,
              selectedAddons: oi.addons ? (typeof oi.addons === 'string' ? JSON.parse(oi.addons) : oi.addons) : [],
              specialInstructions: oi.notes || ''
            };
          }) : [];

          const tbl = tablesRef.current.find((x) => x.id === o.table_id);

          const newOrder: Order = {
            id: o.id,
            sessionId: o.session_id,
            restaurantId: o.restaurant_id,
            branchId: o.branch_id,
            tableId: o.table_id,
            tableNumber: tbl ? tbl.tableNumber : '1',
            status: o.status,
            items,
            subtotal: Number(o.subtotal || 0),
            gstAmount: Number(o.tax || 0),
            serviceChargeAmount: Number(o.service_charge || 0),
            discountAmount: Number(o.discount || 0),
            totalAmount: Number(o.grand_total || o.total_amount || 0),
            createdAt: o.created_at,
            updatedAt: o.created_at || new Date().toISOString()
          };

          setOrders((prev) => {
            if (prev.some((x) => x.id === o.id)) return prev;
            return [newOrder, ...prev];
          });
          
          addSystemNotification(`⚡ New order placed for Table ${tbl ? tbl.tableNumber : '00'}!`);
        } else if (payload.eventType === 'UPDATE') {
          const o = payload.new;
          setOrders((prev) => prev.map((x) => x.id === o.id ? {
            ...x,
            status: o.status,
            totalAmount: Number(o.grand_total || o.total_amount || 0),
            subtotal: Number(o.subtotal || 0),
            gstAmount: Number(o.tax || 0),
            serviceChargeAmount: Number(o.service_charge || 0),
            discountAmount: Number(o.discount || 0)
          } : x));
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((x) => x.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(tableChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  // Simulation: Reset All State
  const resetAllState = async () => {
    addSystemNotification('💻 Sandbox database successfully resetting...');
    localStorage.clear();

    try {
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('table_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('menu_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      await syncWithSupabase();
      
      setWaiterRequests([]);
      setFeedbacks([]);
      setActiveSession(null);
      setCart([]);
      setActiveCoupon(null);
      setSelectedRestaurantId(toUUID('rest_1'));
      setSelectedBranchId(toUUID('branch_1a'));
      setSelectedTableId(toUUID('table_1_2'));
      addSystemNotification('💻 Sandbox database successfully reset to factory defaults.');
    } catch (e: any) {
      console.error("Failed to reset database:", e.message);
    }
  };

  const generateSessionToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = 'session_';
    for (let i = 0; i < 14; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Simulation: Customer scans QR Code
  const customerScanQR = async (restaurantId: string, branchId: string, tableId: string) => {
    setSelectedRestaurantId(restaurantId);
    setSelectedBranchId(branchId);
    setSelectedTableId(tableId);

    const tbl = tables.find((t) => t.id === tableId);

    try {
      const { data: dbSessions } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'Active')
        .limit(1);

      if (dbSessions && dbSessions.length > 0) {
        const s = dbSessions[0];
        const restoredSess: TableSession = {
          id: s.id,
          tableId: s.table_id,
          restaurantId: s.restaurant_id,
          branchId: s.branch_id,
          customerName: s.customer_name || '',
          customerPhone: s.customer_phone || '',
          joinedAt: s.started_at,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          isActive: s.status === 'Active',
          status: s.status,
          paymentStatus: s.payment_status,
          totalBill: 0
        };
        setActiveSession(restoredSess);
        setTableSessions((prev) => prev.map((x) => x.id === restoredSess.id ? restoredSess : x));
        addSystemNotification(`📲 Restored active session on Table ${tbl?.tableNumber || ''}`);
      } else {
        const newSessId = crypto.randomUUID();
        const newSessToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { data: newSess, error } = await supabase
          .from('table_sessions')
          .insert([{
            id: newSessId,
            session_token: newSessToken,
            table_id: tableId,
            restaurant_id: restaurantId,
            branch_id: branchId,
            customer_name: '',
            customer_phone: '',
            status: 'Active',
            payment_status: 'pending'
          }])
          .select()
          .single();
        if (error) throw error;

        const createdSess: TableSession = {
          id: newSess.id,
          tableId: newSess.table_id,
          restaurantId: newSess.restaurant_id,
          branchId: newSess.branch_id,
          customerName: newSess.customer_name || '',
          customerPhone: newSess.customer_phone || '',
          joinedAt: newSess.started_at,
          startedAt: newSess.started_at,
          endedAt: newSess.ended_at,
          isActive: newSess.status === 'Active',
          status: newSess.status,
          paymentStatus: newSess.payment_status,
          totalBill: 0
        };
        setTableSessions((prev) => [...prev, createdSess]);
        setActiveSession(createdSess);
        setCart([]);
        setActiveCoupon(null);
        addSystemNotification(`📲 Generated new table session.`);
      }
    } catch (err: any) {
      console.error("Failed to scan QR / join session:", err.message);
    }
  };

  // Simulation: Customer Enters Guest Details
  const customerEnterDetails = async (name: string, phone?: string) => {
    if (!activeSession) return;

    const updatedSess = { ...activeSession, customerName: name || 'Guest', customerPhone: phone };
    setActiveSession(updatedSess);
    setTableSessions((prev) => prev.map((s) => s.id === activeSession.id ? updatedSess : s));
    setTables((prev) => prev.map((t) => t.id === activeSession.tableId ? { ...t, status: TableStatus.OCCUPIED } : t));

    try {
      const { error: sessErr } = await supabase
        .from('table_sessions')
        .update({
          customer_name: name || 'Guest',
          customer_phone: phone
        })
        .eq('id', activeSession.id);
      if (sessErr) throw sessErr;

      const { error: tblErr } = await supabase
        .from('restaurant_tables')
        .update({ status: 'Occupied' })
        .eq('id', activeSession.tableId);
      if (tblErr) throw tblErr;

      addSystemNotification(`👤 Guest "${name || 'Guest'}" checked into Table.`);
    } catch (err: any) {
      console.error("Failed to enter details:", err.message);
    }
  };

  // Cart operations
  const addToCart = (
    item: MenuItem,
    quantity: number,
    variant?: MenuVariant,
    addons: MenuAddon[] = [],
    instructions?: string
  ) => {
    setCart((prev) => {
      // Unique matching logic based on item, variant and addons selection
      const existingIndex = prev.findIndex(
        (c) =>
          c.item.id === item.id &&
          c.selectedVariant?.id === variant?.id &&
          c.selectedAddons.length === addons.length &&
          c.selectedAddons.every((a) => addons.some((o) => o.id === a.id))
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          item,
          quantity,
          selectedVariant: variant,
          selectedAddons: addons,
          specialInstructions: instructions,
        },
      ];
    });

    addSystemNotification(`🛒 Added ${quantity}x ${item.name} to cart`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.id === cartItemId ? { ...c, quantity: qty } : c))
    );
  };

  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  // Apply Coupon
  const applyCouponCode = (code: string) => {
    const coupon = coupons.find(
      (c) => c.restaurantId === selectedRestaurantId && c.code.toUpperCase() === code.trim().toUpperCase()
    );

    if (!coupon) {
      return { success: false, message: 'Invalid coupon code.' };
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date('2026-07-01')) {
      return { success: false, message: 'Coupon has expired.' };
    }

    // Minimum amount check
    const cartSubtotal = cart.reduce((acc, c) => {
      const itemPrice = c.item.price + (c.selectedVariant?.price || 0);
      const addonsPrice = c.selectedAddons.reduce((sa, a) => sa + a.price, 0);
      return acc + (itemPrice + addonsPrice) * c.quantity;
    }, 0);

    if (cartSubtotal < coupon.minOrderAmount) {
      return {
        success: false,
        message: `Minimum order of ${
          restaurants.find((r) => r.id === selectedRestaurantId)?.currency || '₹'
        }${coupon.minOrderAmount} required.`,
      };
    }

    setActiveCoupon(coupon);
    addSystemNotification(`🎟️ Coupon ${coupon.code} applied successfully!`);
    return { success: true, message: 'Coupon applied!' };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
  };

  // Simulation: Customer places order
  const customerPlaceOrder = async () => {
    if (!activeSession || cart.length === 0) return;

    // Validate the active session token (Security requirement)
    const sessionInDb = tableSessions.find((s) => s.id === activeSession.id);
    if (!sessionInDb || !sessionInDb.isActive) {
      alert("Session expired. Please scan the QR code again.");
      setActiveSession(null);
      setCart([]);
      return;
    }

    // Resolve details purely from the valid session token
    const rest = restaurants.find((r) => r.id === sessionInDb.restaurantId);
    if (!rest) return;

    // Calculate billing
    const subtotal = cart.reduce((acc, c) => {
      const itemPrice = c.item.price + (c.selectedVariant?.price || 0);
      const addonsPrice = c.selectedAddons.reduce((sa, a) => sa + a.price, 0);
      return acc + (itemPrice + addonsPrice) * c.quantity;
    }, 0);

    // Apply Coupon discount
    let discountAmount = 0;
    if (activeCoupon) {
      if (activeCoupon.discountPercent) {
        discountAmount = (subtotal * activeCoupon.discountPercent) / 100;
        if (activeCoupon.maxDiscount && discountAmount > activeCoupon.maxDiscount) {
          discountAmount = activeCoupon.maxDiscount;
        }
      } else if (activeCoupon.discountFlat) {
        discountAmount = activeCoupon.discountFlat;
      }
    }

    const gstAmount = parseFloat(((subtotal - discountAmount) * (rest.gstPercent / 100)).toFixed(2));
    const serviceChargeAmount = parseFloat(
      ((subtotal - discountAmount) * (rest.serviceChargePercent / 100)).toFixed(2)
    );
    const totalAmount = parseFloat((subtotal - discountAmount + gstAmount + serviceChargeAmount).toFixed(2));

    const tbl = tables.find((t) => t.id === activeSession.tableId);
    const orderId = toUUID(`ord_${Date.now()}`);

    const orderItems: OrderItem[] = cart.map((c) => ({
      id: `orditem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemId: c.item.id,
      name: c.item.name,
      quantity: c.quantity,
      price: c.item.price + (c.selectedVariant?.price || 0) + c.selectedAddons.reduce((a, b) => a + b.price, 0),
      selectedVariant: c.selectedVariant,
      selectedAddons: c.selectedAddons,
      specialInstructions: c.specialInstructions,
    }));

    const newOrder: Order = {
      id: orderId,
      sessionId: activeSession.id,
      restaurantId: activeSession.restaurantId,
      branchId: activeSession.branchId,
      tableId: activeSession.tableId,
      tableNumber: tbl?.tableNumber || '00',
      status: OrderStatus.PENDING,
      items: orderItems,
      subtotal,
      gstAmount,
      serviceChargeAmount,
      discountAmount,
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Append to global orders list
    setOrders((prev) => [newOrder, ...prev]);

    // Update session running bill
    setActiveSession((prev) => (prev ? { ...prev, totalBill: prev.totalBill + totalAmount } : null));

    // Also update this session in our list of sessions
    setTableSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, totalBill: s.totalBill + totalAmount }
          : s
      )
    );

    // Clear cart and coupon
    setCart([]);
    setActiveCoupon(null);

    try {
      const { error: orderErr } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          session_id: activeSession.id,
          restaurant_id: activeSession.restaurantId,
          branch_id: activeSession.branchId,
          table_id: activeSession.tableId,
          status: 'pending',
          subtotal: subtotal,
          tax: gstAmount,
          service_charge: serviceChargeAmount,
          discount: discountAmount,
          grand_total: totalAmount,
          source: 'Customer QR'
        }]);
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(cart.map((c) => ({
          order_id: orderId,
          menu_item_id: c.item.id,
          quantity: c.quantity,
          price: c.item.price + (c.selectedVariant?.price || 0) + c.selectedAddons.reduce((a, b) => a + b.price, 0),
          variant: c.selectedVariant || null,
          addons: c.selectedAddons,
          notes: c.specialInstructions || null
        })));
      if (itemsErr) throw itemsErr;

      addSystemNotification(
        `🔔 NEW ORDER! Table ${tbl?.tableNumber || '00'} placed an order of ${rest.currency}${totalAmount}.`
      );
    } catch (err: any) {
      console.error("Failed to place order in Supabase:", err.message);
    }
  };

  // Customer triggers Water/Waiter/Tissue/Bill Request
  const customerRequestService = (type: ServiceRequestType) => {
    if (!activeSession) return;

    // Validate the active session token (Security requirement)
    const sessionInDb = tableSessions.find((s) => s.id === activeSession.id);
    if (!sessionInDb || !sessionInDb.isActive || sessionInDb.status !== 'ACTIVE') {
      alert("Session expired. Please scan the QR code again.");
      setActiveSession(null);
      setCart([]);
      return;
    }

    const tbl = tables.find((t) => t.id === sessionInDb.tableId);
    if (!tbl) return;

    const requestName =
      type === ServiceRequestType.CALL_WAITER
        ? 'Waiter Call'
        : type === ServiceRequestType.REQUEST_WATER
        ? 'Water Bottle'
        : type === ServiceRequestType.REQUEST_TISSUE
        ? 'Tissue Box'
        : 'Final Bill';

    const newReq: WaiterRequest = {
      id: `req_${Date.now()}`,
      sessionId: sessionInDb.id,
      restaurantId: sessionInDb.restaurantId,
      branchId: sessionInDb.branchId,
      tableId: sessionInDb.tableId,
      tableNumber: tbl.tableNumber,
      type,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setWaiterRequests((prev) => [newReq, ...prev]);

    // If requesting bill, update Table status to BILL_REQUESTED
    if (type === ServiceRequestType.REQUEST_BILL) {
      setTables((prev) =>
        prev.map((t) => (t.id === sessionInDb.tableId ? { ...t, status: TableStatus.BILL_REQUESTED } : t))
      );
    }

    addSystemNotification(`⚡ Service Request Sent: Table ${tbl.tableNumber} requested [${requestName}].`);
  };

  // Staff order flow updates
  const updateOrderStatus = async (orderId: string, status: OrderStatus, notifyMsg: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    addSystemNotification(notifyMsg);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    } catch (e: any) {
      console.error("Failed to update order status in Supabase:", e.message);
    }
  };

  const staffAcceptOrder = (orderId: string) => {
    const o = orders.find((ord) => ord.id === orderId);
    updateOrderStatus(orderId, OrderStatus.ACCEPTED, `👨‍🍳 Order ${orderId.substr(-4)} ACCEPTED by kitchen.`);
  };

  const staffStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.PREPARING, `🔥 Order ${orderId.substr(-4)} is now BEING PREPARED.`);
  };

  const staffMarkReady = (orderId: string) => {
    const o = orders.find((ord) => ord.id === orderId);
    updateOrderStatus(orderId, OrderStatus.READY, `🍽️ Order ${orderId.substr(-4)} is READY for Table ${o?.tableNumber || 'Auto'}.`);
  };

  const staffMarkServed = (orderId: string) => {
    const o = orders.find((ord) => ord.id === orderId);
    updateOrderStatus(orderId, OrderStatus.SERVED, `✅ Order ${orderId.substr(-4)} SERVED to Table ${o?.tableNumber || 'Auto'}.`);
  };

  const staffCompleteOrder = (orderId: string) => {
    const o = orders.find((ord) => ord.id === orderId);
    updateOrderStatus(orderId, OrderStatus.COMPLETED, `🏁 Order ${orderId.substr(-4)} marked as COMPLETED.`);
  };

  const staffCancelOrder = (orderId: string) => {
    const o = orders.find((ord) => ord.id === orderId);
    updateOrderStatus(orderId, OrderStatus.CANCELLED, `❌ Order ${orderId.substr(-4)} CANCELLED.`);
  };

  // Waiter completes service requests
  const waiterResolveRequest = (requestId: string) => {
    setWaiterRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'resolved' as const } : r))
    );
    const req = waiterRequests.find((r) => r.id === requestId);
    if (req) {
      addSystemNotification(`✅ Request resolved on Table ${req.tableNumber}`);
    }
  };

  // Cashier settles table session
  const cashierSettleTable = (sessionId: string, method: PaymentMethod) => {
    // Find all uncompleted orders of this session and complete them
    const sessOrders = orders.filter((o) => o.sessionId === sessionId);
    
    // Calculate total amount
    const totalCollected = sessOrders.reduce((sum, o) => {
      if (o.status !== OrderStatus.CANCELLED) {
        return sum + o.totalAmount;
      }
      return sum;
    }, 0);

    const activeReq = waiterRequests.find((r) => r.sessionId === sessionId && r.type === ServiceRequestType.REQUEST_BILL);
    const tblId = activeReq?.tableId || sessOrders[0]?.tableId || selectedTableId;
    const restId = activeReq?.restaurantId || sessOrders[0]?.restaurantId || selectedRestaurantId;

    const payment: Payment = {
      id: `pay_${Date.now()}`,
      orderIds: sessOrders.map((o) => o.id),
      sessionId,
      restaurantId: restId,
      amount: totalCollected,
      method,
      status: 'completed',
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    // Close session orders
    setOrders((prev) =>
      prev.map((o) =>
        o.sessionId === sessionId && o.status !== OrderStatus.CANCELLED
          ? { ...o, status: OrderStatus.COMPLETED, updatedAt: new Date().toISOString() }
          : o
      )
    );

    // Resolve any remaining requests for this session
    setWaiterRequests((prev) =>
      prev.map((r) => (r.sessionId === sessionId ? { ...r, status: 'resolved' } : r))
    );

    // Set Table to Cleaning State
    setTables((prev) =>
      prev.map((t) => (t.id === tblId ? { ...t, status: TableStatus.CLEANING } : t))
    );

    // If this is the active simulated customer session, end activeSession
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(null);
    }

    // Invalidate the session immediately and close in table_sessions database
    setTableSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              isActive: false,
              endedAt: new Date().toISOString(),
              status: 'COMPLETED',
              paymentStatus: 'completed',
            }
          : s
      )
    );

    // Persist updates to Supabase
    supabase.from('table_sessions').update({ status: 'Completed', payment_status: 'completed', ended_at: new Date().toISOString() }).eq('id', sessionId).then();
    supabase.from('restaurant_tables').update({ status: 'Cleaning' }).eq('id', tblId).then();
    supabase.from('orders').update({ status: 'completed' }).eq('session_id', sessionId).then();

    addSystemNotification(
      `💳 Settled Session ${sessionId.substr(-4)} via [${method.toUpperCase()}]. Table placed in CLEANING state.`
    );

    return { payment, invoiceUrl: '#' };
  };

  const staffMarkTableCleaned = (tableId: string) => {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: TableStatus.AVAILABLE } : t)));
    addSystemNotification(`🧼 Table ${tables.find((t) => t.id === tableId)?.tableNumber} cleaned and now AVAILABLE.`);

    supabase.from('restaurant_tables').update({ status: 'Available' }).eq('id', tableId).then();
  };

  const staffAddItemsToBill = async (
    sessionId: string,
    items: { item: MenuItem; quantity: number; selectedVariant?: MenuVariant; selectedAddons: MenuAddon[]; specialInstructions?: string }[]
  ) => {
    if (items.length === 0) return;

    const sessionInDb = tableSessions.find((s) => s.id === sessionId);
    if (!sessionInDb) {
      addSystemNotification("⚠️ Table session not found.");
      return;
    }

    const rest = restaurants.find((r) => r.id === sessionInDb.restaurantId);
    if (!rest) return;

    const tbl = tables.find((t) => t.id === sessionInDb.tableId);

    const subtotal = items.reduce((acc, c) => {
      const itemPrice = c.item.price + (c.selectedVariant?.price || 0);
      const addonsPrice = c.selectedAddons.reduce((sa, a) => sa + a.price, 0);
      return acc + (itemPrice + addonsPrice) * c.quantity;
    }, 0);

    const gstAmount = parseFloat((subtotal * (rest.gstPercent / 100)).toFixed(2));
    const serviceChargeAmount = parseFloat((subtotal * (rest.serviceChargePercent / 100)).toFixed(2));
    const totalAmount = parseFloat((subtotal + gstAmount + serviceChargeAmount).toFixed(2));

    const orderId = toUUID(`ord_${Date.now()}`);
    const orderItems: OrderItem[] = items.map((c) => ({
      id: `orditem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemId: c.item.id,
      name: c.item.name,
      quantity: c.quantity,
      price: c.item.price + (c.selectedVariant?.price || 0) + c.selectedAddons.reduce((a, b) => a + b.price, 0),
      selectedVariant: c.selectedVariant,
      selectedAddons: c.selectedAddons,
      specialInstructions: c.specialInstructions,
      addedBy: currentUser?.fullName || 'Staff',
      addedByRole: currentUser?.role || UserRole.CASHIER,
      addedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: currentUser?.role === UserRole.WAITER ? 'Waiter POS' : 'Cashier POS'
    }));

    const newOrder: Order = {
      id: orderId,
      sessionId: sessionInDb.id,
      restaurantId: sessionInDb.restaurantId,
      branchId: sessionInDb.branchId,
      tableId: sessionInDb.tableId,
      tableNumber: tbl?.tableNumber || '00',
      status: OrderStatus.PENDING,
      items: orderItems,
      subtotal,
      gstAmount,
      serviceChargeAmount,
      discountAmount: 0,
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addedBy: currentUser?.fullName || 'Staff',
      addedByRole: currentUser?.role || UserRole.CASHIER,
      source: currentUser?.role === UserRole.WAITER ? 'Waiter POS' : 'Cashier POS'
    };

    setOrders((prev) => [newOrder, ...prev]);

    const updatedSess = { ...sessionInDb, totalBill: sessionInDb.totalBill + totalAmount };
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(updatedSess);
    }
    setTableSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? updatedSess : s))
    );

    try {
      const { error: orderErr } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          session_id: sessionId,
          restaurant_id: sessionInDb.restaurantId,
          branch_id: sessionInDb.branchId,
          table_id: sessionInDb.tableId,
          status: 'pending',
          subtotal,
          tax: gstAmount,
          service_charge: serviceChargeAmount,
          discount: 0,
          grand_total: totalAmount,
          source: currentUser?.role === UserRole.WAITER ? 'Waiter' : 'Cashier'
        }]);
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(items.map((c) => ({
          order_id: orderId,
          menu_item_id: c.item.id,
          quantity: c.quantity,
          price: c.item.price + (c.selectedVariant?.price || 0) + c.selectedAddons.reduce((a, b) => a + b.price, 0),
          variant: c.selectedVariant || null,
          addons: c.selectedAddons,
          notes: c.specialInstructions || null
        })));
      if (itemsErr) throw itemsErr;

      // Log to audit_logs
      if (currentUser?.id) {
        supabase.from('audit_logs').insert([{
          restaurant_id: sessionInDb.restaurantId,
          user_id: currentUser.id,
          action: 'ADD_ITEMS',
          details: { sessionId, orderId, itemsCount: items.length }
        }]).then();
      }

      addSystemNotification(
        `🔔 Items added manually to Table ${tbl?.tableNumber || '00'}! Total: ${rest.currency}${totalAmount}`
      );
    } catch (err: any) {
      console.error("Failed to add items to bill in Supabase:", err.message);
    }
  };

  const staffUpdateOrderItemQuantity = async (
    sessionId: string,
    orderId: string,
    orderItemId: string,
    newQuantity: number
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const sessionInDb = tableSessions.find((s) => s.id === sessionId);
    if (!sessionInDb) return;

    const rest = restaurants.find((r) => r.id === sessionInDb.restaurantId);
    if (!rest) return;

    let updatedOrder: Order | null = null;
    let priceDiff = 0;

    const targetItem = order.items.find((it) => it.id === orderItemId);
    if (!targetItem) return;

    const oldTotal = targetItem.price * targetItem.quantity;

    if (newQuantity <= 0) {
      priceDiff = -oldTotal;
      const remainingItems = order.items.filter((it) => it.id !== orderItemId);
      
      if (remainingItems.length === 0) {
        updatedOrder = {
          ...order,
          items: [],
          subtotal: 0,
          gstAmount: 0,
          serviceChargeAmount: 0,
          totalAmount: 0,
          status: OrderStatus.CANCELLED,
          updatedAt: new Date().toISOString()
        };
        priceDiff = -order.totalAmount;
      } else {
        const newSubtotal = order.subtotal + priceDiff;
        const newGst = parseFloat((newSubtotal * (rest.gstPercent / 100)).toFixed(2));
        const newSrv = parseFloat((newSubtotal * (rest.serviceChargePercent / 100)).toFixed(2));
        const newTotal = parseFloat((newSubtotal + newGst + newSrv).toFixed(2));
        priceDiff = newTotal - order.totalAmount;

        updatedOrder = {
          ...order,
          items: remainingItems,
          subtotal: newSubtotal,
          gstAmount: newGst,
          serviceChargeAmount: newSrv,
          totalAmount: newTotal,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newTotalForItem = targetItem.price * newQuantity;
      priceDiff = newTotalForItem - oldTotal;

      const updatedItems = order.items.map((it) =>
        it.id === orderItemId ? { ...it, quantity: newQuantity } : it
      );

      const newSubtotal = order.subtotal + priceDiff;
      const newGst = parseFloat((newSubtotal * (rest.gstPercent / 100)).toFixed(2));
      const newSrv = parseFloat((newSubtotal * (rest.serviceChargePercent / 100)).toFixed(2));
      const newTotal = parseFloat((newSubtotal + newGst + newSrv).toFixed(2));
      priceDiff = newTotal - order.totalAmount;

      updatedOrder = {
        ...order,
        items: updatedItems,
        subtotal: newSubtotal,
        gstAmount: newGst,
        serviceChargeAmount: newSrv,
        totalAmount: newTotal,
        updatedAt: new Date().toISOString()
      };
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder! : o)));

    const newSessTotal = parseFloat(Math.max(0, sessionInDb.totalBill + priceDiff).toFixed(2));
    const updatedSess = { ...sessionInDb, totalBill: newSessTotal };
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(updatedSess);
    }
    setTableSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? updatedSess : s))
    );

    try {
      if (newQuantity <= 0 && updatedOrder.items.length === 0) {
        await supabase.from('order_items').delete().eq('id', orderItemId);
        await supabase.from('orders').update({
          status: 'cancelled',
          subtotal: 0,
          tax: 0,
          service_charge: 0,
          grand_total: 0
        }).eq('id', orderId);
      } else {
        if (newQuantity <= 0) {
          await supabase.from('order_items').delete().eq('id', orderItemId);
        } else {
          await supabase.from('order_items').update({ quantity: newQuantity }).eq('id', orderItemId);
        }
        await supabase.from('orders').update({
          subtotal: updatedOrder.subtotal,
          tax: updatedOrder.gstAmount,
          service_charge: updatedOrder.serviceChargeAmount,
          grand_total: updatedOrder.totalAmount
        }).eq('id', orderId);
      }

      addSystemNotification(`📝 Bill updated. Recalculated total.`);
    } catch (err: any) {
      console.error("Failed to update item quantity in Supabase:", err.message);
    }
  };

  // Billing & Thermal Receipts State Handlers
  const adminUpdateBillingSettings = async (restaurantId: string, settings: Partial<Restaurant>) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === restaurantId ? { ...r, ...settings } : r))
    );
    addSystemNotification(`⚙️ Billing and Printer settings updated successfully.`);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          gst_percent: settings.gstPercent,
          service_charge_percent: settings.serviceChargePercent,
          receipt_header: settings.receiptHeader,
          receipt_footer: settings.receiptFooter,
          auto_print: settings.autoPrint,
          printer_type: settings.printerType,
          receipt_width: settings.receiptWidth,
          currency: settings.currency,
          logo_url: settings.logoUrl,
          address: settings.address,
          gstin: settings.gstin,
          fssai: settings.fssai
        })
        .eq('id', restaurantId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Failed to update billing settings in Supabase:", err.message);
    }
  };

  const addBillPrintLog = (billNumber: string, action: 'print' | 'reprint') => {
    const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
    const newLog: BillPrintLog = {
      id: `log_${Date.now()}`,
      restaurantId: selectedRestaurantId,
      billNumber,
      printerType: activeRest.printerType || 'thermal_80mm',
      receiptWidth: activeRest.receiptWidth || '80mm',
      action,
      timestamp: new Date().toISOString(),
    };
    setBillPrintLogs((prev) => [newLog, ...prev]);
    addSystemNotification(`🖨️ Logged bill ${billNumber} print action [${action.toUpperCase()}].`);
  };

  const generateReceipt = (
    sessionId: string,
    discountAmount: number = 0,
    couponCode: string = '',
    serviceChargePercent?: number
  ): Receipt => {
    const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
    const sessOrders = orders.filter((o) => o.sessionId === sessionId && o.status !== OrderStatus.CANCELLED);
    
    // Aggregated items
    const itemsMap: { [key: string]: { name: string; quantity: number; unitPrice: number; total: number } } = {};
    sessOrders.forEach((o) => {
      o.items.forEach((it) => {
        const key = it.selectedVariant ? `${it.name}-${it.selectedVariant.name}` : it.name;
        const name = it.selectedVariant ? `${it.name} (${it.selectedVariant.name})` : it.name;
        if (itemsMap[key]) {
          itemsMap[key].quantity += it.quantity;
          itemsMap[key].total += it.price * it.quantity;
        } else {
          itemsMap[key] = {
            name,
            quantity: it.quantity,
            unitPrice: it.price,
            total: it.price * it.quantity,
          };
        }
      });
    });

    const items = Object.values(itemsMap);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Calculate Coupon discount
    let couponDiscountAmount = 0;
    if (couponCode) {
      const c = coupons.find((cp) => cp.code.toLowerCase() === couponCode.toLowerCase() && cp.restaurantId === selectedRestaurantId);
      if (c) {
        if (c.discountPercent) {
          couponDiscountAmount = Math.round((subtotal * c.discountPercent) / 100);
          if (c.maxDiscount && couponDiscountAmount > c.maxDiscount) {
            couponDiscountAmount = c.maxDiscount;
          }
        } else if (c.discountFlat) {
          couponDiscountAmount = c.discountFlat;
        }
      }
    }

    const manualDiscount = Math.min(discountAmount, subtotal - couponDiscountAmount);
    const taxableValue = Math.max(0, subtotal - couponDiscountAmount - manualDiscount);

    const srvPercent = serviceChargePercent !== undefined ? serviceChargePercent : (activeRest.serviceChargePercent || 0);
    const serviceChargeAmount = Math.round((taxableValue * srvPercent) / 100);

    const gstPercent = activeRest.gstPercent || 0;
    const gstAmount = Math.round(((taxableValue + serviceChargeAmount) * gstPercent) / 100);

    const grandTotal = taxableValue + serviceChargeAmount + gstAmount;

    // Check if there is already a receipt for this session to reuse the bill number
    const existingReceipt = receipts.find((r) => r.sessionId === sessionId);
    const billNumber = existingReceipt ? existingReceipt.billNumber : `BIL-${Date.now().toString().slice(-6)}`;
    const orderNumber = existingReceipt ? existingReceipt.orderNumber : `ORD-${sessionId.slice(-4).toUpperCase()}`;

    const cashierName = currentUser?.fullName || 'Elena Vance';

    const newReceipt: Receipt = {
      id: existingReceipt ? existingReceipt.id : `rec_${Date.now()}`,
      restaurantId: selectedRestaurantId,
      sessionId,
      tableNumber: sessOrders[0]?.tableNumber || '01',
      customerName: activeSession && activeSession.id === sessionId && activeSession.customerName ? activeSession.customerName : (sessOrders[0] ? 'Table Guest' : 'Walk-in Guest'),
      customerPhone: activeSession?.customerPhone,
      billNumber,
      orderNumber,
      cashierName,
      status: existingReceipt ? existingReceipt.status : ReceiptStatus.DRAFT,
      subtotal,
      discountAmount: manualDiscount,
      couponCode: couponCode || undefined,
      couponDiscountAmount,
      gstAmount,
      serviceChargeAmount,
      grandTotal,
      items,
      createdAt: existingReceipt ? existingReceipt.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save/update in list
    setReceipts((prev) => {
      const filtered = prev.filter((r) => r.sessionId !== sessionId);
      return [newReceipt, ...filtered];
    });

    return newReceipt;
  };

  const updateReceiptStatus = (receiptId: string, status: ReceiptStatus, paymentMethod?: 'cash' | 'upi' | 'card') => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          const updated = {
            ...r,
            status,
            paymentMethod,
            updatedAt: new Date().toISOString(),
          };

          // If payment completes (Paid/Closed), settle the table session automatically!
          if (status === ReceiptStatus.PAID || status === ReceiptStatus.CLOSED) {
            setTimeout(() => {
              // Mark session orders complete
              setOrders((oPrev) =>
                oPrev.map((o) =>
                  o.sessionId === r.sessionId && o.status !== OrderStatus.CANCELLED
                    ? { ...o, status: OrderStatus.COMPLETED, updatedAt: new Date().toISOString() }
                    : o
                )
              );
              // Resolve any requests for this session
              setWaiterRequests((wPrev) =>
                wPrev.map((w) => (w.sessionId === r.sessionId ? { ...w, status: 'resolved' as const } : w))
              );
              // Table to cleaning
              const sessOrders = orders.filter((o) => o.sessionId === r.sessionId);
              const tblId = sessOrders[0]?.tableId || selectedTableId;
              setTables((tPrev) =>
                tPrev.map((t) => (t.id === tblId ? { ...t, status: TableStatus.CLEANING } : t))
              );
              // Clear active simulated session
              if (activeSession && activeSession.id === r.sessionId) {
                setActiveSession(null);
              }
            }, 0);
          }

          return updated;
        }
        return r;
      })
    );

    addSystemNotification(`🧾 Receipt updated to status [${status.toUpperCase()}]`);
  };

  // Feedback Submission
  const submitFeedback = (rating: number, comment: string) => {
    if (!activeSession) return;
    const newFb: Feedback = {
      id: `fb_${Date.now()}`,
      restaurantId: activeSession.restaurantId,
      sessionId: activeSession.id,
      customerName: activeSession.customerName || 'Anonymous',
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((prev) => [newFb, ...prev]);
    addSystemNotification(`⭐ Customer submitted a ${rating}-star feedback.`);
  };

  // Admin functions
  const adminAddCategory = async (cat: Omit<MenuCategory, 'id'>) => {
    const catId = toUUID(`cat_${Date.now()}`);
    const newCat: MenuCategory = {
      ...cat,
      id: catId,
    };
    setMenuCategories((prev) => [...prev, newCat]);
    addSystemNotification(`📁 Added menu category: ${cat.name}`);

    try {
      await supabase.from('menu_categories').insert([{
        id: catId,
        restaurant_id: selectedRestaurantId,
        name: cat.name,
        icon: cat.icon,
        sort_order: cat.sortOrder,
        is_active: cat.isActive
      }]);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const adminUpdateCategory = async (categoryId: string, updates: Partial<MenuCategory>) => {
    setMenuCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c)));
    addSystemNotification('📁 Menu category updated');

    try {
      await supabase.from('menu_categories').update({
        name: updates.name,
        icon: updates.icon,
        sort_order: updates.sortOrder,
        is_active: updates.isActive
      }).eq('id', categoryId);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const adminAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const itemId = toUUID(`item_${Date.now()}`);
    const newItem: MenuItem = {
      ...item,
      id: itemId,
    };
    setMenuItems((prev) => [...prev, newItem]);
    addSystemNotification(`🍖 Added menu item: ${item.name}`);

    try {
      await supabase.from('menu_items').insert([{
        id: itemId,
        restaurant_id: selectedRestaurantId,
        category_id: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        veg: item.isVeg,
        available: item.isAvailable,
        popular: item.isPopular
      }]);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const adminUpdateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)));
    addSystemNotification('🍖 Menu item updated');

    try {
      await supabase.from('menu_items').update({
        name: updates.name,
        description: updates.description,
        price: updates.price,
        image: updates.image,
        veg: updates.isVeg,
        available: updates.isAvailable,
        popular: updates.isPopular
      }).eq('id', itemId);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const adminToggleItemAvailability = async (itemId: string) => {
    let nextState = true;
    setMenuItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          nextState = !i.isAvailable;
          addSystemNotification(`🍖 Item "${i.name}" marked as ${nextState ? 'In Stock' : 'Out of Stock'}`);
          return { ...i, isAvailable: nextState };
        }
        return i;
      })
    );

    try {
      await supabase.from('menu_items').update({ available: nextState }).eq('id', itemId);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const adminAddCoupon = (coupon: Omit<Coupon, 'id'>) => {
    const newCpn: Coupon = {
      ...coupon,
      id: `coupon_${Date.now()}`,
    };
    setCoupons((prev) => [...prev, newCpn]);
    addSystemNotification(`🎟️ Added promo coupon: ${coupon.code}`);
  };

  const adminAddBanner = (banner: Omit<Banner, 'id'>) => {
    const newBnr: Banner = {
      ...banner,
      id: `banner_${Date.now()}`,
    };
    setBanners((prev) => [...prev, newBnr]);
    addSystemNotification(`🖼️ Added restaurant promo banner: ${banner.title}`);
  };

  const adminDeleteBanner = (bannerId: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
    addSystemNotification('🖼️ Banner removed.');
  };

  const adminToggleBannerActive = (bannerId: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b))
    );
    addSystemNotification('🖼️ Banner status updated.');
  };

  const adminUpdateBanner = (bannerId: string, updates: Partial<Banner>) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, ...updates } : b))
    );
    addSystemNotification('🖼️ Banner details updated.');
  };

  const adminAddTable = (table: Omit<RestaurantTable, 'id' | 'qrUrl'>) => {
    if (!table.tableNumber.trim()) {
      return { success: false, error: 'Table name/number cannot be empty.' };
    }
    if (table.seatingCapacity < 1) {
      return { success: false, error: 'Seating capacity must be at least 1.' };
    }

    let branchId = table.branchId;
    const existingBranchesForRestaurant = branches.filter((b) => b.restaurantId === table.restaurantId);
    if (existingBranchesForRestaurant.length === 0) {
      const newBranchId = toUUID(`branch_${Date.now()}`);
      const parentRestaurant = restaurants.find((r) => r.id === table.restaurantId);
      const newBranch: Branch = {
        id: newBranchId,
        restaurantId: table.restaurantId,
        name: 'Main Branch',
        address: parentRestaurant?.address || 'Main Address',
        phone: parentRestaurant?.phone || '',
        isActive: true,
        is_default: true,
        isDefault: true,
      };
      setBranches((prev) => [...prev, newBranch]);
      branchId = newBranchId;
    } else if (!branchId) {
      branchId = existingBranchesForRestaurant[0].id;
    }

    const isDuplicate = tables.some(
      (t) =>
        t.restaurantId === table.restaurantId &&
        t.branchId === branchId &&
        t.tableNumber.toLowerCase().trim() === table.tableNumber.toLowerCase().trim()
    );
    if (isDuplicate) {
      return { success: false, error: `Table "${table.tableNumber}" already exists in this branch.` };
    }

    const tableId = toUUID(`table_${Date.now()}`);
    const qrUrl = `${APP_CONFIG.WEB_URL}/menu/${table.restaurantId}/${branchId}/${tableId}`;
    const newTable: RestaurantTable = {
      ...table,
      branchId,
      id: tableId,
      qrUrl,
      isActive: table.isActive !== false,
    };

    setTables((prev) => [...prev, newTable]);
    addSystemNotification(`🪑 Successfully created Table ${table.tableNumber}.`);

    supabase.from('restaurant_tables').insert([{
      id: tableId,
      branch_id: branchId,
      restaurant_id: table.restaurantId,
      table_name: table.tableNumber,
      capacity: table.seatingCapacity,
      status: 'Available',
      permanent_qr_token: tableId
    }]).then();

    return { success: true };
  };

  const adminUpdateTable = (tableId: string, updates: Partial<RestaurantTable>) => {
    if (updates.tableNumber !== undefined) {
      if (!updates.tableNumber.trim()) {
        return { success: false, error: 'Table name/number cannot be empty.' };
      }
      
      const currentTable = tables.find((t) => t.id === tableId);
      const targetRestaurantId = updates.restaurantId || currentTable?.restaurantId;
      const targetBranchId = updates.branchId || currentTable?.branchId;
      
      const isDuplicate = tables.some(
        (t) =>
          t.id !== tableId &&
          t.restaurantId === targetRestaurantId &&
          t.branchId === targetBranchId &&
          t.tableNumber.toLowerCase().trim() === updates.tableNumber!.toLowerCase().trim()
      );
      if (isDuplicate) {
        return { success: false, error: `Another table named "${updates.tableNumber}" already exists in this branch.` };
      }
    }
    
    if (updates.seatingCapacity !== undefined && updates.seatingCapacity < 1) {
      return { success: false, error: 'Seating capacity must be at least 1.' };
    }

    let finalBranchId = updates.branchId;
    if (finalBranchId === '' || !finalBranchId) {
      const currentTable = tables.find((t) => t.id === tableId);
      const rId = updates.restaurantId || currentTable?.restaurantId;
      if (rId) {
        const existing = branches.filter((b) => b.restaurantId === rId);
        if (existing.length > 0) {
          finalBranchId = existing[0].id;
        }
      }
    }

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          const updated = { ...t, ...updates };
          if (finalBranchId) {
            updated.branchId = finalBranchId;
          }
          updated.qrUrl = `${APP_CONFIG.WEB_URL}/menu/${updated.restaurantId}/${updated.branchId}/${updated.id}`;
          return updated;
        }
        return t;
      })
    );
    
    addSystemNotification(`🪑 Table updated successfully.`);

    supabase.from('restaurant_tables').update({
      branch_id: finalBranchId,
      table_name: updates.tableNumber,
      capacity: updates.seatingCapacity,
      status: updates.status ? getTableStatusString(updates.status) : undefined
    }).eq('id', tableId).then();

    return { success: true };
  };

  const adminDeleteTable = (tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    addSystemNotification(`🪑 Table deleted.`);

    supabase.from('restaurant_tables').delete().eq('id', tableId).then();
  };

  // Branch management functions
  const adminAddBranch = (branch: Omit<Branch, 'id' | 'restaurantId'>) => {
    if (!currentUser || !currentUser.restaurantId) {
      return { success: false, error: 'No active restaurant tenant found.' };
    }
    const bId = toUUID(`branch_${Date.now()}`);
    const newBranch: Branch = {
      id: bId,
      restaurantId: currentUser.restaurantId,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      isActive: branch.isActive !== false,
    };
    setBranches((prev) => [...prev, newBranch]);
    addSystemNotification(`📍 Branch "${branch.name}" created successfully.`);

    supabase.from('branches').insert([{
      id: bId,
      restaurant_id: currentUser.restaurantId,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      status: branch.isActive !== false ? 'active' : 'inactive'
    }]).then();

    return { success: true };
  };

  const adminUpdateBranch = (branchId: string, updates: Partial<Branch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, ...updates } : b))
    );
    addSystemNotification(`📍 Branch details updated.`);

    supabase.from('branches').update({
      name: updates.name,
      address: updates.address,
      phone: updates.phone,
      status: updates.isActive !== undefined ? (updates.isActive ? 'active' : 'inactive') : undefined
    }).eq('id', branchId).then();

    return { success: true };
  };

  const adminDeleteBranch = (branchId: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== branchId));
    setTables((prev) => prev.filter((t) => t.branchId !== branchId));
    addSystemNotification(`📍 Branch and its associated tables deleted.`);

    supabase.from('branches').delete().eq('id', branchId).then();
    return { success: true };
  };

  // Super Admin functions
  const superAdminToggleRestaurantStatus = (restaurantId: string, status: RestaurantStatus) => {
    setRestaurants((prev) => prev.map((r) => (r.id === restaurantId ? { ...r, status } : r)));
    addSystemNotification(`🏛️ Restaurant Status for "${
      restaurants.find((r) => r.id === restaurantId)?.name
    }" updated to [${status.toUpperCase()}].`);

    supabase.from('restaurants').update({ status }).eq('id', restaurantId).then();
  };

  const superAdminUpdateRestaurantPlan = (restaurantId: string, plan: SubscriptionPlan) => {
    setRestaurants((prev) => prev.map((r) => (r.id === restaurantId ? { ...r, plan } : r)));
    addSystemNotification(`🏛️ Restaurant plan for "${
      restaurants.find((r) => r.id === restaurantId)?.name
    }" changed to [${plan}].`);

    supabase.from('restaurants').update({ subscription_plan: plan }).eq('id', restaurantId).then();
  };

  const superAdminCreateRestaurant = (restaurant: Omit<Restaurant, 'id' | 'rating'>) => {
    const restId = toUUID(`rest_${Date.now()}`);
    const newRest: Restaurant = {
      id: restId,
      name: restaurant.name,
      description: restaurant.description,
      cuisine: restaurant.cuisine,
      rating: 4.8,
      logo: restaurant.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=60',
      banner: restaurant.banner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      address: restaurant.address,
      status: restaurant.status || RestaurantStatus.APPROVED,
      plan: restaurant.plan || SubscriptionPlan.FREE,
      primaryColor: restaurant.primaryColor || '#F59E0B',
      accentColor: restaurant.accentColor || '#10B981',
      currency: restaurant.currency || '₹',
      gstPercent: restaurant.gstPercent || 5,
      serviceChargePercent: restaurant.serviceChargePercent || 5,
      phone: restaurant.phone,
      email: restaurant.email,
      businessHours: restaurant.businessHours || '11:00 AM - 11:00 PM',
    };
    setRestaurants((prev) => [...prev, newRest]);
    
    const bId = toUUID(`branch_${Date.now()}`);
    const mainBranch: Branch = {
      id: bId,
      restaurantId: restId,
      name: `${restaurant.name} - Head Branch`,
      address: restaurant.address || 'Head Office Address',
      phone: restaurant.phone,
      isActive: true,
    };
    setBranches((prev) => [...prev, mainBranch]);

    supabase.from('restaurants').insert([{
      id: restId,
      name: newRest.name,
      description: newRest.description,
      logo: newRest.logo,
      banner: newRest.banner,
      status: newRest.status,
      subscription_plan: newRest.plan,
      rating: newRest.rating,
      cuisine: newRest.cuisine,
      primary_color: newRest.primaryColor,
      accent_color: newRest.accentColor,
      currency: newRest.currency,
      gst_percent: newRest.gstPercent,
      service_charge_percent: newRest.serviceChargePercent,
      phone: newRest.phone,
      email: newRest.email,
      address: newRest.address,
      business_hours: newRest.businessHours
    }]).then(() => {
      supabase.from('branches').insert([{
        id: bId,
        restaurant_id: restId,
        name: mainBranch.name,
        address: mainBranch.address,
        phone: mainBranch.phone,
        status: mainBranch.isActive ? 'active' : 'inactive'
      }]).then();
    });

    addSystemNotification(`🏛️ New restaurant "${restaurant.name}" created.`);
    return { success: true };
  };

  const superAdminDeleteRestaurant = (restaurantId: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
    setBranches((prev) => prev.filter((b) => b.restaurantId !== restaurantId));
    setTables((prev) => prev.filter((t) => t.restaurantId !== restaurantId));
    setMenuCategories((prev) => prev.filter((c) => c.restaurantId !== restaurantId));
    setMenuItems((prev) => prev.filter((i) => i.restaurantId !== restaurantId));
    setCoupons((prev) => prev.filter((c) => c.restaurantId !== restaurantId));
    setBanners((prev) => prev.filter((b) => b.restaurantId !== restaurantId));
    setOrders((prev) => prev.filter((o) => o.restaurantId !== restaurantId));
    setReceipts((prev) => prev.filter((r) => r.restaurantId !== restaurantId));
    updateAndPersistUsers((prev) => prev.filter((u) => u.restaurantId !== restaurantId));

    supabase.from('restaurants').delete().eq('id', restaurantId).then();

    addSystemNotification(`🏛️ Restaurant and all associated tenant data deleted.`);
    return { success: true };
  };

  // Authentication & Profiles state methods
  const login = async (email: string, password: string) => {
    let supabaseAuthUser: any = null;
    let authError: any = null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });
      if (error) {
        authError = error;
      } else if (data && data.user) {
        supabaseAuthUser = data.user;
      }
    } catch (e) {
      console.warn("Supabase Auth sign-in threw exception, trying local/profiles fallback", e);
    }

    if (supabaseAuthUser) {
      // Query database profiles table to get the most accurate profile details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseAuthUser.id)
        .maybeSingle();

      const meta = supabaseAuthUser.user_metadata || {};
      const loggedUser: UserProfile = {
        id: supabaseAuthUser.id,
        email: supabaseAuthUser.email || email,
        fullName: profileData?.full_name || meta.fullName || 'User',
        phone: profileData?.phone || meta.phone || '',
        role: (profileData?.role || meta.role || UserRole.RESTAURANT_ADMIN) as UserRole,
        restaurantId: profileData?.restaurant_id || meta.restaurantId,
        branchId: profileData?.branch_id || meta.branchId,
        createdAt: supabaseAuthUser.created_at,
        isVerified: meta.isVerified ?? true,
        onboardingStep: meta.onboardingStep ?? 5,
        businessAddress: meta.businessAddress,
        gstNumber: meta.gstNumber,
        status: profileData?.status || meta.status || 'active',
      };

      if (loggedUser.status === 'inactive') {
        return { success: false, error: 'Your staff account has been deactivated. Please contact your restaurant administrator.' };
      }

      const userWithModules = {
        ...loggedUser,
        authorizedModules: getAuthorizedModulesForRole(loggedUser.role),
      };
      updateAndPersistCurrentUser(userWithModules);

      // Switch active workspace view role
      if (loggedUser.role === UserRole.SUPER_ADMIN) {
        setCurrentRole('superadmin');
      } else if (loggedUser.role === UserRole.RESTAURANT_ADMIN) {
        setCurrentRole('admin');
        if (loggedUser.restaurantId) {
          setSelectedRestaurantId(loggedUser.restaurantId);
          const rBranch = branches.find((b) => b.restaurantId === loggedUser.restaurantId);
          if (rBranch) {
            setSelectedBranchId(rBranch.id);
            const rTable = tables.find((t) => t.branchId === rBranch.id);
            if (rTable) setSelectedTableId(rTable.id);
          }
        }
      } else {
        setCurrentRole('staff');
        if (loggedUser.role === UserRole.KITCHEN) setStaffSubRole('kitchen');
        else if (loggedUser.role === UserRole.CASHIER) setStaffSubRole('cashier');
        else if (loggedUser.role === UserRole.MANAGER) setStaffSubRole('dashboard');
        else if (loggedUser.role === UserRole.WAITER) setStaffSubRole('waiter');
        
        if (loggedUser.restaurantId) setSelectedRestaurantId(loggedUser.restaurantId);
        if (loggedUser.branchId) {
          setSelectedBranchId(loggedUser.branchId);
          const rTable = tables.find((t) => t.branchId === loggedUser.branchId);
          if (rTable) setSelectedTableId(rTable.id);
        }
      }

      addSystemNotification(`🔑 Welcome back, ${loggedUser.fullName}! Logged in as [${loggedUser.role.toUpperCase()}].`);
      return { success: true };
    }

    // fallback: if Supabase Auth returned an error (e.g. Email not confirmed, etc.) OR didn't match,
    // we query the `profiles` table in Supabase directly by email to check credentials!
    try {
      const { data: dbProfile, error: profileDbErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (!profileDbErr && dbProfile) {
        // Extract stored password from profile_image if present (prefix pwd:)
        let profilePassword = 'staff123';
        if (dbProfile.profile_image && dbProfile.profile_image.startsWith('pwd:')) {
          profilePassword = dbProfile.profile_image.substring(4);
        } else {
          // If profile_image doesn't have it, look up in the local `users` state list
          const localUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
          if (localUser && localUser.password) {
            profilePassword = localUser.password;
          }
        }

        if (profilePassword === password) {
          if (dbProfile.status === 'inactive') {
            return { success: false, error: 'Your staff account has been deactivated. Please contact your restaurant administrator.' };
          }

          const loggedUser: UserProfile = {
            id: dbProfile.id,
            email: dbProfile.email,
            fullName: dbProfile.full_name,
            phone: dbProfile.phone || '',
            role: dbProfile.role as UserRole,
            restaurantId: dbProfile.restaurant_id || undefined,
            branchId: dbProfile.branch_id || undefined,
            createdAt: dbProfile.created_at || new Date().toISOString(),
            isVerified: true,
            onboardingStep: 5,
            status: dbProfile.status || 'active',
            password: profilePassword
          };

          const userWithModules = {
            ...loggedUser,
            authorizedModules: getAuthorizedModulesForRole(loggedUser.role),
          };
          updateAndPersistCurrentUser(userWithModules);

          // Add to local state if not exists
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === loggedUser.id);
            if (!exists) {
              const updated = [...prev, loggedUser];
              localStorage.setItem('qr_users', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });

          // Switch active workspace view role
          if (loggedUser.role === UserRole.SUPER_ADMIN) {
            setCurrentRole('superadmin');
          } else if (loggedUser.role === UserRole.RESTAURANT_ADMIN) {
            setCurrentRole('admin');
            if (loggedUser.restaurantId) {
              setSelectedRestaurantId(loggedUser.restaurantId);
              const rBranch = branches.find((b) => b.restaurantId === loggedUser.restaurantId);
              if (rBranch) {
                setSelectedBranchId(rBranch.id);
                const rTable = tables.find((t) => t.branchId === rBranch.id);
                if (rTable) setSelectedTableId(rTable.id);
              }
            }
          } else {
            setCurrentRole('staff');
            if (loggedUser.role === UserRole.KITCHEN) setStaffSubRole('kitchen');
            else if (loggedUser.role === UserRole.CASHIER) setStaffSubRole('cashier');
            else if (loggedUser.role === UserRole.MANAGER) setStaffSubRole('dashboard');
            else if (loggedUser.role === UserRole.WAITER) setStaffSubRole('waiter');
            
            if (loggedUser.restaurantId) setSelectedRestaurantId(loggedUser.restaurantId);
            if (loggedUser.branchId) {
              setSelectedBranchId(loggedUser.branchId);
              const rTable = tables.find((t) => t.branchId === loggedUser.branchId);
              if (rTable) setSelectedTableId(rTable.id);
            }
          }

          addSystemNotification(`🔑 Welcome back, ${loggedUser.fullName}! Logged in as [${loggedUser.role.toUpperCase()}] via profile fallback.`);
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect password.' };
        }
      }
    } catch (err: any) {
      console.warn("Direct database profile auth check failed:", err.message);
    }

    // secondary local fallback
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return { success: false, error: authError?.message || 'User not found. Please register or verify the email.' };
    }
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }
    if (user.status === 'inactive') {
      return { success: false, error: 'Your staff account has been deactivated. Please contact your restaurant administrator.' };
    }

    const userWithModules = {
      ...user,
      authorizedModules: getAuthorizedModulesForRole(user.role),
    };
    updateAndPersistCurrentUser(userWithModules);

    // Switch active workspace view role
    if (user.role === UserRole.SUPER_ADMIN) {
      setCurrentRole('superadmin');
    } else if (user.role === UserRole.RESTAURANT_ADMIN) {
      setCurrentRole('admin');
      if (user.restaurantId) {
        setSelectedRestaurantId(user.restaurantId);
        const rBranch = branches.find((b) => b.restaurantId === user.restaurantId);
        if (rBranch) {
          setSelectedBranchId(rBranch.id);
          const rTable = tables.find((t) => t.branchId === rBranch.id);
          if (rTable) setSelectedTableId(rTable.id);
        }
      }
    } else {
      setCurrentRole('staff');
      if (user.role === UserRole.KITCHEN) setStaffSubRole('kitchen');
      else if (user.role === UserRole.CASHIER) setStaffSubRole('cashier');
      else if (user.role === UserRole.MANAGER) setStaffSubRole('dashboard');
      else if (user.role === UserRole.WAITER) setStaffSubRole('waiter');
      
      if (user.restaurantId) setSelectedRestaurantId(user.restaurantId);
      if (user.branchId) {
        setSelectedBranchId(user.branchId);
        const rTable = tables.find((t) => t.branchId === user.branchId);
        if (rTable) setSelectedTableId(rTable.id);
      }
    }

    addSystemNotification(`🔑 Welcome back, ${user.fullName}! Logged in as [${user.role.toUpperCase()}].`);
    return { success: true };
  };

  const signup = async (params: {
    restaurantName: string;
    ownerName: string;
    email: string;
    phone: string;
    password?: string;
    businessAddress?: string;
    gstNumber?: string;
  }) => {
    const exists = users.some((u) => u.email.toLowerCase() === params.email.toLowerCase().trim());
    if (exists) {
      return { success: false, error: 'Email address already registered.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.toLowerCase().trim(),
        password: params.password || 'password123',
        options: {
          data: {
            fullName: params.ownerName,
            phone: params.phone,
            role: UserRole.RESTAURANT_ADMIN,
            onboardingStep: 1,
            isVerified: false,
            businessAddress: params.businessAddress,
            gstNumber: params.gstNumber,
            status: 'active'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const newUser: UserProfile = {
          id: data.user.id,
          email: data.user.email || params.email.toLowerCase().trim(),
          fullName: params.ownerName,
          phone: params.phone,
          role: UserRole.RESTAURANT_ADMIN,
          createdAt: data.user.created_at,
          isVerified: false,
          onboardingStep: 1,
          businessAddress: params.businessAddress,
          gstNumber: params.gstNumber,
          status: 'active',
        };

        // Sync registration to profiles table in Supabase
        supabase.from('profiles').insert([{
          id: data.user.id,
          full_name: params.ownerName,
          email: params.email.toLowerCase().trim(),
          phone: params.phone,
          role: 'restaurant_admin',
          status: 'active',
          profile_image: `pwd:${params.password || 'password123'}`
        }]).then();

        updateAndPersistUsers((prev) => [...prev, newUser]);
        updateAndPersistCurrentUser(newUser);
        setCurrentRole('admin');

        addSystemNotification(`📝 Created account for ${params.ownerName}. Please verify your email.`);
        return { success: true };
      }
    } catch (e: any) {
      console.warn("Supabase signup failed, trying local fallback", e);
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: params.email.toLowerCase().trim(),
      fullName: params.ownerName,
      phone: params.phone,
      role: UserRole.RESTAURANT_ADMIN,
      createdAt: new Date().toISOString(),
      isVerified: false,
      onboardingStep: 1,
      businessAddress: params.businessAddress,
      gstNumber: params.gstNumber,
      password: params.password || 'password123',
    };

    updateAndPersistUsers((prev) => [...prev, newUser]);
    updateAndPersistCurrentUser(newUser);
    setCurrentRole('admin');
    
    addSystemNotification(`📝 Created account for ${params.ownerName}. Please verify your email.`);
    return { success: true };
  };

  const logout = () => {
    const name = currentUser?.fullName || 'User';
    if (currentUser && !currentUser.id.startsWith('user_')) {
      supabase.auth.signOut().then();
    }
    updateAndPersistCurrentUser(null);
    setCurrentRole('customer');
    addSystemNotification(`👋 Logged out successfully. Good bye, ${name}!`);
  };

  const updateOnboardingStep = (step: number) => {
    if (!currentUser) return;
    const updated = { ...currentUser, onboardingStep: step };
    updateAndPersistCurrentUser(updated);
    updateAndPersistUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    if (!currentUser.id.startsWith('user_')) {
      supabase.auth.updateUser({ data: { onboardingStep: step } }).then();
    }
  };

  const verifyOnboardingEmail = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, isVerified: true, onboardingStep: 2 };
    updateAndPersistCurrentUser(updated);
    updateAndPersistUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    if (!currentUser.id.startsWith('user_')) {
      supabase.auth.updateUser({ data: { isVerified: true, onboardingStep: 2 } }).then();
    }
    addSystemNotification('📧 Email address successfully verified!');
  };

  const onboardingSetupRestaurant = async (params: Partial<Restaurant>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'No active user session.' };
    
    const restId = toUUID(`rest_${Date.now()}`);
    const newRest: Restaurant = {
      id: restId,
      name: params.name || 'My Restaurant',
      description: params.description || 'Delicious dining experience.',
      cuisine: params.cuisine || 'Multi-cuisine',
      rating: 4.8,
      logo: params.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=60',
      banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      address: params.address || currentUser.businessAddress || 'Business Address',
      status: RestaurantStatus.APPROVED,
      plan: SubscriptionPlan.GROWTH,
      primaryColor: '#F59E0B',
      accentColor: '#10B981',
      currency: '₹',
      gstPercent: 5,
      serviceChargePercent: 5,
      phone: currentUser.phone || '555-0101',
      email: currentUser.email,
      businessHours: '11:00 AM - 11:00 PM',
    };

    try {
      // 1. Insert the restaurant tenant first (essential for foreign keys)
      const { error: restErr } = await supabase.from('restaurants').insert([{
        id: restId,
        name: newRest.name,
        description: newRest.description,
        logo: newRest.logo,
        banner: newRest.banner,
        status: newRest.status,
        subscription_plan: newRest.plan,
        rating: newRest.rating,
        cuisine: newRest.cuisine,
        primary_color: newRest.primaryColor,
        accent_color: newRest.accentColor,
        currency: newRest.currency,
        gst_percent: newRest.gstPercent,
        service_charge_percent: newRest.serviceChargePercent,
        phone: newRest.phone,
        email: newRest.email,
        address: newRest.address,
        business_hours: newRest.businessHours,
        owner_name: currentUser.fullName
      }]);

      if (restErr) {
        console.error("Supabase restaurant setup error:", restErr);
        addSystemNotification(`❌ DB Error setting up restaurant: ${restErr.message}`);
        return { success: false, error: `Database insert failed: ${restErr.message}` };
      }

      // 2. Link the new restaurant to user's profile and auth metadata
      if (!currentUser.id.startsWith('user_')) {
        const { error: profileErr } = await supabase.from('profiles').update({ restaurant_id: restId }).eq('id', currentUser.id);
        if (profileErr) {
          console.error("Supabase link restaurant to profile error:", profileErr);
          addSystemNotification(`⚠️ Warning: Profiles link failed: ${profileErr.message}`);
        }

        const { error: authErr } = await supabase.auth.updateUser({ data: { restaurantId: restId, onboardingStep: 3 } });
        if (authErr) {
          console.warn("Supabase auth user_metadata update warning:", authErr.message);
        }
      }

      // 3. Update React States only after DB success
      setRestaurants((prev) => [...prev, newRest]);
      setSelectedRestaurantId(restId);

      const updated = { ...currentUser, restaurantId: restId, onboardingStep: 3 };
      updateAndPersistCurrentUser(updated);
      updateAndPersistUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

      addSystemNotification(`🏛️ Created restaurant tenant: ${newRest.name}`);
      return { success: true };
    } catch (err: any) {
      console.error("onboardingSetupRestaurant exception:", err);
      addSystemNotification(`❌ Unexpected error: ${err.message || err}`);
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const onboardingSetupBranch = async (name: string, address: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'No active user session.' };
    if (!currentUser.restaurantId) return { success: false, error: 'Restaurant ID is not linked to your account.' };

    const bId = toUUID(`branch_${Date.now()}`);
    const newBranch: Branch = {
      id: bId,
      restaurantId: currentUser.restaurantId,
      name,
      address,
      phone,
      isActive: true,
    };

    try {
      // 1. Insert the branch into database first
      const { error: branchErr } = await supabase.from('branches').insert([{
        id: bId,
        restaurant_id: currentUser.restaurantId,
        name,
        address,
        phone,
        status: 'active'
      }]);

      if (branchErr) {
        console.error("Supabase branch setup error:", branchErr);
        addSystemNotification(`❌ DB Error setting up branch: ${branchErr.message}`);
        return { success: false, error: `Database insert failed: ${branchErr.message}` };
      }

      // 2. Link branch to profiles and auth metadata
      if (!currentUser.id.startsWith('user_')) {
        const { error: profileErr } = await supabase.from('profiles').update({ branch_id: bId }).eq('id', currentUser.id);
        if (profileErr) {
          console.error("Supabase link branch to profile error:", profileErr);
          addSystemNotification(`⚠️ Warning: Profiles link failed: ${profileErr.message}`);
        }

        const { error: authErr } = await supabase.auth.updateUser({ data: { branchId: bId, onboardingStep: 5 } });
        if (authErr) {
          console.warn("Supabase auth user_metadata update warning:", authErr.message);
        }
      }

      // 3. Update React States
      setBranches((prev) => [...prev, newBranch]);
      setSelectedBranchId(bId);

      const updated = { ...currentUser, branchId: bId, onboardingStep: 5 };
      updateAndPersistCurrentUser(updated);
      updateAndPersistUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

      addSystemNotification(`📍 Created branch: ${name}`);
      return { success: true };
    } catch (err: any) {
      console.error("onboardingSetupBranch exception:", err);
      addSystemNotification(`❌ Unexpected error: ${err.message || err}`);
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const onboardingSetupTables = async (count: number): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'No active user session.' };
    if (!currentUser.restaurantId || !currentUser.branchId) {
      return { success: false, error: 'Restaurant ID or Branch ID is missing from your profile.' };
    }

    const newTables: RestaurantTable[] = [];
    for (let i = 1; i <= count; i++) {
      const tableId = toUUID(`table_${Date.now()}_${i}`);
      newTables.push({
        id: tableId,
        branchId: currentUser.branchId,
        restaurantId: currentUser.restaurantId,
        tableNumber: i < 10 ? `0${i}` : `${i}`,
        seatingCapacity: i % 2 === 0 ? 4 : 2,
        status: TableStatus.AVAILABLE,
        qrUrl: `${APP_CONFIG.WEB_URL}/menu/${currentUser.restaurantId}/${currentUser.branchId}/${tableId}`,
      });
    }

    try {
      // 1. Insert tables into Supabase
      const { error: tablesErr } = await supabase.from('restaurant_tables').insert(newTables.map(t => ({
        id: t.id,
        branch_id: t.branchId,
        restaurant_id: t.restaurantId,
        table_name: t.tableNumber,
        capacity: t.seatingCapacity,
        status: 'Available',
        permanent_qr_token: t.id
      })));

      if (tablesErr) {
        console.error("Supabase tables generation error:", tablesErr);
        addSystemNotification(`❌ DB Error generating tables: ${tablesErr.message}`);
        return { success: false, error: `Database insert failed: ${tablesErr.message}` };
      }

      // 2. Update auth metadata step
      if (!currentUser.id.startsWith('user_')) {
        const { error: authErr } = await supabase.auth.updateUser({ data: { onboardingStep: 5 } });
        if (authErr) {
          console.warn("Supabase auth user_metadata update warning:", authErr.message);
        }
      }

      // 3. Update React states
      setTables((prev) => [...prev, ...newTables]);
      if (newTables.length > 0) {
        setSelectedTableId(newTables[0].id);
      }

      const updated = { ...currentUser, onboardingStep: 5 };
      updateAndPersistCurrentUser(updated);
      updateAndPersistUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

      addSystemNotification(`🪑 Successfully generated ${count} digital table QR codes!`);
      return { success: true };
    } catch (err: any) {
      console.error("onboardingSetupTables exception:", err);
      addSystemNotification(`❌ Unexpected error: ${err.message || err}`);
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const addStaffMember = async (
    fullName: string,
    email: string,
    role: string,
    branchId: string,
    phone: string = '',
    password: string = 'staff123',
    status: 'active' | 'inactive' = 'active'
  ) => {
    if (!currentUser || !currentUser.restaurantId) {
      return { success: false, error: 'No active restaurant found.' };
    }

    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return { success: false, error: 'Email address already registered.' };
    }

    const tempId = `user_${Date.now()}`;
    const newStaff: UserProfile = {
      id: tempId,
      email: email.toLowerCase().trim(),
      fullName,
      phone,
      role: role as UserRole,
      restaurantId: currentUser.restaurantId,
      branchId,
      createdAt: new Date().toISOString(),
      isVerified: true,
      onboardingStep: 5,
      password,
      status,
    };

    updateAndPersistUsers((prev) => [...prev, newStaff]);
    addSystemNotification(`👤 Added staff member: ${fullName} (${role.toUpperCase()})`);

    try {
      // Create a secondary client for silent auth signup (so we don't disrupt current admin session)
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        { auth: { persistSession: false } }
      );

      const { data, error } = await tempClient.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            fullName,
            role,
            restaurantId: currentUser.restaurantId,
            branchId,
            onboardingStep: 5
          }
        }
      });

      if (error) {
        console.warn("Staff Supabase signup (Auth) failed, trying direct profile table insert fallback:", error.message);
        
        const directId = toUUID(tempId);
        const { error: profileErr } = await supabase.from('profiles').insert([{
          id: directId,
          full_name: fullName,
          email: email.toLowerCase().trim(),
          phone,
          role,
          restaurant_id: currentUser.restaurantId,
          branch_id: branchId,
          status,
          profile_image: `pwd:${password}`
        }]);

        if (profileErr) {
          console.error("Direct staff profile insert failed:", profileErr.message);
          return { success: false, error: `Auth error: ${error.message}. DB error: ${profileErr.message}` };
        }

        updateAndPersistUsers((prev) =>
          prev.map((u) => (u.id === tempId ? { ...u, id: directId } : u))
        );
        addSystemNotification(`👤 Added staff member: ${fullName} directly to database`);
        return { success: true };
      }

      if (data.user) {
        const finalId = data.user.id;
        // Insert into database profiles table
        const { error: profileErr } = await supabase.from('profiles').insert([{
          id: finalId,
          full_name: fullName,
          email: email.toLowerCase().trim(),
          phone,
          role,
          restaurant_id: currentUser.restaurantId,
          branch_id: branchId,
          status,
          profile_image: `pwd:${password}`
        }]);

        if (profileErr) {
          console.error("Staff profile db insert error:", profileErr.message);
          return { success: false, error: `Database insert failed: ${profileErr.message}` };
        }

        // Update the temporary ID with the actual UUID returned by Supabase
        updateAndPersistUsers((prev) =>
          prev.map((u) => (u.id === tempId ? { ...u, id: finalId } : u))
        );
      }
    } catch (err: any) {
      console.error("Staff creation exception:", err.message);
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }

    return { success: true };
  };

  const updateStaffMember = (id: string, updates: Partial<UserProfile>) => {
    updateAndPersistUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser && currentUser.id === id) {
            updateAndPersistCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addSystemNotification(`👤 Staff member details updated.`);

    // Persist to profiles table in Supabase
    const profileUpdates: any = {
      full_name: updates.fullName,
      phone: updates.phone,
      role: updates.role,
      branch_id: updates.branchId,
      status: updates.status
    };
    if (updates.password) {
      profileUpdates.profile_image = `pwd:${updates.password}`;
    }
    supabase.from('profiles').update(profileUpdates).eq('id', id).then();
  };

  const deleteStaffMember = (id: string) => {
    updateAndPersistUsers((prev) => prev.filter((u) => u.id !== id));
    addSystemNotification('👤 Staff member removed.');

    // Delete from profiles table in Supabase
    supabase.from('profiles').delete().eq('id', id).then();
  };

  return (
    <AppStateContext.Provider
      value={{
        restaurants,
        branches,
        tables,
        menuCategories,
        menuItems,
        banners,
        coupons,
        orders,
        waiterRequests,
        feedbacks,
        activeSession,
        tableSessions,
        cart,
        activeCoupon,
        notifications,
        
        // Billing Module Exposes
        receipts,
        billPrintLogs,
        adminUpdateBillingSettings,
        addBillPrintLog,
        generateReceipt,
        updateReceiptStatus,
        
        currentRole,
        selectedRestaurantId,
        selectedBranchId,
        selectedTableId,
        staffSubRole,
        isQrModalOpen,
        
        setCurrentRole,
        setStaffSubRole,
        setSelectedRestaurantId,
        setSelectedBranchId,
        setSelectedTableId,
        setIsQrModalOpen,
        setTables,
        setTableSessions,
        setOrders,
        
        customerScanQR,
        customerEnterDetails,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        applyCouponCode,
        removeCoupon,
        customerPlaceOrder,
        customerRequestService,
        
        staffAcceptOrder,
        staffStartPreparing,
        staffMarkReady,
        staffMarkServed,
        staffCompleteOrder,
        staffCancelOrder,
        waiterResolveRequest,
        cashierSettleTable,
        staffMarkTableCleaned,
        staffAddItemsToBill,
        staffUpdateOrderItemQuantity,
        
        adminAddCategory,
        adminUpdateCategory,
        adminAddMenuItem,
        adminUpdateMenuItem,
        adminToggleItemAvailability,
        adminAddCoupon,
        adminAddBanner,
        adminDeleteBanner,
        adminToggleBannerActive,
        adminUpdateBanner,
        adminAddTable,
        adminUpdateTable,
        adminDeleteTable,
        adminAddBranch,
        adminUpdateBranch,
        adminDeleteBranch,
        
        superAdminToggleRestaurantStatus,
        superAdminUpdateRestaurantPlan,
        superAdminCreateRestaurant,
        superAdminDeleteRestaurant,
        
        submitFeedback,
        resetAllState,
        addSystemNotification,
        clearNotifications,

        // Auth
        currentUser,
        users,
        login,
        signup,
        logout,
        updateOnboardingStep,
        verifyOnboardingEmail,
        onboardingSetupRestaurant,
        onboardingSetupBranch,
        onboardingSetupTables,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }

  const { currentUser, selectedRestaurantId } = context;

  // Determine active restaurant ID for Row Level Security (RLS) / Multi-tenant filtering
  // If logged in as non-superadmin, enforce strict RLS.
  if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
    const rId = currentUser.restaurantId;
    return {
      ...context,
      selectedRestaurantId: rId,
      restaurants: context.restaurants.filter((r) => r.id === rId),
      branches: context.branches.filter((b) => b.restaurantId === rId),
      tables: context.tables.filter((t) => t.restaurantId === rId),
      menuCategories: context.menuCategories.filter((c) => c.restaurantId === rId),
      menuItems: context.menuItems.filter((i) => i.restaurantId === rId),
      banners: context.banners.filter((b) => b.restaurantId === rId),
      coupons: context.coupons.filter((c) => c.restaurantId === rId),
      orders: context.orders.filter((o) => o.restaurantId === rId),
      waiterRequests: context.waiterRequests.filter((w) => w.restaurantId === rId),
      receipts: context.receipts.filter((r) => r.restaurantId === rId),
      users: context.users.filter((u) => u.restaurantId === rId || u.role === UserRole.SUPER_ADMIN),
    };
  }

  // If not logged in (e.g. Customer simulation or guest mode)
  // We filter categories, items, tables, orders, etc., by selectedRestaurantId,
  // but keep restaurants list intact so the client dashboard/scanners can switch context.
  const rId = selectedRestaurantId;
  return {
    ...context,
    branches: context.branches.filter((b) => b.restaurantId === rId),
    tables: context.tables.filter((t) => t.restaurantId === rId),
    menuCategories: context.menuCategories.filter((c) => c.restaurantId === rId),
    menuItems: context.menuItems.filter((i) => i.restaurantId === rId),
    banners: context.banners.filter((b) => b.restaurantId === rId),
    coupons: context.coupons.filter((c) => c.restaurantId === rId),
    orders: context.orders.filter((o) => o.restaurantId === rId),
    waiterRequests: context.waiterRequests.filter((w) => w.restaurantId === rId),
    receipts: context.receipts.filter((r) => r.restaurantId === rId),
    users: context.users.filter((u) => u.restaurantId === rId || u.role === UserRole.SUPER_ADMIN),
  };
}
