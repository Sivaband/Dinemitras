/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../state';
import {
  Smartphone,
  Monitor,
  Database,
  QrCode,
  Bell,
  Trash2,
  ChefHat,
  ShieldCheck,
  Store,
  Terminal,
  Layers,
  HelpCircle,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RestaurantStatus } from '../types';
import QrCameraScanner from './QrCameraScanner';

interface DeviceSimulatorProps {
  customerElement: React.ReactNode;
  staffElement: React.ReactNode;
  adminElement: React.ReactNode;
  superAdminElement: React.ReactNode;
}

export default function DeviceSimulator({
  customerElement,
  staffElement,
  adminElement,
  superAdminElement
}: DeviceSimulatorProps) {
  const {
    currentRole,
    setCurrentRole,
    restaurants,
    branches,
    tables,
    customerScanQR,
    resetAllState,
    notifications,
    clearNotifications,
    selectedRestaurantId,
    selectedBranchId,
    selectedTableId,
    activeSession,
    isQrModalOpen,
    setIsQrModalOpen
  } = useAppState();

  const [qrScanMode, setQrScanMode] = useState<'preset' | 'camera'>('preset');
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [qrRestId, setQrRestId] = useState(selectedRestaurantId);
  const [qrBranchId, setQrBranchId] = useState(selectedBranchId);
  const [qrTableId, setQrTableId] = useState(selectedTableId);

  const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];

  // Helper to trigger QR scanning simulator
  const handleSimulateScan = () => {
    customerScanQR(qrRestId, qrBranchId, qrTableId);
    setIsQrModalOpen(false);
    
    // Auto-switch to customer or split mode to show the result
    if (currentRole !== 'split' && currentRole !== 'customer') {
      setCurrentRole('split');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'customer': return 'Customer App';
      case 'staff': return 'Staff Board';
      case 'admin': return 'Restaurant Admin';
      case 'superadmin': return 'Platform Super Admin';
      case 'split': return 'Split-Screen Sandbox';
      default: return 'Simulator';
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Platform Header */}
      <header className="bg-[#11131e]/90 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-md px-4 py-2.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-2 rounded-xl shadow-lg ring-1 ring-white/10">
            <Layers className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">Sizzlr QR</span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-semibold">
                Multi-Tenant RLS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Flutter-to-React High-Fidelity Prototype</p>
          </div>
        </div>

        {/* Quick QR & Dev Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mock QR Trigger */}
          <button
            id="btn_qr_scan_trigger"
            onClick={() => {
              setQrRestId(selectedRestaurantId);
              setIsQrModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500 hover:to-orange-500 text-amber-400 hover:text-white border border-amber-500/30 hover:border-transparent px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 shadow-md shadow-amber-500/5 hover:shadow-amber-500/20 active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden lg:inline">Simulate QR Scan</span>
          </button>

          {/* Database Reset */}
          <button
            id="btn_db_reset"
            onClick={resetAllState}
            className="flex items-center gap-1.5 bg-slate-800/40 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
            title="Reset Database to Default Presets"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset Demo DB</span>
          </button>

          {/* System Logs */}
          <button
            id="btn_system_logs"
            onClick={() => setShowLogDrawer(true)}
            className="relative flex items-center justify-center bg-slate-800/40 text-slate-300 hover:text-white border border-slate-700/60 p-2 rounded-lg cursor-pointer transition-all duration-200"
            title="System Terminal Logs"
          >
            <Terminal className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>
        </div>

        {/* Perspective Selectors */}
        <div className="flex items-center bg-slate-800/50 p-1 border border-slate-700/50 rounded-xl max-w-full overflow-x-auto gap-0.5">
          <button
            id="tab_role_split"
            onClick={() => setCurrentRole('split')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              currentRole === 'split' ? 'bg-indigo-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 hidden sm:inline" />
            <Monitor className="w-3.5 h-3.5 hidden sm:inline" />
            <span>Sandbox</span>
          </button>

          <button
            id="tab_role_customer"
            onClick={() => setCurrentRole('customer')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              currentRole === 'customer' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>

          <button
            id="tab_role_staff"
            onClick={() => setCurrentRole('staff')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              currentRole === 'staff' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Staff</span>
          </button>

          <button
            id="tab_role_admin"
            onClick={() => setCurrentRole('admin')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              currentRole === 'admin' ? 'bg-yellow-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Brand Admin</span>
          </button>

          <button
            id="tab_role_superadmin"
            onClick={() => setCurrentRole('superadmin')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
              currentRole === 'superadmin' ? 'bg-rose-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Real-time Toast Alerts at top center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col gap-2 w-full max-w-sm px-4">
          <AnimatePresence>
            {notifications.slice(0, 1).map((notif, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="bg-slate-900/95 border border-emerald-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-2.5 pointer-events-auto ring-1 ring-emerald-500/10"
              >
                <div className="bg-emerald-500/15 p-1 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 animate-bounce" />
                </div>
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-emerald-400 block mb-0.5">Realtime DB Signal</span>
                  <p className="text-slate-300 font-medium leading-relaxed">{notif.replace(/^[💻📲👤🛒🎟️🔔⚡👨‍🍳🔥🍽️✅❌🏁]/, '')}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Content routing */}
        {currentRole === 'split' ? (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
            {/* Left Hand: iOS Device Frame Mockup */}
            <div className="w-full lg:w-[420px] xl:w-[460px] bg-[#0c0d12] flex items-center justify-center p-4 overflow-y-auto min-h-[500px] lg:min-h-0">
              <div className="w-full max-w-[375px] aspect-[9/19] bg-black rounded-[48px] border-[10px] border-[#222533] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden ring-1 ring-slate-800">
                {/* iPhone notch pill */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black w-24 h-5 rounded-full z-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2 border border-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111]" />
                </div>
                {/* iOS Bar indicators */}
                <div className="h-10 bg-black pt-5 px-6 flex justify-between text-[10px] text-slate-400 font-mono font-bold select-none z-40 shrink-0">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-4 h-2 bg-slate-400 rounded-sm" />
                  </div>
                </div>
                {/* Main Inside Web App */}
                <div className="flex-1 bg-slate-900 overflow-hidden relative flex flex-col">
                  {customerElement}
                </div>
              </div>
            </div>

            {/* Right Hand: Staff Board Console (Desktop mockup) */}
            <div className="flex-1 bg-[#090a0f] flex flex-col overflow-hidden">
              <div className="bg-[#11131e]/40 px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                  <span>STAFF TERMINAL & BUSINESS CONTROLLER</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    REALTIME LISTENER CONNECTED
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {staffElement}
              </div>
            </div>
          </div>
        ) : currentRole === 'customer' ? (
          <div className="flex-1 bg-[#090a0f] flex justify-center p-0 md:p-6 overflow-y-auto">
            {/* Center phone frame on desktop, fill on mobile */}
            <div className="w-full max-w-[420px] bg-slate-950 md:rounded-[36px] md:border-8 md:border-[#222533] md:shadow-2xl relative flex flex-col overflow-hidden md:h-[840px] my-auto">
              <div className="flex-1 overflow-hidden relative flex flex-col">
                {customerElement}
              </div>
            </div>
          </div>
        ) : currentRole === 'staff' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {staffElement}
          </div>
        ) : currentRole === 'admin' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {adminElement}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {superAdminElement}
          </div>
        )}
      </main>

      {/* QR Scanner Dialog */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#11131e] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden relative"
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scanning Mode Toggle Tabs */}
            <div className="flex bg-[#161928] p-1 border border-slate-800 rounded-xl mb-5">
              <button
                onClick={() => setQrScanMode('preset')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  qrScanMode === 'preset' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Preset Tables</span>
              </button>
              <button
                onClick={() => setQrScanMode('camera')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  qrScanMode === 'camera' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera</span>
              </button>
            </div>

            {qrScanMode === 'camera' ? (
              <QrCameraScanner
                tables={tables}
                branches={branches}
                restaurants={restaurants}
                onScanComplete={(restaurantId, branchId, tableId) => {
                  customerScanQR(restaurantId, branchId, tableId);
                  setIsQrModalOpen(false);
                  if (currentRole !== 'split' && currentRole !== 'customer') {
                    setCurrentRole('split');
                  }
                }}
                onClose={() => setIsQrModalOpen(false)}
              />
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="bg-amber-500/10 p-3.5 rounded-full border border-amber-500/20 text-amber-400 mb-3">
                    <QrCode className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white leading-snug">QR Code Auto-Detection</h3>
                  <p className="text-xs text-slate-400 mt-1">Select a table position to simulate an instant QR scan action.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-mono font-medium block mb-1.5">1. Select Restaurant Tenant</label>
                    <div className="grid grid-cols-1 gap-2">
                      {restaurants.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setQrRestId(r.id);
                            // Auto update branch and tables matching
                            const rBranch = branches.find((b) => b.restaurantId === r.id);
                            if (rBranch) {
                              setQrBranchId(rBranch.id);
                              const rTable = tables.find((t) => t.branchId === rBranch.id);
                              if (rTable) setQrTableId(rTable.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            qrRestId === r.id
                              ? 'bg-amber-500/10 border-amber-500 text-white'
                              : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block">{r.name}</span>
                            <span className="text-[10px] text-slate-400">{r.cuisine}</span>
                          </div>
                          {r.status === RestaurantStatus.SUSPENDED && (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] px-1.5 py-0.5 rounded font-bold">
                              Suspended
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-mono font-medium block mb-1.5">2. Branch</label>
                      <select
                        value={qrBranchId}
                        onChange={(e) => {
                          setQrBranchId(e.target.value);
                          const bTable = tables.find((t) => t.branchId === e.target.value);
                          if (bTable) setQrTableId(bTable.id);
                        }}
                        className="w-full bg-[#181a27] border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      >
                        {branches
                          .filter((b) => b.restaurantId === qrRestId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-mono font-medium block mb-1.5">3. Select Table</label>
                      <select
                        value={qrTableId}
                        onChange={(e) => setQrTableId(e.target.value)}
                        className="w-full bg-[#181a27] border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      >
                        {tables
                          .filter((t) => t.branchId === qrBranchId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              Table {t.tableNumber} (Seats {t.seatingCapacity}) - {t.status.toUpperCase()}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => setIsQrModalOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSimulateScan}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg hover:shadow-amber-500/20 cursor-pointer"
                  >
                    Simulate Scanned QR
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Realtime Terminal Log Drawer */}
      <AnimatePresence>
        {showLogDrawer && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="absolute inset-0" onClick={() => setShowLogDrawer(false)} />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 h-full bg-[#11131e] border-l border-slate-800 p-4 relative flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>PLATFORM SIGNALS LOG</span>
                </div>
                <button
                  onClick={() => setShowLogDrawer(false)}
                  className="text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 text-slate-300 pr-1">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
                    <Database className="w-8 h-8 opacity-25 mb-2" />
                    <span>No database events yet.</span>
                    <p className="text-[9px] text-slate-600 mt-1">Submit orders or triggers to log operations.</p>
                  </div>
                ) : (
                  notifications.map((notif, index) => (
                    <div key={index} className="border-b border-slate-900 pb-2">
                      <span className="text-slate-500 text-[9px] block">
                        {new Date().toLocaleTimeString()}
                      </span>
                      <p className="leading-normal mt-0.5">{notif}</p>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white font-semibold py-2 rounded-lg text-xs font-mono cursor-pointer mt-3"
                >
                  Clear Terminal Logs
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
