/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../state';
import {
  Search,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  Bell,
  Trash2,
  Percent,
  Clock,
  Sparkles,
  CheckCircle2,
  User,
  Phone,
  ArrowLeft,
  Star,
  MessageSquare,
  Coffee,
  Heart,
  HelpCircle,
  X,
  Droplet,
  FileText,
  Sparkle,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, RestaurantStatus, ServiceRequestType, OrderStatus, formatIndianCurrency } from '../types';

export default function CustomerApp() {
  const {
    restaurants,
    branches,
    tables,
    menuCategories,
    menuItems,
    banners,
    orders,
    waiterRequests,
    activeSession,
    cart,
    activeCoupon,
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
    submitFeedback,
    selectedRestaurantId,
    selectedBranchId,
    selectedTableId,
    feedbacks,
    isQrModalOpen,
    setIsQrModalOpen
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isVegOnly, setIsVegOnly] = useState(false);
  
  // Checking Guest Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [nameError, setNameError] = useState('');

  // Item customization modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Drawers/views toggles
  const [showCart, setShowCart] = useState(false);
  const [showServiceRequests, setShowServiceRequests] = useState(false);
  const [showRunningBill, setShowRunningBill] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  
  // Feedback popup state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const activeTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  if (!activeRest) {
    return (
      <div className="flex-1 bg-[#090a0f] text-slate-100 flex flex-col items-center justify-center p-6 h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/80 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400 animate-pulse">Setting up digital menu...</p>
        </div>
      </div>
    );
  }

  // Colors
  const pColor = activeRest.primaryColor || '#F59E0B';
  const aColor = activeRest.accentColor || '#10B981';

  if (activeRest.status === RestaurantStatus.SUSPENDED) {
    return (
      <div className="flex-1 bg-[#090a0f] text-slate-100 flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="bg-rose-500/10 p-5 rounded-full border border-rose-500/20 text-rose-500 mb-4 animate-bounce">
          <StoreSuspendedIcon className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold font-sans text-white">Bistro Under Maintenance</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
          <strong>{activeRest.name}</strong> is temporarily offline or undergoing maintenance. Please contact the restaurant administrator.
        </p>
      </div>
    );
  }

  // 1. Guest Check-In Mode
  if (!activeSession || !activeSession.customerName) {
    const handleCheckIn = (e: React.FormEvent) => {
      e.preventDefault();
      if (!guestName.trim()) {
        setNameError('Please enter your name to browse the menu.');
        return;
      }
      customerEnterDetails(guestName.trim(), guestPhone.trim());
    };

    return (
      <div className="flex-1 bg-[#0a0a0d] text-slate-100 flex flex-col h-full overflow-y-auto">
        {/* Banner with Restaurant Details */}
        <div className="h-44 relative shrink-0">
          <img
            src={activeRest.banner}
            alt={activeRest.name}
            className="w-full h-full object-cover brightness-[0.4]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] to-transparent" />
        </div>

        <div className="px-6 pb-8 -mt-10 relative z-10 flex-1 flex flex-col">
          {/* Logo */}
          <div className="flex items-end gap-4 mb-4">
            <img
              src={activeRest.logo}
              alt={activeRest.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-800 shadow-2xl shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="pb-1">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Table {activeTable?.tableNumber || '02'}
              </span>
              <h2 className="text-lg font-extrabold text-white mt-1 leading-tight">{activeRest.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  ★ {activeRest.rating}
                </span>
                <span>•</span>
                <span>{activeRest.cuisine}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">{activeRest.description}</p>

          {/* Form */}
          <form onSubmit={handleCheckIn} className="space-y-4 bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-mono block mb-1">AUTOMATIC QR DISCOVERY</span>
                <p className="text-xs text-white mt-0.5 mb-2.5">
                  Welcome to <strong>{activeBranch?.name || 'Main Branch'}</strong>, Table <strong>{activeTable?.tableNumber || '01'}</strong>
                </p>
                <button
                  type="button"
                  id="customer_scan_table_camera"
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 hover:border-transparent px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan Table QR Code</span>
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      setNameError('');
                    }}
                    placeholder="e.g., John Doe"
                    className="w-full bg-[#151724] border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white transition-all outline-none"
                  />
                </div>
                {nameError && <p className="text-rose-400 text-[10px] mt-1 font-semibold">{nameError}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Mobile Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g., +1 (555) 000-0000"
                    className="w-full bg-[#151724] border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">For digital invoice & tracking links</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-bold py-3 px-4 rounded-xl text-sm shadow-xl active:scale-[0.98] transition-all cursor-pointer mt-6"
              style={{ backgroundColor: aColor, color: '#090a0f' }}
            >
              Enter Menu & Order
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Active Customer Web Experience
  const restMenu = menuItems.filter((i) => i.restaurantId === selectedRestaurantId);
  const restCategories = menuCategories.filter((c) => c.restaurantId === selectedRestaurantId && c.isActive);

  // Filter items
  const filteredItems = restMenu.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchesVeg = isVegOnly ? item.isVeg : true;
    return matchesSearch && matchesCategory && matchesVeg;
  });

  // Calculate cart sum
  const cartSubtotal = cart.reduce((acc, c) => {
    const price = c.item.price + (c.selectedVariant?.price || 0);
    const addons = c.selectedAddons.reduce((sa, a) => sa + a.price, 0);
    return acc + (price + addons) * c.quantity;
  }, 0);

  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountPercent) {
      discountAmount = (cartSubtotal * activeCoupon.discountPercent) / 100;
      if (activeCoupon.maxDiscount && discountAmount > activeCoupon.maxDiscount) {
        discountAmount = activeCoupon.maxDiscount;
      }
    } else if (activeCoupon.discountFlat) {
      discountAmount = activeCoupon.discountFlat;
    }
  }

  const gstAmount = parseFloat(( (cartSubtotal - discountAmount) * (activeRest.gstPercent / 100) ).toFixed(2));
  const serviceChargeAmount = parseFloat(( (cartSubtotal - discountAmount) * (activeRest.serviceChargePercent / 100) ).toFixed(2));
  const cartTotal = parseFloat((cartSubtotal - discountAmount + gstAmount + serviceChargeAmount).toFixed(2));

  // Customer placed orders in this table session
  const sessionOrders = orders.filter((o) => o.sessionId === activeSession.id);
  const hasActiveOrders = sessionOrders.length > 0;
  const latestOrder = sessionOrders[0];

  // Outstanding waiter requests pending
  const activeWaiterReq = waiterRequests.filter(
    (r) => r.sessionId === activeSession.id && r.status === 'pending'
  );

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 0;
      case OrderStatus.ACCEPTED: return 1;
      case OrderStatus.PREPARING: return 2;
      case OrderStatus.READY: return 3;
      case OrderStatus.SERVED: return 4;
      default: return 0;
    }
  };

  // Triggers customization drawer
  const openCustomization = (item: MenuItem) => {
    setCustomizingItem(item);
    setSelectedVariantId(item.variants[0]?.id || '');
    setSelectedAddonIds([]);
    setSpecialInstructions('');
  };

  const handleAddCustomizedToCart = () => {
    if (!customizingItem) return;
    const variant = customizingItem.variants.find((v) => v.id === selectedVariantId);
    const addons = customizingItem.addons.filter((a) => selectedAddonIds.includes(a.id));
    addToCart(customizingItem, 1, variant, addons, specialInstructions);
    setCustomizingItem(null);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback(feedbackRating, feedbackComment);
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackComment('');
    }, 3000);
  };

  return (
    <div className="flex-1 bg-[#090a0f] text-slate-100 flex flex-col h-full relative overflow-hidden">
      
      {/* 2.1 Customer Header */}
      <header className="bg-[#11131e] px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img
            src={activeRest.logo}
            alt={activeRest.name}
            className="w-9 h-9 rounded-lg object-cover border border-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">ORDERING LIVE AT</span>
            <span className="font-extrabold text-sm text-white leading-tight">{activeRest.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-full text-xs font-mono shadow-sm">
            Table {activeTable?.tableNumber || '01'}
          </span>
          <button
            onClick={() => setShowRunningBill(true)}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1 text-[11px]"
            title="View Active Session Bill"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bill</span>
          </button>
        </div>
      </header>

      {/* 2.2 Scrollable Body */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-none px-4 space-y-4 pt-3">
        
        {/* Guest Welcome Row */}
        <div className="bg-slate-900/40 border border-slate-800/40 px-3.5 py-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-300">Active session: <strong>{activeSession.customerName}</strong></span>
          </div>
          {/* <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Token: {activeSession.id}
          </span> */}
        </div>

        {/* Live Order Tracker Banner */}
        {hasActiveOrders && latestOrder.status !== OrderStatus.COMPLETED && latestOrder.status !== OrderStatus.CANCELLED && (
          <div className="bg-[#151724] border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Order Tracking
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Status: {latestOrder.status.toUpperCase()}</span>
            </div>

            {/* Steps Stepper */}
            <div className="grid grid-cols-5 gap-0.5 mt-3 relative">
              <div className="absolute top-2 left-6 right-6 h-0.5 bg-slate-800 -z-0" />
              <div
                className="absolute top-2 left-6 h-0.5 bg-emerald-500 -z-0 transition-all duration-500"
                style={{ width: `${getStatusStepIndex(latestOrder.status) * 25}%` }}
              />

              {[
                { label: 'Sent', key: OrderStatus.PENDING },
                { label: 'Accepted', key: OrderStatus.ACCEPTED },
                { label: 'Preparing', key: OrderStatus.PREPARING },
                { label: 'Ready', key: OrderStatus.READY },
                { label: 'Served', key: OrderStatus.SERVED },
              ].map((step, idx) => {
                const stepIdx = getStatusStepIndex(latestOrder.status);
                const isCurrent = latestOrder.status === step.key;
                const isDone = stepIdx >= idx;

                return (
                  <div key={step.label} className="flex flex-col items-center text-center z-10">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-125 shadow-lg shadow-emerald-500/20'
                          : isDone
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[8px] mt-1.5 font-bold leading-tight ${
                        isCurrent ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[10px] text-slate-400 text-center mt-3 font-mono">
              {latestOrder.status === OrderStatus.PENDING && 'Kitchen is reviewing your order...'}
              {latestOrder.status === OrderStatus.ACCEPTED && 'Order accepted! Beginning prep shortly.'}
              {latestOrder.status === OrderStatus.PREPARING && '👨‍🍳 Chef is currently preparing your meal!'}
              {latestOrder.status === OrderStatus.READY && '🍽️ Order is ready! Waiter is serving it now.'}
              {latestOrder.status === OrderStatus.SERVED && 'Bon Appétit! Place additional orders below.'}
            </p>
          </div>
        )}

        {/* 2.3 Banners Horizontal Scroll */}
        <div className="overflow-x-auto flex gap-3.5 scrollbar-none py-1 snap-x shrink-0">
          {banners
            .filter((b) => b.restaurantId === selectedRestaurantId && b.isActive)
            .map((b) => (
              <div
                key={b.id}
                className="w-[280px] h-32 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shrink-0 relative snap-center shadow-lg"
              >
                <img
                  src={b.image}
                  alt={b.title}
                  className="w-full h-full object-cover brightness-[0.35]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400 font-mono mb-1">
                    {b.type.toUpperCase()} OFFER
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{b.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">{b.subtitle}</p>
                </div>
              </div>
            ))}
        </div>

        {/* Filters and Search */}
        <div className="space-y-3 shrink-0">
          {/* Search Row */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, toppings, burgers..."
              className="w-full bg-[#11131e] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 p-0.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Veg Toggle + Reset Filter */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedCategory === null
                    ? 'bg-slate-800 border border-slate-700 text-white font-bold'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Menu
              </button>

              <button
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  isVegOnly
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Veg Only</span>
              </button>
            </div>
            {selectedCategory && (
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                Showing {filteredItems.length} items
              </span>
            )}
          </div>

          {/* Categories Slider */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
            {restCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'text-slate-950 font-bold shadow-md'
                    : 'bg-[#11131e] border border-slate-800 text-slate-300 hover:text-white'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.id ? aColor : undefined,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2.4 Menu List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-[#11131e]/20 border border-dashed border-slate-800 rounded-2xl">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <span className="text-slate-400 text-xs font-medium">No dishes found.</span>
              <p className="text-[10px] text-slate-500 mt-1">Try resetting search or filters.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#11131e]/70 border border-slate-800/80 p-3.5 rounded-2xl shadow-md flex gap-3.5 hover:border-slate-700/60 transition-all duration-200"
              >
                {/* Food Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-800 shrink-0 relative shadow-inner">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Veg tag */}
                  <span className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-sm flex items-center justify-center p-0.5 border bg-slate-950/80 ${
                    item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                      {item.isSpecial && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[7px] px-1 py-0.2 rounded shrink-0 font-bold uppercase font-mono">
                          Special
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-sm font-black text-white font-mono">
                      {formatIndianCurrency(item.price, activeRest.currency)}
                    </span>

                    {item.isAvailable ? (
                      <button
                        onClick={() => openCustomization(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95"
                        style={{ backgroundColor: `${aColor}1a`, color: aColor, border: `1px solid ${aColor}30` }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    ) : (
                      <span className="bg-slate-800 text-slate-500 border border-slate-800/60 text-[8px] px-2 py-1 rounded font-bold font-mono uppercase">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2.5 Floating Bottom Bar (Service Request & Cart Toggles) */}
      <div className="absolute bottom-0 inset-x-0 bg-[#11131e]/90 border-t border-slate-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between z-30 shadow-2xl shrink-0">
        
        {/* Service Requests popover trigger */}
        <button
          onClick={() => setShowServiceRequests(true)}
          className="relative flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3.5 py-2 rounded-xl text-xs text-slate-300 font-bold cursor-pointer"
        >
          <Bell className="w-4 h-4 text-amber-400 animate-swing" />
          <span>Call Service</span>
          {activeWaiterReq.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black rounded-full text-[8px] h-4 min-w-4 px-1 flex items-center justify-center animate-bounce border border-[#11131e]">
              {activeWaiterReq.length}
            </span>
          )}
        </button>

        {/* Floating Cart checkout */}
        {cart.length > 0 ? (
          <button
            onClick={() => setShowCart(true)}
            className="flex-1 max-w-[200px] flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg animate-pulse hover:animate-none cursor-pointer text-slate-950"
            style={{ backgroundColor: aColor }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
            </div>
            <span>{formatIndianCurrency(cartTotal, activeRest.currency)}</span>
          </button>
        ) : (
          <div className="text-[10px] text-slate-500 font-mono text-right flex flex-col justify-center">
            <span>Free Wifi: <strong>Sizzlr_Guest</strong></span>
            <span>Scan, Order, Repeat</span>
          </div>
        )}
      </div>

      {/* 3. ITEM CUSTOMIZATION DRAWER MODAL */}
      <AnimatePresence>
        {customizingItem && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setCustomizingItem(null)} />
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-[#11131e] border-t border-slate-800 rounded-t-[28px] p-6 max-h-[85%] overflow-y-auto relative z-10 flex flex-col text-slate-100 shadow-2xl"
            >
              <button
                onClick={() => setCustomizingItem(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1 rounded-full bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-sm font-extrabold text-white leading-snug">{customizingItem.name}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-1 mb-4">{customizingItem.description}</p>

              <div className="space-y-4 flex-1">
                {/* Variants option */}
                {customizingItem.variants.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-2">CHOOSE PORTION SIZE</span>
                    <div className="space-y-2">
                      {customizingItem.variants.map((v) => (
                        <label
                          key={v.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selectedVariantId === v.id
                              ? 'bg-slate-800 border-amber-500'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="radio"
                              name="item-variant"
                              checked={selectedVariantId === v.id}
                              onChange={() => setSelectedVariantId(v.id)}
                              className="accent-amber-500"
                            />
                            <span className="font-semibold text-slate-200">{v.name}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            {v.price > 0 ? `+${formatIndianCurrency(v.price, activeRest.currency)}` : 'Included'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addons option */}
                {customizingItem.addons.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-2 font-mono">AVAILABLE ADD-ONS</span>
                    <div className="space-y-2">
                      {customizingItem.addons.map((addon) => {
                        const isSelected = selectedAddonIds.includes(addon.id);
                        return (
                          <label
                            key={addon.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected ? 'bg-slate-800 border-amber-500' : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAddonIds([...selectedAddonIds, addon.id]);
                                  } else {
                                    setSelectedAddonIds(selectedAddonIds.filter((id) => id !== addon.id));
                                  }
                                }}
                                className="accent-amber-500 rounded"
                              />
                              <span className="font-semibold text-slate-200">{addon.name}</span>
                            </div>
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              +{formatIndianCurrency(addon.price, activeRest.currency)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Special Instructions text */}
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-1">KITCHEN INSTRUCTIONS (OPTIONAL)</span>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., No onions, extra spicy, sauce on side, allergy notes..."
                    className="w-full bg-[#151724] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 placeholder-slate-600 resize-none h-16"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCustomizedToCart}
                className="w-full font-black py-3 rounded-xl text-xs shadow-lg mt-6 cursor-pointer text-slate-950"
                style={{ backgroundColor: aColor }}
              >
                Add Item To Basket
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CUSTOMER CART BASKET VIEW (DRAWER) */}
      <AnimatePresence>
        {showCart && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ y: 250 }}
              animate={{ y: 0 }}
              exit={{ y: 250 }}
              className="bg-[#11131e] border-t border-slate-800 rounded-t-[28px] p-6 max-h-[90%] overflow-y-auto relative z-10 flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setShowCart(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4 shrink-0">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Your Food Basket</h4>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-700 opacity-30 mb-2" />
                  <span>Your basket is empty</span>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  
                  {/* Cart Items List */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto">
                    {cart.map((c) => (
                      <div key={c.id} className="bg-slate-900/50 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white block line-clamp-1">{c.item.name}</span>
                          {c.selectedVariant && (
                            <span className="text-[10px] text-amber-400 block font-mono">{c.selectedVariant.name}</span>
                          )}
                          {c.selectedAddons.length > 0 && (
                            <span className="text-[9px] text-slate-400 block line-clamp-1">
                              +{c.selectedAddons.map((a) => a.name).join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Increment / Decrement */}
                        <div className="flex items-center gap-2.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800/60 shrink-0">
                          <button
                            onClick={() => updateCartQuantity(c.id, c.quantity - 1)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white font-mono shrink-0 w-3 text-center">{c.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(c.id, c.quantity + 1)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-white font-mono shrink-0 w-12 text-right">
                          {formatIndianCurrency(( (c.item.price + (c.selectedVariant?.price || 0) + c.selectedAddons.reduce((a,b)=>a+b.price,0)) * c.quantity ), activeRest.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Promo coupon inputs */}
                  <form onSubmit={handleApplyCoupon} className="border-t border-b border-slate-800/60 py-3 space-y-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono tracking-wider">APPLY COUPONS</span>
                    {activeCoupon ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <Percent className="w-3.5 h-3.5" />
                          <span>Code: {activeCoupon.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="text-[10px] text-slate-500 hover:text-rose-400 font-bold underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="e.g., TRUFFLE10"
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white outline-none uppercase font-mono"
                        />
                        <button
                          type="submit"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-[10px] text-rose-400 font-semibold">{couponError}</p>}
                  </form>

                  {/* Invoice Summary */}
                  <div className="space-y-1.5 text-xs text-slate-400 shrink-0 font-mono">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white">{formatIndianCurrency(cartSubtotal, activeRest.currency)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Coupon Discount</span>
                        <span>-{formatIndianCurrency(discountAmount, activeRest.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST ({activeRest.gstPercent}%)</span>
                      <span className="text-white">{formatIndianCurrency(gstAmount, activeRest.currency)}</span>
                    </div>
                    {activeRest.serviceChargePercent > 0 && (
                      <div className="flex justify-between">
                        <span>Service Charge ({activeRest.serviceChargePercent}%)</span>
                        <span className="text-white">{formatIndianCurrency(serviceChargeAmount, activeRest.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold mt-1 text-white">
                      <span className="font-sans">Grand Total</span>
                      <span className="font-mono text-amber-400">{formatIndianCurrency(cartTotal, activeRest.currency)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      customerPlaceOrder();
                      setShowCart(false);
                    }}
                    className="w-full font-black py-3 rounded-xl text-xs shadow-lg mt-4 cursor-pointer text-slate-950"
                    style={{ backgroundColor: aColor }}
                  >
                    Place Live Order to Kitchen
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CALL SERVICE / SERVICE REQUESTS PANEL (DRAWER) */}
      <AnimatePresence>
        {showServiceRequests && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setShowServiceRequests(false)} />
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-[#11131e] border-t border-slate-800 rounded-t-[28px] p-6 max-h-[80%] overflow-y-auto relative z-10 flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setShowServiceRequests(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4 shrink-0">
                <Bell className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Request Table Assistance</h4>
              </div>

              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Need anything? Click any request below and a staff notification will sync instantly to our waiters and cashier terminals.
              </p>

              <div className="grid grid-cols-2 gap-3.5 mb-6">
                {[
                  { label: 'Call Waiter', desc: 'General help request', type: ServiceRequestType.CALL_WAITER, icon: Coffee, color: 'hover:border-amber-500 hover:bg-amber-500/5' },
                  { label: 'Request Water', desc: 'Bring water bottles', type: ServiceRequestType.REQUEST_WATER, icon: Droplet, color: 'hover:border-blue-500 hover:bg-blue-500/5' },
                  { label: 'Request Tissue', desc: 'Napkins or towels', type: ServiceRequestType.REQUEST_TISSUE, icon: Sparkle, color: 'hover:border-slate-500 hover:bg-slate-500/5' },
                  { label: 'Request Bill', desc: 'Initiate final settle', type: ServiceRequestType.REQUEST_BILL, icon: FileText, color: 'hover:border-emerald-500 hover:bg-emerald-500/5' },
                ].map((req) => (
                  <button
                    key={req.label}
                    onClick={() => {
                      customerRequestService(req.type);
                      setShowServiceRequests(false);
                    }}
                    className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-start gap-1 cursor-pointer transition-all active:scale-95 text-left ${req.color}`}
                  >
                    <req.icon className="w-5 h-5 text-amber-400 mb-1" />
                    <span className="text-xs font-bold text-white block">{req.label}</span>
                    <span className="text-[10px] text-slate-500 leading-normal">{req.desc}</span>
                  </button>
                ))}
              </div>

              {activeWaiterReq.length > 0 && (
                <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl text-[10px] text-slate-400 font-mono space-y-1.5 shrink-0">
                  <span className="font-bold text-slate-300">ACTIVE ASSISTANCE TIMERS:</span>
                  {activeWaiterReq.map((r, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-800 pb-1">
                      <span>✓ {r.type.toUpperCase().replace('_', ' ')}</span>
                      <span className="text-amber-400">PENDING RESOLVE</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. RUNNING BILL / ACTIVE SESSION BILL PREVIEW */}
      <AnimatePresence>
        {showRunningBill && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setShowRunningBill(false)} />
            <motion.div
              initial={{ y: 250 }}
              animate={{ y: 0 }}
              exit={{ y: 250 }}
              className="bg-[#11131e] border-t border-slate-800 rounded-t-[28px] p-6 max-h-[90%] overflow-y-auto relative z-10 flex flex-col shadow-2xl text-slate-100"
            >
              <button
                onClick={() => setShowRunningBill(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4 shrink-0">
                <FileText className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Running Bill Statement</h4>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto">
                {sessionOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Clock className="w-12 h-12 mx-auto text-slate-700 opacity-30 mb-2" />
                    <span>No dishes ordered in this session yet.</span>
                    <p className="text-[10px] text-slate-600 mt-1">Place an order to see details.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pr-1">
                    {/* List Orders in Session */}
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {sessionOrders.map((ord) => (
                        <div key={ord.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl relative">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-2 font-mono text-[9px]">
                            <span className="text-slate-500">ORDER {ord.id.substr(-4)}</span>
                            <span className={`px-2 py-0.2 rounded font-black ${
                              ord.status === OrderStatus.COMPLETED
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : ord.status === OrderStatus.CANCELLED
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {ord.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {ord.items.map((it) => (
                              <div key={it.id} className="flex justify-between text-xs text-slate-300">
                                <span>{it.quantity}x {it.name}</span>
                                <span className="font-mono text-slate-400">{formatIndianCurrency(it.price, activeRest.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall Session Bill Total Summary */}
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase font-mono tracking-wider">AGGREGATE SESSION STATEMENT</span>
                      <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                        <div className="flex justify-between">
                          <span>Total Subtotal</span>
                          <span className="text-white">
                            {formatIndianCurrency(sessionOrders.reduce((sum, o) => sum + (o.status !== OrderStatus.CANCELLED ? o.subtotal : 0), 0), activeRest.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Applied Discounts</span>
                          <span className="text-emerald-400">
                            -{formatIndianCurrency(sessionOrders.reduce((sum, o) => sum + (o.status !== OrderStatus.CANCELLED ? o.discountAmount : 0), 0), activeRest.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes (GST)</span>
                          <span className="text-white">
                            {formatIndianCurrency(sessionOrders.reduce((sum, o) => sum + (o.status !== OrderStatus.CANCELLED ? o.gstAmount : 0), 0), activeRest.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charges</span>
                          <span className="text-white">
                            {formatIndianCurrency(sessionOrders.reduce((sum, o) => sum + (o.status !== OrderStatus.CANCELLED ? o.serviceChargeAmount : 0), 0), activeRest.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold mt-1 text-white">
                          <span className="font-sans">Grand Session Bill</span>
                          <span className="font-mono text-amber-400">
                            {formatIndianCurrency(activeSession.totalBill, activeRest.currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Settle feedback trigger */}
                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <span className="text-xs text-slate-400 block font-bold">SUBMIT SESSION FEEDBACK</span>
                      <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className="p-1 hover:scale-110 cursor-pointer"
                            >
                              <Star className={`w-6 h-6 ${feedbackRating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="What did you think of the service or food?"
                          className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl outline-none focus:border-amber-500"
                        />

                        <button
                          type="submit"
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold py-2 rounded-xl text-xs cursor-pointer"
                        >
                          Submit Review
                        </button>
                      </form>

                      {feedbackSubmitted && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg text-[10px] text-center font-bold">
                          ✓ Review submitted! Thank you for your feedback.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icon fallbacks inside the component
function StoreSuspendedIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M2 20h20" />
      <path d="M5 17V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v12" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}
