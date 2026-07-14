/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../state';
import { supabase } from '../supabaseClient';
import {
  ChefHat,
  Bell,
  Check,
  X,
  Clock,
  Trash2,
  DollarSign,
  Droplet,
  Coffee,
  Sparkles,
  RefreshCw,
  Utensils,
  CreditCard,
  User,
  Users,
  ArrowLeftRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sliders,
  Play,
  ClipboardList,
  Printer,
  Download,
  Share2,
  Send,
  Eye,
  Search,
  FileSpreadsheet,
  BookOpen,
  Tag,
  ChevronRight,
  Receipt,
  ShieldAlert,
  ArrowLeft,
  Plus,
  Minus
} from 'lucide-react';
import { OrderStatus, TableStatus, PaymentMethod, ServiceRequestType, UserRole, formatIndianCurrency, ReceiptStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import AuthPortal from './AuthPortal';

export default function StaffConsole() {
  const {
    orders,
    waiterRequests,
    tables,
    restaurants,
    staffSubRole,
    setStaffSubRole,
    selectedRestaurantId,
    staffAcceptOrder,
    staffStartPreparing,
    staffMarkReady,
    staffMarkServed,
    staffCompleteOrder,
    staffCancelOrder,
    waiterResolveRequest,
    cashierSettleTable,
    staffMarkTableCleaned,
    currentUser,
    logout,
    // New billing extensions
    receipts,
    billPrintLogs,
    addBillPrintLog,
    generateReceipt,
    updateReceiptStatus,
    coupons,
    addSystemNotification,
    adminUpdateBillingSettings,
    menuItems,
    menuCategories,
    staffAddItemsToBill,
    staffUpdateOrderItemQuantity,
    tableSessions,
    setTableSessions,
    setTables,
    setOrders,
    selectedBranchId,
    customerRequestService
  } = useAppState();

  const activeBranchId = selectedBranchId || currentUser?.branchId;

  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSelectedCategory, setAddSelectedCategory] = useState<string | null>(null);
  const [addIsVegOnly, setAddIsVegOnly] = useState(false);

  // Customize modal states
  const [customizingItem, setCustomizingItem] = useState<any>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [customizingQty, setCustomizingQty] = useState(1);

  const [activeBillSettleSessionId, setActiveBillSettleSessionId] = useState<string | null>(null);
  const [cashierPayMethod, setCashierPayMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [settledInvoice, setSettledInvoice] = useState<any>(null);

  // Waiter Manual Order Module States
  const [waiterTab, setWaiterTab] = useState<'alerts' | 'manual'>('alerts');
  const [waiterSearchQuery, setWaiterSearchQuery] = useState('');
  const [waiterSelectedTable, setWaiterSelectedTable] = useState<any | null>(null);
  const [waiterActiveSession, setWaiterActiveSession] = useState<any | null>(null);
  const [waiterCart, setWaiterCart] = useState<{ id: string; item: any; quantity: number; selectedVariant?: any; selectedAddons: any[]; specialInstructions?: string }[]>([]);
  const [waiterSearchMenuQuery, setWaiterSearchMenuQuery] = useState('');
  const [waiterSelectedCategory, setWaiterSelectedCategory] = useState<string | null>(null);
  const [waiterIsVegOnly, setWaiterIsVegOnly] = useState(false);
  const [viewOrdersTable, setViewOrdersTable] = useState<any | null>(null);
  const [transferringFromTable, setTransferringFromTable] = useState<any | null>(null);
  const [transferTargetTableId, setTransferTargetTableId] = useState<string>('');

  // Analytics calculations for Waiter Manual Ordering
  const waiterOrders = orders.filter(o => o.source === 'Waiter' || o.source === 'Waiter POS');
  const qrOrdersCount = orders.filter(o => o.source === 'Customer QR').length;
  const waiterOrdersCount = waiterOrders.length;
  const cashierOrdersCount = orders.filter(o => o.source === 'Cashier' || o.source === 'Cashier POS' || o.source === 'Manager').length;

  const waiterStatsMap: { [name: string]: { count: number; sales: number } } = {};
  waiterOrders.forEach(o => {
    const name = o.addedBy || 'Unknown Waiter';
    if (!waiterStatsMap[name]) {
      waiterStatsMap[name] = { count: 0, sales: 0 };
    }
    waiterStatsMap[name].count += 1;
    waiterStatsMap[name].sales += o.totalAmount;
  });

  const waiterStatsList = Object.entries(waiterStatsMap).map(([name, stats]) => ({
    name,
    count: stats.count,
    sales: stats.sales
  })).sort((a, b) => b.sales - a.sales);

  const totalWaiterSales = waiterOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const uniqueWaitersCount = Object.keys(waiterStatsMap).length || 1;
  const averageWaiterSales = totalWaiterSales / uniqueWaitersCount;
  const topPerformingWaiter = waiterStatsList[0] || { name: 'None', count: 0, sales: 0 };

  const handleSelectTableForOrder = async (table: any) => {
    setWaiterSelectedTable(table);
    
    // Find active session
    const activeSess = tableSessions.find(s => s.tableId === table.id && s.isActive);
    if (activeSess) {
      setWaiterActiveSession(activeSess);
      setWaiterCart([]); // Cart starts empty for the new additions of this session
      addSystemNotification(`📝 Continuing running session for Table ${table.tableNumber}`);
    } else {
      const newSessId = crypto.randomUUID();
      const newSessToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestName = `Guest @ T${table.tableNumber}`;
      
      try {
        const { data: newSess, error } = await supabase
          .from('table_sessions')
          .insert([{
            id: newSessId,
            session_token: newSessToken,
            table_id: table.id,
            restaurant_id: selectedRestaurantId || table.restaurantId,
            branch_id: table.branchId,
            customer_name: guestName,
            customer_phone: '',
            status: 'Active',
            payment_status: 'pending'
          }])
          .select()
          .single();
        if (error) throw error;

        // Update table status to occupied
        await supabase
          .from('restaurant_tables')
          .update({ status: 'Occupied' })
          .eq('id', table.id);

        const createdSess: any = {
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

        // Update local states
        setTableSessions((prev) => [...prev, createdSess]);
        setTables((prev) => prev.map((t) => t.id === table.id ? { ...t, status: 'Occupied' as any } : t));
        setWaiterActiveSession(createdSess);
        setWaiterCart([]);
        addSystemNotification(`✨ Created new manual session for Table ${table.tableNumber}`);
      } catch (err: any) {
        console.error("Failed to create table session:", err.message);
        addSystemNotification("⚠️ Failed to start table session: " + err.message);
      }
    }
  };

  const handleTransferTable = async (fromTableId: string, toTableId: string) => {
    if (!fromTableId || !toTableId) return;

    // Find active session for fromTable
    const session = tableSessions.find(s => s.tableId === fromTableId && s.isActive);
    if (!session) {
      addSystemNotification("⚠️ No active session found to transfer.");
      return;
    }

    const fromTbl = tables.find(t => t.id === fromTableId);
    const toTbl = tables.find(t => t.id === toTableId);
    if (!fromTbl || !toTbl) return;

    try {
      // 1. Update table_id in table_sessions in Supabase
      const { error: sessErr } = await supabase
        .from('table_sessions')
        .update({ table_id: toTableId })
        .eq('id', session.id);
      if (sessErr) throw sessErr;

      // 2. Update table_id in orders in Supabase
      const { error: ordErr } = await supabase
        .from('orders')
        .update({ table_id: toTableId })
        .eq('session_id', session.id);
      if (ordErr) throw ordErr;

      // 3. Update table status in restaurant_tables in Supabase
      await supabase.from('restaurant_tables').update({ status: 'Available' }).eq('id', fromTableId);
      await supabase.from('restaurant_tables').update({ status: 'Occupied' }).eq('id', toTableId);

      // 4. Update local states
      setTableSessions(prev => prev.map(s => s.id === session.id ? { ...s, tableId: toTableId } : s));
      setOrders(prev => prev.map(o => o.sessionId === session.id ? { ...o, tableId: toTableId, tableNumber: toTbl.tableNumber } : o));
      
      setTables(prev => prev.map(t => {
        if (t.id === fromTableId) return { ...t, status: 'Available' as any };
        if (t.id === toTableId) return { ...t, status: 'Occupied' as any };
        return t;
      }));

      addSystemNotification(`🔀 Transferred Table ${fromTbl.tableNumber} to Table ${toTbl.tableNumber} successfully!`);
      setTransferringFromTable(null);
    } catch (err: any) {
      console.error("Failed to transfer table:", err.message);
      addSystemNotification("⚠️ Transfer failed: " + err.message);
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setSettledInvoice(null);
      if (path === '/orders') {
        if (staffSubRole !== 'kitchen' && staffSubRole !== 'waiter') {
          setStaffSubRole('kitchen');
        }
      } else if (path === '/tables') {
        setStaffSubRole('cashier');
      } else if (path === '/dashboard' || path === '/analytics') {
        setStaffSubRole('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [staffSubRole, setStaffSubRole]);

  // POS Billing Module State Additions
  const [posTab, setPosTab] = useState<'register' | 'reports'>('register');
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [customCouponCode, setCustomCouponCode] = useState<string>('');
  const [customServiceChargePercent, setCustomServiceChargePercent] = useState<number | undefined>(undefined);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'thermal' | 'a4'>('thermal');
  const [printAnimation, setPrintAnimation] = useState<boolean>(false);
  const [shareModal, setShareModal] = useState<boolean>(false);
  const [shareTarget, setShareTarget] = useState<'whatsapp' | 'email'>('whatsapp');
  const [shareInput, setShareInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!currentUser || ![UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN, UserRole.WAITER, UserRole.RESTAURANT_ADMIN].includes(currentUser.role)) {
    return <AuthPortal initialRequestedRole="staff" />;
  }

  const isAuthorized = (moduleId: string) => {
    return currentUser?.authorizedModules?.includes(moduleId) ?? false;
  };

  const path = window.location.pathname;
  let currentRouteModule = 'dashboard';
  if (path === '/orders') {
    if (isAuthorized('kitchen') && !isAuthorized('waiter')) {
      currentRouteModule = 'kitchen';
    } else if (isAuthorized('waiter') && !isAuthorized('kitchen')) {
      currentRouteModule = 'waiter';
    } else if (isAuthorized('kitchen') && isAuthorized('waiter')) {
      currentRouteModule = staffSubRole === 'waiter' ? 'waiter' : 'kitchen';
    } else {
      currentRouteModule = 'unauthorized';
    }
  } else if (path === '/tables') {
    currentRouteModule = 'cashier';
  } else if (path === '/dashboard' || path === '/analytics') {
    currentRouteModule = 'dashboard';
  }

  const hasAccessToCurrentRoute = currentRouteModule !== 'unauthorized' && isAuthorized(currentRouteModule);

  const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
  const canAddItems = currentUser && (
    [UserRole.RESTAURANT_ADMIN, UserRole.MANAGER, UserRole.CASHIER].includes(currentUser.role) ||
    (currentUser.role === UserRole.WAITER && activeRest.waiterCanAddItems)
  );
  const canRemoveItems = currentUser && (
    [UserRole.RESTAURANT_ADMIN, UserRole.MANAGER, UserRole.CASHIER].includes(currentUser.role)
  );
  const restOrders = orders.filter((o) => o.restaurantId === selectedRestaurantId);
  const activeRequests = waiterRequests.filter((r) => r.restaurantId === selectedRestaurantId && r.status === 'pending');
  const restTables = tables.filter((t) => t.restaurantId === selectedRestaurantId);

  // Active metrics
  const pendingOrdersCount = restOrders.filter((o) => o.status === OrderStatus.PENDING).length;
  const preparingOrdersCount = restOrders.filter((o) => o.status === OrderStatus.PREPARING).length;
  const activeBillRequests = activeRequests.filter((r) => r.type === ServiceRequestType.REQUEST_BILL);

  // Helper: Settle calculation for Cashier POS
  const getSessionSettleDetails = (sessionId: string) => {
    const sessOrders = restOrders.filter((o) => o.sessionId === sessionId && o.status !== OrderStatus.CANCELLED);
    const subtotal = sessOrders.reduce((acc, o) => acc + o.subtotal, 0);
    const discount = sessOrders.reduce((acc, o) => acc + o.discountAmount, 0);
    const tax = sessOrders.reduce((acc, o) => acc + o.gstAmount, 0);
    const srv = sessOrders.reduce((acc, o) => acc + o.serviceChargeAmount, 0);
    const total = sessOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    const tblNum = sessOrders[0]?.tableNumber || '00';
    const custName = sessOrders[0] ? 'Guest Table ' + tblNum : 'Guest';

    return { subtotal, discount, tax, srv, total, tblNum, custName, sessOrders };
  };

  const handleCashierSettle = (sessionId: string) => {
    const { payment } = cashierSettleTable(sessionId, cashierPayMethod);
    setSettledInvoice({
      ...payment,
      details: getSessionSettleDetails(sessionId)
    });
    setActiveBillSettleSessionId(null);
  };

  return (
    <div className="flex-1 bg-[#090a0f] text-slate-100 flex flex-col h-full overflow-hidden select-none">
      
      {/* 1. Crew Nav Bar */}
      <div className="bg-[#11131e] border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex gap-1 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp, color: 'text-amber-400' },
            { id: 'kitchen', label: 'Kitchen KDS', icon: ChefHat, color: 'text-indigo-400', badge: pendingOrdersCount },
            { id: 'waiter', label: 'Waiter Alerts', icon: Bell, color: 'text-rose-400', badge: activeRequests.length },
            { id: 'cashier', label: 'Cashier POS', icon: DollarSign, color: 'text-emerald-400', badge: activeBillRequests.length },
          ].filter(item => isAuthorized(item.id)).map((role) => (
            <button
              key={role.id}
              onClick={() => {
              setStaffSubRole(role.id as any);
              setSettledInvoice(null);
              // Update URL path
              let nextPath = '/dashboard';
              if (role.id === 'kitchen' || role.id === 'waiter') nextPath = '/orders';
              else if (role.id === 'cashier') nextPath = '/tables';
              window.history.pushState(null, '', nextPath);
              window.dispatchEvent(new Event('popstate'));
            }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                staffSubRole === role.id
                  ? 'bg-slate-800 border-slate-700 text-white font-extrabold shadow-sm'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <role.icon className={`w-3.5 h-3.5 ${role.color}`} />
              <span>{role.label}</span>
              {role.badge !== undefined && role.badge > 0 ? (
                <span className="bg-rose-500 text-white font-black text-[9px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-pulse">
                  {role.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-slate-350 font-semibold">{currentUser?.fullName}</span>
            <span className="text-[8px] text-slate-500 font-mono uppercase font-bold">{currentUser?.role?.replace('_', ' ')}</span>
          </div>
          <button
            onClick={logout}
            className="text-[10px] bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 px-2 py-1 rounded-lg cursor-pointer transition shrink-0 font-bold"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* 2. Operational Panes Container */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {!hasAccessToCurrentRoute ? (
          <div className="flex flex-col items-center justify-center p-6 min-h-[50vh]">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
              <div className="w-16 h-16 rounded-full bg-rose-550/10 border border-rose-500/25 flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="w-8 h-8 text-rose-550" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Access Restricted</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                  Your employee account role <span className="font-mono text-amber-400 uppercase font-bold">[{currentUser?.role}]</span> is not authorized to access the requested module.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center font-sans">
                {isAuthorized('dashboard') && (
                  <button
                    onClick={() => {
                      setStaffSubRole('dashboard');
                      window.history.pushState(null, '', '/dashboard');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    Return to Overview
                  </button>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
        
        {/* ======================================= */}
        {/* PANEL: OVERVIEW STATS & TABLE DIRECTORY */}
        {/* ======================================= */}
        {staffSubRole === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Today's Orders", val: restOrders.length, foot: "Completed + active", theme: "from-blue-500/10 border-blue-500/20 text-blue-400" },
                { title: "KDS Queue", val: pendingOrdersCount + preparingOrdersCount, foot: "Pending & preparing", theme: "from-indigo-500/10 border-indigo-500/20 text-indigo-400" },
                { title: "Active Alerts", val: activeRequests.length, foot: "Water, calls, tissue", theme: "from-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse" },
                { title: "Occupied Tables", val: restTables.filter(t => t.status === TableStatus.OCCUPIED || t.status === TableStatus.BILL_REQUESTED).length, foot: `Out of ${restTables.length} tables`, theme: "from-amber-500/10 border-amber-500/20 text-amber-400" },
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-tr ${card.theme} border p-4 rounded-2xl shadow-md`}>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide font-mono">{card.title}</span>
                  <p className="text-2xl font-black mt-1.5 leading-none">{card.val}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">{card.foot}</p>
                </div>
              ))}
            </div>

            {/* Table Session Layout grid */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                <span className="text-xs font-bold text-slate-300">TABLE SECTOR STATUS</span>
                <span className="text-[10px] text-slate-500 font-mono">Total Positions: {restTables.length}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {restTables.map((tbl) => {
                  let statusColor = "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700";
                  if (tbl.status === TableStatus.OCCUPIED) statusColor = "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md";
                  if (tbl.status === TableStatus.BILL_REQUESTED) statusColor = "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 animate-pulse shadow-lg";
                  if (tbl.status === TableStatus.CLEANING) statusColor = "bg-blue-500/10 border-blue-500/30 text-blue-400";
                  
                  return (
                    <div key={tbl.id} className={`p-4 rounded-2xl border flex flex-col justify-between h-32 transition-all duration-200 ${statusColor}`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase font-mono">TBL {tbl.tableNumber}</span>
                          <span className="text-[9px] opacity-75">{tbl.seatingCapacity} seats</span>
                        </div>
                        <span className="text-[9px] font-mono mt-2 font-bold block opacity-90 uppercase tracking-wide">
                          ● {tbl.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Mini Action triggers */}
                      <div className="mt-3">
                        {tbl.status === TableStatus.CLEANING ? (
                          <button
                            onClick={() => staffMarkTableCleaned(tbl.id)}
                            className="w-full bg-blue-500 text-slate-950 font-black text-[9px] tracking-wide py-1 rounded-lg cursor-pointer transition-all active:scale-95"
                          >
                            Mark Cleaned
                          </button>
                        ) : tbl.status === TableStatus.BILL_REQUESTED ? (
                          <button
                            onClick={() => {
                              // Find session linking to table
                              const sessionOrders = restOrders.find(o => o.tableId === tbl.id && o.status !== OrderStatus.COMPLETED) || restOrders.find(o => o.tableId === tbl.id);
                              if (sessionOrders) {
                                setStaffSubRole('cashier');
                                setActiveBillSettleSessionId(sessionOrders.sessionId);
                              }
                            }}
                            className="w-full bg-emerald-500 text-slate-950 font-black text-[9px] tracking-wide py-1 rounded-lg cursor-pointer transition-all active:scale-95"
                          >
                            POS Checkout
                          </button>
                        ) : (
                          <span className="text-[8px] text-slate-600 font-mono block">No actions pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: KITCHEN DISPLAY SYSTEM (KDS) */}
        {/* ======================================= */}
        {staffSubRole === 'kitchen' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4" />
                Live Kitchen Display Board
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Preparing: {preparingOrdersCount} orders
              </span>
            </div>

            {/* List Kitchen Orders */}
            {restOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).length === 0 ? (
              <div className="text-center py-20 bg-[#11131e]/20 border border-dashed border-slate-800 rounded-2xl">
                <Utensils className="w-10 h-10 mx-auto text-slate-700 opacity-25 mb-2" />
                <span className="text-xs text-slate-400 font-medium">Kitchen display is clear!</span>
                <p className="text-[10px] text-slate-500 mt-1">New incoming customer orders will flash here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {restOrders
                  .filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED)
                  .map((order) => {
                    const isPending = order.status === OrderStatus.PENDING;
                    const isAccepted = order.status === OrderStatus.ACCEPTED;
                    const isPreparing = order.status === OrderStatus.PREPARING;
                    const isReady = order.status === OrderStatus.READY;
                    const isServed = order.status === OrderStatus.SERVED;

                    let borderTheme = "border-slate-800";
                    if (isPending) borderTheme = "border-amber-500/40 bg-amber-500/5 animate-pulse";
                    if (isPreparing) borderTheme = "border-indigo-500/40 bg-indigo-500/5";
                    if (isReady) borderTheme = "border-emerald-500/40";

                    return (
                      <div key={order.id} className={`border p-4 rounded-2xl flex flex-col justify-between ${borderTheme} shadow-md`}>
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                            <div>
                              <span className="bg-slate-800/80 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                                Table {order.tableNumber}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-2 font-mono">#{order.id.substr(-4)}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Items checklist */}
                          <div className="space-y-2 mb-4">
                            {order.items.map((it) => (
                              <div key={it.id} className="text-xs">
                                <div className="flex justify-between items-start">
                                  <span className="font-extrabold text-slate-100">{it.quantity}x {it.name}</span>
                                </div>
                                {it.selectedVariant && (
                                  <span className="text-[9px] text-amber-400 block ml-4 font-mono">Portion: {it.selectedVariant.name}</span>
                                )}
                                {it.selectedAddons.length > 0 && (
                                  <span className="text-[8px] text-slate-400 block ml-4 leading-normal">
                                    + {it.selectedAddons.map((a) => a.name).join(', ')}
                                  </span>
                                )}
                                {it.specialInstructions && (
                                  <div className="mt-1 ml-4 border-l-2 border-indigo-500/40 pl-2 text-[9px] text-indigo-400 italic font-mono bg-indigo-500/5 p-1 rounded-r">
                                    Note: {it.specialInstructions}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive status drivers */}
                        <div className="border-t border-slate-800/60 pt-3 flex gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => staffCancelOrder(order.id)}
                                className="flex-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => staffAcceptOrder(order.id)}
                                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-slate-950 hover:text-white font-extrabold py-1.5 rounded-lg text-[10px] cursor-pointer"
                              >
                                Accept Order
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button
                              onClick={() => staffStartPreparing(order.id)}
                              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-slate-950 font-black py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>START PREPARATION</span>
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              onClick={() => staffMarkReady(order.id)}
                              className="w-full bg-emerald-500 text-slate-950 font-black py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer animate-pulse"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>MARK AS READY TO SERVE</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => staffMarkServed(order.id)}
                              className="w-full bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>SERVED TO TABLE</span>
                            </button>
                          )}

                          {isServed && (
                            <div className="w-full text-center py-1 bg-slate-900 border border-slate-850 rounded-lg text-[9px] text-slate-500 font-mono uppercase">
                              Delivered to Crew Waiter
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: WAITER ALERTS & REQUEST RESOLVE */}
        {/* ======================================= */}
        {/* ======================================= */}
        {/* PANEL: WAITER ALERTS & MANUAL ORDERING */}
        {/* ======================================= */}
        {staffSubRole === 'waiter' && (
          <div className="space-y-6">
            
            {/* Waiter Subrole Top Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/85 pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setWaiterTab('alerts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                    waiterTab === 'alerts'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-extrabold shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Alerts & Deliveries ({activeRequests.length})</span>
                </button>
                {currentUser?.role !== UserRole.CASHIER && (
                  <button
                    onClick={() => setWaiterTab('manual')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                      waiterTab === 'manual'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-extrabold shadow-sm'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Manual Ordering Module</span>
                  </button>
                )}
              </div>
              
              {/* Waiter Performance Realtime Summary Card */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl text-[10px] font-mono text-slate-400 shadow-inner">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Total Waiter Sales: <strong className="text-emerald-400">{formatIndianCurrency(totalWaiterSales, activeRest.currency)}</strong></span>
                </div>
                <span className="text-slate-800 hidden sm:inline">|</span>
                <div>
                  <span>Avg Sales/Waiter: <strong className="text-amber-400">{formatIndianCurrency(averageWaiterSales, activeRest.currency)}</strong></span>
                </div>
                <span className="text-slate-800 hidden sm:inline">|</span>
                <div>
                  <span>Top Performing: <strong className="text-indigo-400">{topPerformingWaiter.name}</strong></span>
                </div>
              </div>
            </div>

            {waiterTab === 'alerts' ? (
              // ============================================
              // WAITER SUB-TAB 1: ALERTS & DELIVERY TRACKER
              // ============================================
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-4">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 animate-bounce" />
                      Active Table Assistance Alerts
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Unresolved requests: {activeRequests.length}
                    </span>
                  </div>

                  {activeRequests.length === 0 ? (
                    <div className="text-center py-10 bg-[#11131e]/20 border border-dashed border-slate-800 rounded-2xl">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/20 mb-2" />
                      <span className="text-xs text-slate-400 font-medium font-sans">All guest tables are happy!</span>
                      <p className="text-[10px] text-slate-500 mt-1">Water, service calls, and bill requests will flash here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {activeRequests.map((req) => {
                        let reqLabel = "Service Call";
                        let ReqIcon = Coffee;
                        let cardBg = "border-amber-500/20 bg-amber-500/5";

                        if (req.type === ServiceRequestType.REQUEST_WATER) {
                          reqLabel = "Water Bottle";
                          ReqIcon = Droplet;
                          cardBg = "border-blue-500/20 bg-blue-500/5";
                        } else if (req.type === ServiceRequestType.REQUEST_TISSUE) {
                          reqLabel = "Napkin Tissues";
                          ReqIcon = Sparkles;
                          cardBg = "border-slate-500/20 bg-slate-900/40";
                        } else if (req.type === ServiceRequestType.REQUEST_BILL) {
                          reqLabel = "POS FINAL BILL";
                          ReqIcon = DollarSign;
                          cardBg = "border-emerald-500/30 bg-emerald-500/5 animate-pulse";
                        }

                        return (
                          <div key={req.id} className={`border p-4 rounded-2xl flex flex-col justify-between h-36 shadow-md ${cardBg}`}>
                            <div>
                              <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 mb-2 font-mono text-[9px] text-slate-500">
                                <span>ALERT #{req.id.substr(-4)}</span>
                                <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <ReqIcon className="w-5 h-5 text-amber-400" />
                                <div>
                                  <span className="text-xs font-black text-white block">Table {req.tableNumber}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{reqLabel}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => waiterResolveRequest(req.id)}
                              className="w-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-extrabold py-2 rounded-xl text-[10px] cursor-pointer transition-all duration-200"
                            >
                              Resolve Call
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-4">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-400" />
                      Table Serving & Delivery Tracker (Active Orders)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Ready & Served: {restOrders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.SERVED).length}
                    </span>
                  </div>

                  {restOrders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.SERVED).length === 0 ? (
                    <div className="text-center py-12 bg-[#11131e]/10 border border-dashed border-slate-850 rounded-2xl">
                      <Utensils className="w-8 h-8 mx-auto text-slate-700 opacity-30 mb-2" />
                      <span className="text-xs text-slate-500 font-semibold">No active deliveries pending!</span>
                      <p className="text-[10px] text-slate-500 mt-1">Orders marked as ready by kitchen or currently served will display here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {restOrders
                        .filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.SERVED)
                        .map((order) => {
                          const isReady = order.status === OrderStatus.READY;

                          return (
                            <div
                              key={order.id}
                              className={`border p-4 rounded-2xl flex flex-col justify-between shadow-md transition-all ${
                                isReady
                                  ? 'border-amber-500/30 bg-amber-500/5 animate-pulse'
                                  : 'border-indigo-500/30 bg-slate-900/20'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                                  <span className="bg-slate-800 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-lg">
                                    Table {order.tableNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">#{order.id.substr(-4)}</span>
                                </div>

                                <div className="space-y-1.5 mb-4">
                                  {order.items.map((it) => (
                                    <div key={it.id} className="text-xs flex justify-between">
                                      <span className="text-slate-300 font-bold">
                                        {it.quantity}x {it.name}
                                      </span>
                                      {it.selectedVariant && (
                                        <span className="text-[10px] text-amber-500 font-mono">({it.selectedVariant.name})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">STATUS</span>
                                  <span
                                    className={`text-[10px] font-black uppercase font-mono ${
                                      isReady ? 'text-amber-400' : 'text-indigo-400'
                                    }`}
                                  >
                                    {isReady ? '🍳 Ready for Table' : '✅ Served to Table'}
                                  </span>
                                </div>

                                {isReady ? (
                                  <button
                                    onClick={() => staffMarkServed(order.id)}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all active:scale-95"
                                  >
                                    SERVE TO TABLE
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => staffCompleteOrder(order.id)}
                                    className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-black px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all"
                                  >
                                    MARK COMPLETE
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // ============================================
              // WAITER SUB-TAB 2: MANUAL ORDERING SYSTEM
              // ============================================
              <div className="space-y-6">
                
                {waiterSelectedTable ? (
                  // 2A. ACTIVE POS ORDERING WORKSPACE (SPLIT SCREEN)
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Category & Item Selection Grid (8 Cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="bg-[#11131e]/90 border border-slate-800/80 p-4 rounded-3xl space-y-3 shadow-md backdrop-blur-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-amber-500 font-mono font-bold block uppercase tracking-wider">BROWSE SIZZLR MENU</span>
                            <h3 className="text-sm font-black text-white">Select Items to Place Order</h3>
                          </div>
                          
                          <button
                            onClick={() => {
                              if (waiterCart.length > 0 && !window.confirm("Abandon current items in cart?")) return;
                              setWaiterSelectedTable(null);
                              setWaiterActiveSession(null);
                              setWaiterCart([]);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Exit Ordering</span>
                          </button>
                        </div>

                        {/* Search and Category Filter controls */}
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={waiterSearchMenuQuery}
                              onChange={(e) => setWaiterSearchMenuQuery(e.target.value)}
                              placeholder="Search menu items by name, ingredients, description..."
                              className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none placeholder-slate-600"
                            />
                            {waiterSearchMenuQuery && (
                              <button
                                onClick={() => setWaiterSearchMenuQuery('')}
                                className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-850 pt-2.5">
                            <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
                              <button
                                onClick={() => setWaiterSelectedCategory(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                                  waiterSelectedCategory === null
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                All Categories
                              </button>
                              {menuCategories.map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => setWaiterSelectedCategory(waiterSelectedCategory === cat.id ? null : cat.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                                    waiterSelectedCategory === cat.id
                                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                                      : 'bg-slate-900 border border-slate-850 text-slate-350 hover:text-slate-200'
                                  }`}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => setWaiterIsVegOnly(!waiterIsVegOnly)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                                waiterIsVegOnly
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold'
                                  : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              <span>Veg Only</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Menu Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {(() => {
                          const filtered = menuItems.filter((item) => {
                            const matchesSearch = item.name.toLowerCase().includes(waiterSearchMenuQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(waiterSearchMenuQuery.toLowerCase());
                            const matchesCategory = waiterSelectedCategory ? item.categoryId === waiterSelectedCategory : true;
                            const matchesVeg = waiterIsVegOnly ? item.isVeg : true;
                            return matchesSearch && matchesCategory && matchesVeg;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="col-span-full text-center py-16 bg-slate-900/10 border border-dashed border-slate-850 rounded-3xl text-slate-500">
                                <Utensils className="w-8 h-8 mx-auto text-slate-700 opacity-35 mb-2" />
                                <span className="text-xs font-semibold">No food items found matching criteria.</span>
                              </div>
                            );
                          }

                          return filtered.map((item) => (
                            <div
                              key={item.id}
                              className="bg-[#11131e]/60 border border-slate-850 p-3.5 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-all shadow-sm"
                            >
                              <div className="flex gap-2.5">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-850 shrink-0 relative">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  <span className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-sm flex items-center justify-center p-0.5 border bg-slate-950/80 ${item.isVeg ? 'border-emerald-500' : 'border-rose-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-white line-clamp-1">{item.name}</h4>
                                  <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-normal">{item.description}</p>
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-850/65">
                                <span className="text-xs font-black text-white font-mono">{formatIndianCurrency(item.price, activeRest.currency)}</span>
                                <button
                                  onClick={() => {
                                    setCustomizingItem(item);
                                    setSelectedVariantId(item.variants?.[0]?.id || '');
                                    setSelectedAddonIds([]);
                                    setSpecialInstructions('');
                                    setCustomizingQty(1);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition active:scale-95 shadow"
                                >
                                  ADD TO ORDER
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Right Column: POS Cart Builder & Bill summary (4 Cols) */}
                    <div className="lg:col-span-4 bg-[#11131e]/80 border border-slate-800/80 rounded-3xl p-4 flex flex-col h-[75vh] justify-between shadow-2xl backdrop-blur-md sticky top-4">
                      
                      {/* Cart Header */}
                      <div className="border-b border-slate-850 pb-3 mb-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-slate-800 text-amber-400 font-extrabold px-2 py-0.5 rounded-lg">
                              Table {waiterSelectedTable.tableNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Cart Builder</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1">Session: {waiterActiveSession?.id?.substr(-8)} • {waiterActiveSession?.customerName}</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/45 px-2 py-0.5 rounded border border-emerald-900/30 uppercase font-mono font-bold animate-pulse">Waiter POS</span>
                      </div>

                      {/* Cart Items List */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                        {waiterCart.map((cartItem) => {
                          const itemPrice = cartItem.item.price + (cartItem.selectedVariant?.price || 0) + cartItem.selectedAddons.reduce((sa, a) => sa + a.price, 0);
                          return (
                            <div key={cartItem.id} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-bold text-slate-100 block truncate">{cartItem.item.name}</span>
                                  {cartItem.selectedVariant && (
                                    <span className="text-[9px] text-amber-500 font-bold uppercase block mt-0.5">Size: {cartItem.selectedVariant.name}</span>
                                  )}
                                  {cartItem.selectedAddons.length > 0 && (
                                    <span className="text-[9px] text-slate-400 block truncate leading-relaxed mt-0.5">
                                      + {cartItem.selectedAddons.map(a => a.name).join(', ')}
                                    </span>
                                  )}
                                  {cartItem.specialInstructions && (
                                    <span className="text-[9px] text-indigo-400 bg-indigo-950/20 px-1.5 py-0.5 border border-indigo-950 rounded block mt-1 truncate italic">
                                      “{cartItem.specialInstructions}”
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-black font-mono text-white pl-2 shrink-0">{formatIndianCurrency(itemPrice * cartItem.quantity, activeRest.currency)}</span>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-900/60">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setWaiterCart(prev => prev.map(c => c.id === cartItem.id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c));
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold font-mono text-white">{cartItem.quantity}</span>
                                  <button
                                    onClick={() => {
                                      setWaiterCart(prev => prev.map(c => c.id === cartItem.id ? { ...c, quantity: c.quantity + 1 } : c));
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => setWaiterCart(prev => prev.filter(c => c.id !== cartItem.id))}
                                  className="text-[10px] text-rose-450 hover:text-rose-400 font-bold cursor-pointer hover:bg-rose-950/15 p-1 rounded transition"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {waiterCart.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-600 space-y-2">
                            <ClipboardList className="w-10 h-10 text-slate-800" />
                            <span className="text-xs font-semibold">Your order cart is empty.</span>
                            <p className="text-[10px] text-slate-500 leading-normal max-w-[200px]">Select items from Sizzlr menu on the left to build the order.</p>
                          </div>
                        )}
                      </div>

                      {/* Calculations & Submit */}
                      <div className="border-t border-slate-850 pt-3.5 space-y-3.5 mt-3 shrink-0">
                        {(() => {
                          const subtotal = waiterCart.reduce((acc, c) => {
                            const itemPrice = c.item.price + (c.selectedVariant?.price || 0) + c.selectedAddons.reduce((sa, a) => sa + a.price, 0);
                            return acc + itemPrice * c.quantity;
                          }, 0);
                          const gstAmount = parseFloat((subtotal * (activeRest.gstPercent / 100)).toFixed(2));
                          const srvAmount = parseFloat((subtotal * (activeRest.serviceChargePercent / 100)).toFixed(2));
                          const total = parseFloat((subtotal + gstAmount + srvAmount).toFixed(2));

                          return (
                            <>
                              <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span className="text-slate-200">{formatIndianCurrency(subtotal, activeRest.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>GST Tax ({activeRest.gstPercent}%):</span>
                                  <span className="text-slate-200">+{formatIndianCurrency(gstAmount, activeRest.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Service Charge ({activeRest.serviceChargePercent}%):</span>
                                  <span className="text-slate-200">+{formatIndianCurrency(srvAmount, activeRest.currency)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black border-t border-slate-900 pt-2 text-white">
                                  <span className="font-sans">Grand Total:</span>
                                  <span className="text-amber-400 font-mono">{formatIndianCurrency(total, activeRest.currency)}</span>
                                </div>
                              </div>

                              <button
                                onClick={async () => {
                                  if (waiterCart.length === 0) return;
                                  try {
                                    await staffAddItemsToBill(waiterActiveSession.id, waiterCart);
                                    setWaiterCart([]);
                                    setWaiterSelectedTable(null);
                                    setWaiterActiveSession(null);
                                    addSystemNotification(`✨ Order successfully sent to kitchen!`);
                                  } catch (e: any) {
                                    console.error("Failed to place manual order:", e);
                                    addSystemNotification("⚠️ Order submit failed: " + e.message);
                                  }
                                }}
                                disabled={waiterCart.length === 0}
                                className={`w-full font-black py-3 rounded-xl text-xs text-center uppercase tracking-wider cursor-pointer shadow transition active:scale-95 ${
                                  waiterCart.length > 0
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                    : 'bg-slate-800 text-slate-550 cursor-not-allowed'
                                }`}
                              >
                                Submit Order to Kitchen
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 2B. TABLE SELECTION & MANAGEMENT GRID (WITH DETAILED CARDS & REALTIME BILLS)
                  <div className="space-y-6">
                    
                    {/* Realtime Bento Grid Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      
                      {/* Grid Cell 1: Total Distribution */}
                      <div className="bg-[#11131e]/50 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Zap className="w-16 h-16 text-indigo-400" />
                        </div>
                        <span className="text-[10px] text-slate-450 font-mono block uppercase tracking-wider font-bold">Active Orders Distribution</span>
                        <div className="mt-3.5 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="flex items-center gap-1.5 font-sans"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />📱 Customer QR:</span>
                            <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{qrOrdersCount} orders</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="flex items-center gap-1.5 font-sans"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />👨‍🍳 Waiter POS:</span>
                            <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{waiterOrdersCount} orders</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="flex items-center gap-1.5 font-sans"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />💵 Cashier POS:</span>
                            <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{cashierOrdersCount} orders</span>
                          </div>
                        </div>
                      </div>

                      {/* Grid Cell 2: Waiter Performance Avg */}
                      <div className="bg-[#11131e]/50 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <TrendingUp className="w-16 h-16 text-emerald-400" />
                        </div>
                        <span className="text-[10px] text-slate-450 font-mono block uppercase tracking-wider font-bold">Waiter Revenue & Velocity</span>
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-350">
                            <span>Total Revenue Added:</span>
                            <span className="font-mono font-bold text-emerald-400">{formatIndianCurrency(totalWaiterSales, activeRest.currency)}</span>
                          </div>
                          <div className="flex justify-between text-slate-350">
                            <span>Active Waiters Grouped:</span>
                            <span className="font-mono font-bold text-white">{uniqueWaitersCount} staff</span>
                          </div>
                          <div className="flex justify-between text-slate-350">
                            <span>Avg Waiter Efficiency:</span>
                            <span className="font-mono font-bold text-amber-400">{formatIndianCurrency(averageWaiterSales, activeRest.currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Grid Cell 3: Live Waiter Leaderboard */}
                      <div className="bg-[#11131e]/50 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[10px] text-slate-450 font-mono block uppercase tracking-wider font-bold">Waiter Performance Leaderboard</span>
                        <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-none">
                          {waiterStatsList.slice(0, 3).map((w, idx) => (
                            <div key={w.name} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center ${idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{idx + 1}</span>
                                <span className="font-semibold text-slate-300 truncate max-w-[120px]">{w.name}</span>
                              </div>
                              <span className="font-mono text-slate-400 text-[11px] font-bold">{formatIndianCurrency(w.sales, activeRest.currency)} ({w.count} ord)</span>
                            </div>
                          ))}
                          {waiterStatsList.length === 0 && (
                            <div className="text-center py-4 text-slate-600 font-mono text-[10px]">
                              No waiter manual logs yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Table Filters & Live Search */}
                    <div className="bg-[#11131e]/40 border border-slate-850 p-3.5 rounded-2xl">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={waiterSearchQuery}
                          onChange={(e) => setWaiterSearchQuery(e.target.value)}
                          placeholder="Search branch tables by number (e.g. '04', '1')..."
                          className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none placeholder-slate-650"
                        />
                        {waiterSearchQuery && (
                          <button
                            onClick={() => setWaiterSearchQuery('')}
                            className="absolute right-3 top-2.5 p-0.5 text-slate-550 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(() => {
                        const filteredTables = tables.filter(t => 
                          t.restaurantId === selectedRestaurantId &&
                          (activeBranchId ? t.branchId === activeBranchId : true) &&
                          t.tableNumber.toLowerCase().includes(waiterSearchQuery.toLowerCase())
                        );

                        if (filteredTables.length === 0) {
                          return (
                            <div className="col-span-full text-center py-16 bg-slate-900/10 border border-dashed border-slate-850 rounded-3xl text-slate-550">
                              <Users className="w-8 h-8 mx-auto text-slate-700 opacity-30 mb-2" />
                              <span className="text-xs font-semibold">No branch tables found.</span>
                            </div>
                          );
                        }

                        return filteredTables.map((tbl) => {
                          const activeSess = tableSessions.find(s => s.tableId === tbl.id && s.isActive);
                          // Compute dynamic current bill based on all orders placed in this table session
                          const sessionOrders = orders.filter((o) => o.sessionId === activeSess?.id && o.status !== OrderStatus.CANCELLED);
                          const currentBill = sessionOrders.reduce((acc, o) => acc + o.totalAmount, 0);

                          let statusBg = 'border-slate-850 bg-slate-950/40 text-slate-400';
                          let statusLabel = 'Available';

                          if (tbl.status === TableStatus.OCCUPIED) {
                            statusBg = 'border-amber-500/20 bg-amber-500/5 text-amber-400';
                            statusLabel = 'Occupied';
                          } else if (tbl.status === TableStatus.BILL_REQUESTED) {
                            statusBg = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 animate-pulse';
                            statusLabel = 'Bill Requested';
                          } else if (tbl.status === TableStatus.CLEANING) {
                            statusBg = 'border-slate-700 bg-slate-900/40 text-slate-400';
                            statusLabel = 'Cleaning';
                          } else if (tbl.status === TableStatus.RESERVED) {
                            statusBg = 'border-indigo-500/25 bg-indigo-950/20 text-indigo-400';
                            statusLabel = 'Reserved';
                          }

                          return (
                            <div
                              key={tbl.id}
                              className={`border p-4.5 rounded-3xl flex flex-col justify-between shadow hover:shadow-lg transition-all ${
                                activeSess ? 'border-slate-800 bg-[#11131e]/50' : 'border-slate-850 bg-[#11131e]/20'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
                                  <div>
                                    <span className="text-[10px] text-slate-500 font-mono block">TABLE</span>
                                    <span className="text-sm font-black text-white">T-{tbl.tableNumber}</span>
                                  </div>
                                  
                                  {/* Table Status Badge */}
                                  <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider font-sans border ${statusBg}`}>
                                    {statusLabel}
                                  </span>
                                </div>

                                <div className="space-y-1.5 mb-4 text-xs">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Capacity:</span>
                                    <span className="font-bold text-white">👥 {tbl.seatingCapacity} Seats</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Running Bill:</span>
                                    <span className="font-mono font-extrabold text-white">
                                      {activeSess ? formatIndianCurrency(currentBill, activeRest.currency) : formatIndianCurrency(0, activeRest.currency)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Session Name:</span>
                                    <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                                      {activeSess ? (activeSess.customerName || `Guest (${activeSess.id.substr(-4)})`) : 'No Active Session'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Waiter Card Action Buttons Block */}
                              <div className="space-y-2 pt-3 border-t border-slate-850">
                                {activeSess ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => handleSelectTableForOrder(tbl)}
                                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded-xl text-[10px] cursor-pointer transition text-center uppercase"
                                      >
                                        Manual Order
                                      </button>
                                      <button
                                        onClick={() => setViewOrdersTable(tbl)}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold py-2 rounded-xl text-[10px] cursor-pointer transition text-center uppercase"
                                      >
                                        View Orders
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={async () => {
                                          if (!window.confirm(`Request bill for Table ${tbl.tableNumber}?`)) return;
                                          try {
                                            // Trigger REQUEST_BILL simulated alert
                                            customerRequestService(ServiceRequestType.REQUEST_BILL);
                                            // Update table status in database
                                            await supabase.from('restaurant_tables').update({ status: 'Bill Requested' }).eq('id', tbl.id);
                                            setTables(prev => prev.map(t => t.id === tbl.id ? { ...t, status: TableStatus.BILL_REQUESTED } : t));
                                            addSystemNotification(`⚡ Requested bill for Table ${tbl.tableNumber}`);
                                          } catch (e: any) {
                                            console.error(e);
                                          }
                                        }}
                                        disabled={tbl.status === TableStatus.BILL_REQUESTED}
                                        className={`font-bold py-1.5 rounded-xl text-[9px] text-center uppercase transition ${
                                          tbl.status === TableStatus.BILL_REQUESTED
                                            ? 'bg-emerald-950/20 text-emerald-600 border border-emerald-950 cursor-not-allowed'
                                            : 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/20 text-emerald-400 cursor-pointer'
                                        }`}
                                      >
                                        {tbl.status === TableStatus.BILL_REQUESTED ? 'Bill Requested' : 'Request Bill'}
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          setTransferringFromTable(tbl);
                                          setTransferTargetTableId('');
                                        }}
                                        className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-bold py-1.5 rounded-xl text-[9px] cursor-pointer transition text-center uppercase flex items-center justify-center gap-1"
                                      >
                                        <ArrowLeftRight className="w-3 h-3" />
                                        <span>Transfer</span>
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => {
                                        addSystemNotification(`🔔 Cashier alerted for Table ${tbl.tableNumber}!`);
                                      }}
                                      className="w-full bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 font-semibold py-1.5 rounded-xl text-[9px] border border-slate-850/60 cursor-pointer transition uppercase text-center"
                                    >
                                      Call Cashier Alert
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleSelectTableForOrder(tbl)}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-[10px] cursor-pointer transition uppercase text-center shadow"
                                  >
                                    Start New Session
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SUB-MODAL: DETAILED ORDER HISTORY & WAITER MODIFIER PERMS */}
            {/* ======================================================== */}
            {viewOrdersTable && (() => {
              const activeSess = tableSessions.find(s => s.tableId === viewOrdersTable.id && s.isActive);
              const sessionOrders = orders.filter((o) => o.sessionId === activeSess?.id && o.status !== OrderStatus.CANCELLED);
              const totalSum = sessionOrders.reduce((acc, o) => acc + o.totalAmount, 0);

              return (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#11131e] border border-slate-800 p-6 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col justify-between shadow-2xl relative">
                    <button
                      onClick={() => setViewOrdersTable(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div>
                      <div className="border-b border-slate-850 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-800 text-amber-400 font-extrabold px-2.5 py-0.5 rounded-lg">
                            Table {viewOrdersTable.tableNumber}
                          </span>
                          <span className="text-sm font-black text-white uppercase tracking-wider">Running Bill & Orders</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Session: {activeSess?.id} • Guest: {activeSess?.customerName}</p>
                      </div>

                      {/* Orders Content list */}
                      <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin">
                        
                        {/* Summary bill items */}
                        <div className="bg-slate-950/60 border border-slate-850/60 p-4 rounded-xl space-y-2">
                          <span className="text-[10px] text-slate-450 font-mono block uppercase tracking-wider font-bold">Itemized Session Bill Summary</span>
                          <div className="space-y-1.5 pt-1.5">
                            {sessionOrders.flatMap(o => o.items).map((it, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-300 font-bold">{it.quantity}x {it.name}</span>
                                <span className="font-mono text-slate-400">{formatIndianCurrency(it.price * it.quantity, activeRest.currency)}</span>
                              </div>
                            ))}
                            {sessionOrders.length === 0 && (
                              <span className="text-[10px] text-slate-600 block text-center py-2 font-mono">No items ordered yet in this session.</span>
                            )}
                          </div>
                          {sessionOrders.length > 0 && (
                            <div className="flex justify-between text-xs font-black border-t border-slate-900 pt-2 text-white">
                              <span>Subtotal Running Bill:</span>
                              <span className="text-amber-400 font-mono">{formatIndianCurrency(totalSum, activeRest.currency)}</span>
                            </div>
                          )}
                        </div>

                        {/* Separate Orders Breakdown with Audit trail & Waiter perms */}
                        <div className="space-y-3">
                          <span className="text-[10px] text-slate-450 font-mono block uppercase tracking-wider font-bold">Placed Orders History & Audit logs</span>
                          
                          {sessionOrders.map((ord) => {
                            const isWaiterOrder = ord.source === 'Waiter' || ord.source === 'Waiter POS';
                            // Waiters can only modify their own orders before they are preparing/ready
                            const canWaiterUpdate = isWaiterOrder && (currentUser?.role !== UserRole.WAITER || ord.addedBy === currentUser.fullName) &&
                              ord.status !== OrderStatus.COMPLETED && ord.status !== OrderStatus.CANCELLED && ord.status !== OrderStatus.SERVED && ord.status !== OrderStatus.READY;

                            return (
                              <div key={ord.id} className="border border-slate-850 bg-slate-950/20 p-3.5 rounded-xl space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-900/60 pb-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-black text-white">Order #{ord.id.substr(-4)}</span>
                                      <span className="text-[9px] font-mono font-semibold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">{ord.source}</span>
                                    </div>
                                    {/* AUDIT TRAIL LOGGING */}
                                    <span className="text-[9px] text-slate-500 font-mono block mt-1 leading-normal">
                                      Added By: <strong className="text-slate-300">{ord.addedBy || 'System'}</strong> ({ord.addedByRole || 'Guest'}) • Time: {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Device: Waiter POS
                                    </span>
                                  </div>

                                  <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded uppercase border ${
                                    ord.status === OrderStatus.PENDING ? 'border-amber-500/25 bg-amber-500/5 text-amber-400' :
                                    ord.status === OrderStatus.PREPARING ? 'border-blue-500/25 bg-blue-500/5 text-blue-400' :
                                    ord.status === OrderStatus.READY ? 'border-purple-500/25 bg-purple-500/5 text-purple-400 animate-pulse' :
                                    'border-slate-800 bg-slate-900 text-slate-400'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {ord.items.map((it) => (
                                    <div key={it.id} className="text-xs flex justify-between items-center bg-slate-900/10 p-2 border border-slate-900/30 rounded-lg">
                                      <div className="min-w-0">
                                        <span className="text-slate-200 font-bold block">{it.quantity}x {it.name}</span>
                                        {it.selectedVariant && (
                                          <span className="text-[9px] text-amber-500 block">({it.selectedVariant.name})</span>
                                        )}
                                      </div>

                                      {/* Quantities updates (Waiter own order update) */}
                                      {canWaiterUpdate ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => staffUpdateOrderItemQuantity(activeSess!.id, ord.id, it.id, it.quantity - 1)}
                                            className="p-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded cursor-pointer transition"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="font-mono text-white font-bold text-xs w-4 text-center">{it.quantity}</span>
                                          <button
                                            onClick={() => staffUpdateOrderItemQuantity(activeSess!.id, ord.id, it.id, it.quantity + 1)}
                                            className="p-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded cursor-pointer transition"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (window.confirm(`Remove ${it.name} from Order?`)) {
                                                staffUpdateOrderItemQuantity(activeSess!.id, ord.id, it.id, 0);
                                              }
                                            }}
                                            className="text-rose-450 hover:text-rose-400 text-[10px] pl-1 font-bold"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="font-mono font-bold text-slate-450 text-[11px]">{formatIndianCurrency(it.price * it.quantity, activeRest.currency)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                    <button
                      onClick={() => setViewOrdersTable(null)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs uppercase font-bold cursor-pointer"
                    >
                      Close Summary
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ======================================================== */}
            {/* SUB-MODAL: TRANSFER TABLE SYSTEM                       */}
            {/* ======================================================== */}
            {transferringFromTable && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#11131e] border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative space-y-4">
                  <button
                    onClick={() => setTransferringFromTable(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center pb-2 border-b border-slate-850">
                    <span className="text-[10px] text-amber-500 font-mono font-bold block uppercase tracking-widest">TABLE MANAGEMENT</span>
                    <h3 className="text-sm font-black text-white mt-1">Transfer Table T-{transferringFromTable.tableNumber}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Move active session to another available table</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 font-mono block uppercase">SELECT TARGET TABLE</label>
                      <select
                        value={transferTargetTableId}
                        onChange={(e) => setTransferTargetTableId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                      >
                        <option value="">-- Choose Available Table --</option>
                        {tables
                          .filter(t => 
                            t.restaurantId === selectedRestaurantId &&
                            (activeBranchId ? t.branchId === activeBranchId : true) &&
                            t.status === TableStatus.AVAILABLE &&
                            t.id !== transferringFromTable.id
                          )
                          .map(t => (
                            <option key={t.id} value={t.id}>Table T-{t.tableNumber} (👥 {t.seatingCapacity} Seats)</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setTransferringFromTable(null)}
                        className="w-1/2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleTransferTable(transferringFromTable.id, transferTargetTableId)}
                        disabled={!transferTargetTableId}
                        className={`w-1/2 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow transition ${
                          transferTargetTableId
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Confirm Transfer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: CASHIER REGISTER / INVOICE POS   */}
        {/* ======================================= */}
        {staffSubRole === 'cashier' && (
          <div className="space-y-6">
            
            {/* Top POS Control Bar & Tabs */}
            <div className="bg-[#11131e]/90 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/15 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <CreditCard className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">POS Sizzlr Register Terminal</h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Printer: <span className="text-amber-400 uppercase font-bold">{activeRest.printerType || 'thermal_80mm'}</span> ({activeRest.receiptWidth || '80mm'}) • Auto-Print: <span className="text-emerald-400 font-bold">{activeRest.autoPrint ? 'ON' : 'OFF'}</span>
                  </p>
                </div>
              </div>

              {/* POS Mode Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0 select-none">
                <button
                  onClick={() => {
                    setPosTab('register');
                    setSettledInvoice(null);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    posTab === 'register'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Register POS</span>
                </button>
                <button
                  onClick={() => {
                    setPosTab('reports');
                    setSettledInvoice(null);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    posTab === 'reports'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reports & Audits</span>
                </button>
              </div>
            </div>

            {posTab === 'register' ? (
              // ===============================================
              // TAB 1: POS REGISTER TERMINAL
              // ===============================================
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Queue (Cols 3) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">CHECKOUT TERMINALS</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  
                  {activeBillRequests.length === 0 ? (
                    <div className="p-4 text-center bg-slate-900/20 border border-slate-850 border-dashed rounded-xl">
                      <span className="text-[11px] text-slate-500 font-mono block">No active bill calls.</span>
                      <p className="text-[9px] text-slate-650 mt-1">Cashier can checkout tables manually from the directory below.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeBillRequests.map((req) => (
                        <button
                          key={req.id}
                          onClick={() => {
                            setActiveBillSettleSessionId(req.sessionId);
                            setSettledInvoice(null);
                            const receiptsList = receipts.filter(r => r.sessionId === req.sessionId);
                            if (receiptsList.length > 0) {
                              setActiveReceipt(receiptsList[0]);
                              setCustomDiscount(receiptsList[0].discountAmount);
                              setCustomCouponCode(receiptsList[0].couponCode || '');
                              setCustomServiceChargePercent(receiptsList[0].serviceChargeAmount ? activeRest.serviceChargePercent : 0);
                            } else {
                              setActiveReceipt(null);
                              setCustomDiscount(0);
                              setCustomCouponCode('');
                              setCustomServiceChargePercent(undefined);
                            }
                          }}
                          className={`w-full p-3 border rounded-xl flex items-center justify-between text-left cursor-pointer transition-all ${
                            activeBillSettleSessionId === req.sessionId
                              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/20 shadow-md'
                              : 'bg-slate-900/60 border-slate-850 hover:bg-slate-850/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            <div>
                              <span className="text-xs font-black text-white block">Table {req.tableNumber} Request</span>
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Token: {req.sessionId.replace('session_', '')}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual Table Checkout Directory */}
                  <div className="pt-2">
                    <span className="text-[9px] font-bold text-slate-500 font-mono block uppercase mb-2 tracking-widest">DINING DIRECTORY</span>
                    <div className="grid grid-cols-2 gap-2">
                      {restTables
                        .filter((t) => t.status === TableStatus.OCCUPIED || t.status === TableStatus.BILL_REQUESTED)
                        .map((tbl) => {
                          const relativeOrder = restOrders.find(o => o.tableId === tbl.id && o.status !== OrderStatus.COMPLETED) || restOrders.find(o => o.tableId === tbl.id);
                          if (!relativeOrder) return null;
                          const isSelected = activeBillSettleSessionId === relativeOrder.sessionId;
                          return (
                            <button
                              key={tbl.id}
                              onClick={() => {
                                setActiveBillSettleSessionId(relativeOrder.sessionId);
                                setSettledInvoice(null);
                                const receiptsList = receipts.filter(r => r.sessionId === relativeOrder.sessionId);
                                if (receiptsList.length > 0) {
                                  setActiveReceipt(receiptsList[0]);
                                  setCustomDiscount(receiptsList[0].discountAmount);
                                  setCustomCouponCode(receiptsList[0].couponCode || '');
                                  setCustomServiceChargePercent(receiptsList[0].serviceChargeAmount ? activeRest.serviceChargePercent : 0);
                                } else {
                                  setActiveReceipt(null);
                                  setCustomDiscount(0);
                                  setCustomCouponCode('');
                                  setCustomServiceChargePercent(undefined);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-slate-800 border-amber-500/40 text-amber-400 font-bold'
                                  : 'bg-[#11131e]/40 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs">Table {tbl.tableNumber}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${tbl.status === TableStatus.BILL_REQUESTED ? 'bg-amber-400 animate-pulse' : 'bg-indigo-400'}`} />
                              </div>
                              <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Settle Orders</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Reprint Last Bill Quick Utility */}
                  {receipts.filter(r => r.restaurantId === selectedRestaurantId && (r.status === ReceiptStatus.PRINTED || r.status === ReceiptStatus.PAID || r.status === ReceiptStatus.CLOSED)).length > 0 && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <button
                        onClick={() => {
                          const printed = receipts
                            .filter(r => r.restaurantId === selectedRestaurantId && (r.status === ReceiptStatus.PRINTED || r.status === ReceiptStatus.PAID || r.status === ReceiptStatus.CLOSED))
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                          if (printed.length > 0) {
                            setActiveReceipt(printed[0]);
                            setActiveBillSettleSessionId(printed[0].sessionId);
                            addBillPrintLog(printed[0].billNumber, 'reprint');
                            setPrintAnimation(true);
                            setTimeout(() => setPrintAnimation(false), 4000);
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 p-2.5 rounded-xl text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>REPRINT LAST GENERATED BILL</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Middle workspace: Bill review and discount adjustments (Cols 4) */}
                <div className="lg:col-span-4 space-y-4">
                  <AnimatePresence mode="wait">
                    {activeBillSettleSessionId ? (
                      <motion.div
                        key={activeBillSettleSessionId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-[#11131e]/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4"
                      >
                        {(() => {
                          const sessOrders = orders.filter((o) => o.sessionId === activeBillSettleSessionId && o.status !== OrderStatus.CANCELLED);
                          const currentSubtotal = sessOrders.reduce((sum, o) => sum + o.subtotal, 0);
                          const tblNum = sessOrders[0]?.tableNumber || '01';
                          
                          // Look up coupon benefits
                          const activeCpn = coupons.find(c => c.code.toLowerCase() === customCouponCode.toLowerCase());
                          let calculatedCouponSavings = 0;
                          if (activeCpn) {
                            if (activeCpn.discountPercent) {
                              calculatedCouponSavings = Math.round((currentSubtotal * activeCpn.discountPercent) / 100);
                              if (activeCpn.maxDiscount && calculatedCouponSavings > activeCpn.maxDiscount) {
                                calculatedCouponSavings = activeCpn.maxDiscount;
                              }
                            } else if (activeCpn.discountFlat) {
                              calculatedCouponSavings = activeCpn.discountFlat;
                            }
                          }

                          const manualDiscountCap = Math.max(0, currentSubtotal - calculatedCouponSavings);
                          const validatedManualDiscount = Math.min(customDiscount, manualDiscountCap);
                          const currentTaxable = Math.max(0, currentSubtotal - calculatedCouponSavings - validatedManualDiscount);

                          const srvRate = customServiceChargePercent !== undefined ? customServiceChargePercent : activeRest.serviceChargePercent;
                          const currentSrvCharge = Math.round((currentTaxable * srvRate) / 100);

                          const currentGST = Math.round(((currentTaxable + currentSrvCharge) * activeRest.gstPercent) / 100);
                          const draftGrandTotal = currentTaxable + currentSrvCharge + currentGST;

                          return (
                            <>
                              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                                <div>
                                  <span className="text-[9px] text-amber-500 font-mono font-bold block tracking-widest uppercase">POS ACTIVE REVIEW</span>
                                  <h3 className="text-sm font-black text-white">Table {tblNum} Settle Drawer</h3>
                                </div>
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">Session: {activeBillSettleSessionId}</span>
                              </div>

                              {/* Cashier Add Items Action */}
                              {canAddItems && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddSearchQuery('');
                                    setAddSelectedCategory(null);
                                    setAddIsVegOnly(false);
                                    setIsAddItemsOpen(true);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-205 font-bold shadow-md hover:bg-slate-950/40 active:scale-98"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-400 font-black" />
                                  <span>+ ADD ITEMS TO BILL</span>
                                </button>
                              )}

                              {/* Item list scrollbox */}
                              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                <span className="text-[9px] font-bold text-slate-500 font-mono block uppercase">ORDERED ITEMS REVIEW</span>
                                {sessOrders.map((ord) => (
                                  <div key={ord.id} className="bg-slate-950/60 p-2 rounded-lg border border-slate-900/60 space-y-1">
                                    <span className="text-[8px] text-slate-600 font-mono block">Order ID: #{ord.id.slice(-4).toUpperCase()}</span>
                                    {ord.items.map((it) => (
                                      <div key={it.id} className="flex justify-between items-center text-[11px] text-slate-350 font-mono leading-tight py-1 border-b border-slate-900/40 last:border-0 gap-2">
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className="text-slate-100 font-bold truncate">{it.name}</span>
                                          {it.selectedVariant && (
                                            <span className="text-[9px] text-amber-500 font-mono">Portion: {it.selectedVariant.name}</span>
                                          )}
                                          {it.selectedAddons && it.selectedAddons.length > 0 && (
                                            <span className="text-[8px] text-slate-550 truncate">
                                              + {it.selectedAddons.map(a => a.name).join(', ')}
                                            </span>
                                          )}
                                          {/* Audit Trail Details */}
                                          {it.addedBy && (
                                            <span className="text-[7.5px] text-slate-500 mt-0.5 leading-none">
                                              Added by: {it.addedBy} ({it.addedByRole?.replace('_', ' ')}) • {it.addedTime} • {it.source}
                                            </span>
                                          )}
                                        </div>
 
                                        <div className="flex items-center gap-3 shrink-0">
                                          {/* Quantity adjustments if permitted */}
                                          {canRemoveItems ? (
                                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0 select-none">
                                              <button
                                                type="button"
                                                onClick={() => staffUpdateOrderItemQuantity(activeBillSettleSessionId, ord.id, it.id, it.quantity - 1)}
                                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                                                title="Decrease Quantity"
                                              >
                                                <Minus className="w-2.5 h-2.5" />
                                              </button>
                                              <span className="text-[10px] text-white font-mono font-bold shrink-0 w-3 text-center">{it.quantity}</span>
                                              <button
                                                type="button"
                                                onClick={() => staffUpdateOrderItemQuantity(activeBillSettleSessionId, ord.id, it.id, it.quantity + 1)}
                                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 cursor-pointer"
                                                title="Increase Quantity"
                                              >
                                                <Plus className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 font-bold">{it.quantity}x</span>
                                          )}
 
                                          <div className="flex items-center gap-1.5 font-mono">
                                            <span className="text-slate-200 font-bold">{formatIndianCurrency(it.price * it.quantity, activeRest.currency)}</span>
                                            {canRemoveItems && (
                                              <button
                                                type="button"
                                                onClick={() => staffUpdateOrderItemQuantity(activeBillSettleSessionId, ord.id, it.id, 0)}
                                                className="text-slate-550 hover:text-rose-500 cursor-pointer p-0.5"
                                                title="Void Item"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>

                              {/* Discounter, coupons, and service charges configuration section */}
                              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-3">
                                <span className="text-[9px] font-bold text-slate-400 font-mono block uppercase tracking-wider">ADJUST CHARGES & DISCOUNTS</span>
                                
                                {/* 1. Manual Cash Discount */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-450 font-bold">Manual Cash Discount</span>
                                    <span className="text-emerald-400 font-mono font-bold">-{formatIndianCurrency(validatedManualDiscount, activeRest.currency)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="0"
                                      max={manualDiscountCap}
                                      value={customDiscount}
                                      onChange={(e) => setCustomDiscount(Number(e.target.value))}
                                      className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      max={manualDiscountCap}
                                      value={customDiscount}
                                      onChange={(e) => setCustomDiscount(Math.min(manualDiscountCap, Number(e.target.value)))}
                                      className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-right font-mono text-slate-250 focus:border-amber-500 outline-none"
                                    />
                                  </div>
                                </div>

                                {/* 2. Coupon Selector Dropdown */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-450 font-bold flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-amber-500" /> Coupon Campaign
                                    </span>
                                    {calculatedCouponSavings > 0 && (
                                      <span className="text-amber-400 font-mono font-bold">-{formatIndianCurrency(calculatedCouponSavings, activeRest.currency)}</span>
                                    )}
                                  </div>
                                  <select
                                    value={customCouponCode}
                                    onChange={(e) => setCustomCouponCode(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none cursor-pointer focus:border-amber-500 font-mono"
                                  >
                                    <option value="">-- Select Coupon Code --</option>
                                    {coupons
                                      .filter(c => c.restaurantId === selectedRestaurantId)
                                      .map(c => (
                                        <option key={c.id} value={c.code}>
                                          {c.code} ({c.discountPercent ? `${c.discountPercent}%` : `${c.discountFlat} Flat`} Off)
                                        </option>
                                      ))
                                    }
                                  </select>
                                </div>

                                {/* 3. Service Charge Toggle */}
                                <div className="space-y-1 pt-1 border-t border-slate-900">
                                  <div className="flex justify-between text-[10px] items-center">
                                    <span className="text-slate-455 font-bold">Apply Service Charge</span>
                                    <div className="flex gap-1">
                                      {[0, 5, 10, 12].map((pct) => (
                                        <button
                                          key={pct}
                                          onClick={() => setCustomServiceChargePercent(pct)}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                                            (customServiceChargePercent !== undefined ? customServiceChargePercent : activeRest.serviceChargePercent) === pct
                                              ? 'bg-amber-500 text-slate-950'
                                              : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                                          }`}
                                        >
                                          {pct}%
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Running math breakdown */}
                              <div className="space-y-1.5 text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-3">
                                <div className="flex justify-between">
                                  <span>Gross Subtotal</span>
                                  <span>{formatIndianCurrency(currentSubtotal, activeRest.currency)}</span>
                                </div>
                                {calculatedCouponSavings > 0 && (
                                  <div className="flex justify-between text-amber-500">
                                    <span>Coupon Discount ({customCouponCode})</span>
                                    <span>-{formatIndianCurrency(calculatedCouponSavings, activeRest.currency)}</span>
                                  </div>
                                )}
                                {validatedManualDiscount > 0 && (
                                  <div className="flex justify-between text-emerald-400">
                                    <span>Manual Cash Discount</span>
                                    <span>-{formatIndianCurrency(validatedManualDiscount, activeRest.currency)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Service Charge ({srvRate}%)</span>
                                  <span>{formatIndianCurrency(currentSrvCharge, activeRest.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>GST Auto-Calculation ({activeRest.gstPercent}%)</span>
                                  <span>{formatIndianCurrency(currentGST, activeRest.currency)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-800 pt-2 text-xs font-black text-white">
                                  <span>Draft Session Total</span>
                                  <span className="text-amber-400">{formatIndianCurrency(draftGrandTotal, activeRest.currency)}</span>
                                </div>
                              </div>

                              {/* Generate action */}
                              <button
                                onClick={() => {
                                  const receiptObj = generateReceipt(
                                    activeBillSettleSessionId,
                                    customDiscount,
                                    customCouponCode,
                                    customServiceChargePercent
                                  );
                                  setActiveReceipt(receiptObj);
                                  addSystemNotification(`🏁 Generated Bill ${receiptObj.billNumber} with status [${receiptObj.status.toUpperCase()}]`);
                                }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow transition active:scale-95"
                              >
                                <Zap className="w-4 h-4 text-slate-950 animate-bounce" />
                                <span>GENERATE FINAL BILL</span>
                              </button>
                            </>
                          );
                        })()}
                      </motion.div>
                    ) : (
                      <div className="text-center py-16 px-4 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                        <ClipboardList className="w-10 h-10 text-slate-800 opacity-30 mb-2.5" />
                        <span className="text-xs text-slate-400 font-semibold font-sans">No checkout dining table selected</span>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal">
                          Select a billing request from the checkout queue or choose an active table from the directory.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Workspace: Simulated Preview Screen & Printer Controls (Cols 5) */}
                <div className="lg:col-span-5 space-y-4">
                  {activeReceipt ? (
                    <div className="space-y-4">
                      
                      {/* Live print/A4/thermal switcher & configs */}
                      <div className="bg-[#11131e] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900 select-none">
                          <button
                            onClick={() => setPreviewType('thermal')}
                            className={`px-3 py-1 text-[10px] font-bold rounded ${
                              previewType === 'thermal'
                                ? 'bg-slate-800 text-white font-black'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Thermal (80/58)
                          </button>
                          <button
                            onClick={() => setPreviewType('a4')}
                            className={`px-3 py-1 text-[10px] font-bold rounded ${
                              previewType === 'a4'
                                ? 'bg-slate-800 text-white font-black'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            A4 Invoice PDF
                          </button>
                        </div>

                        {/* Printer width switcher */}
                        {previewType === 'thermal' && (
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[8px] text-slate-500 font-mono">WIDTH:</span>
                            <div className="bg-slate-950 p-0.5 border border-slate-850 rounded flex">
                              {['58mm', '80mm'].map((wd) => (
                                <button
                                  key={wd}
                                  onClick={() => adminUpdateBillingSettings(selectedRestaurantId, { receiptWidth: wd as any })}
                                  className={`px-1.5 py-0.5 text-[8px] font-mono font-black rounded ${
                                    (activeRest.receiptWidth || '80mm') === wd
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {wd}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Simulative printer receipt feeder card */}
                      <div className="relative overflow-hidden">
                        
                        {/* Interactive mechanical printer slot */}
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 h-6 rounded-t-xl border-t border-slate-700 border-x border-slate-850 flex items-center justify-between px-4 shadow-inner relative z-25">
                          <div className="w-16 h-1 bg-slate-950 rounded-full mx-auto shadow" />
                          <span className="text-[7px] text-slate-500 font-mono absolute left-4">ESC/POS SLOT</span>
                          <span className="text-[7px] text-emerald-400 font-mono absolute right-4 animate-pulse">● ONLINE</span>
                        </div>

                        {/* Slide-out paper block */}
                        <div className="bg-slate-950 border-x border-b border-slate-900 p-4 rounded-b-xl max-h-[500px] overflow-y-auto relative bg-[radial-gradient(#11131e_1px,transparent_1px)] [background-size:16px_16px]">
                          
                          {/* Slide down animation mask */}
                          <div className={`${printAnimation ? 'animate-print-feed border-b border-dashed border-red-500/30' : ''} transition-all duration-1000`}>
                            {previewType === 'thermal' ? (
                              // ============================================
                              // THERMAL RECEIPT PREVIEW (80mm / 58mm style)
                              // ============================================
                              <div
                                className={`mx-auto bg-[#faf8ee] text-slate-900 p-5 shadow-2xl font-mono text-xs select-text ${
                                  (activeRest.receiptWidth || '80mm') === '58mm' ? 'max-w-[260px] text-[10px]' : 'max-w-[340px] text-[11px]'
                                }`}
                                style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                              >
                                {/* Center Restaurant Details */}
                                <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
                                  {activeRest.logo && (
                                    <img
                                      src={activeRest.logo}
                                      alt="Logo"
                                      className="w-10 h-10 rounded-full mx-auto object-cover border border-slate-300 referrerPolicy='no-referrer'"
                                    />
                                  )}
                                  <h3 className="text-xs font-black uppercase tracking-tight">{activeRest.name}</h3>
                                  <p className="text-[9px] text-slate-500 leading-normal whitespace-pre-line">{activeRest.receiptHeader || activeRest.description}</p>
                                  <p className="text-[9px] text-slate-500">PH: {activeRest.phone}</p>
                                  <p className="text-[9px] text-slate-500">GSTIN: {currentUser?.onboardingStep === 5 ? '27AAAAA1111A1Z1' : 'Unregistered'}</p>
                                </div>

                                {/* Bill Core Info */}
                                <div className="space-y-0.5 text-[10px] text-slate-650 border-b border-dashed border-slate-300 pb-3 mb-3">
                                  <div className="flex justify-between">
                                    <span>BILL NO:</span>
                                    <span className="font-bold text-slate-900">{activeReceipt.billNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ORDER NO:</span>
                                    <span className="text-slate-900">{activeReceipt.orderNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>DATE & TIME:</span>
                                    <span>{new Date(activeReceipt.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>DINING TABLE:</span>
                                    <span className="font-black text-slate-950">Table {activeReceipt.tableNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>CUSTOMER:</span>
                                    <span className="font-bold">{activeReceipt.customerName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>CASHIER:</span>
                                    <span>{activeReceipt.cashierName}</span>
                                  </div>
                                </div>

                                {/* Items mapping */}
                                <div className="border-b border-dashed border-slate-300 pb-2 mb-3 space-y-2">
                                  <div className="flex justify-between text-[9px] text-slate-500 font-bold border-b border-dashed border-slate-200 pb-1">
                                    <span>ITEM DESCRIPTION</span>
                                    <span>TOTAL</span>
                                  </div>
                                  {activeReceipt.items.map((it: any, idx: number) => (
                                    <div key={idx} className="space-y-0.5">
                                      <div className="flex justify-between font-bold text-slate-900">
                                        <span>{it.name}</span>
                                        <span>{formatIndianCurrency(it.total, activeRest.currency)}</span>
                                      </div>
                                      <div className="text-[9px] text-slate-500">
                                        {it.quantity} × {formatIndianCurrency(it.unitPrice, activeRest.currency)}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Summaries list */}
                                <div className="space-y-1.5 border-b border-dashed border-slate-350 pb-3 mb-3">
                                  <div className="flex justify-between">
                                    <span>SUBTOTAL:</span>
                                    <span>{formatIndianCurrency(activeReceipt.subtotal, activeRest.currency)}</span>
                                  </div>
                                  {activeReceipt.couponDiscountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                      <span>COUPON SAVINGS:</span>
                                      <span>-{formatIndianCurrency(activeReceipt.couponDiscountAmount, activeRest.currency)}</span>
                                    </div>
                                  )}
                                  {activeReceipt.discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                      <span>CASH DISCOUNT:</span>
                                      <span>-{formatIndianCurrency(activeReceipt.discountAmount, activeRest.currency)}</span>
                                    </div>
                                  )}
                                  {activeReceipt.serviceChargeAmount > 0 && (
                                    <div className="flex justify-between">
                                      <span>SERVICE CHARGES:</span>
                                      <span>{formatIndianCurrency(activeReceipt.serviceChargeAmount, activeRest.currency)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>GST AUTO TAX ({activeRest.gstPercent}%):</span>
                                    <span>{formatIndianCurrency(activeReceipt.gstAmount, activeRest.currency)}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-400 pt-1.5 text-xs font-black text-slate-950">
                                    <span>GRAND TOTAL:</span>
                                    <span>{formatIndianCurrency(activeReceipt.grandTotal, activeRest.currency)}</span>
                                  </div>
                                </div>

                                {/* Footer & custom message */}
                                <div className="text-center text-[9px] text-slate-400 space-y-1 leading-relaxed">
                                  <p className="whitespace-pre-line italic font-sans font-medium text-slate-500">
                                    {activeRest.receiptFooter || "Thank you for dining with us!\nVisit Again"}
                                  </p>
                                  <p className="font-mono text-[7px] text-slate-300 mt-2">Sizzlr POS Engine v1.1.2</p>
                                </div>
                              </div>
                            ) : (
                              // ============================================
                              // CORPORATE A4 INVOICE PDF STYLE PREVIEW
                              // ============================================
                              <div
                                className="mx-auto bg-white text-slate-950 p-6 shadow-2xl font-sans text-xs select-text max-w-lg"
                                style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                              >
                                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
                                  <div className="space-y-1">
                                    {activeRest.logo && (
                                      <img
                                        src={activeRest.logo}
                                        alt="Restaurant Logo"
                                        className="w-12 h-12 rounded object-cover referrerPolicy='no-referrer'"
                                      />
                                    )}
                                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{activeRest.name}</h2>
                                    <p className="text-[9px] text-slate-500 font-mono whitespace-pre-line">{activeRest.address}</p>
                                    <p className="text-[9px] text-slate-500 font-mono">Phone: {activeRest.phone} • Email: {activeRest.email}</p>
                                  </div>
                                  <div className="text-right space-y-1">
                                    <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded">
                                      TAX INVOICE
                                    </span>
                                    <p className="text-[9px] text-slate-500 font-mono mt-2">INVOICE #: <strong className="text-slate-800">{activeReceipt.billNumber}</strong></p>
                                    <p className="text-[9px] text-slate-500 font-mono">Date: {new Date(activeReceipt.createdAt).toLocaleDateString()}</p>
                                    <p className="text-[9px] text-slate-500 font-mono">Time: {new Date(activeReceipt.createdAt).toLocaleTimeString()}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] bg-slate-50 p-2.5 rounded border border-slate-100 font-mono">
                                  <div>
                                    <span className="text-slate-450 block uppercase font-bold text-[8px] tracking-wider mb-0.5">Billed To (Customer Details)</span>
                                    <p className="text-slate-800 font-bold">{activeReceipt.customerName}</p>
                                    <p className="text-slate-500">{activeReceipt.customerPhone || 'Walk-in Table Guest'}</p>
                                    <p className="text-slate-800 font-black mt-1">Table {activeReceipt.tableNumber}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-450 block uppercase font-bold text-[8px] tracking-wider mb-0.5">Settle Terminal Logs</span>
                                    <p className="text-slate-700">Cashier: <strong>{activeReceipt.cashierName}</strong></p>
                                    <p className="text-slate-500">Order Ref: {activeReceipt.orderNumber}</p>
                                    <p className="text-slate-700">GSTIN Reg: 27AAAAA1111A1Z1</p>
                                  </div>
                                </div>

                                <table className="w-full text-left mb-4 border-collapse text-[10px]">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[8px] border-b border-slate-250">
                                      <th className="py-2 px-1">Item Description</th>
                                      <th className="py-2 text-center w-12">Qty</th>
                                      <th className="py-2 text-right w-20">Unit Rate</th>
                                      <th className="py-2 text-right w-20">Gross Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-150">
                                    {activeReceipt.items.map((it: any, idx: number) => (
                                      <tr key={idx} className="text-slate-800">
                                        <td className="py-2 px-1 font-semibold">{it.name}</td>
                                        <td className="py-2 text-center font-mono">{it.quantity}</td>
                                        <td className="py-2 text-right font-mono">{formatIndianCurrency(it.unitPrice, activeRest.currency)}</td>
                                        <td className="py-2 text-right font-mono font-bold">{formatIndianCurrency(it.total, activeRest.currency)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                <div className="flex justify-between items-start pt-2.5 border-t border-slate-200">
                                  <div className="w-1/2 space-y-1.5 text-[8px] text-slate-400">
                                    <p className="font-bold text-[9px] text-slate-650">GST tax invoice declaration:</p>
                                    <p className="leading-relaxed">This invoice is digitally generated. All dining taxes are computed in conformity to the rules outlined in GST Schedule 2026. Goods once sold or served are non-refundable.</p>
                                    <p className="font-bold text-emerald-600 mt-2 whitespace-pre-line italic text-[9px]">{activeRest.receiptFooter}</p>
                                  </div>
                                  <div className="w-1/2 font-mono text-[9px] text-slate-500 space-y-1 text-right">
                                    <div className="flex justify-between">
                                      <span>Gross Subtotal:</span>
                                      <span className="text-slate-850 font-bold">{formatIndianCurrency(activeReceipt.subtotal, activeRest.currency)}</span>
                                    </div>
                                    {activeReceipt.couponDiscountAmount > 0 && (
                                      <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Coupon Discount:</span>
                                        <span>-{formatIndianCurrency(activeReceipt.couponDiscountAmount, activeRest.currency)}</span>
                                      </div>
                                    )}
                                    {activeReceipt.discountAmount > 0 && (
                                      <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Cash Discount:</span>
                                        <span>-{formatIndianCurrency(activeReceipt.discountAmount, activeRest.currency)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span>Service Charge ({activeRest.serviceChargePercent}%):</span>
                                      <span>{formatIndianCurrency(activeReceipt.serviceChargeAmount, activeRest.currency)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>GST Tax ({activeRest.gstPercent}%):</span>
                                      <span>{formatIndianCurrency(activeReceipt.gstAmount, activeRest.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-300 pt-1.5 mt-1.5">
                                      <span>Grand Total:</span>
                                      <span className="text-amber-600">{formatIndianCurrency(activeReceipt.grandTotal, activeRest.currency)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-[8px] text-slate-400">
                                  <span>Generated via Sizzlr ERP QR Cloud</span>
                                  <span>Authorized POS Signature</span>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Printing Control Station Box */}
                      <div className="bg-[#11131e] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">PRINTER CONTROLS</span>
                          <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> USB
                            </span>
                            <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" /> Bluetooth
                            </span>
                          </div>
                        </div>

                        {/* Interactive Payment Method Collection */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono font-bold text-slate-450 block uppercase">COLLECT SECURE PAYMENT</span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'upi', label: 'UPI QR PAY' },
                              { id: 'cash', label: 'CASH COLLECT' },
                              { id: 'card', label: 'CREDIT CARD' },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setCashierPayMethod(opt.id as any)}
                                className={`p-2.5 rounded-xl border text-center cursor-pointer font-bold text-[10px] transition-all ${
                                  cashierPayMethod === opt.id
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Payment UPI QR Code Simulation */}
                        {cashierPayMethod === 'upi' && (
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col items-center justify-center space-y-2">
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=sizzlr@ybl%26am=${activeReceipt.grandTotal}%26tn=Table-${activeReceipt.tableNumber}`}
                                alt="UPI QR"
                                className="w-24 h-24 referrerPolicy='no-referrer'"
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">Scan to pay: <strong className="text-amber-400">{formatIndianCurrency(activeReceipt.grandTotal, activeRest.currency)}</strong></span>
                          </div>
                        )}

                        {/* Actions Row (Print, Share, Download, Close Table) */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                          
                          {/* 1. Print Receipt Trigger */}
                          <button
                            onClick={() => {
                              updateReceiptStatus(activeReceipt.id, ReceiptStatus.PRINTED, cashierPayMethod);
                              addBillPrintLog(activeReceipt.billNumber, 'print');
                              setPrintAnimation(true);
                              setTimeout(() => setPrintAnimation(false), 4000);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 shadow"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>SIMULATE PRINT</span>
                          </button>

                          {/* 2. Download PDF Trigger */}
                          <button
                            onClick={() => {
                              addSystemNotification(`💾 Downloading Bill Invoice PDF ${activeReceipt.billNumber}...`);
                              // Create a simple blob download
                              const receiptString = `
                                INVOICE - ${activeRest.name}
                                Bill Number: ${activeReceipt.billNumber}
                                Date: ${new Date(activeReceipt.createdAt).toLocaleString()}
                                Table: Table ${activeReceipt.tableNumber}
                                Grand Total: ${formatIndianCurrency(activeReceipt.grandTotal, activeRest.currency)}
                              `;
                              const blob = new Blob([receiptString], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `Sizzlr_${activeReceipt.billNumber}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>DOWNLOAD PDF</span>
                          </button>

                          {/* 3. Share Trigger */}
                          <button
                            onClick={() => {
                              setShareTarget('whatsapp');
                              setShareInput('');
                              setShareModal(true);
                            }}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>SHARE RECEIPT</span>
                          </button>

                          {/* 4. Complete Payment & Close Session */}
                          <button
                            onClick={() => {
                              updateReceiptStatus(activeReceipt.id, ReceiptStatus.CLOSED, cashierPayMethod);
                              setActiveReceipt(null);
                              setActiveBillSettleSessionId(null);
                              addSystemNotification(`🏁 Table session completed. Table put in CLEANING state.`);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>CLOSE TERMINAL</span>
                          </button>

                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-24 px-4 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                      <Printer className="w-10 h-10 text-slate-850 opacity-30 mb-2.5 animate-pulse" />
                      <span className="text-xs text-slate-400 font-semibold font-sans">ESC/POS Thermal Feed Terminal</span>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal">
                        Generate the final bill inside the center settlements column to preview, download, and simulated-print thermal tickets.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              // ===============================================
              // TAB 2: REPORTS & COMPREHENSIVE AUDIT LOGS
              // ===============================================
              <div className="space-y-6">
                
                {/* 1. Metric cards (10 metrics requested by user) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(() => {
                    const activeReceipts = receipts.filter(r => r.restaurantId === selectedRestaurantId);
                    
                    const printedBillsList = activeReceipts.filter(r => r.status === ReceiptStatus.PRINTED || r.status === ReceiptStatus.PAID || r.status === ReceiptStatus.CLOSED);
                    const printedBillsVal = printedBillsList.reduce((sum, r) => sum + r.grandTotal, 0);

                    const reprintCount = billPrintLogs.filter(l => l.restaurantId === selectedRestaurantId && l.action === 'reprint').length;
                    const cancelledOrdersCount = orders.filter(o => o.restaurantId === selectedRestaurantId && o.status === OrderStatus.CANCELLED).length;

                    const paidBillsList = activeReceipts.filter(r => r.status === ReceiptStatus.PAID || r.status === ReceiptStatus.CLOSED);
                    const paidBillsVal = paidBillsList.reduce((sum, r) => sum + r.grandTotal, 0);

                    const pendingBillsList = activeReceipts.filter(r => r.status === ReceiptStatus.DRAFT || r.status === ReceiptStatus.BILL_REQUESTED || r.status === ReceiptStatus.GENERATED);
                    const pendingBillsVal = pendingBillsList.reduce((sum, r) => sum + r.grandTotal, 0);

                    const gstVal = printedBillsList.reduce((sum, r) => sum + r.gstAmount, 0);

                    const cashVal = paidBillsList.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.grandTotal, 0);
                    const upiVal = paidBillsList.filter(r => r.paymentMethod === 'upi').reduce((sum, r) => sum + r.grandTotal, 0);
                    const cardVal = paidBillsList.filter(r => r.paymentMethod === 'card').reduce((sum, r) => sum + r.grandTotal, 0);

                    const metricsList = [
                      { title: 'Printed Bills', value: `${printedBillsList.length} (${formatIndianCurrency(printedBillsVal, activeRest.currency)})`, color: 'text-amber-400', desc: 'Active printed queue' },
                      { title: 'Reprinted Bills', value: `${reprintCount} times`, color: 'text-blue-400', desc: 'Duplicated receipts' },
                      { title: 'Cancelled Bills', value: `${cancelledOrdersCount} orders`, color: 'text-rose-400', desc: 'Kitchen order voids' },
                      { title: 'Paid Bills', value: `${paidBillsList.length} (${formatIndianCurrency(paidBillsVal, activeRest.currency)})`, color: 'text-emerald-400', desc: 'Settle collections' },
                      { title: 'Pending Bills', value: `${pendingBillsList.length} (${formatIndianCurrency(pendingBillsVal, activeRest.currency)})`, color: 'text-slate-400', desc: 'Awaiting payments' },
                      { title: 'Daily Sales', value: formatIndianCurrency(paidBillsVal, activeRest.currency), color: 'text-amber-400 font-extrabold', desc: 'Net earnings today' },
                      { title: 'GST Collected', value: formatIndianCurrency(gstVal, activeRest.currency), color: 'text-purple-400', desc: 'Taxes to government' },
                      { title: 'Cash Box', value: formatIndianCurrency(cashVal, activeRest.currency), color: 'text-emerald-400', desc: 'Physical currency' },
                      { title: 'UPI QR Box', value: formatIndianCurrency(upiVal, activeRest.currency), color: 'text-sky-400', desc: 'Digital bank pay' },
                      { title: 'Card Swipe Box', value: formatIndianCurrency(cardVal, activeRest.currency), color: 'text-indigo-400', desc: 'POS swipe terminal' },
                    ];

                    return metricsList.map((m, idx) => (
                      <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between shadow">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">{m.title}</span>
                        <span className={`text-sm font-black my-1 block ${m.color}`}>{m.value}</span>
                        <span className="text-[8px] text-slate-600 leading-normal block">{m.desc}</span>
                      </div>
                    ));
                  })()}
                </div>

                {/* historical receipts search explorer and logs table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left block: Receipts Explorer table (Cols 2) */}
                  <div className="lg:col-span-2 bg-[#11131e]/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Historical Receipts Explorer</h3>
                        <p className="text-[8px] text-slate-500 font-mono">Query audit trail database of Sizzlr receipts</p>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search Bill No, Table..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl pl-8 pr-3 py-1 text-[11px] text-slate-300 placeholder-slate-500 focus:border-amber-500 outline-none w-44 font-mono"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] font-bold">
                            <th className="py-2.5">Bill ID</th>
                            <th className="py-2.5">Table</th>
                            <th className="py-2.5">Customer</th>
                            <th className="py-2.5 text-right">Subtotal</th>
                            <th className="py-2.5 text-right">Grand Total</th>
                            <th className="py-2.5">Method</th>
                            <th className="py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {(() => {
                            const activeReceipts = receipts.filter(r => r.restaurantId === selectedRestaurantId);
                            const filtered = activeReceipts.filter(r => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              return r.billNumber.toLowerCase().includes(query) ||
                                r.tableNumber.toLowerCase().includes(query) ||
                                r.customerName.toLowerCase().includes(query);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="text-center py-8 text-slate-600 italic">No receipts recorded.</td>
                                </tr>
                              );
                            }

                            return filtered.map((rec) => (
                              <tr key={rec.id} className="text-slate-300 hover:bg-slate-950/40">
                                <td className="py-2.5 font-bold text-white">{rec.billNumber}</td>
                                <td className="py-2.5 text-amber-400 font-extrabold">Table {rec.tableNumber}</td>
                                <td className="py-2.5 text-slate-400">{rec.customerName}</td>
                                <td className="py-2.5 text-right text-slate-500">{formatIndianCurrency(rec.subtotal, activeRest.currency)}</td>
                                <td className="py-2.5 text-right font-bold text-white">{formatIndianCurrency(rec.grandTotal, activeRest.currency)}</td>
                                <td className="py-2.5">
                                  <span className="bg-slate-850 text-slate-300 px-1.5 py-0.5 rounded text-[9px] uppercase">
                                    {rec.paymentMethod || 'none'}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full ${
                                    rec.status === ReceiptStatus.CLOSED ? 'bg-slate-800 text-slate-500' :
                                    rec.status === ReceiptStatus.PAID ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    rec.status === ReceiptStatus.PRINTED ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-900 text-slate-450'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right block: Action Logs list (Cols 1) */}
                  <div className="lg:col-span-1 bg-[#11131e]/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg space-y-4">
                    <div className="border-b border-slate-800/60 pb-3">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Printer logs</h3>
                      <p className="text-[8px] text-slate-500 font-mono">Real-time ESC/POS printing actions logs</p>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {billPrintLogs.filter(l => l.restaurantId === selectedRestaurantId).length === 0 ? (
                        <div className="text-center py-12 text-slate-600 italic text-[11px]">No print logs recorded.</div>
                      ) : (
                        billPrintLogs
                          .filter(l => l.restaurantId === selectedRestaurantId)
                          .map((l) => (
                            <div key={l.id} className="bg-slate-950/60 border border-slate-900/60 p-2.5 rounded-xl flex items-start gap-2.5 font-mono text-[10px]">
                              <div className={`p-1 rounded shrink-0 ${l.action === 'reprint' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                <Printer className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 space-y-0.5 leading-normal">
                                <div className="flex justify-between">
                                  <strong className="text-white text-[11px]">{l.billNumber}</strong>
                                  <span className={`text-[8px] font-bold px-1 rounded uppercase ${l.action === 'reprint' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                    {l.action}
                                  </span>
                                </div>
                                <p className="text-slate-450 text-[9px]">Printer: {l.printerType} ({l.receiptWidth})</p>
                                <p className="text-slate-600 text-[8px]">{new Date(l.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* Sharing overlay dialog modal */}
            {shareModal && activeReceipt && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl relative">
                  <button
                    onClick={() => setShareModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-1.5 text-center">
                    <Share2 className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Share Digital Receipt</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Bill No: {activeReceipt.billNumber}</p>
                  </div>

                  {/* Channel toggler */}
                  <div className="flex bg-slate-950 p-0.5 border border-slate-850 rounded-xl select-none text-[10px] font-bold">
                    <button
                      onClick={() => {
                        setShareTarget('whatsapp');
                        setShareInput('');
                      }}
                      className={`flex-1 py-1.5 text-center rounded-lg cursor-pointer ${shareTarget === 'whatsapp' ? 'bg-slate-800 text-white font-extrabold' : 'text-slate-500'}`}
                    >
                      WhatsApp Messaging
                    </button>
                    <button
                      onClick={() => {
                        setShareTarget('email');
                        setShareInput('');
                      }}
                      className={`flex-1 py-1.5 text-center rounded-lg cursor-pointer ${shareTarget === 'email' ? 'bg-slate-800 text-white font-extrabold' : 'text-slate-500'}`}
                    >
                      Email PDF Invoice
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-slate-500 font-mono block">
                      {shareTarget === 'whatsapp' ? 'WhatsApp Mobile Number (with country code)' : 'Guest Email Address'}
                    </label>
                    <input
                      type={shareTarget === 'whatsapp' ? 'tel' : 'email'}
                      placeholder={shareTarget === 'whatsapp' ? '+91 98765 43210' : 'guest@gmail.com'}
                      value={shareInput}
                      onChange={(e) => setShareInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 placeholder-slate-650 font-mono"
                    />

                    <button
                      onClick={() => {
                        if (!shareInput) {
                          addSystemNotification(`⚠️ Please enter valid coordinates before sharing.`);
                          return;
                        }
                        addSystemNotification(`📨 Receipt shared successfully via [${shareTarget.toUpperCase()}] to ${shareInput}`);
                        setShareModal(false);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>TRANSMIT RECEIPT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cashier Add Items Menu Browser Modal */}
            {isAddItemsOpen && activeBillSettleSessionId && (
              <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#11131e] border border-slate-800 p-6 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative">
                  <button
                    onClick={() => setIsAddItemsOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1.5 hover:bg-slate-800/80 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Items to Table Bill</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Select items to append to active table session</p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={addSearchQuery}
                        onChange={(e) => setAddSearchQuery(e.target.value)}
                        placeholder="Search menu items..."
                        className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none"
                      />
                      {addSearchQuery && (
                        <button
                          onClick={() => setAddSearchQuery('')}
                          className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
                        <button
                          onClick={() => setAddSelectedCategory(null)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            addSelectedCategory === null
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          All Categories
                        </button>
                        {menuCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setAddSelectedCategory(addSelectedCategory === cat.id ? null : cat.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                              addSelectedCategory === cat.id
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-900 border border-slate-800/60 text-slate-350 hover:text-slate-200'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setAddIsVegOnly(!addIsVegOnly)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                          addIsVegOnly
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold'
                            : 'bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span>Veg Only</span>
                      </button>
                    </div>
                  </div>

                  {/* Menu Items Grid */}
                  <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                    {(() => {
                      const filtered = menuItems.filter((item) => {
                        const matchesSearch = item.name.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(addSearchQuery.toLowerCase());
                        const matchesCategory = addSelectedCategory ? item.categoryId === addSelectedCategory : true;
                        const matchesVeg = addIsVegOnly ? item.isVeg : true;
                        return matchesSearch && matchesCategory && matchesVeg;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-full text-center py-12 text-slate-500">
                            <span>No items found.</span>
                          </div>
                        );
                      }

                      return filtered.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-950/50 border border-slate-800/50 p-3 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all"
                        >
                          <div className="flex gap-2">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-850 shrink-0 relative">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              <span className={`absolute top-1 left-1 w-3 h-3 rounded-sm flex items-center justify-center p-0.5 border bg-slate-955/80 ${item.isVeg ? 'border-emerald-500' : 'border-rose-500'}`}>
                                <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                              <p className="text-[9px] text-slate-450 line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-900">
                            <span className="text-xs font-black text-white font-mono">{formatIndianCurrency(item.price, activeRest.currency)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomizingItem(item);
                                setSelectedVariantId(item.variants?.[0]?.id || '');
                                setSelectedAddonIds([]);
                                setSpecialInstructions('');
                                setCustomizingQty(1);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1 rounded-lg text-[10px] font-black cursor-pointer transition active:scale-95 shadow-sm uppercase"
                            >
                              Add to Bill
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

           </div>
         )}

         {/* Customize Item Modal */}
         {customizingItem && (
           <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-[#11131e] border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative space-y-4">
               <button
                 onClick={() => setCustomizingItem(null)}
                 className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
               >
                 <X className="w-5 h-5" />
               </button>

               <div className="text-center pb-2 border-b border-slate-800">
                 <span className="text-[10px] text-amber-500 font-mono font-bold block uppercase tracking-widest">CUSTOMIZE ITEM</span>
                 <h3 className="text-sm font-black text-white mt-1">{customizingItem.name}</h3>
               </div>

               <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                 {/* Variants */}
                 {customizingItem.variants && customizingItem.variants.length > 0 && (
                   <div className="space-y-1.5">
                     <span className="text-[10px] font-bold text-slate-450 font-mono block uppercase">CHOOSE PORTION / VARIANT</span>
                     <div className="space-y-2">
                       {customizingItem.variants.map((v: any) => (
                         <label
                           key={v.id}
                           className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                             selectedVariantId === v.id
                               ? 'bg-slate-900 border-amber-500 text-amber-400'
                               : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
                           }`}
                         >
                           <div className="flex items-center gap-2">
                             <input
                               type="radio"
                               name="menu-variant"
                               checked={selectedVariantId === v.id}
                               onChange={() => setSelectedVariantId(v.id)}
                               className="accent-amber-500"
                             />
                             <span>{v.name}</span>
                           </div>
                           <span className="font-mono">+{formatIndianCurrency(v.price, activeRest.currency)}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Add-ons */}
                 {customizingItem.addons && customizingItem.addons.length > 0 && (
                   <div className="space-y-1.5">
                     <span className="text-[10px] font-bold text-slate-455 font-mono block uppercase">CHOOSE OPTIONAL ADD-ONS</span>
                     <div className="space-y-2">
                       {customizingItem.addons.map((a: any) => {
                         const isChecked = selectedAddonIds.includes(a.id);
                         return (
                           <label
                             key={a.id}
                             className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                               isChecked
                                 ? 'bg-slate-900 border-amber-500/80 text-amber-400'
                                 : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
                             }`}
                           >
                             <div className="flex items-center gap-2">
                               <input
                                 type="checkbox"
                                 checked={isChecked}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     setSelectedAddonIds([...selectedAddonIds, a.id]);
                                   } else {
                                     setSelectedAddonIds(selectedAddonIds.filter((id) => id !== a.id));
                                   }
                                 }}
                                 className="accent-amber-500"
                               />
                               <span>{a.name}</span>
                             </div>
                             <span className="font-mono">+{formatIndianCurrency(a.price, activeRest.currency)}</span>
                           </label>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {/* Quantity Selector */}
                 <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                   <span className="text-[10px] font-bold text-slate-455 font-mono uppercase">Enter Quantity</span>
                   <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
                     <button
                       type="button"
                       onClick={() => setCustomizingQty(Math.max(1, customizingQty - 1))}
                       className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                     >
                       <Minus className="w-3.5 h-3.5" />
                     </button>
                     <span className="text-xs font-black text-white font-mono w-4 text-center">{customizingQty}</span>
                     <button
                       type="button"
                       onClick={() => setCustomizingQty(customizingQty + 1)}
                       className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                     >
                       <Plus className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 </div>

                 {/* Special Instructions */}
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-455 font-mono block uppercase">SPECIAL COOKING NOTES</label>
                   <textarea
                     rows={2}
                     value={specialInstructions}
                     onChange={(e) => setSpecialInstructions(e.target.value)}
                     placeholder="e.g., Less spicy, no onions, extra ice..."
                     className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 placeholder-slate-650 resize-none font-sans"
                   />
                 </div>
               </div>

               {/* Add action */}
               <button
                 type="button"
                 onClick={() => {
                   const selectedVariant = customizingItem.variants?.find((v: any) => v.id === selectedVariantId);
                   const selectedAddons = customizingItem.addons?.filter((a: any) => selectedAddonIds.includes(a.id)) || [];
                   
                   if (waiterSelectedTable) {
                     // Waiter POS Mode: Add to local waiter cart
                     const newCartItem = {
                       id: `w_cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                       item: customizingItem,
                       quantity: customizingQty,
                       selectedVariant,
                       selectedAddons,
                       specialInstructions
                     };
                     setWaiterCart((prev) => {
                       const idx = prev.findIndex(c => 
                         c.item.id === customizingItem.id &&
                         c.selectedVariant?.id === selectedVariant?.id &&
                         c.selectedAddons.length === selectedAddons.length &&
                         c.selectedAddons.every(a => selectedAddons.some(o => o.id === a.id))
                       );
                       if (idx > -1) {
                         const updated = [...prev];
                         updated[idx].quantity += customizingQty;
                         return updated;
                       }
                       return [...prev, newCartItem];
                     });
                     addSystemNotification(`🛒 Added ${customizingQty}x ${customizingItem.name} to waiter order cart.`);
                   } else {
                     // Cashier POS Mode: Add to active cashier session
                     staffAddItemsToBill(activeBillSettleSessionId!, [{
                       item: customizingItem,
                       quantity: customizingQty,
                       selectedVariant,
                       selectedAddons,
                       specialInstructions
                     }]);
                   }

                   setCustomizingItem(null);
                 }}
                 className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow transition active:scale-95"
               >
                 Confirm Add to Bill
               </button>
             </div>
           </div>
         )}
          </>
        )}
       </div>
    </div>
  );
}

// Icon helpers
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
