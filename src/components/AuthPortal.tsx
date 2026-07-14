/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppState } from '../state';
import { UserRole } from '../types';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  MapPin,
  QrCode,
  ChevronRight,
  Check,
  AlertCircle,
  Sparkles,
  Shield,
  Briefcase,
  Layers,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthPortalProps {
  initialRequestedRole?: 'superadmin' | 'admin' | 'staff';
}

export default function AuthPortal({ initialRequestedRole }: AuthPortalProps) {
  const {
    currentUser,
    login,
    signup,
    logout,
    verifyOnboardingEmail,
    onboardingSetupRestaurant,
    onboardingSetupBranch
  } = useAppState();

  const getInitialMode = (): 'login' | 'signup' | 'forgot' => {
    const path = window.location.pathname;
    if (path === '/register') return 'signup';
    if (path === '/forgot-password') return 'forgot';
    return 'login';
  };

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(getInitialMode);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/register') setMode('signup');
      else if (path === '/forgot-password') setMode('forgot');
      else if (path === '/' || path === '/login') setMode('login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regRestaurantName, setRegRestaurantName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regGst, setRegGst] = useState('');
  const [regError, setRegError] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Onboarding Form States
  const [onbCuisine, setOnbCuisine] = useState('Multi-cuisine');
  const [onbLogo, setOnbLogo] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=60');
  const [onbDesc, setOnbDesc] = useState('Crafted recipes made with premium fresh ingredients.');
  
  const [onbBranchName, setOnbBranchName] = useState('');
  const [onbBranchAddress, setOnbBranchAddress] = useState('');
  const [onbBranchPhone, setOnbBranchPhone] = useState('+91 96*******84');

  const [onbTableCount, setOnbTableCount] = useState(8);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [onbError, setOnbError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regOwnerName || !regRestaurantName || !regEmail || !regPhone || !regPassword) {
      setRegError('Please fill in all required fields.');
      return;
    }
    const res = await signup({
      restaurantName: regRestaurantName,
      ownerName: regOwnerName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      businessAddress: regAddress,
      gstNumber: regGst
    });
    if (!res.success) {
      setRegError(res.error || 'Registration failed');
    }
  };

  // Helper to pre-populate login form for easy demo testing
  const useCredentialPreset = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setMode('login');
  };

  // If currentUser is logged in, but hasn't completed onboarding, show Onboarding steps
  if (currentUser && currentUser.onboardingStep < 5) {
    const step = currentUser.onboardingStep;
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 md:p-12 font-sans">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-semibold block mb-1">
                Step {step} of 3 • Tenant Provisioning
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Onboarding Brand Owner</h2>
            </div>
            <button
              onClick={logout}
              className="text-xs bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-700/60 cursor-pointer transition"
            >
              Log Out
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s < step
                      ? 'bg-emerald-500'
                      : s === step
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                />
                <span className="text-[9px] text-center font-mono uppercase font-semibold tracking-wider text-slate-500 hidden sm:inline">
                  {s === 1 ? 'Verify Email' : s === 2 ? 'Tenant Setup' : 'Add Branch & Finish'}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Simulated Email Verification */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 shrink-0 mt-0.5">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-sm">Verify your business email</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    We sent a mock validation email to <strong className="text-slate-200">{currentUser.email}</strong> to activate your multi-tenant sandbox profile.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mb-2">Simulated Outbox Preview</span>
                  <div className="text-xs text-slate-400 text-left border-t border-slate-800/80 pt-2 space-y-1">
                    <p><strong className="text-slate-300">From:</strong> auth@sizzlr-saas.com</p>
                    <p><strong className="text-slate-300">To:</strong> {currentUser.email}</p>
                    <p><strong className="text-slate-300">Subject:</strong> Verify your restaurant account</p>
                    <p className="mt-3 text-slate-300 italic">"Welcome to Sizzlr! Click the button below to verify your email and unlock your brand dashboard."</p>
                  </div>
                </div>

                <button
                  onClick={verifyOnboardingEmail}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-3 px-4 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all duration-200"
                >
                  <span>Verify Email Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Restaurant Tenant Creation */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Now let's configure your central restaurant cloud tenant details. This establishes your default branding, cuisine, and taxation structure.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Restaurant Brand Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={regRestaurantName}
                      onChange={(e) => setRegRestaurantName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                      placeholder="e.g. Sizzling Charcoal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                      Primary Cuisine
                    </label>
                    <input
                      type="text"
                      value={onbCuisine}
                      onChange={(e) => setOnbCuisine(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                      placeholder="e.g. BBQ & Steaks"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                      Brand Logo URL
                    </label>
                    <input
                      type="text"
                      value={onbLogo}
                      onChange={(e) => setOnbLogo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Description / Slogan
                  </label>
                  <textarea
                    rows={2}
                    value={onbDesc}
                    onChange={(e) => setOnbDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                  />
                </div>

                {onbError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs text-center font-medium">
                    {onbError}
                  </div>
                )}

                <button
                  disabled={isSettingUp}
                  onClick={async () => {
                    setIsSettingUp(true);
                    setOnbError('');
                    try {
                      const res = await onboardingSetupRestaurant({
                        name: regRestaurantName,
                        cuisine: onbCuisine,
                        logo: onbLogo,
                        description: onbDesc
                      });
                      if (res && !res.success) {
                        setOnbError(res.error || 'Failed to setup restaurant tenant.');
                      }
                    } catch (err: any) {
                      setOnbError(err.message || 'An unexpected error occurred.');
                    } finally {
                      setIsSettingUp(false);
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-3 px-4 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all duration-200 ${isSettingUp ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{isSettingUp ? 'Provisioning Tenant...' : 'Provision Restaurant Tenant'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Branch Creation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Sizzlr is natively multi-branch! Let's set up your first physical branch location where digital QR ordering will be active.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Branch Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={onbBranchName}
                      onChange={(e) => setOnbBranchName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                      placeholder="e.g. Downtown Bistro"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={onbBranchAddress}
                      onChange={(e) => setOnbBranchAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Branch Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={onbBranchPhone}
                      onChange={(e) => setOnbBranchPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                {onbError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs text-center font-medium">
                    {onbError}
                  </div>
                )}

                <button
                  disabled={isSettingUp}
                  onClick={async () => {
                    setIsSettingUp(true);
                    setOnbError('');
                    try {
                      const res = await onboardingSetupBranch(onbBranchName, onbBranchAddress, onbBranchPhone);
                      if (res && !res.success) {
                        setOnbError(res.error || 'Failed to register branch.');
                      }
                    } catch (err: any) {
                      setOnbError(err.message || 'An unexpected error occurred.');
                    } finally {
                      setIsSettingUp(false);
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-3 px-4 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all duration-200 ${isSettingUp ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{isSettingUp ? 'Registering Outlet...' : 'Register Outlet & Branch'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-y-auto">
      {/* Left side: Premium Branding & Quick Preset Credentials */}
      <div className="w-full md:w-[42%] bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800/80 p-6 md:p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
        <div className="absolute top-1/2 -left-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-2 rounded-xl shadow-lg ring-1 ring-white/10">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">Sizzlr QR SaaS</span>
              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">Multi-Tenant Console</p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
              Instant Digital Dining Infrastructure
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Log in to access branch-specific digital menus, manage orders in real-time, generate secure QR codes, or simulate instant staff kitchen alerts.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold block mb-1">
              Secure Cloud Access
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Use your registered credentials to log in. Multi-tenant partitioning ensures secure role-based isolation of your menus, reports, and staff terminals.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Login & Sign Up Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          {/* Tabs for Login / Register */}
          {mode !== 'forgot' && (
            <div className="flex border-b border-slate-800 mb-6">
              <button
                onClick={() => {
                  window.history.pushState(null, '', '/login');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className={`flex-1 pb-3 text-sm font-semibold tracking-tight transition cursor-pointer relative ${
                  mode === 'login' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Login Portal</span>
                {mode === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button>
              {/* <button
                onClick={() => {
                  window.history.pushState(null, '', '/register');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className={`flex-1 pb-3 text-sm font-semibold tracking-tight transition cursor-pointer relative ${
                  mode === 'signup' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Register Brand</span>
                {mode === 'signup' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button> */}
            </div>
          )}

          {mode === 'forgot' ? (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center pb-2 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400 mt-1">Enter your registered email to receive simulated instructions.</p>
              </div>

              {forgotSent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Instructions Sent!</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    A password recovery email was successfully simulated to <strong className="text-white">{forgotEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSent(false);
                      setForgotEmail('');
                      window.history.pushState(null, '', '/login');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className="text-amber-500 font-bold hover:underline block mt-2 text-left cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                      Registered Business Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition animate-none"
                        placeholder="name@business.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition duration-200 mt-2 text-xs"
                  >
                    Send Reset Link
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState(null, '', '/login');
                        window.dispatchEvent(new Event('popstate'));
                      }}
                      className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
                    >
                      Back to <span className="text-amber-500 font-bold hover:underline">Login Portal</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="name@business.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      window.history.pushState(null, '', '/forgot-password');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className="text-[10px] text-amber-500 hover:underline font-bold cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition duration-200 mt-2 text-xs"
              >
                Login
              </button>

              <div className="border-t border-slate-800/80 pt-4 mt-4 text-center space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState(null, '', '/register');
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="text-xs text-slate-400 hover:text-white font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer bg-transparent border-none"
                >
                  <span>New owner?</span>
                  <span className="text-amber-500 font-bold hover:underline">Create Restaurant Account</span>
                </button>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      window.history.pushState(null, '', '/customer');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className="text-[11px] text-amber-500/80 hover:text-amber-400 font-bold bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    Go to Guest Ordering App
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* SIGN UP / REGISTER FORM */
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Restaurant Brand Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regRestaurantName}
                    onChange={(e) => setRegRestaurantName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="e.g. Spice & Coal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="owner@brand.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="+91 **********"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="Address, City"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    GST/Tax ID
                  </label>
                  <input
                    type="text"
                    value={regGst}
                    onChange={(e) => setRegGst(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="GSTIN1234"
                  />
                </div>
              </div>

              {regError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{regError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition duration-200 mt-2"
              >
                Register & Setup Sandbox Tenant
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
