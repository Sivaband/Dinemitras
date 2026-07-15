/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../state';
import {
  TrendingUp,
  Sliders,
  Store,
  QrCode,
  FolderPlus,
  Plus,
  Trash2,
  Settings,
  Star,
  PlusCircle,
  Folder,
  UtensilsCrossed,
  Tag,
  Check,
  Percent,
  ChevronRight,
  Printer,
  X,
  Sparkles,
  Download,
  Edit,
  Users,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  FileText,
  Search,
  Key,
  Building2,
  Briefcase,
  Lock,
  Mail,
  Phone,
  Shield,
  Image,
  MapPin
} from 'lucide-react';
import {
  RevenueChart,
  PopularItemsChart,
  CategoryShareChart,
  PeakHoursChart
} from './DashboardCharts';
import { Restaurant, MenuCategory, MenuItem, Coupon, Banner, UserRole, formatIndianCurrency, RestaurantTable, TableStatus } from '../types';
import AuthPortal from './AuthPortal';
import { useEmployeeViewModel } from '../viewmodels/EmployeeViewModel';
import { APP_CONFIG } from '../config/app';

export default function AdminDashboard() {
  const {
    restaurants,
    menuCategories,
    menuItems,
    orders,
    coupons,
    banners,
    tables,
    selectedRestaurantId,
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
    branches,
    addSystemNotification,
    setSelectedRestaurantId,
    currentUser,
    logout,
    adminUpdateBillingSettings,
    users,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember
  } = useAppState();

  if (!currentUser || currentUser.role !== UserRole.RESTAURANT_ADMIN || currentUser.onboardingStep < 5) {
    return <AuthPortal initialRequestedRole="admin" />;
  }

  const getInitialTab = (): 'analytics' | 'branches' | 'menu' | 'qr' | 'staff' | 'offers' | 'settings' => {
    const path = window.location.pathname;
    if (path === '/branches') return 'branches';
    if (path === '/menu') return 'menu';
    if (path === '/tables') return 'qr';
    if (path === '/staff') return 'staff';
    if (path === '/offers' || path === '/coupons' || path === '/banners') return 'offers';
    if (path === '/settings') return 'settings';
    return 'analytics';
  };

  const [activeTab, setActiveTab] = useState<'analytics' | 'branches' | 'menu' | 'qr' | 'staff' | 'offers' | 'settings'>(getInitialTab);

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/branches') setActiveTab('branches');
      else if (path === '/menu') setActiveTab('menu');
      else if (path === '/tables') setActiveTab('qr');
      else if (path === '/staff') setActiveTab('staff');
      else if (path === '/offers' || path === '/coupons' || path === '/banners') setActiveTab('offers');
      else if (path === '/settings') setActiveTab('settings');
      else if (path === '/dashboard' || path === '/analytics') setActiveTab('analytics');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const {
    employees,
    loading: employeeLoading,
    error: employeeError,
    successMessage: employeeSuccess,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus
  } = useEmployeeViewModel();

  React.useEffect(() => {
    if (activeTab === 'staff') {
      fetchEmployees();
    }
  }, [activeTab, selectedRestaurantId, fetchEmployees]);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');

  // Menu Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemIsPopular, setNewItemIsPopular] = useState(false);
  const [newItemIsSpecial, setNewItemIsSpecial] = useState(false);
  const [newItemPrepTime, setNewItemPrepTime] = useState('10');
  const [newItemImage, setNewItemImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80');

  // Coupon Form State
  const [newCpnCode, setNewCpnCode] = useState('');
  const [newCpnPercent, setNewCpnPercent] = useState('');
  const [newCpnFlat, setNewCpnFlat] = useState('');
  const [newCpnMin, setNewCpnMin] = useState('15');

  // Table Management State Additions
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [viewingQrTable, setViewingQrTable] = useState<RestaurantTable | null>(null);
  const [selectedTableBranchFilter, setSelectedTableBranchFilter] = useState<string>('all');

  // Table Form Fields
  const [tableFormNumber, setTableFormNumber] = useState('');
  const [tableFormCapacity, setTableFormCapacity] = useState('4');
  const [tableFormBranch, setTableFormBranch] = useState('');
  const [tableFormStatus, setTableFormStatus] = useState<TableStatus>(TableStatus.AVAILABLE);
  const [tableFormIsActive, setTableFormIsActive] = useState(true);
  const [tableFormError, setTableFormError] = useState('');

  // Local Brand color customizers
  const [isUpdatingColors, setIsUpdatingColors] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Staff Management State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffBranchFilter, setStaffBranchFilter] = useState('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState('all');

  // Branch Management State
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [isDeleteBranchConfirmOpen, setIsDeleteBranchConfirmOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Form fields for Branch
  const [branchFormName, setBranchFormName] = useState('');
  const [branchFormAddress, setBranchFormAddress] = useState('');
  const [branchFormPhone, setBranchFormPhone] = useState('');
  const [branchFormIsActive, setBranchFormIsActive] = useState(true);
  const [branchFormError, setBranchFormError] = useState('');

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteStaffConfirmOpen, setIsDeleteStaffConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Form fields for Add Staff
  const [staffFormFullName, setStaffFormFullName] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormMobile, setStaffFormMobile] = useState('');
  const [staffFormPassword, setStaffFormPassword] = useState('');
  const [staffFormConfirmPassword, setStaffFormConfirmPassword] = useState('');
  const [staffFormBranch, setStaffFormBranch] = useState('');
  const [staffFormRole, setStaffFormRole] = useState('waiter');
  const [staffFormStatus, setStaffFormStatus] = useState<'active' | 'inactive'>('active');
  const [staffFormError, setStaffFormError] = useState('');

  // Form fields for Edit Staff
  const [editStaffFullName, setEditStaffFullName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffMobile, setEditStaffMobile] = useState('');
  const [editStaffBranch, setEditStaffBranch] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('waiter');
  const [editStaffStatus, setEditStaffStatus] = useState<'active' | 'inactive'>('active');
  const [editStaffError, setEditStaffError] = useState('');

  // Form fields for Password Reset
  const [resetStaffNewPassword, setResetStaffNewPassword] = useState('');
  const [resetStaffConfirmPassword, setResetStaffConfirmPassword] = useState('');
  const [resetStaffError, setResetStaffError] = useState('');

  // Password visibility states
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [showStaffConfirmPassword, setShowStaffConfirmPassword] = useState(false);
  const [showResetStaffPassword, setShowResetStaffPassword] = useState(false);
  const [showResetStaffConfirmPassword, setShowResetStaffConfirmPassword] = useState(false);

  // Offers and Banners UI states
  const [offersSubTab, setOffersSubTab] = useState<'coupons' | 'banners'>('coupons');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerType, setBannerType] = useState<'promo' | 'special' | 'event'>('promo');
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const activeRest = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0] || ({
    id: selectedRestaurantId,
    name: 'Loading...',
    description: '',
    cuisine: 'Multi-Cuisine',
    rating: 5,
    logo: '',
    banner: '',
    address: '',
    status: 'approved',
    plan: 'Free',
    primaryColor: '#1e1b18',
    accentColor: '#d4af37',
    currency: '₹',
    gstPercent: 5,
    serviceChargePercent: 5,
    phone: '',
    email: '',
    businessHours: '11:00 AM - 11:00 PM',
    receiptHeader: 'Thank you!',
    receiptFooter: 'Visit again!',
    autoPrint: false,
    printerType: 'thermal_80mm',
    receiptWidth: '80mm',
    logoUrl: '',
    gstin: '',
    fssai: ''
  } as Restaurant);
  const restBranches = branches.filter((b) => b.restaurantId === activeRest.id);
  const restStaff = employees;
  const filteredStaff = restStaff.filter((s) => {
    const matchQuery =
      s.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
    
    const matchRole = staffRoleFilter === 'all' || s.role === staffRoleFilter;
    const matchBranch = staffBranchFilter === 'all' || s.branchId === staffBranchFilter;
    const matchStatus =
      staffStatusFilter === 'all' ||
      (staffStatusFilter === 'active' && s.status !== 'inactive') ||
      (staffStatusFilter === 'inactive' && s.status === 'inactive');

    return matchQuery && matchRole && matchBranch && matchStatus;
  });

  // Billing and Receipt Settings State
  const [billingGst, setBillingGst] = useState(activeRest?.gstPercent || 5);
  const [billingServiceCharge, setBillingServiceCharge] = useState(activeRest?.serviceChargePercent || 5);
  const [billingHeader, setBillingHeader] = useState(activeRest?.receiptHeader || 'Thank you for dining with us!');
  const [billingFooter, setBillingFooter] = useState(activeRest?.receiptFooter || 'Visit again! Dev by Sizzlr POS');
  const [billingAutoPrint, setBillingAutoPrint] = useState(activeRest?.autoPrint || false);
  const [billingPrinterType, setBillingPrinterType] = useState(activeRest?.printerType || 'thermal_80mm');
  const [billingReceiptWidth, setBillingReceiptWidth] = useState(activeRest?.receiptWidth || '80mm');
  const [billingCurrency, setBillingCurrency] = useState(activeRest?.currency || '₹');
  const [billingLogoUrl, setBillingLogoUrl] = useState(activeRest?.logoUrl || '');
  const [billingAddress, setBillingAddress] = useState(activeRest?.address || '');
  const [billingGstin, setBillingGstin] = useState(activeRest?.gstin || '');
  const [billingFssai, setBillingFssai] = useState(activeRest?.fssai || '');

  React.useEffect(() => {
    if (activeRest) {
      setBillingGst(activeRest.gstPercent || 5);
      setBillingServiceCharge(activeRest.serviceChargePercent || 5);
      setBillingHeader(activeRest.receiptHeader || 'Thank you for dining with us!');
      setBillingFooter(activeRest.receiptFooter || 'Visit again! Dev by Sizzlr POS');
      setBillingAutoPrint(activeRest.autoPrint || false);
      setBillingPrinterType(activeRest.printerType || 'thermal_80mm');
      setBillingReceiptWidth(activeRest.receiptWidth || '80mm');
      setBillingCurrency(activeRest.currency || '₹');
      setBillingLogoUrl(activeRest.logoUrl || '');
      setBillingAddress(activeRest.address || '');
      setBillingGstin(activeRest.gstin || '');
      setBillingFssai(activeRest.fssai || '');
    }
  }, [activeRest?.id]);
  const restCategories = menuCategories.filter((c) => c.restaurantId === selectedRestaurantId);
  const restMenu = menuItems.filter((i) => i.restaurantId === selectedRestaurantId);
  const restOrders = orders.filter((o) => o.restaurantId === selectedRestaurantId);
  const restCoupons = coupons.filter((c) => c.restaurantId === selectedRestaurantId);
  const restBanners = banners.filter((b) => b.restaurantId === selectedRestaurantId);

  // Active metrics
  const totalRevenue = restOrders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.totalAmount : 0), 0);
  const avgOrderVal = restOrders.length > 0 ? totalRevenue / restOrders.length : 0;
  
  // Custom print Table QR code layout
  const [selectedPrintTable, setSelectedPrintTable] = useState<any>(null);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    adminAddCategory({
      restaurantId: selectedRestaurantId,
      name: newCatName.trim(),
      icon: newCatIcon,
      sortOrder: restCategories.length + 1,
      isActive: true
    });
    setNewCatName('');
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    adminAddMenuItem({
      categoryId: newItemCategory || restCategories[0]?.id || 'cat_temp',
      restaurantId: selectedRestaurantId,
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      image: newItemImage,
      price: parseFloat(newItemPrice) || 10,
      isVeg: newItemIsVeg,
      isPopular: newItemIsPopular,
      isSpecial: newItemIsSpecial,
      isAvailable: true,
      prepTimeMinutes: parseInt(newItemPrepTime) || 10,
      variants: [],
      addons: []
    });
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCpnCode.trim()) return;
    adminAddCoupon({
      restaurantId: selectedRestaurantId,
      code: newCpnCode.trim().toUpperCase(),
      discountPercent: newCpnPercent ? parseInt(newCpnPercent) : undefined,
      discountFlat: newCpnFlat ? parseFloat(newCpnFlat) : undefined,
      minOrderAmount: parseFloat(newCpnMin) || 15,
      expiryDate: '2026-12-31'
    });
    setNewCpnCode('');
    setNewCpnPercent('');
    setNewCpnFlat('');
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) {
      setBannerError('Title is required');
      return;
    }
    const defaultImg = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
    adminAddBanner({
      restaurantId: selectedRestaurantId,
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      image: bannerImage.trim() || defaultImg,
      type: bannerType,
      isActive: bannerIsActive
    });
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImage('');
    setBannerType('promo');
    setBannerIsActive(true);
    setBannerError('');
  };

  const handleOpenEditBannerModal = (banner: Banner) => {
    setEditingBannerId(banner.id);
    setBannerTitle(banner.title);
    setBannerSubtitle(banner.subtitle);
    setBannerImage(banner.image);
    setBannerType(banner.type);
    setBannerIsActive(banner.isActive);
    setBannerError('');
    setIsBannerModalOpen(true);
  };

  const handleUpdateBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBannerId) return;
    if (!bannerTitle.trim()) {
      setBannerError('Title is required');
      return;
    }
    adminUpdateBanner(editingBannerId, {
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      image: bannerImage.trim(),
      type: bannerType,
      isActive: bannerIsActive
    });
    setIsBannerModalOpen(false);
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImage('');
    setBannerType('promo');
    setBannerIsActive(true);
    setBannerError('');
  };

  // Table Management Actions
  const handleOpenAddTableModal = () => {
    const resBranches = branches.filter((b) => b.restaurantId === selectedRestaurantId);
    setTableFormNumber('');
    setTableFormCapacity('4');
    setTableFormBranch(resBranches[0]?.id || '');
    setTableFormStatus(TableStatus.AVAILABLE);
    setTableFormIsActive(true);
    setTableFormError('');
    setIsAddingTable(true);
  };

  const handleOpenEditTableModal = (table: RestaurantTable) => {
    setTableFormNumber(table.tableNumber);
    setTableFormCapacity(table.seatingCapacity.toString());
    setTableFormBranch(table.branchId);
    setTableFormStatus(table.status);
    setTableFormIsActive(table.isActive !== false);
    setTableFormError('');
    setEditingTable(table);
  };

  const handleSubmitTableForm = (e: React.FormEvent) => {
    e.preventDefault();
    setTableFormError('');

    const trimmedNumber = tableFormNumber.trim();
    if (!trimmedNumber) {
      setTableFormError('Table name/number is required.');
      return;
    }

    const parsedCapacity = parseInt(tableFormCapacity);
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      setTableFormError('Seating capacity must be at least 1.');
      return;
    }

    let targetBranchId = tableFormBranch;
    const resBranches = branches.filter((b) => b.restaurantId === selectedRestaurantId);
    if (!targetBranchId && resBranches.length > 0) {
      targetBranchId = resBranches[0].id;
    }

    if (editingTable) {
      const res = adminUpdateTable(editingTable.id, {
        tableNumber: trimmedNumber,
        seatingCapacity: parsedCapacity,
        branchId: targetBranchId,
        status: tableFormStatus,
        isActive: tableFormIsActive,
      });

      if (res && !res.success) {
        setTableFormError(res.error || 'Failed to update table.');
        return;
      }

      setEditingTable(null);
    } else {
      const res = adminAddTable({
        restaurantId: selectedRestaurantId,
        branchId: targetBranchId,
        tableNumber: trimmedNumber,
        seatingCapacity: parsedCapacity,
        status: tableFormStatus,
        isActive: tableFormIsActive,
      });

      if (res && !res.success) {
        setTableFormError(res.error || 'Failed to add table.');
        return;
      }

      setIsAddingTable(false);
    }
  };

  const handleDeleteTable = (tableId: string) => {
    const tbl = tables.find((t) => t.id === tableId);
    if (window.confirm(`Are you sure you want to delete Table ${tbl?.tableNumber || ''}? This action is irreversible.`)) {
      adminDeleteTable(tableId);
      if (selectedPrintTable?.id === tableId) {
        setSelectedPrintTable(null);
      }
    }
  };

  const handleToggleTableActive = (table: RestaurantTable) => {
    const nextActive = table.isActive !== false;
    adminUpdateTable(table.id, { isActive: !nextActive });
  };

  const handleDownloadQR = async (table: RestaurantTable) => {
    try {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(table.qrUrl)}`;
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${activeRest.name.replace(/\s+/g, '_')}_Table_${table.tableNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      addSystemNotification('📥 QR code image downloaded successfully.');
    } catch (err) {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(table.qrUrl)}`, '_blank');
    }
  };

  const handlePrintQR = (table: RestaurantTable) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(table.qrUrl)}`;
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Card - Table ${table.tableNumber}</title>
            <style>
              @page {
                size: A5;
                margin: 0;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f8fafc;
                color: #1e293b;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
              }
              .card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                padding: 24px;
                width: 100%;
                max-width: 420px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                text-align: center;
                box-sizing: border-box;
              }
              .header {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
              }
              .logo {
                width: 56px;
                height: 56px;
                border-radius: 12px;
                object-fit: cover;
                border: 2px solid #e2e8f0;
              }
              .brand-name {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
                letter-spacing: -0.025em;
              }
              .brand-tagline {
                font-size: 11px;
                color: #64748b;
                margin: 0;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .table-badge {
                background: #0f172a;
                color: white;
                font-weight: 800;
                font-size: 14px;
                padding: 6px 16px;
                border-radius: 9999px;
                display: inline-block;
                margin-bottom: 16px;
                letter-spacing: 0.05em;
              }
              .qr-outer-container {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                border: 2px solid #e2e8f0;
                padding: 16px;
                border-radius: 20px;
                margin-bottom: 20px;
                position: relative;
              }
              .qr-img {
                display: block;
                width: 160px;
                height: 160px;
              }
              .qr-logo-overlay {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 4px;
                border-radius: 8px;
                border: 1.5px solid #e2e8f0;
              }
              .qr-logo-overlay img {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                display: block;
              }
              .instructions-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-top: 0;
                margin-bottom: 12px;
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 8px;
              }
              .steps-grid {
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 10px;
                text-align: left;
                margin-bottom: 16px;
              }
              .step-item {
                display: flex;
                align-items: flex-start;
                gap: 8px;
              }
              .step-icon {
                font-size: 14px;
                flex-shrink: 0;
                margin-top: 1px;
              }
              .step-text {
                font-size: 10px;
                line-height: 1.3;
                color: #334155;
              }
              .step-text strong {
                color: #0f172a;
              }
              .features-list {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 6px 12px;
                padding: 10px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px dashed #cbd5e1;
                margin-bottom: 16px;
              }
              .feature-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 9px;
                font-weight: 700;
                color: #475569;
              }
              .feature-check {
                color: #10b981;
                font-weight: 900;
              }
              .footer {
                font-size: 9px;
                color: #64748b;
                line-height: 1.4;
                border-top: 1px solid #f1f5f9;
                padding-top: 10px;
                margin-top: 12px;
              }
              .footer strong {
                color: #0f172a;
              }
              @media print {
                body {
                  background: white;
                  padding: 0;
                }
                .card {
                  box-shadow: none;
                  border: none;
                  max-width: 100%;
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                ${activeRest.logo ? `<img class="logo" src="${activeRest.logo}" alt="Logo" referrerPolicy="no-referrer" />` : ''}
                <h1 class="brand-name">${activeRest.name}</h1>
                <p class="brand-tagline">${activeRest.cuisine || 'Multi-Cuisine'} • Smart QR Menu</p>
              </div>

              <div class="table-badge">TABLE ${table.tableNumber}</div>

              <div>
                <div class="qr-outer-container">
                  <img class="qr-img" src="${qrUrl}" alt="QR Code" />
                  ${activeRest.logo ? `
                    <div class="qr-logo-overlay">
                      <img src="${activeRest.logo}" alt="" referrerPolicy="no-referrer" />
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="instructions-title">
                <span>📱 How to Order</span>
              </div>

              <div class="steps-grid">
                <div class="step-item">
                  <span class="step-icon">📷</span>
                  <div class="step-text"><strong>1. Scan QR</strong> with your phone camera.</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">👤</span>
                  <div class="step-text"><strong>2. Enter Name</strong> (mobile optional).</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">🍽</span>
                  <div class="step-text"><strong>3. Browse Menu</strong> digital selection.</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">🛒</span>
                  <div class="step-text"><strong>4. Add to Cart</strong> items of choice.</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">✅</span>
                  <div class="step-text"><strong>5. Place Order</strong> straight to kitchen.</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">👨‍🍳</span>
                  <div class="step-text"><strong>6. Track Order</strong> status in real-time.</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">➕</span>
                  <div class="step-text"><strong>7. Order More</strong> anytime during meal.</div>
                </div>
                <div class="step-item">
                  <span class="step-icon">🧾</span>
                  <div class="step-text"><strong>8. Request Bill</strong> ready to checkout.</div>
                </div>
              </div>

              <div class="features-list">
                <div class="feature-item"><span class="feature-check">✔</span> No App Required</div>
                <div class="feature-item"><span class="feature-check">✔</span> Works in Any Browser</div>
                <div class="feature-item"><span class="feature-check">✔</span> Secure Ordering</div>
                <div class="feature-item"><span class="feature-check">✔</span> Live Kitchen Updates</div>
                <div class="feature-item"><span class="feature-check">✔</span> Order More Anytime</div>
                <div class="feature-item"><span class="feature-check">✔</span> Running Bill</div>
                <div class="feature-item"><span class="feature-check">✔</span> Call Waiter</div>
                <div class="feature-item"><span class="feature-check">✔</span> Request Bill</div>
              </div>

              <div class="footer">
                <div>Thank you for dining with us ❤️</div>
                <div style="margin-top: 2px;">Powered by <strong>QR Restaurant Ordering System</strong></div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyQRLink = (table: RestaurantTable) => {
    navigator.clipboard.writeText(table.qrUrl);
    addSystemNotification(`📋 Copied QR Code URL for Table ${table.tableNumber} to clipboard!`);
  };

  const handleRegenerateQR = (table: RestaurantTable) => {
    const newQrUrl = `${APP_CONFIG.WEB_URL}/menu/${table.restaurantId}/${table.branchId}/${table.id}?refresh=${Date.now()}`;
    adminUpdateTable(table.id, { qrUrl: newQrUrl });
    addSystemNotification(`🔄 Regenerated QR Code for Table ${table.tableNumber}.`);
  };

  return (
    <div className="flex-1 bg-[#090a0f] text-slate-100 flex flex-col md:flex-row h-full overflow-hidden font-sans select-none">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-56 bg-[#11131e] border-b md:border-b-0 md:border-r border-slate-800 shrink-0 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
        <div className="hidden md:flex items-center gap-2 px-2 py-3 border-b border-slate-800/80 mb-4 shrink-0">
          <Store className="w-5 h-5 text-amber-400" />
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white leading-tight truncate">{activeRest.name}</h3>
            <span className="text-[10px] text-slate-500 font-mono">Bistro Portal</span>
          </div>
        </div>

        {[
          { id: 'analytics', label: 'Dashboard Live', icon: TrendingUp },
          { id: 'branches', label: 'Branch Hub', icon: MapPin },
          { id: 'menu', label: 'Menu & Food', icon: UtensilsCrossed },
          { id: 'qr', label: 'QR Generator', icon: QrCode },
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'offers', label: 'Offers & Coupons', icon: Tag },
          { id: 'settings', label: 'Brand Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedPrintTable(null);
              // Update browser address path
              let nextPath = '/dashboard';
              if (tab.id === 'branches') nextPath = '/branches';
              else if (tab.id === 'menu') nextPath = '/menu';
              else if (tab.id === 'qr') nextPath = '/tables';
              else if (tab.id === 'staff') nextPath = '/staff';
              else if (tab.id === 'offers') nextPath = '/offers';
              else if (tab.id === 'settings') nextPath = '/settings';
              window.history.pushState(null, '', nextPath);
              window.dispatchEvent(new Event('popstate'));
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}

        {/* Tenant Switcher at bottom of sidebar on desktop */}
        <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/80 space-y-3">
          <div>
            <label className="text-[9px] text-slate-500 font-mono font-medium block mb-1">SWITCH SIMULATED BRAND</label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-2 text-xs rounded-lg text-white"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] text-slate-300 block truncate font-semibold">{currentUser?.fullName}</span>
              <span className="text-[8px] text-amber-500 font-mono block">Brand Owner</span>
            </div>
            <button
              onClick={logout}
              className="text-[10px] bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 px-2 py-1 rounded-lg cursor-pointer transition shrink-0 font-bold"
            >
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Primary Dashboard Panel */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-none relative">
        
        {/* ======================================= */}
        {/* PANEL: BRANCH HUB */}
        {/* ======================================= */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">MANAGE MULTI-TENANT SITES</span>
                <h3 className="text-sm font-black text-white">Branch Hub</h3>
              </div>
              <button
                onClick={() => {
                  setBranchFormName('');
                  setBranchFormAddress('');
                  setBranchFormPhone('');
                  setBranchFormIsActive(true);
                  setBranchFormError('');
                  setIsAddBranchOpen(true);
                }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" />
                Add New Branch
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#11131e] border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase">TOTAL BRANCHES</span>
                <span className="text-xl font-black text-white mt-1 block">{branches.length}</span>
              </div>
              <div className="bg-[#11131e] border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase">TOTAL TABLES DEPLOYED</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {tables.filter((t) => branches.some((b) => b.id === t.branchId)).length}
                </span>
              </div>
              <div className="bg-[#11131e] border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase">ACTIVE STAFF ASSIGNED</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {users.filter((u) => branches.some((b) => b.id === u.branchId)).length}
                </span>
              </div>
            </div>

            {/* Branches List */}
            {branches.length === 0 ? (
              <div className="bg-[#11131e] border border-slate-850 rounded-2xl p-12 text-center">
                <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-300">No Branches Setup Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Create branches to map separate physical locations and route orders to designated staff terminals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => {
                  const branchTables = tables.filter((t) => t.branchId === branch.id);
                  const branchStaff = users.filter((u) => u.branchId === branch.id);
                  return (
                    <div key={branch.id} className="bg-[#11131e] border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-amber-500/10 p-2 rounded-xl">
                              <MapPin className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white leading-tight">{branch.name}</h4>
                              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">ID: {branch.id}</span>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              branch.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 font-sans text-xs">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Store className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate">{branch.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{branch.phone || 'No Phone Registered'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-850 font-mono text-[10px]">
                          <div className="bg-slate-950/40 p-2 rounded-lg text-center">
                            <span className="text-slate-500 block uppercase">Tables Deployed</span>
                            <span className="text-sm font-black text-slate-300 mt-1 block">{branchTables.length}</span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-lg text-center">
                            <span className="text-slate-500 block uppercase">Staff Assigned</span>
                            <span className="text-sm font-black text-slate-300 mt-1 block">{branchStaff.length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-850">
                        <button
                          onClick={() => {
                            setSelectedBranch(branch);
                            setBranchFormName(branch.name);
                            setBranchFormAddress(branch.address);
                            setBranchFormPhone(branch.phone || '');
                            setBranchFormIsActive(branch.isActive);
                            setBranchFormError('');
                            setIsEditBranchOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 bg-slate-850 hover:bg-slate-800 text-slate-200 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-none"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBranch(branch);
                            setIsDeleteBranchConfirmOpen(true);
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer border-none"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: LIVE ANALYTICS CHARTS */}
        {/* ======================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">RESTAURANT PERFORMANCE SUMMARY</span>
                <h3 className="text-sm font-black text-white">Live Brand Analytics</h3>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                {activeRest.plan} Plan
              </span>
            </div>

            {/* Micro Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Platform Volume', val: `$${totalRevenue.toFixed(2)}`, desc: `${restOrders.length} transactions` },
                { label: 'Average Ticket', val: `$${avgOrderVal.toFixed(2)}`, desc: 'Average order bill' },
                { label: 'Food Items', val: restMenu.length, desc: `${restCategories.length} categories active` },
                { label: 'Table Density', val: `${tables.filter((t) => t.restaurantId === selectedRestaurantId).length} tables`, desc: 'Active branches included' },
              ].map((metric, idx) => (
                <div key={idx} className="bg-[#11131e]/60 border border-slate-800/60 p-4 rounded-2xl shadow-md">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">{metric.label}</span>
                  <p className="text-xl font-extrabold mt-1 text-white">{metric.val}</p>
                  <p className="text-[9px] text-slate-500 mt-1">{metric.desc}</p>
                </div>
              ))}
            </div>

            {/* Recharts Render Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#11131e]/50 border border-slate-800/60 p-5 rounded-2xl shadow-md">
                <span className="text-xs font-extrabold text-slate-300 block mb-3 uppercase tracking-wide">Weekly Revenue Trend</span>
                <RevenueChart data={[]} color={activeRest.accentColor} />
              </div>

              <div className="bg-[#11131e]/50 border border-slate-800/60 p-5 rounded-2xl shadow-md">
                <span className="text-xs font-extrabold text-slate-300 block mb-3 uppercase tracking-wide">Popular Menu Items</span>
                <PopularItemsChart data={[]} color={activeRest.accentColor} />
              </div>

              <div className="bg-[#11131e]/50 border border-slate-800/60 p-5 rounded-2xl shadow-md">
                <span className="text-xs font-extrabold text-slate-300 block mb-3 uppercase tracking-wide">Menu Category Breakdown</span>
                <CategoryShareChart />
              </div>

              <div className="bg-[#11131e]/50 border border-slate-800/60 p-5 rounded-2xl shadow-md">
                <span className="text-xs font-extrabold text-slate-300 block mb-3 uppercase tracking-wide">Hourly Footfall Distribution</span>
                <PeakHoursChart />
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: MENU CATEGORIES & ITEMS BUILDER */}
        {/* ======================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">MANAGE PRODUCTS & CHIPS</span>
                <h3 className="text-sm font-black text-white">Interactive Menu Builder</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category CRUD column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#11131e]/60 border border-slate-800/60 p-5 rounded-2xl shadow-md">
                  <span className="text-xs font-extrabold text-slate-300 block mb-3 uppercase">Create Category</span>
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g., Starters, Cocktails"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 hover:text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                    >
                      Save Category
                    </button>
                  </form>
                </div>

                {/* List Categories */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-mono block font-bold uppercase tracking-wider">ACTIVE CATEGORIES</span>
                  {restCategories.map((c) => (
                    <div key={c.id} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-extrabold text-white">{c.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Sort #{c.sortOrder}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items CRUD and Directory */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-[#11131e]/60 border border-slate-800/60 p-5 rounded-2xl shadow-md">
                  <span className="text-xs font-extrabold text-slate-300 block mb-3 uppercase">Create Menu Item</span>
                  <form onSubmit={handleCreateMenuItem} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Item Title</label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g., Crispy Mozzarella Sticks"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Unit Base Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="e.g., 250"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Item Description</label>
                      <input
                        type="text"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        placeholder="Detailed recipe description"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Select Category Tag</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white"
                      >
                        {restCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Prep Time (Mins)</label>
                      <input
                        type="number"
                        value={newItemPrepTime}
                        onChange={(e) => setNewItemPrepTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Dish Photo URL</label>
                      <input
                        type="url"
                        value={newItemImage}
                        onChange={(e) => setNewItemImage(e.target.value)}
                        placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[9px] text-slate-500 uppercase font-mono font-bold mr-1">Suggestions:</span>
                        {[
                          { name: '🍲 Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80' },
                          { name: '🍗 Butter Chicken', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80' },
                          { name: '🧀 Paneer Tikka', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80' },
                          { name: '🥞 Dosa', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80' },
                          { name: '🥟 Samosa', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80' },
                        ].map((suggestion) => (
                          <button
                            key={suggestion.name}
                            type="button"
                            onClick={() => setNewItemImage(suggestion.url)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-[10px] text-slate-300 px-2 py-1 rounded-lg cursor-pointer transition-all"
                          >
                            {suggestion.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-2 py-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={newItemIsVeg}
                          onChange={(e) => setNewItemIsVeg(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>Is Vegetarian</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={newItemIsPopular}
                          onChange={(e) => setNewItemIsPopular(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>Is Bestseller</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={newItemIsSpecial}
                          onChange={(e) => setNewItemIsSpecial(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>Chef's Special</span>
                      </label>
                    </div>

                    <div className="col-span-2">
                      <button
                        type="submit"
                        className="w-full font-extrabold py-2.5 rounded-xl text-xs cursor-pointer text-slate-950"
                        style={{ backgroundColor: activeRest.accentColor }}
                      >
                        Save Food Item
                      </button>
                    </div>
                  </form>
                </div>

                {/* List food menu items in directory */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-mono block font-bold uppercase tracking-wider">PRODUCT DIRECTORY & STOCK STATES</span>
                  <div className="space-y-2">
                    {restMenu.map((item) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{formatIndianCurrency(item.price, activeRest.currency)}</p>
                          </div>
                        </div>

                        {/* Stock toggle */}
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${
                            item.isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <button
                            onClick={() => adminToggleItemAvailability(item.id)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-750 text-[10px] text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            Toggle State
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: TABLE MANAGEMENT & QR LABS      */}
        {/* ======================================= */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            {/* Header section with add table button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">TENANT OPERATIONS</span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <QrCode className="w-5.5 h-5.5 text-amber-400" />
                  <span>Table Management & Digital QRs</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure dining tables, track service statuses, and export high-contrast scan-to-order QR codes.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={selectedTableBranchFilter}
                  onChange={(e) => setSelectedTableBranchFilter(e.target.value)}
                  className="bg-[#11131e] border border-slate-800 hover:border-slate-750 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
                >
                  <option value="all">All Branches</option>
                  {branches
                    .filter((b) => b.restaurantId === selectedRestaurantId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <button
                  onClick={handleOpenAddTableModal}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-amber-500/10"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Table</span>
                </button>
              </div>
            </div>

            {/* Micro Dashboard Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#11131e] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Total Configured</span>
                <span className="text-xl font-black text-white block mt-1">
                  {tables.filter((t) => t.restaurantId === selectedRestaurantId).length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Tables registered</span>
              </div>

              <div className="bg-[#11131e] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Available Status</span>
                <span className="text-xl font-black text-emerald-400 block mt-1">
                  {tables.filter((t) => t.restaurantId === selectedRestaurantId && t.status === TableStatus.AVAILABLE).length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Ready for seating</span>
              </div>

              <div className="bg-[#11131e] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">In Service / Active</span>
                <span className="text-xl font-black text-amber-400 block mt-1">
                  {tables.filter((t) => t.restaurantId === selectedRestaurantId && t.status !== TableStatus.AVAILABLE).length}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Occupied, Reserve, Bill, Clean</span>
              </div>

              <div className="bg-[#11131e] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Seating Capacity</span>
                <span className="text-xl font-black text-indigo-400 block mt-1">
                  {tables
                    .filter((t) => t.restaurantId === selectedRestaurantId)
                    .reduce((acc, t) => acc + t.seatingCapacity, 0)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-sans">Total seating heads</span>
              </div>
            </div>

            {/* Table Cards Grid */}
            {tables.filter((t) => {
              if (t.restaurantId !== selectedRestaurantId) return false;
              if (selectedTableBranchFilter !== 'all' && t.branchId !== selectedTableBranchFilter) return false;
              return true;
            }).length === 0 ? (
              <div className="bg-[#11131e]/50 border border-slate-800 rounded-3xl p-12 text-center">
                <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-40 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">No tables matching this filter</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Get started by clicking the "Add Table" button at the top-right to register your first dining node.
                </p>
                <button
                  onClick={handleOpenAddTableModal}
                  className="mt-4 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Create Your First Table
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tables
                  .filter((t) => {
                    if (t.restaurantId !== selectedRestaurantId) return false;
                    if (selectedTableBranchFilter !== 'all' && t.branchId !== selectedTableBranchFilter) return false;
                    return true;
                  })
                  .map((tbl) => {
                    const branch = branches.find((b) => b.id === tbl.branchId);
                    const branchName = branch ? branch.name : 'Unknown Branch';
                    
                    // Table status styling mapping
                    let statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    if (tbl.status === TableStatus.OCCUPIED) {
                      statusColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                    } else if (tbl.status === TableStatus.RESERVED) {
                      statusColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                    } else if (tbl.status === TableStatus.BILL_REQUESTED) {
                      statusColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
                    } else if (tbl.status === TableStatus.CLEANING) {
                      statusColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                    }

                    const isDisabled = tbl.isActive === false;

                    return (
                      <div
                        key={tbl.id}
                        className={`bg-[#11131e] border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 shadow-md ${
                          isDisabled 
                            ? 'opacity-60 border-slate-900/60' 
                            : 'border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Table Header Row */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-white leading-tight flex items-center gap-1.5 truncate">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0"></span>
                              <span>Table {tbl.tableNumber}</span>
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium truncate block mt-0.5">
                              📍 {branchName}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${statusColor}`}>
                            {tbl.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Middle Spec Details */}
                        <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-300 font-mono border-t border-b border-slate-850/50 py-3">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>{tbl.seatingCapacity} Seats</span>
                          </div>
                          
                          <div className="h-4 w-px bg-slate-800"></div>

                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isDisabled ? 'bg-slate-600' : 'bg-emerald-500'}`}></span>
                            <span className="text-slate-400">
                              {isDisabled ? 'Disabled' : 'Scan Enabled'}
                            </span>
                          </div>
                        </div>

                        {/* Inline QR Thumbnail Preview Container */}
                        <div className="mt-4 flex items-center gap-3.5 bg-slate-900/40 rounded-xl p-2.5 border border-slate-850/30">
                          <div className="w-12 h-12 bg-white rounded-lg p-1.5 shrink-0 flex items-center justify-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(tbl.qrUrl)}`}
                              alt="QR code thumbnail"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase font-mono block">QR MENU URL</span>
                            <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{tbl.qrUrl}</p>
                          </div>
                        </div>

                        {/* Quick Action Footer Controls */}
                        <div className="mt-4 pt-3 border-t border-slate-850/50 flex flex-wrap items-center justify-between gap-2.5">
                          {/* Left toggle active */}
                          <button
                            onClick={() => handleToggleTableActive(tbl)}
                            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                              isDisabled
                                ? 'bg-slate-800 border-slate-750 text-slate-400 hover:bg-slate-700'
                                : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {isDisabled ? 'Enable QR' : 'Disable QR'}
                          </button>

                          {/* Action group */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditTableModal(tbl)}
                              title="Edit Table"
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg cursor-pointer border border-slate-800 hover:border-slate-750 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setViewingQrTable(tbl)}
                              title="View and Test QR"
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg cursor-pointer border border-slate-800 hover:border-slate-750 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadQR(tbl)}
                              title="Download QR Image (PNG)"
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg cursor-pointer border border-slate-800 hover:border-slate-750 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handlePrintQR(tbl)}
                              title="Print QR Tag"
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg cursor-pointer border border-slate-800 hover:border-slate-750 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteTable(tbl.id)}
                              title="Delete Table"
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg cursor-pointer border border-rose-500/10 hover:border-rose-500/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Modal: Add / Edit Table Form */}
            {(isAddingTable || editingTable) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[#11131e] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
                  <button
                    onClick={() => {
                      setIsAddingTable(false);
                      setEditingTable(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-base font-black text-white flex items-center gap-2 mb-4">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>{editingTable ? 'Edit Table Configuration' : 'Add New Dining Table'}</span>
                  </h3>

                  <form onSubmit={handleSubmitTableForm} className="space-y-4">
                    {tableFormError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
                        {tableFormError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Table Name/Number</label>
                      <input
                        type="text"
                        required
                        value={tableFormNumber}
                        onChange={(e) => setTableFormNumber(e.target.value)}
                        placeholder="e.g. Table 01, VIP Room 2"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Seating Capacity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={tableFormCapacity}
                          onChange={(e) => setTableFormCapacity(e.target.value)}
                          placeholder="e.g. 4"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Status</label>
                        <select
                          value={tableFormStatus}
                          onChange={(e) => setTableFormStatus(e.target.value as TableStatus)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value={TableStatus.AVAILABLE}>Available</option>
                          <option value={TableStatus.OCCUPIED}>Occupied</option>
                          <option value={TableStatus.RESERVED}>Reserved</option>
                          <option value={TableStatus.BILL_REQUESTED}>Bill Requested</option>
                          <option value={TableStatus.CLEANING}>Cleaning</option>
                        </select>
                      </div>
                    </div>

                    {branches.filter((b) => b.restaurantId === selectedRestaurantId).length > 1 && (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Assign Branch</label>
                        <select
                          value={tableFormBranch}
                          onChange={(e) => setTableFormBranch(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                        >
                          <option value="" disabled>Select Branch</option>
                          {branches
                            .filter((b) => b.restaurantId === selectedRestaurantId)
                            .map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="table-form-active"
                        checked={tableFormIsActive}
                        onChange={(e) => setTableFormIsActive(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded bg-slate-900 border-slate-800 cursor-pointer"
                      />
                      <label htmlFor="table-form-active" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                        Enable table for scanning & customer ordering
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTable(false);
                          setEditingTable(null);
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition-colors animate-pulse"
                      >
                        Save Table
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: View & Actions for QR Code */}
            {viewingQrTable && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-[#11131e] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative flex flex-col items-center">
                  <button
                    onClick={() => setViewingQrTable(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-4">
                    <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">LIVE DIGITAL QR MENU</span>
                    <h3 className="text-base font-black text-white">Table {viewingQrTable.tableNumber}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {branches.find((b) => b.id === viewingQrTable.branchId)?.name || 'Main Branch'}
                    </p>
                  </div>

                  {/* High resolution real QR generated by qrserver */}
                  <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center mb-4 relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(viewingQrTable.qrUrl)}`}
                      alt={`Table ${viewingQrTable.tableNumber} QR Code`}
                      className="w-48 h-48 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg border border-slate-200">
                      <img
                        src={activeRest.logo}
                        alt=""
                        className="w-6 h-6 rounded object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* QR Code link display */}
                  <div className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 mb-4 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1 font-mono">Dynamic Destination URL</span>
                    <p className="text-[10px] text-amber-400 font-mono select-all truncate break-all px-1">
                      {viewingQrTable.qrUrl}
                    </p>
                  </div>

                  {/* How to Order Guidelines */}
                  <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-5 text-left font-sans">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <span>📱 How to Order Instructions</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[10px] text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">📷</span>
                        <span><strong>1. Scan QR</strong> with phone camera.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">👤</span>
                        <span><strong>2. Enter Name</strong> (mobile optional).</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">🍽</span>
                        <span><strong>3. Browse Menu</strong> selection.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">🛒</span>
                        <span><strong>4. Add to Cart</strong> choices.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">✅</span>
                        <span><strong>5. Place Order</strong> to kitchen.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">👨‍🍳</span>
                        <span><strong>6. Track Order</strong> status live.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">➕</span>
                        <span><strong>7. Order More</strong> anytime.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400">🧾</span>
                        <span><strong>8. Request Bill</strong> to pay.</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] font-bold text-slate-400">
                      <span className="text-emerald-400 flex items-center gap-1">✔ No App Required</span>
                      <span className="text-emerald-400 flex items-center gap-1">✔ Works in Browser</span>
                      <span className="text-emerald-400 flex items-center gap-1">✔ Secure Ordering</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    <button
                      onClick={() => handleDownloadQR(viewingQrTable)}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download (PNG)</span>
                    </button>

                    <button
                      onClick={() => handlePrintQR(viewingQrTable)}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print QR Tag</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => handleCopyQRLink(viewingQrTable)}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy QR Link</span>
                    </button>

                    <button
                      onClick={() => handleRegenerateQR(viewingQrTable)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate QR</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setViewingQrTable(null)}
                    className="mt-5 w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: OFFERS & COUPONS MANAGEMENT */}
        {/* ======================================= */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">CAMPAIGNS & PROMOTIONS</span>
                <h3 className="text-sm font-black text-white">Offers, Discounts, & Banners</h3>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setOffersSubTab('coupons')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    offersSubTab === 'coupons'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Coupons
                </button>
                <button
                  onClick={() => setOffersSubTab('banners')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    offersSubTab === 'banners'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Promo Banners
                </button>
              </div>
            </div>

            {offersSubTab === 'coupons' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Creator left */}
                <div className="lg:col-span-1">
                  <div className="bg-[#11131e]/60 border border-slate-800/60 p-5 rounded-2xl shadow-md space-y-3">
                    <span className="text-xs font-extrabold text-slate-300 block uppercase font-mono">Create Coupon Code</span>
                    <form onSubmit={handleCreateCoupon} className="space-y-3">
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">COUPON CODE</label>
                        <input
                          type="text"
                          value={newCpnCode}
                          onChange={(e) => setNewCpnCode(e.target.value)}
                          placeholder="e.g., WINTER20"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none uppercase font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">PERCENT DISCOUNT</label>
                          <input
                            type="number"
                            value={newCpnPercent}
                            onChange={(e) => {
                              setNewCpnPercent(e.target.value);
                              setNewCpnFlat('');
                            }}
                            placeholder="e.g., 20"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">FLAT DISCOUNT ($)</label>
                          <input
                            type="number"
                            value={newCpnFlat}
                            onChange={(e) => {
                              setNewCpnFlat(e.target.value);
                              setNewCpnPercent('');
                            }}
                            placeholder="e.g., 5.00"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">MINIMUM ORDER REQ.</label>
                        <input
                          type="number"
                          value={newCpnMin}
                          onChange={(e) => setNewCpnMin(e.target.value)}
                          placeholder="e.g., 15"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full font-extrabold py-2.5 rounded-xl text-xs cursor-pointer text-slate-950"
                        style={{ backgroundColor: activeRest.accentColor }}
                      >
                        Save Coupon
                      </button>
                    </form>
                  </div>
                </div>

                {/* List right */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-xs font-bold text-slate-400 block font-mono uppercase">ACTIVE CAMPAIGNS</span>
                  {restCoupons.length === 0 ? (
                    <div className="bg-[#11131e]/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center">
                      <p className="text-xs text-slate-500 font-mono">No active coupons found for this restaurant.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {restCoupons.map((c) => (
                        <div key={c.id} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl shadow-sm flex items-start gap-3">
                          <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400 border border-amber-500/20">
                            <Percent className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-black text-white font-mono">{c.code}</span>
                            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                              Discount:{' '}
                              <strong>
                                {c.discountPercent ? `${c.discountPercent}% OFF` : `$${c.discountFlat?.toFixed(2)} OFF`}
                              </strong>
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono leading-normal mt-0.5">
                              Min Order Req: ${c.minOrderAmount}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Banner Creator form */}
                <div className="lg:col-span-1">
                  <div className="bg-[#11131e]/60 border border-slate-800/60 p-5 rounded-2xl shadow-md space-y-4">
                    <span className="text-xs font-extrabold text-slate-300 block uppercase font-mono">Create Promo Banner</span>
                    {bannerError && (
                      <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/40 p-2 rounded-xl font-mono">
                        {bannerError}
                      </p>
                    )}
                    <form onSubmit={handleCreateBanner} className="space-y-3.5">
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">BANNER TITLE</label>
                        <input
                          type="text"
                          value={bannerTitle}
                          onChange={(e) => setBannerTitle(e.target.value)}
                          placeholder="e.g., Happy Hours Special"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">SUBTITLE / OFFER DESCRIPTION</label>
                        <textarea
                          value={bannerSubtitle}
                          onChange={(e) => setBannerSubtitle(e.target.value)}
                          placeholder="e.g., Get 20% off on all alcoholic beverages between 4 PM to 7 PM!"
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none resize-none leading-normal"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">IMAGE URL</label>
                        <input
                          type="text"
                          value={bannerImage}
                          onChange={(e) => setBannerImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                        />
                        {/* Suggestion Chips */}
                        <div className="mt-2.5 space-y-1">
                          <span className="text-[8px] text-slate-500 font-mono uppercase block">Presets:</span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: '🍕 Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
                              { label: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
                              { label: '🍹 Drinks', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
                              { label: '🍣 Sushi', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80' },
                              { label: '🍰 Dessert', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' }
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setBannerImage(preset.url)}
                                className="text-[9px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded-md border border-slate-800 cursor-pointer transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">BANNER TYPE</label>
                          <select
                            value={bannerType}
                            onChange={(e) => setBannerType(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                          >
                            <option value="promo">Promo</option>
                            <option value="special">Special</option>
                            <option value="event">Event</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">INITIAL STATUS</label>
                          <select
                            value={bannerIsActive ? 'active' : 'inactive'}
                            onChange={(e) => setBannerIsActive(e.target.value === 'active')}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                          >
                            <option value="active">Active (Visible)</option>
                            <option value="inactive">Inactive (Hidden)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full font-extrabold py-2.5 rounded-xl text-xs cursor-pointer text-slate-950 mt-1 flex items-center justify-center gap-1"
                        style={{ backgroundColor: activeRest.accentColor }}
                      >
                        <Plus className="w-4 h-4" /> Save Banner
                      </button>
                    </form>
                  </div>
                </div>

                {/* Banner list right */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-xs font-bold text-slate-400 block font-mono uppercase">ACTIVE PROMO BANNERS</span>
                  {restBanners.length === 0 ? (
                    <div className="bg-[#11131e]/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center">
                      <p className="text-xs text-slate-500 font-mono">No banners found for this restaurant.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {restBanners.map((b) => (
                        <div key={b.id} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                          <img
                            src={b.image}
                            alt={b.title}
                            className="w-20 h-16 object-cover rounded-xl border border-slate-800 shrink-0 bg-slate-950"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-white">{b.title}</span>
                              <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                                b.type === 'special'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : b.type === 'event'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {b.type}
                              </span>
                              {!b.isActive && (
                                <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-rose-500/10 text-rose-400 border-rose-500/20">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-normal line-clamp-2">
                              {b.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => adminToggleBannerActive(b.id)}
                              title={b.isActive ? "Deactivate Banner" : "Activate Banner"}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                b.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditBannerModal(b)}
                              title="Edit Banner"
                              className="p-2 bg-slate-950 text-amber-400 border border-slate-850 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => adminDeleteBanner(b.id)}
                              title="Delete Banner"
                              className="p-2 bg-slate-950 text-rose-400 border border-slate-850 rounded-xl hover:bg-rose-950/40 hover:border-rose-900/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: RESTAURANT PROFILE BRADING */}
        {/* ======================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">BRAND BRANDING AND TAXATION</span>
                <h3 className="text-sm font-black text-white">Bistro Business Settings</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Profile details */}
              <div className="bg-[#11131e]/60 border border-slate-800/60 p-5 rounded-2xl shadow-md space-y-4">
                <span className="text-xs font-extrabold text-slate-300 block uppercase font-mono">Business Profile</span>
                <div className="space-y-3 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400">Brand Name:</span>
                    <span className="text-white font-bold">{activeRest.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400">Cuisine Sector:</span>
                    <span className="text-white">{activeRest.cuisine}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400">GST Percent:</span>
                    <span className="text-white">{activeRest.gstPercent}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400">Service Charges:</span>
                    <span className="text-white">{activeRest.serviceChargePercent}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400">Business Hours:</span>
                    <span className="text-white font-semibold">{activeRest.businessHours}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Contact Details:</span>
                    <span className="text-white text-right leading-tight font-sans">
                      {activeRest.email} <br /> {activeRest.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Theme color customizers */}
              <div className="bg-[#11131e]/60 border border-slate-800/60 p-5 rounded-2xl shadow-md space-y-4">
                <span className="text-xs font-extrabold text-slate-300 block uppercase font-mono">Dynamic Brand Customization</span>
                
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  QR Customers will automatically load this color scheme. Try applying presets to test real-time brand isolation stylesheet renders.
                </p>

                <div className="space-y-3 border-t border-slate-850 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">Primary Accent Preset:</span>
                    <div className="flex gap-2">
                      {[
                        { label: 'Gold (Italian)', primary: '#1e1b18', accent: '#d4af37' },
                        { label: 'Red (Japanese)', primary: '#0c0c0d', accent: '#e03e52' },
                        { label: 'Cyan (Burgers)', primary: '#0f172a', accent: '#06b6d4' },
                      ].map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            activeRest.primaryColor = preset.primary;
                            activeRest.accentColor = preset.accent;
                            setIsUpdatingColors(!isUpdatingColors);
                          }}
                          className="px-2.5 py-1 text-[9px] font-bold rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-850 pt-3">
                    <span className="text-xs text-slate-400">Current Branding Colors:</span>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: activeRest.primaryColor }} />
                        <span className="font-mono text-[10px]">{activeRest.primaryColor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: activeRest.accentColor }} />
                        <span className="font-mono text-[10px]">{activeRest.accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill & Printer Terminal Settings Card */}
            <div className="bg-[#11131e]/60 border border-slate-800/60 p-6 rounded-2xl shadow-md space-y-6 mt-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Receipt & Printer Terminal Configuration</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Set parameters for the waiters and cashiers billing terminals.</p>
                  </div>
                </div>
                {saveSuccess && (
                  <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase font-mono animate-bounce">
                    ✓ PERSISTED SECURELY
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Section A: Company Details */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">1. Corporate Registry</span>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        value={billingGstin}
                        onChange={(e) => setBillingGstin(e.target.value)}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">FSSAI License No</label>
                      <input
                        type="text"
                        value={billingFssai}
                        onChange={(e) => setBillingFssai(e.target.value)}
                        placeholder="12345678901234"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Store Address</label>
                      <textarea
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="Block-3, Gourmet Plaza, Tech City"
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Tax & Charges */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">2. Tariffs & Currency</span>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">GST (%)</label>
                        <input
                          type="number"
                          value={billingGst}
                          onChange={(e) => setBillingGst(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Svc Charge (%)</label>
                        <input
                          type="number"
                          value={billingServiceCharge}
                          onChange={(e) => setBillingServiceCharge(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Currency Symbol</label>
                      <input
                        type="text"
                        value={billingCurrency}
                        onChange={(e) => setBillingCurrency(e.target.value)}
                        placeholder="₹"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Brand Logo URL</label>
                      <input
                        type="text"
                        value={billingLogoUrl}
                        onChange={(e) => setBillingLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Thermal Print Parameters */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">3. Printer Terminal</span>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Receipt Size</label>
                        <select
                          value={billingReceiptWidth}
                          onChange={(e) => setBillingReceiptWidth(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono cursor-pointer"
                        >
                          <option value="58mm">58mm (Thermal)</option>
                          <option value="80mm">80mm (Standard)</option>
                          <option value="A4">A4 Invoice Sheet</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Interface</label>
                        <select
                          value={billingPrinterType}
                          onChange={(e) => setBillingPrinterType(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono cursor-pointer"
                        >
                          <option value="thermal_58mm">Thermal 58mm Bluetooth</option>
                          <option value="thermal_80mm">Thermal 80mm WiFi/USB</option>
                          <option value="a4_laser">A4 Office Desktop Laser</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white font-extrabold uppercase">Auto-Print Receipts</span>
                        <span className="text-[9px] text-slate-500">Auto-print invoice upon order serve</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={billingAutoPrint}
                        onChange={(e) => setBillingAutoPrint(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header/Footer Texts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-850 pt-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Receipt Header Text</label>
                  <input
                    type="text"
                    value={billingHeader}
                    onChange={(e) => setBillingHeader(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Receipt Footer Text</label>
                  <input
                    type="text"
                    value={billingFooter}
                    onChange={(e) => setBillingFooter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-slate-850 pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    adminUpdateBillingSettings(selectedRestaurantId, {
                      gstPercent: billingGst,
                      serviceChargePercent: billingServiceCharge,
                      receiptHeader: billingHeader,
                      receiptFooter: billingFooter,
                      autoPrint: billingAutoPrint,
                      printerType: billingPrinterType as any,
                      receiptWidth: billingReceiptWidth as any,
                      currency: billingCurrency,
                      logoUrl: billingLogoUrl,
                      address: billingAddress,
                      gstin: billingGstin,
                      fssai: billingFssai
                    });
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3500);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2 rounded-xl text-xs font-black tracking-wider cursor-pointer shadow transition"
                >
                  SAVE PERSISTENT BILLING CONFIG
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* PANEL: STAFF MANAGEMENT */}
        {/* ======================================= */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Header section with total metrics */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">TEAM ROLES & TERMINALS</span>
                <h3 className="text-sm font-black text-white">Staff Account Management</h3>
                <p className="text-xs text-slate-400 mt-1">Create, manage, and assign physical branch permissions for waiter, cashier, kitchen, and manager terminals.</p>
              </div>
              <button
                onClick={() => {
                  setStaffFormFullName('');
                  setStaffFormEmail('');
                  setStaffFormMobile('');
                  setStaffFormPassword('');
                  setStaffFormConfirmPassword('');
                  setStaffFormBranch(restBranches[0]?.id || '');
                  setStaffFormRole('waiter');
                  setStaffFormStatus('active');
                  setStaffFormError('');
                  setIsAddStaffOpen(true);
                }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs tracking-wider cursor-pointer shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>ADD STAFF ACCOUNT</span>
              </button>
            </div>

            {/* Dashboard summary metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Staff', count: restStaff.length, sub: 'Registered' },
                { label: 'Active Staff', count: restStaff.filter(s => s.status !== 'inactive').length, sub: 'Terminals Online' },
                { label: 'Managers', count: restStaff.filter(s => s.role === UserRole.MANAGER).length, sub: 'Branch Managers' },
                { label: 'Waiters', count: restStaff.filter(s => s.role === UserRole.WAITER).length, sub: 'Floor Waiters' }
              ].map((m, idx) => (
                <div key={idx} className="bg-[#11131e]/50 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase">{m.label}</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-2xl font-black text-white leading-none">{m.count}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{m.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-[#11131e]/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition font-sans"
                />
              </div>

              {/* Role Filter */}
              <div className="w-full md:w-44">
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer font-sans"
                >
                  <option value="all">All Roles</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.CASHIER}>Cashier</option>
                  <option value={UserRole.KITCHEN}>Kitchen Staff</option>
                  <option value={UserRole.WAITER}>Waiter</option>
                </select>
              </div>

              {/* Branch Filter */}
              <div className="w-full md:w-44">
                <select
                  value={staffBranchFilter}
                  onChange={(e) => setStaffBranchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer font-sans"
                >
                  <option value="all">All Branches</option>
                  {restBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-36">
                <select
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-855 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer font-sans"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {employeeError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 font-sans shadow-md">
                <span>⚠️ {employeeError}</span>
              </div>
            )}

            {/* Staff list table */}
            <div className="bg-[#11131e]/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Staff Profile</th>
                      <th className="py-3.5 px-4 font-bold">Assigned Branch</th>
                      <th className="py-3.5 px-4 font-bold">System Role</th>
                      <th className="py-3.5 px-4 font-bold">Terminal Status</th>
                      <th className="py-3.5 px-4 font-bold">Created Date</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {employeeLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-3" />
                          <p className="text-xs text-slate-400 font-bold font-sans">Connecting to Terminal Registry...</p>
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-500 font-medium font-sans">
                          No staff terminals match the active filters or exist.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((s) => {
                        const sBranch = restBranches.find((b) => b.id === s.branchId);
                        const initials = s.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        // Define role pill styling
                        let rolePillClass = 'bg-slate-800 text-slate-300';
                        if (s.role === UserRole.MANAGER) rolePillClass = 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
                        else if (s.role === UserRole.CASHIER) rolePillClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                        else if (s.role === UserRole.KITCHEN) rolePillClass = 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20';
                        else if (s.role === UserRole.WAITER) rolePillClass = 'bg-rose-500/10 text-rose-550 border border-rose-500/20';

                        return (
                          <tr key={s.id} className="hover:bg-slate-800/20 transition group text-xs text-slate-300 font-medium">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-750 flex items-center justify-center font-bold text-slate-200 font-mono">
                                  {initials}
                                </div>
                                <div>
                                  <span className="font-extrabold text-white text-xs block leading-tight">{s.fullName}</span>
                                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{s.email}</span>
                                  {s.phone && (
                                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{s.phone}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>{sBranch ? sBranch.name : 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-md text-[9px] font-mono uppercase font-bold tracking-wider ${rolePillClass}`}>
                                {s.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                s.status !== 'inactive'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.status !== 'inactive' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{s.status !== 'inactive' ? 'Active' : 'Deactivated'}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-[10px] text-slate-500">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Simulated'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Active/Inactive */}
                                <button
                                  onClick={() => {
                                    toggleEmployeeStatus(s.id, s.status || 'active');
                                  }}
                                  title={s.status === 'inactive' ? 'Enable Staff Account' : 'Disable Staff Account'}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide transition cursor-pointer ${
                                    s.status === 'inactive'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                  }`}
                                >
                                  {s.status === 'inactive' ? 'Enable' : 'Disable'}
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => {
                                    setSelectedStaff(s);
                                    setResetStaffNewPassword('');
                                    setResetStaffConfirmPassword('');
                                    setResetStaffError('');
                                    setIsResetPasswordOpen(true);
                                  }}
                                  title="Reset Password"
                                  className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg transition cursor-pointer"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => {
                                    setSelectedStaff(s);
                                    setEditStaffFullName(s.fullName);
                                    setEditStaffEmail(s.email);
                                    setEditStaffMobile(s.phone);
                                    setEditStaffBranch(s.branchId || '');
                                    setEditStaffRole(s.role);
                                    setEditStaffStatus(s.status || 'active');
                                    setEditStaffError('');
                                    setIsEditStaffOpen(true);
                                  }}
                                  title="Edit Staff Details"
                                  className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg transition cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => {
                                    setSelectedStaff(s);
                                    setIsDeleteStaffConfirmOpen(true);
                                  }}
                                  title="Delete Staff Account"
                                  className="p-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
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
      </main>

      {/* ======================================= */}
      {/* MODAL: ADD STAFF */}
      {/* ======================================= */}
      <AnimatePresence>
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8"
            >
              {/* Header */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-white text-sm">Create New Staff Terminal</h3>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {staffFormError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span>⚠️ {staffFormError}</span>
                  </div>
                )}

                {/* Personal details */}
                <div className="space-y-3.5 font-sans">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">1. Personal Details</span>
                  
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={staffFormFullName}
                      onChange={(e) => setStaffFormFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={staffFormMobile}
                        onChange={(e) => setStaffFormMobile(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={staffFormEmail}
                        onChange={(e) => setStaffFormEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                        placeholder="john@bistro.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showStaffPassword ? "text" : "password"}
                          required
                          value={staffFormPassword}
                          onChange={(e) => setStaffFormPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPassword(!showStaffPassword)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          {showStaffPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showStaffConfirmPassword ? "text" : "password"}
                          required
                          value={staffFormConfirmPassword}
                          onChange={(e) => setStaffFormConfirmPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffConfirmPassword(!showStaffConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          {showStaffConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const autoPass = Math.random().toString(36).slice(-8);
                        setStaffFormPassword(autoPass);
                        setStaffFormConfirmPassword(autoPass);
                        addSystemNotification(`🔑 Auto-generated password: ${autoPass}`);
                      }}
                      className="text-[10px] text-amber-500 font-bold hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Auto-generate strong password
                    </button>
                  </div>
                </div>

                {/* Work details */}
                <div className="space-y-3.5 pt-2 border-t border-slate-850 font-sans">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">2. Work Assignment</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Branch *</label>
                      <select
                        value={staffFormBranch}
                        onChange={(e) => setStaffFormBranch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
                      >
                        {restBranches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Role *</label>
                      <select
                        value={staffFormRole}
                        onChange={(e) => setStaffFormRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
                      >
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.CASHIER}>Cashier</option>
                        <option value={UserRole.KITCHEN}>Kitchen Staff</option>
                        <option value={UserRole.WAITER}>Waiter</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Account Status</label>
                    <select
                      value={staffFormStatus}
                      onChange={(e) => setStaffFormStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0 font-sans">
                <button
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setStaffFormError('');
                    if (!staffFormFullName || !staffFormEmail || !staffFormPassword) {
                      setStaffFormError('Please fill in all required fields.');
                      return;
                    }
                    if (staffFormPassword !== staffFormConfirmPassword) {
                      setStaffFormError('Passwords do not match.');
                      return;
                    }
                    createEmployee({
                      fullName: staffFormFullName,
                      email: staffFormEmail,
                      role: staffFormRole as any,
                      branchId: staffFormBranch,
                      phone: staffFormMobile,
                      password: staffFormPassword,
                      status: staffFormStatus,
                      restaurantId: selectedRestaurantId,
                    }).then((result) => {
                      if (result.success) {
                        setIsAddStaffOpen(false);
                      } else {
                        setStaffFormError(result.error || 'Failed to add staff member.');
                      }
                    });
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow transition"
                >
                  Save & Create Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: EDIT STAFF */}
      {/* ======================================= */}
      <AnimatePresence>
        {isEditStaffOpen && selectedStaff && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8"
            >
              {/* Header */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-white text-sm">Edit Staff Terminal Details</h3>
                </div>
                <button
                  onClick={() => setIsEditStaffOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {editStaffError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span>⚠️ {editStaffError}</span>
                  </div>
                )}

                <div className="space-y-3.5 font-sans">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">1. Personal Details</span>
                  
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editStaffFullName}
                      onChange={(e) => setEditStaffFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={editStaffMobile}
                        onChange={(e) => setEditStaffMobile(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={editStaffEmail}
                        onChange={(e) => setEditStaffEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 pt-2 border-t border-slate-850 font-sans">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">2. Work Assignment</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Branch *</label>
                      <select
                        value={editStaffBranch}
                        onChange={(e) => setEditStaffBranch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
                      >
                        {restBranches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Role *</label>
                      <select
                        value={editStaffRole}
                        onChange={(e) => setEditStaffRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
                      >
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.CASHIER}>Cashier</option>
                        <option value={UserRole.KITCHEN}>Kitchen Staff</option>
                        <option value={UserRole.WAITER}>Waiter</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Account Status</label>
                    <select
                      value={editStaffStatus}
                      onChange={(e) => setEditStaffStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0 font-sans">
                <button
                  onClick={() => setIsEditStaffOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setEditStaffError('');
                    if (!editStaffFullName || !editStaffEmail) {
                      setEditStaffError('Please fill in all required fields.');
                      return;
                    }
                    updateEmployee(selectedStaff.id, {
                      fullName: editStaffFullName,
                      email: editStaffEmail,
                      phone: editStaffMobile,
                      branchId: editStaffBranch,
                      role: editStaffRole as UserRole,
                      status: editStaffStatus
                    }).then((result) => {
                      if (result.success) {
                        setIsEditStaffOpen(false);
                      } else {
                        setEditStaffError(result.error || 'Failed to update employee.');
                      }
                    });
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow transition"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ======================================= */}
      <AnimatePresence>
        {isResetPasswordOpen && selectedStaff && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans"
            >
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-white text-xs uppercase">Reset Staff Password</h3>
                </div>
                <button
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-400 leading-normal">
                  Update the credentials for <strong className="text-white">{selectedStaff.fullName}</strong>. Their password will be instantly synced in local memory storage.
                </p>

                {resetStaffError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] font-semibold">
                    {resetStaffError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showResetStaffPassword ? "text" : "password"}
                        required
                        value={resetStaffNewPassword}
                        onChange={(e) => setResetStaffNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-amber-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetStaffPassword(!showResetStaffPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                      >
                        {showResetStaffPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showResetStaffConfirmPassword ? "text" : "password"}
                        required
                        value={resetStaffConfirmPassword}
                        onChange={(e) => setResetStaffConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-amber-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetStaffConfirmPassword(!showResetStaffConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                      >
                        {showResetStaffConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 px-5 py-3.5 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setResetStaffError('');
                    if (!resetStaffNewPassword) {
                      setResetStaffError('Please enter a password.');
                      return;
                    }
                    if (resetStaffNewPassword !== resetStaffConfirmPassword) {
                      setResetStaffError('Passwords do not match.');
                      return;
                    }
                    updateEmployee(selectedStaff.id, { password: resetStaffNewPassword }).then((result) => {
                      if (result.success) {
                        setIsResetPasswordOpen(false);
                      } else {
                        setResetStaffError(result.error || 'Failed to reset password.');
                      }
                    });
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: DELETE STAFF CONFIRMATION */}
      {/* ======================================= */}
      <AnimatePresence>
        {isDeleteStaffConfirmOpen && selectedStaff && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans"
            >
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-400 flex items-center justify-center rounded-xl mb-1">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Delete Staff Terminal Account?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5 font-medium">
                    This action will permanently delete <strong className="text-white">{selectedStaff.fullName}</strong>'s profile and terminal credentials. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-stretch gap-3">
                <button
                  onClick={() => setIsDeleteStaffConfirmOpen(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteEmployee(selectedStaff.id).then((result) => {
                      if (result.success) {
                        setIsDeleteStaffConfirmOpen(false);
                      }
                    });
                  }}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: EDIT PROMO BANNER */}
      {/* ======================================= */}
      <AnimatePresence>
        {isBannerModalOpen && editingBannerId && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider">CAMPAIGNS & PROMOTIONS</span>
                  <h3 className="text-sm font-black text-white">Edit Promo Banner</h3>
                </div>
                <button
                  onClick={() => {
                    setIsBannerModalOpen(false);
                    setEditingBannerId(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateBannerSubmit} className="p-5 space-y-4">
                {bannerError && (
                  <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/40 p-2 rounded-xl font-mono">
                    {bannerError}
                  </p>
                )}
                <div>
                  <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">BANNER TITLE</label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g., Happy Hours Special"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">SUBTITLE / OFFER DESCRIPTION</label>
                  <textarea
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="e.g., Get 20% off on all alcoholic beverages!"
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none resize-none leading-normal"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">IMAGE URL</label>
                  <input
                    type="text"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                  <div className="mt-2 space-y-1">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block">Presets:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: '🍕 Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
                        { label: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
                        { label: '🍹 Drinks', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
                        { label: '🍣 Sushi', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80' },
                        { label: '🍰 Dessert', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setBannerImage(preset.url)}
                          className="text-[9px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded-md border border-slate-800 cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">BANNER TYPE</label>
                    <select
                      value={bannerType}
                      onChange={(e) => setBannerType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="promo">Promo</option>
                      <option value="special">Special</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-mono font-medium block mb-1">STATUS</label>
                    <select
                      value={bannerIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setBannerIsActive(e.target.value === 'active')}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border-t border-slate-800/60 -mx-5 -mb-5 flex items-center justify-stretch gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBannerModalOpen(false);
                      setEditingBannerId(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer text-slate-950"
                    style={{ backgroundColor: activeRest.accentColor }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: ADD BRANCH */}
      {/* ======================================= */}
      <AnimatePresence>
        {isAddBranchOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8"
            >
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-white text-sm">Create New Branch Site</h3>
                </div>
                <button
                  onClick={() => setIsAddBranchOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!branchFormName.trim() || !branchFormAddress.trim()) {
                    setBranchFormError('Branch Name and Address are required.');
                    return;
                  }
                  const res = adminAddBranch({
                    name: branchFormName,
                    address: branchFormAddress,
                    phone: branchFormPhone,
                    isActive: branchFormIsActive
                  });
                  if (res.success) {
                    setIsAddBranchOpen(false);
                  } else {
                    setBranchFormError(res.error || 'Failed to add branch.');
                  }
                }}
                className="p-6 space-y-4 overflow-y-auto max-h-[60vh]"
              >
                {branchFormError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span>⚠️ {branchFormError}</span>
                  </div>
                )}

                <div className="space-y-3.5 font-sans">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Branch Name *</label>
                    <input
                      type="text"
                      required
                      value={branchFormName}
                      onChange={(e) => setBranchFormName(e.target.value)}
                      placeholder="e.g. Westside Mall Express"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 transition-colors animate-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={branchFormAddress}
                      onChange={(e) => setBranchFormAddress(e.target.value)}
                      placeholder="e.g. 450 Boulevard Ave, Suite 12"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 transition-colors animate-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={branchFormPhone}
                      onChange={(e) => setBranchFormPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 transition-colors animate-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <input
                      type="checkbox"
                      id="branchActive"
                      checked={branchFormIsActive}
                      onChange={(e) => setBranchFormIsActive(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor="branchActive" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Activate this branch site immediately
                    </label>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border-t border-slate-800/60 -mx-6 -mb-6 flex items-center justify-stretch gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddBranchOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer text-slate-950 bg-amber-500 hover:bg-amber-600"
                  >
                    Save Branch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: EDIT BRANCH */}
      {/* ======================================= */}
      <AnimatePresence>
        {isEditBranchOpen && selectedBranch && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8"
            >
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-white text-sm">Edit Branch Terminal</h3>
                </div>
                <button
                  onClick={() => setIsEditBranchOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!branchFormName.trim() || !branchFormAddress.trim()) {
                    setBranchFormError('Branch Name and Address are required.');
                    return;
                  }
                  const res = adminUpdateBranch(selectedBranch.id, {
                    name: branchFormName,
                    address: branchFormAddress,
                    phone: branchFormPhone,
                    isActive: branchFormIsActive
                  });
                  if (res.success) {
                    setIsEditBranchOpen(false);
                  } else {
                    setBranchFormError(res.error || 'Failed to update branch.');
                  }
                }}
                className="p-6 space-y-4 overflow-y-auto max-h-[60vh]"
              >
                {branchFormError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span>⚠️ {branchFormError}</span>
                  </div>
                )}

                <div className="space-y-3.5 font-sans">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Branch Name *</label>
                    <input
                      type="text"
                      required
                      value={branchFormName}
                      onChange={(e) => setBranchFormName(e.target.value)}
                      placeholder="e.g. Westside Mall Express"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 transition-colors animate-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={branchFormAddress}
                      onChange={(e) => setBranchFormAddress(e.target.value)}
                      placeholder="e.g. 450 Boulevard Ave, Suite 12"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 transition-colors animate-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={branchFormPhone}
                      onChange={(e) => setBranchFormPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 transition-colors animate-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <input
                      type="checkbox"
                      id="editBranchActive"
                      checked={branchFormIsActive}
                      onChange={(e) => setBranchFormIsActive(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor="editBranchActive" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      This branch site is open and active
                    </label>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border-t border-slate-800/60 -mx-6 -mb-6 flex items-center justify-stretch gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditBranchOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer text-slate-950 bg-amber-500 hover:bg-amber-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODAL: DELETE BRANCH CONFIRMATION */}
      {/* ======================================= */}
      <AnimatePresence>
        {isDeleteBranchConfirmOpen && selectedBranch && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-rose-950/40 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="font-extrabold text-sm">Delete Branch Location</h3>
                </div>
                <button
                  onClick={() => setIsDeleteBranchConfirmOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you absolutely sure you want to delete the branch <strong className="text-white">"{selectedBranch?.name}"</strong>?
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[11px] font-mono leading-relaxed">
                  ⚠️ This action is irreversible and will also delete all QR Tables assigned to this branch location.
                </div>
              </div>

              <div className="bg-slate-950 p-4 border-t border-slate-800/60 flex items-center justify-stretch gap-3">
                <button
                  onClick={() => setIsDeleteBranchConfirmOpen(false)}
                  className="flex-1 py-2 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    adminDeleteBranch(selectedBranch.id);
                    setIsDeleteBranchConfirmOpen(false);
                  }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
