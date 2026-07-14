/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../state';
import {
  ShieldAlert,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  Layers,
  Wrench,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { BranchComparisonChart } from './DashboardCharts';
import { RestaurantStatus, SubscriptionPlan, UserRole } from '../types';
import AuthPortal from './AuthPortal';

export default function SuperAdminDashboard() {
  const {
    restaurants,
    orders,
    superAdminToggleRestaurantStatus,
    superAdminUpdateRestaurantPlan,
    superAdminCreateRestaurant,
    superAdminDeleteRestaurant,
    addSystemNotification,
    currentUser,
    logout
  } = useAppState();

  if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
    return <AuthPortal initialRequestedRole="superadmin" />;
  }

  const [selectedRestFilter, setSelectedRestFilter] = useState<'all' | 'approved' | 'suspended' | 'pending'>('all');

  // Restaurant Creation & Deletion State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormError, setCreateFormError] = useState('');
  
  const [restFormName, setRestFormName] = useState('');
  const [restFormDesc, setRestFormDesc] = useState('');
  const [restFormLogo, setRestFormLogo] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80');
  const [restFormBanner, setRestFormBanner] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
  const [restFormStatus, setRestFormStatus] = useState<RestaurantStatus>(RestaurantStatus.APPROVED);
  const [restFormPlan, setRestFormPlan] = useState<SubscriptionPlan>(SubscriptionPlan.GROWTH);
  const [restFormCuisine, setRestFormCuisine] = useState('Multi-Cuisine');
  const [restFormPrimaryColor, setRestFormPrimaryColor] = useState('#f59e0b');
  const [restFormAccentColor, setRestFormAccentColor] = useState('#10b981');
  const [restFormCurrency, setRestFormCurrency] = useState('INR');
  const [restFormGstPercent, setRestFormGstPercent] = useState(5);
  const [restFormServiceCharge, setRestFormServiceCharge] = useState(5);
  const [restFormPhone, setRestFormPhone] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<any>(null);

  // Multi-tenant aggregate metrics
  const platformRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0);
  const totalApprovedTenants = restaurants.filter((r) => r.status === RestaurantStatus.APPROVED).length;
  const totalSuspendedTenants = restaurants.filter((r) => r.status === RestaurantStatus.SUSPENDED).length;

  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedRestFilter === 'all') return true;
    if (selectedRestFilter === 'approved') return r.status === RestaurantStatus.APPROVED;
    if (selectedRestFilter === 'suspended') return r.status === RestaurantStatus.SUSPENDED;
    if (selectedRestFilter === 'pending') return r.status === RestaurantStatus.PENDING;
    return true;
  });

  return (
    <div className="flex-1 bg-[#090a0f] text-slate-100 p-6 overflow-y-auto font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-6">
        <div>
          <span className="text-[10px] text-rose-400 font-mono font-bold block uppercase tracking-wider">PLATFORM CONSOLE ROOT</span>
          <h3 className="text-sm font-black text-white">SaaS Multi-Tenant Administrator</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-slate-300 font-semibold">{currentUser?.fullName}</span>
            <span className="text-[8px] text-rose-400 font-mono uppercase font-bold">Platform Super Admin</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl font-mono">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Root Permission Verified</span>
          </div>
          <button
            onClick={logout}
            className="text-[10px] bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 px-2.5 py-1.5 rounded-lg cursor-pointer transition shrink-0 font-bold"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cumulative Gross SaaS Sales', val: `$${platformRevenue.toFixed(2)}`, desc: 'Gross order billing volume' },
          { label: 'Total Active Tenants', val: totalApprovedTenants, desc: 'Live merchant nodes' },
          { label: 'Suspended Merchants', val: totalSuspendedTenants, desc: 'Violations or unpaid bills' },
          { label: 'Platform Transactions', val: orders.length, desc: 'Realtime order tickets logged' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#11131e]/50 border border-slate-800/60 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block">{stat.label}</span>
            <p className="text-xl font-black mt-1 text-white">{stat.val}</p>
            <p className="text-[9px] text-slate-500 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Merchant isolation Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 font-mono uppercase">TENANT DIRECTORY</span>
            
            <div className="flex items-center gap-2">
              {/* Filter buttons */}
              <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'suspended', label: 'Suspended' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedRestFilter(opt.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                      selectedRestFilter === opt.id
                        ? 'bg-rose-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setRestFormName('');
                  setRestFormDesc('');
                  setRestFormPhone('');
                  setRestFormCuisine('Multi-Cuisine');
                  setRestFormGstPercent(5);
                  setRestFormServiceCharge(5);
                  setRestFormStatus(RestaurantStatus.APPROVED);
                  setRestFormPlan(SubscriptionPlan.GROWTH);
                  setRestFormLogo('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80');
                  setRestFormBanner('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
                  setRestFormPrimaryColor('#f59e0b');
                  setRestFormAccentColor('#10b981');
                  setRestFormCurrency('INR');
                  setCreateFormError('');
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shadow-md cursor-pointer border-none"
              >
                <Plus className="w-3.5 h-3.5" />
                Register Brand
              </button>
            </div>
          </div>

          {/* Tenants lists cards */}
          <div className="space-y-3.5">
            {filteredRestaurants.map((rest) => {
              const rOrders = orders.filter((o) => o.restaurantId === rest.id);
              const rVolume = rOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0);

              return (
                <div key={rest.id} className="bg-[#11131e]/70 border border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={rest.logo}
                      alt={rest.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white leading-tight truncate">{rest.name}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.2 rounded ${
                          rest.status === RestaurantStatus.APPROVED
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {rest.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{rest.cuisine}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">SaaS Sales Volume: ${rVolume.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Merchant control workflows */}
                  <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    {/* Subscription tier switch */}
                    <div>
                      <label className="text-[8px] text-slate-500 font-mono font-semibold block mb-1">PLAN LEVEL</label>
                      <select
                        value={rest.plan}
                        onChange={(e) => superAdminUpdateRestaurantPlan(rest.id, e.target.value as SubscriptionPlan)}
                        className="bg-slate-950 border border-slate-850 rounded p-1 text-[10px] text-white"
                      >
                        <option value={SubscriptionPlan.FREE}>Free Tier</option>
                        <option value={SubscriptionPlan.GROWTH}>Growth Tier</option>
                        <option value={SubscriptionPlan.PRO}>Pro Core Tier</option>
                      </select>
                    </div>

                    {/* Suspension workflow */}
                    <div>
                      <label className="text-[8px] text-slate-500 font-mono font-semibold block mb-1">DATA ISOLATION STATE</label>
                      {rest.status === RestaurantStatus.APPROVED ? (
                        <button
                          onClick={() => superAdminToggleRestaurantStatus(rest.id, RestaurantStatus.SUSPENDED)}
                          className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent text-rose-400 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        >
                          Suspend Tenant
                        </button>
                      ) : (
                        <button
                          onClick={() => superAdminToggleRestaurantStatus(rest.id, RestaurantStatus.APPROVED)}
                          className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/20 hover:border-transparent text-emerald-400 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        >
                          Approve Tenant
                        </button>
                      )}
                    </div>

                    {/* Purge Brand workflow */}
                    <div>
                      <label className="text-[8px] text-slate-500 font-mono font-semibold block mb-1">DESTRUCTIVE ACTION</label>
                      <button
                        onClick={() => {
                          setRestaurantToDelete(rest);
                          setIsDeleteModalOpen(true);
                        }}
                        className="bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent font-bold p-1 rounded text-[10px] cursor-pointer h-7 w-7 flex items-center justify-center transition-colors"
                        title="Purge Merchant Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Platform health analytics */}
        <div className="lg:col-span-1 space-y-4">
          <span className="text-xs font-bold text-slate-400 block font-mono uppercase">TENANT VOLUME METER</span>
          
          <div className="bg-[#11131e]/50 border border-slate-800/60 p-4 rounded-2xl shadow-sm">
            <span className="text-[11px] text-slate-400 font-mono font-bold block mb-4 uppercase">Merchant Gross Sales</span>
            <BranchComparisonChart />
          </div>

          {/* System status notices */}
          <div className="bg-[#11131e]/50 border border-slate-800/60 p-4 rounded-2xl shadow-sm space-y-2.5 font-mono text-[9px] text-slate-400">
            <span className="text-xs font-bold text-slate-300 font-sans block uppercase">PLATFORM INFRASTRUCTURE STATUS</span>
            <div className="flex justify-between border-b border-slate-850 pb-1.5">
              <span>● database_pool:</span>
              <span className="text-emerald-400 font-bold">ACTIVE (100%)</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-1.5">
              <span>● realtime_listener:</span>
              <span className="text-emerald-400">ONLINE</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-1.5">
              <span>● tenant_rls_isolation:</span>
              <span className="text-emerald-400">VERIFIED</span>
            </div>
            <div className="flex justify-between">
              <span>● global_latency_avg:</span>
              <span className="text-emerald-400 font-bold">14ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODAL: REGISTER BRAND */}
      {/* ======================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8"
            >
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-rose-400" />
                  <h3 className="font-extrabold text-white text-sm font-sans">Register New Merchant Brand</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent animate-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!restFormName.trim() || !restFormDesc.trim()) {
                    setCreateFormError('Brand Name and Description are required.');
                    return;
                  }
                  const res = superAdminCreateRestaurant({
                    name: restFormName,
                    description: restFormDesc,
                    logo: restFormLogo,
                    banner: restFormBanner,
                    status: restFormStatus,
                    plan: restFormPlan,
                    cuisine: restFormCuisine,
                    primaryColor: restFormPrimaryColor,
                    accentColor: restFormAccentColor,
                    currency: restFormCurrency,
                    gstPercent: Number(restFormGstPercent),
                    serviceChargePercent: Number(restFormServiceCharge),
                    phone: restFormPhone
                  });
                  if (res.success) {
                    setIsCreateModalOpen(false);
                    addSystemNotification(`Successfully registered brand: "${restFormName}"`);
                  } else {
                    setCreateFormError(res.error || 'Failed to register brand.');
                  }
                }}
                className="p-6 space-y-4 overflow-y-auto max-h-[70vh] font-sans text-xs text-slate-300"
              >
                {createFormError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-semibold flex items-center gap-2">
                    <span>⚠️ {createFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Col */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Brand Name *</label>
                      <input
                        type="text"
                        required
                        value={restFormName}
                        onChange={(e) => setRestFormName(e.target.value)}
                        placeholder="e.g. Spice Symphony"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors animate-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Brand Tagline/Description *</label>
                      <input
                        type="text"
                        required
                        value={restFormDesc}
                        onChange={(e) => setRestFormDesc(e.target.value)}
                        placeholder="e.g. Traditional Indian fine dining and street grills"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors animate-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Cuisine Style</label>
                      <input
                        type="text"
                        value={restFormCuisine}
                        onChange={(e) => setRestFormCuisine(e.target.value)}
                        placeholder="e.g. North Indian, Tandoori"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors animate-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={restFormPhone}
                        onChange={(e) => setRestFormPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors animate-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">GST (%)</label>
                        <input
                          type="number"
                          value={restFormGstPercent}
                          onChange={(e) => setRestFormGstPercent(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors animate-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Serv. Charge (%)</label>
                        <input
                          type="number"
                          value={restFormServiceCharge}
                          onChange={(e) => setRestFormServiceCharge(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors animate-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Col */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Logo Image URL</label>
                      <input
                        type="text"
                        value={restFormLogo}
                        onChange={(e) => setRestFormLogo(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors font-mono animate-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Banner Image URL</label>
                      <input
                        type="text"
                        value={restFormBanner}
                        onChange={(e) => setRestFormBanner(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors font-mono animate-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={restFormPrimaryColor}
                          onChange={(e) => setRestFormPrimaryColor(e.target.value)}
                          className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Accent Color</label>
                        <input
                          type="color"
                          value={restFormAccentColor}
                          onChange={(e) => setRestFormAccentColor(e.target.value)}
                          className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Subscription Plan</label>
                        <select
                          value={restFormPlan}
                          onChange={(e) => setRestFormPlan(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                        >
                          <option value={SubscriptionPlan.FREE}>Free Tier</option>
                          <option value={SubscriptionPlan.GROWTH}>Growth Tier</option>
                          <option value={SubscriptionPlan.PRO}>Pro Core Tier</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Currency</label>
                        <select
                          value={restFormCurrency}
                          onChange={(e) => setRestFormCurrency(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border-t border-slate-800/60 -mx-6 -mb-6 flex items-center justify-stretch gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer text-white bg-rose-600 hover:bg-rose-700"
                  >
                    Register Brand
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: DELETE BRAND CONFIRMATION */}
      {/* ======================================= */}
      <AnimatePresence>
        {isDeleteModalOpen && restaurantToDelete && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans text-xs"
            >
              <div className="bg-rose-950/40 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="font-extrabold text-sm">Purge Merchant Node</h3>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent animate-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-300 leading-relaxed">
                  Are you absolutely certain you want to purge the tenant brand <strong className="text-white">"{restaurantToDelete.name}"</strong>?
                </p>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl leading-relaxed font-mono text-[11px]">
                  ⚠️ This action will completely wipe all branches, tables, menus, orders, and configuration files associated with this brand. This cannot be undone.
                </div>
              </div>

              <div className="bg-slate-950 p-4 border-t border-slate-800/60 flex items-center justify-stretch gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const res = superAdminDeleteRestaurant(restaurantToDelete.id);
                    if (res.success) {
                      setIsDeleteModalOpen(false);
                      addSystemNotification(`Successfully purged brand node: "${restaurantToDelete.name}"`);
                    } else {
                      alert(res.error || 'Failed to delete restaurant.');
                    }
                  }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer border-none"
                >
                  Purge Tenant
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
