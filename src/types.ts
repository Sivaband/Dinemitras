/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RestaurantStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum SubscriptionPlan {
  FREE = 'Free',
  GROWTH = 'Growth',
  PRO = 'Pro',
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  status: RestaurantStatus;
  plan: SubscriptionPlan;
  rating: number;
  cuisine: string;
  primaryColor: string;
  accentColor: string;
  currency: string;
  gstPercent: number;
  serviceChargePercent: number;
  phone: string;
  email?: string;
  address?: string;
  businessHours?: string;
  // Billing and Printer configurations
  receiptHeader?: string;
  receiptFooter?: string;
  autoPrint?: boolean;
  printerType?: 'thermal_58mm' | 'thermal_80mm' | 'usb' | 'bluetooth' | 'network';
  receiptWidth?: '58mm' | '80mm';
  logoUrl?: string;
  gstin?: string;
  fssai?: string;
  waiterCanAddItems?: boolean;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  is_default?: boolean;
  isDefault?: boolean;
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  BILL_REQUESTED = 'bill_requested',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
}

export interface RestaurantTable {
  id: string;
  branchId: string;
  restaurantId: string;
  tableNumber: string;
  seatingCapacity: number;
  status: TableStatus;
  qrUrl: string; // Auto-generated scanning URL
  isActive?: boolean;
}

export interface TableSession {
  id: string; // Resolves to the unique session_token
  sessionToken?: string; // session_token
  tableId: string;
  restaurantId: string;
  branchId: string;
  customerName: string;
  customerPhone?: string;
  joinedAt: string; // started_at
  startedAt?: string; // started_at
  endedAt?: string; // ended_at
  isActive: boolean;
  paymentStatus?: 'pending' | 'completed' | 'refunded'; // payment_status
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'; // status
  totalBill: number;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  icon: string; // Lucide icon name
  sortOrder: number;
  isActive: boolean;
}

export interface MenuVariant {
  id: string;
  name: string; // e.g., "Regular", "Large"
  price: number;
}

export interface MenuAddon {
  id: string;
  name: string; // e.g., "Extra Cheese", "Gluten Free"
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  restaurantId: string;
  name: string;
  description: string;
  image: string;
  price: number; // base price
  isVeg: boolean;
  isPopular: boolean;
  isSpecial: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number; // e.g., 15
  variants: MenuVariant[];
  addons: MenuAddon[];
  isSpicy?: boolean;
  isSweet?: boolean;
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  price: number; // unit price at time of order
  selectedVariant?: MenuVariant;
  selectedAddons: MenuAddon[];
  specialInstructions?: string;
  addedBy?: string;
  addedByRole?: UserRole;
  addedTime?: string;
  source?: string;
}

export interface Order {
  id: string;
  sessionId: string;
  sessionToken?: string; // session_token
  restaurantId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  addedBy?: string;
  addedByRole?: UserRole;
  source?: string;
}

export enum ServiceRequestType {
  CALL_WAITER = 'call_waiter',
  REQUEST_WATER = 'request_water',
  REQUEST_TISSUE = 'request_tissue',
  REQUEST_BILL = 'request_bill',
}

export interface WaiterRequest {
  id: string;
  sessionId: string;
  restaurantId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  type: ServiceRequestType;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export enum PaymentMethod {
  CASH = 'cash',
  UPI = 'upi',
  CARD = 'card',
}

export interface Payment {
  id: string;
  orderIds: string[];
  sessionId: string;
  restaurantId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'refunded';
  invoiceNumber: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  restaurantId: string;
  sessionId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  restaurantId: string;
  code: string;
  discountPercent?: number;
  discountFlat?: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
}

export interface Banner {
  id: string;
  restaurantId: string;
  title: string;
  subtitle: string;
  image: string;
  type: 'promo' | 'special' | 'event';
  isActive: boolean;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  RESTAURANT_ADMIN = 'restaurant_admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen',
  WAITER = 'waiter',
  CUSTOMER_GUEST = 'customer_guest',
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  restaurantId?: string;
  branchId?: string;
  createdAt: string;
  isVerified: boolean;
  onboardingStep: number; // 1: Verify Email, 2: Create Restaurant, 3: Create Branch, 4: Generate Tables, 5: Complete
  businessAddress?: string;
  gstNumber?: string;
  password?: string; // stored for simulation
  status?: 'active' | 'inactive';
  authorizedModules?: string[];
}

export function formatIndianCurrency(amount: number, currency: string = '₹'): string {
  const formattedValue = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
  const symbol = currency === '$' ? '₹' : currency;
  return `${symbol}${formattedValue}`;
}

export enum ReceiptStatus {
  DRAFT = 'draft',
  BILL_REQUESTED = 'bill_requested',
  GENERATED = 'generated',
  PRINTED = 'printed',
  PAID = 'paid',
  CLOSED = 'closed',
}

export interface BillPrintLog {
  id: string;
  restaurantId: string;
  billNumber: string;
  printerType: string;
  receiptWidth: string;
  action: 'print' | 'reprint';
  timestamp: string;
}

export interface Receipt {
  id: string;
  restaurantId: string;
  sessionId: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  billNumber: string;
  orderNumber: string;
  cashierName: string;
  status: ReceiptStatus;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  couponDiscountAmount: number;
  gstAmount: number;
  serviceChargeAmount: number;
  grandTotal: number;
  paymentMethod?: 'cash' | 'upi' | 'card';
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  createdAt: string;
  updatedAt: string;
}

export function getAuthorizedModulesForRole(role: UserRole): string[] {
  switch (role) {
    case UserRole.RESTAURANT_ADMIN:
    case UserRole.MANAGER:
      return ['dashboard', 'kitchen', 'waiter', 'cashier'];
    case UserRole.KITCHEN:
      return ['dashboard', 'kitchen'];
    case UserRole.WAITER:
      return ['dashboard', 'waiter'];
    case UserRole.CASHIER:
      return ['dashboard', 'cashier'];
    case UserRole.SUPER_ADMIN:
    default:
      return [];
  }
}


