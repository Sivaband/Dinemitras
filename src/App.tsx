/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppState, AppStateProvider } from './state';
import CustomerApp from './components/CustomerApp';
import StaffConsole from './components/StaffConsole';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AuthPortal from './components/AuthPortal';
import { UserRole } from './types';
import { 
  Laptop, 
  Smartphone, 
  Layers, 
  LogIn, 
  Store, 
  ChevronRight, 
  ChefHat, 
  ShieldCheck,
  Zap,
  LogOut,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { 
    currentUser, 
    logout, 
    notifications, 
    clearNotifications,
    selectedRestaurantId,
    restaurants,
    tables,
    branches,
    activeSession,
    customerScanQR,
    staffSubRole,
    setStaffSubRole
  } = useAppState();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState(null, '', newPath);
    setPath(newPath);
  };

  const isMenuRoute = path.startsWith('/menu/');
  const isCustomerRoute = isMenuRoute || path === '/customer' || path === '/order-status';

  // Parse table / restaurant IDs on customer QR routes
  useEffect(() => {
    if (path.startsWith('/menu/')) {
      const parts = path.substring(6).split('/');
      if (parts.length >= 2) {
        const restId = parts[0];
        let branchId = '';
        let tblId = '';

        if (parts.length >= 3) {
          branchId = parts[1];
          tblId = parts[2];
        } else {
          tblId = parts[1];
          const tbl = tables.find((t) => t.id === tblId);
          branchId = tbl ? tbl.branchId : (branches.find((b) => b.restaurantId === restId)?.id || 'branch_1a');
        }

        if (restId && tblId) {
          if (!activeSession || activeSession.tableId !== tblId || activeSession.restaurantId !== restId) {
            customerScanQR(restId, branchId, tblId);
          }
        }
      }
    }
  }, [path, tables, branches, activeSession, customerScanQR]);

  // Redirect unauthenticated users from dashboard routes to login
  useEffect(() => {
    const isDashboardRoute = [
      '/dashboard', '/orders', '/menu', '/tables', '/analytics', '/offers', '/coupons', '/banners', '/settings'
    ].includes(path);
    
    if (!currentUser && isDashboardRoute) {
      navigate('/login');
    }
  }, [currentUser, path]);

  // Redirect authenticated users from public routes to dashboard
  useEffect(() => {
    const isPublicRoute = ['/', '/login', '/register', '/forgot-password'].includes(path);
    if (currentUser && isPublicRoute) {
      navigate('/dashboard');
    }
  }, [currentUser, path]);

  // Sync Staff subrole with pathname based on authorized permissions
  useEffect(() => {
    if (currentUser && [UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN, UserRole.WAITER, UserRole.RESTAURANT_ADMIN].includes(currentUser.role)) {
      const authorized = currentUser.authorizedModules || [];
      if (path === '/orders') {
        if (authorized.includes('kitchen') && staffSubRole !== 'kitchen' && staffSubRole !== 'waiter') {
          setStaffSubRole('kitchen');
        } else if (authorized.includes('waiter') && !authorized.includes('kitchen')) {
          setStaffSubRole('waiter');
        }
      } else if (path === '/tables') {
        if (authorized.includes('cashier') && staffSubRole !== 'cashier') {
          setStaffSubRole('cashier');
        }
      } else if ((path === '/dashboard' || path === '/analytics') && staffSubRole !== 'dashboard') {
        if (authorized.includes('dashboard')) {
          setStaffSubRole('dashboard');
        }
      }
    }
  }, [path, currentUser, staffSubRole, setStaffSubRole]);

  const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];

  // Map logged-in role to the appropriate console/dashboard element
  const renderRoleDashboard = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard />;
      case UserRole.RESTAURANT_ADMIN:
        return <AdminDashboard />;
      case UserRole.MANAGER:
      case UserRole.CASHIER:
      case UserRole.KITCHEN:
      case UserRole.WAITER:
        return <StaffConsole />;
      case UserRole.CUSTOMER_GUEST:
      default:
        return <CustomerApp />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans antialiased overflow-hidden selection:bg-amber-500/20 selection:text-amber-400">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col gap-2 w-full max-w-sm px-4">
        <AnimatePresence>
          {notifications.slice(0, 1).map((notif, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/95 border border-emerald-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-2.5 pointer-events-auto ring-1 ring-emerald-500/10"
            >
              <div className="bg-emerald-500/15 p-1 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                <Zap className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 text-xs">
                <span className="font-semibold text-emerald-400 block mb-0.5">DB Signal Event</span>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {notif.replace(/^[💻📲👤🛒🎟️🔔⚡👨‍🍳🔥🍽️✅❌🏁]/, '')}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Conditional Layout Routing */}
      {currentUser ? (
        // LOGGED-IN EXPERIENCE (Full screen, no simulators)
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Subtle responsive bar for branding & logout */}
          <header className="bg-[#11131e]/90 border-b border-slate-800/60 px-4 py-2 flex items-center justify-between shrink-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-1.5 rounded-lg shadow">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-xs tracking-tight text-white block">Sizzlr QR Console</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  Logged in as {currentUser.fullName} ({currentUser.role.replace('_', ' ')})
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition active:scale-95"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </header>

          <div className="flex-1 overflow-hidden relative flex flex-col">
            {renderRoleDashboard()}
          </div>
        </div>
      ) : (
        // NOT LOGGED-IN EXPERIENCE
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {isCustomerRoute ? (
            // CUSTOMER ROUTE: Renders CustomerApp directly in full screen
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Subtle top banner promoting staff login discretely */}
              <div className="bg-[#11131e] border-b border-slate-800/60 px-4 py-2 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-400 font-medium">Digital Table Ordering System</span>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1 text-[10px] bg-slate-800 text-amber-400 hover:text-white px-2 py-1 rounded border border-slate-700 font-bold transition cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Staff Portal</span>
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative flex flex-col">
                <CustomerApp />
              </div>
            </div>
          ) : (
            // PUBLIC AUTH ROUTES: Renders clean AuthPortal in full screen (no simulator/previews)
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
              <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-[10px] font-mono text-slate-400 font-semibold shrink-0 select-none">
                <span className="text-slate-300">MERCHANT & PLATFORM STAFF REGISTRATION & SIGN IN</span>
                <span className="text-slate-500">SECURE SSL TERMINAL</span>
              </div>
              <div className="flex-1">
                <AuthPortal />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
