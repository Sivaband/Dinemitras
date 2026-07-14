/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Restaurant,
  RestaurantStatus,
  SubscriptionPlan,
  Branch,
  RestaurantTable,
  TableStatus,
  MenuCategory,
  MenuItem,
  Coupon,
  Banner,
  Order,
  OrderStatus
} from './types';

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest_1',
    name: 'The Truffle Bistro',
    description: 'Artisanal modern Italian kitchen specializing in woodfired pizzas and fresh handmade pastas infused with truffles.',
    logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&h=200&q=80',
    banner: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&h=400&q=80',
    status: RestaurantStatus.APPROVED,
    plan: SubscriptionPlan.PRO,
    rating: 4.8,
    cuisine: 'Italian Fine Dining',
    primaryColor: '#1e1b18', // Warm deep obsidian
    accentColor: '#d4af37',  // Gold
    currency: '₹',
    gstPercent: 8,
    serviceChargePercent: 10,
    phone: '+1 (555) 234-5678',
    email: 'hello@trufflebistro.com',
    address: '142 Truffle Lane, Suite A, Gastronomy District',
    businessHours: '12:00 PM - 11:00 PM',
    receiptHeader: 'Welcome to Truffle Bistro\nAuthentic Italian Fine Dining',
    receiptFooter: 'Thank you for visiting\nVisit Again!',
    autoPrint: true,
    printerType: 'thermal_80mm',
    receiptWidth: '80mm',
    waiterCanAddItems: true,
  },
  {
    id: 'rest_2',
    name: 'Sakura Sushi Bar',
    description: 'Masterfully prepared premium sushi, sashimi, and authentic hot ramen in a quiet, minimalist Japanese atmosphere.',
    logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=200&h=200&q=80',
    banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&h=400&q=80',
    status: RestaurantStatus.APPROVED,
    plan: SubscriptionPlan.GROWTH,
    rating: 4.7,
    cuisine: 'Traditional Japanese',
    primaryColor: '#0c0c0d', // Zen Slate Black
    accentColor: '#e03e52',  // Sakura Red
    currency: '₹',
    gstPercent: 5,
    serviceChargePercent: 5,
    phone: '+1 (555) 987-6543',
    email: 'contact@sakurasushi.com',
    address: '88 Kyoto Way, Zen Plaza, Little Tokyo',
    businessHours: '11:30 AM - 10:00 PM',
    receiptHeader: 'Sakura Sushi Bar\nTraditional Japanese Cuisine',
    receiptFooter: 'Arigato Gozaimasu\nHave a great day!',
    autoPrint: false,
    printerType: 'thermal_58mm',
    receiptWidth: '58mm',
    waiterCanAddItems: true,
  },
  {
    id: 'rest_3',
    name: 'Burger Lab & Craft Beer',
    description: 'Innovative smash burgers made with 100% dry-aged Angus beef, paired with regional micro-brews and custom sides.',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&h=200&q=80',
    banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&h=400&q=80',
    status: RestaurantStatus.APPROVED,
    plan: SubscriptionPlan.FREE,
    rating: 4.5,
    cuisine: 'Gourmet Fast Casual',
    primaryColor: '#0f172a', // Slate Dark Blue
    accentColor: '#06b6d4',  // Cyan Sparkle
    currency: '₹',
    gstPercent: 5,
    serviceChargePercent: 0,
    phone: '+1 (555) 456-7890',
    email: 'info@burgerlab.com',
    address: '320 Grid Boulevard, Tech Park',
    businessHours: '11:00 AM - Midnight',
    receiptHeader: 'Burger Lab & Craft Beer\nSmashed with Science',
    receiptFooter: 'Hope you loved your burger!\nRate us on Yelp!',
    autoPrint: true,
    printerType: 'usb',
    receiptWidth: '80mm',
    waiterCanAddItems: true,
  },
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch_1a',
    restaurantId: 'rest_1',
    name: 'Downtown Main Branch',
    address: '142 Truffle Lane, Suite A, Gastronomy District',
    phone: '+1 (555) 234-5678',
    isActive: true,
  },
  {
    id: 'branch_1b',
    restaurantId: 'rest_1',
    name: 'Uptown Lakeside Branch',
    address: '710 Cascade Drive, Waterfront Mall',
    phone: '+1 (555) 234-8899',
    isActive: true,
  },
  {
    id: 'branch_2a',
    restaurantId: 'rest_2',
    name: 'Zen Plaza Branch',
    address: '88 Kyoto Way, Zen Plaza, Little Tokyo',
    phone: '+1 (555) 987-6543',
    isActive: true,
  },
  {
    id: 'branch_3a',
    restaurantId: 'rest_3',
    name: 'Tech Park Flagship',
    address: '320 Grid Boulevard, Tech Park',
    phone: '+1 (555) 456-7890',
    isActive: true,
  },
];

export const INITIAL_TABLES: RestaurantTable[] = [
  // Truffle Bistro Tables
  { id: 'table_1_1', branchId: 'branch_1a', restaurantId: 'rest_1', tableNumber: '01', seatingCapacity: 2, status: TableStatus.AVAILABLE, qrUrl: '' },
  { id: 'table_1_2', branchId: 'branch_1a', restaurantId: 'rest_1', tableNumber: '02', seatingCapacity: 4, status: TableStatus.OCCUPIED, qrUrl: '' },
  { id: 'table_1_3', branchId: 'branch_1a', restaurantId: 'rest_1', tableNumber: '03', seatingCapacity: 2, status: TableStatus.AVAILABLE, qrUrl: '' },
  { id: 'table_1_4', branchId: 'branch_1a', restaurantId: 'rest_1', tableNumber: '04', seatingCapacity: 6, status: TableStatus.BILL_REQUESTED, qrUrl: '' },
  { id: 'table_1_5', branchId: 'branch_1a', restaurantId: 'rest_1', tableNumber: '05', seatingCapacity: 4, status: TableStatus.CLEANING, qrUrl: '' },
  // Sakura Sushi Tables
  { id: 'table_2_1', branchId: 'branch_2a', restaurantId: 'rest_2', tableNumber: '10', seatingCapacity: 2, status: TableStatus.AVAILABLE, qrUrl: '' },
  { id: 'table_2_2', branchId: 'branch_2a', restaurantId: 'rest_2', tableNumber: '11', seatingCapacity: 2, status: TableStatus.OCCUPIED, qrUrl: '' },
  { id: 'table_2_3', branchId: 'branch_2a', restaurantId: 'rest_2', tableNumber: '12', seatingCapacity: 4, status: TableStatus.AVAILABLE, qrUrl: '' },
  // Burger Lab Tables
  { id: 'table_3_1', branchId: 'branch_3a', restaurantId: 'rest_3', tableNumber: 'A1', seatingCapacity: 4, status: TableStatus.AVAILABLE, qrUrl: '' },
  { id: 'table_3_2', branchId: 'branch_3a', restaurantId: 'rest_3', tableNumber: 'A2', seatingCapacity: 4, status: TableStatus.OCCUPIED, qrUrl: '' },
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  // Truffle Bistro
  { id: 'cat_1_pasta', restaurantId: 'rest_1', name: 'Fresh Pastas', icon: 'Soup', sortOrder: 1, isActive: true },
  { id: 'cat_1_pizza', restaurantId: 'rest_1', name: 'Woodfired Pizzas', icon: 'Pizza', sortOrder: 2, isActive: true },
  { id: 'cat_1_sides', restaurantId: 'rest_1', name: 'Antipasti & Salads', icon: 'Salad', sortOrder: 3, isActive: true },
  { id: 'cat_1_dessert', restaurantId: 'rest_1', name: 'Sweet Desserts', icon: 'IceCream', sortOrder: 4, isActive: true },

  // Sakura Sushi
  { id: 'cat_2_sushi', restaurantId: 'rest_2', name: 'Premium Sushi Rolls', icon: 'Fish', sortOrder: 1, isActive: true },
  { id: 'cat_2_ramen', restaurantId: 'rest_2', name: 'Hot Ramen Bowls', icon: 'Soup', sortOrder: 2, isActive: true },
  { id: 'cat_2_dessert', restaurantId: 'rest_2', name: 'Traditional Sweets', icon: 'IceCream', sortOrder: 3, isActive: true },

  // Burger Lab
  { id: 'cat_3_burger', restaurantId: 'rest_3', name: 'Smash Burgers', icon: 'Flame', sortOrder: 1, isActive: true },
  { id: 'cat_3_sides', restaurantId: 'rest_3', name: 'Crispy Sides', icon: 'UtensilsCrossed', sortOrder: 2, isActive: true },
  { id: 'cat_3_drinks', restaurantId: 'rest_3', name: 'Craft Shakes', icon: 'CupSoda', sortOrder: 3, isActive: true },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Truffle Bistro Pastas
  {
    id: 'item_1_tagliatelle',
    categoryId: 'cat_1_pasta',
    restaurantId: 'rest_1',
    name: 'Truffle Tagliatelle Carbonara',
    description: 'Handmade fresh egg ribbon pasta coated in silky organic egg yolk sauce, double-smoked pancetta, pecorino romano, and shaved black winter truffles.',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80',
    price: 24.50,
    isVeg: false,
    isPopular: true,
    isSpecial: true,
    isAvailable: true,
    prepTimeMinutes: 14,
    variants: [
      { id: 'var_1_reg', name: 'Regular Portion', price: 0 },
      { id: 'var_1_large', name: 'Grand Portion', price: 6.00 }
    ],
    addons: [
      { id: 'add_1_truffle', name: 'Extra Shaved Truffle (3g)', price: 8.50 },
      { id: 'add_1_pancetta', name: 'Crispy Pancetta Bits', price: 3.00 }
    ]
  },
  {
    id: 'item_1_pesto',
    categoryId: 'cat_1_pasta',
    restaurantId: 'rest_1',
    name: 'Genovese Basil Pesto Gnocchi',
    description: 'Pillowy light potato gnocchi tossed in micro-batch sweet basil pesto, toasted Italian pine nuts, extra virgin olive oil, and premium buffalo burrata.',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    price: 18.50,
    isVeg: true,
    isPopular: false,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 10,
    variants: [],
    addons: [
      { id: 'add_1_burrata', name: 'Extra Burrata Ball', price: 5.00 }
    ]
  },
  // Truffle Bistro Pizzas
  {
    id: 'item_1_margherita',
    categoryId: 'cat_1_pizza',
    restaurantId: 'rest_1',
    name: 'Woodfired Pizza Margherita D.O.C.',
    description: 'Crafted with San Marzano tomatoes, fresh hand-torn fior di latte mozzarella, fragrant sweet basil, and a drizzle of premium extra virgin olive oil.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    price: 16.00,
    isVeg: true,
    isPopular: true,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 12,
    variants: [
      { id: 'var_1_pizza_10', name: '10 inch Personal', price: 0 },
      { id: 'var_1_pizza_14', name: '14 inch Sharing', price: 5.50 }
    ],
    addons: [
      { id: 'add_1_mushrooms', name: 'Porcini Mushrooms', price: 4.00 },
      { id: 'add_1_prosciutto', name: 'Prosciutto di Parma', price: 5.00 }
    ]
  },
  // Truffle Bistro Antipasti & Salads
  {
    id: 'item_1_caprese',
    categoryId: 'cat_1_sides',
    restaurantId: 'rest_1',
    name: 'Heirloom Caprese Salad',
    description: 'Thick slices of colorful dry-farmed heirloom tomatoes, fresh mozzarella di bufala, organic micro-basil, aged modena balsamic glaze, and sea salt flakes.',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80',
    price: 14.00,
    isVeg: true,
    isPopular: false,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 8,
    variants: [],
    addons: []
  },
  // Truffle Bistro Desserts
  {
    id: 'item_1_tiramisu',
    categoryId: 'cat_1_dessert',
    restaurantId: 'rest_1',
    name: 'Bistro Espresso Tiramisu',
    description: 'Espresso-soaked ladyfinger biscuits layered with rich organic mascarpone sabayon cream, premium dark rum, and dusted with high-grade Dutch cocoa powder.',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    price: 9.50,
    isVeg: true,
    isPopular: true,
    isSpecial: true,
    isAvailable: true,
    prepTimeMinutes: 5,
    variants: [],
    addons: []
  },

  // Sakura Sushi rolls
  {
    id: 'item_2_nigiri',
    categoryId: 'cat_2_sushi',
    restaurantId: 'rest_2',
    name: 'Sake & Maguro Nigiri Platter',
    description: '6-piece premium hand-formed sushi combo: Melt-in-your-mouth Atlantic Salmon (Sake) and Bigeye Tuna (Maguro) over seasoned Koshihikari sushi rice.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
    price: 22.00,
    isVeg: false,
    isPopular: true,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 10,
    variants: [],
    addons: [
      { id: 'add_2_wasabi', name: 'Fresh Grated Wasabi Root', price: 2.50 },
      { id: 'add_2_ginger', name: 'Extra Pickled Ginger', price: 0.50 }
    ]
  },
  {
    id: 'item_2_dragon',
    categoryId: 'cat_2_sushi',
    restaurantId: 'rest_2',
    name: 'Signature Dragon Roll',
    description: 'Crispy jumbo shrimp tempura and cucumber interior, layered with buttery avocado slices, toasted freshwater unagi (eel), finished with sweet kabayaki sauce.',
    image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80',
    price: 18.50,
    isVeg: false,
    isPopular: true,
    isSpecial: true,
    isAvailable: true,
    prepTimeMinutes: 12,
    variants: [],
    addons: [
      { id: 'add_2_tobiko', name: 'Topping of Spicy Tobiko (Fish Roe)', price: 3.00 }
    ]
  },
  // Sakura Sushi Ramen
  {
    id: 'item_2_ramen_miso',
    categoryId: 'cat_2_ramen',
    restaurantId: 'rest_2',
    name: 'Hokkaido Spicy Miso Ramen',
    description: 'Noodles in an 18-hour rich pork bone broth blended with spicy red miso. Topped with rolled pork chashu, soft soy-marinated egg, bamboo shoots, and black garlic oil.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    price: 16.50,
    isVeg: false,
    isPopular: true,
    isSpecial: true,
    isAvailable: true,
    prepTimeMinutes: 15,
    variants: [
      { id: 'var_2_ram_mild', name: 'Mild Heat', price: 0 },
      { id: 'var_2_ram_spicy', name: 'Insane Spicy Heat', price: 0.50 }
    ],
    addons: [
      { id: 'add_2_chashu', name: 'Extra Pork Chashu (2pc)', price: 3.50 },
      { id: 'add_2_ajitama', name: 'Extra Soy-Marinated Soft Egg', price: 2.00 }
    ]
  },
  // Sakura Sushi Desserts
  {
    id: 'item_2_mochi',
    categoryId: 'cat_2_dessert',
    restaurantId: 'rest_2',
    name: 'Artisanal Matcha Mochi Trio',
    description: 'Soft and chewy sweet rice cake pockets containing premium Uji green tea gelato, garnished with toasted black sesame seeds.',
    image: 'https://images.unsplash.com/photo-1505394033343-e3a5cf413143?auto=format&fit=crop&w=600&q=80',
    price: 7.00,
    isVeg: true,
    isPopular: false,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 3,
    variants: [],
    addons: []
  },

  // Burger Lab Burgers
  {
    id: 'item_3_smash',
    categoryId: 'cat_3_burger',
    restaurantId: 'rest_3',
    name: 'The Double Smash Smokehouse',
    description: 'Two ultra-smashed Angus patties with caramelized crispy edges, double American cheese, wood-smoked bacon, crispy onion straws, and house-made bourbon BBQ sauce.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    price: 13.99,
    isVeg: false,
    isPopular: true,
    isSpecial: true,
    isAvailable: true,
    prepTimeMinutes: 10,
    variants: [
      { id: 'var_3_double', name: 'Double Patty (1/3 lb)', price: 0 },
      { id: 'var_3_triple', name: 'Triple Patty (1/2 lb)', price: 3.00 }
    ],
    addons: [
      { id: 'add_3_bacon', name: 'Extra Hickory Bacon', price: 2.00 },
      { id: 'add_3_egg', name: 'Sunny Side Up Fried Egg', price: 1.50 }
    ]
  },
  {
    id: 'item_3_chicken',
    categoryId: 'cat_3_burger',
    restaurantId: 'rest_3',
    name: 'Hot Crispy Nashville Chicken',
    description: 'Crispy southern-fried buttermilk chicken breast coated in a fiery cayenne glaze, with creamy laboratory coleslaw, crinkle pickles, on a buttered brioche bun.',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    price: 12.49,
    isVeg: false,
    isPopular: true,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 11,
    variants: [],
    addons: [
      { id: 'add_3_cheese', name: 'Melted Cheddar Cheese Slice', price: 1.00 }
    ]
  },
  // Burger Lab Sides
  {
    id: 'item_3_truffle_fries',
    categoryId: 'cat_3_sides',
    restaurantId: 'rest_3',
    name: 'Crispy Lab Truffle Fries',
    description: 'Thick hand-cut russet potato fries seasoned with sea salt, white truffle oil, freshly grated imported parmesan, and side of roasted garlic aioli.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    price: 6.99,
    isVeg: true,
    isPopular: true,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 6,
    variants: [],
    addons: []
  },
  // Burger Lab Drinks
  {
    id: 'item_3_shake',
    categoryId: 'cat_3_drinks',
    restaurantId: 'rest_3',
    name: 'Oreo Molecular Milkshake',
    description: 'Velvety vanilla bean shake blended with crushed Oreo cookies, topped with whipped cream, hot fudge drip, and chocolate sprinkles.',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    price: 6.50,
    isVeg: true,
    isPopular: false,
    isSpecial: false,
    isAvailable: true,
    prepTimeMinutes: 4,
    variants: [],
    addons: []
  }
];

export const INITIAL_BANNERS: Banner[] = [
  { id: 'banner_1', restaurantId: 'rest_1', title: 'Truffle Festival', subtitle: 'Receive a free glass of Italian Cabernet Sauvignon with any grand size Truffle Tagliatelle', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', type: 'special', isActive: true },
  { id: 'banner_2', restaurantId: 'rest_1', title: 'BOGO Pizza Mondays', subtitle: 'Order any 14" Woodfired Pizza and get a personal size Margherita completely free!', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', type: 'promo', isActive: true },
  { id: 'banner_3', restaurantId: 'rest_2', title: 'Midweek Zen Hours', subtitle: '15% Off all Sushi rolls every Tuesday & Wednesday from 2:00 PM to 5:00 PM', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', type: 'promo', isActive: true },
];

export const INITIAL_COUPONS: Coupon[] = [
  { id: 'coupon_1', restaurantId: 'rest_1', code: 'TRUFFLE10', discountPercent: 10, minOrderAmount: 20, expiryDate: '2026-12-31' },
  { id: 'coupon_2', restaurantId: 'rest_1', code: 'EATPIZZA', discountFlat: 5, minOrderAmount: 30, expiryDate: '2026-12-31' },
  { id: 'coupon_3', restaurantId: 'rest_2', code: 'SAKURA25', discountPercent: 25, minOrderAmount: 50, maxDiscount: 15, expiryDate: '2026-12-31' },
  { id: 'coupon_4', restaurantId: 'rest_3', code: 'LABBURGER', discountFlat: 3, minOrderAmount: 15, expiryDate: '2026-12-31' },
];

// Historical orders to populate statistics
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_hist_1',
    sessionId: 'sess_hist_1',
    restaurantId: 'rest_1',
    branchId: 'branch_1a',
    tableId: 'table_1_2',
    tableNumber: '02',
    status: OrderStatus.COMPLETED,
    items: [
      {
        id: 'orditem_hist_1',
        itemId: 'item_1_tagliatelle',
        name: 'Truffle Tagliatelle Carbonara',
        quantity: 2,
        price: 24.50,
        selectedVariant: { id: 'var_1_reg', name: 'Regular Portion', price: 0 },
        selectedAddons: [{ id: 'add_1_truffle', name: 'Extra Shaved Truffle (3g)', price: 8.50 }]
      },
      {
        id: 'orditem_hist_2',
        itemId: 'item_1_tiramisu',
        name: 'Bistro Espresso Tiramisu',
        quantity: 1,
        price: 9.50,
        selectedVariant: undefined,
        selectedAddons: []
      }
    ],
    subtotal: 75.50,
    gstAmount: 6.04,
    serviceChargeAmount: 7.55,
    discountAmount: 7.55, // TRUFFLE10 used
    totalAmount: 81.54,
    createdAt: '2026-07-01T15:30:00-07:00',
    updatedAt: '2026-07-01T16:15:00-07:00'
  },
  {
    id: 'ord_hist_2',
    sessionId: 'sess_hist_2',
    restaurantId: 'rest_1',
    branchId: 'branch_1a',
    tableId: 'table_1_4',
    tableNumber: '04',
    status: OrderStatus.SERVED,
    items: [
      {
        id: 'orditem_hist_3',
        itemId: 'item_1_margherita',
        name: 'Woodfired Pizza Margherita D.O.C.',
        quantity: 1,
        price: 16.00,
        selectedVariant: { id: 'var_1_pizza_14', name: '14 inch Sharing', price: 5.50 },
        selectedAddons: [{ id: 'add_1_prosciutto', name: 'Prosciutto di Parma', price: 5.00 }]
      },
      {
        id: 'orditem_hist_4',
        itemId: 'item_1_caprese',
        name: 'Heirloom Caprese Salad',
        quantity: 1,
        price: 14.00,
        selectedVariant: undefined,
        selectedAddons: []
      }
    ],
    subtotal: 40.50,
    gstAmount: 3.24,
    serviceChargeAmount: 4.05,
    discountAmount: 0,
    totalAmount: 47.79,
    createdAt: '2026-07-01T21:00:00-07:00',
    updatedAt: '2026-07-01T21:35:00-07:00'
  },
  {
    id: 'ord_hist_3',
    sessionId: 'sess_hist_3',
    restaurantId: 'rest_2',
    branchId: 'branch_2a',
    tableId: 'table_2_2',
    tableNumber: '11',
    status: OrderStatus.COMPLETED,
    items: [
      {
        id: 'orditem_hist_5',
        itemId: 'item_2_dragon',
        name: 'Signature Dragon Roll',
        quantity: 1,
        price: 18.50,
        selectedVariant: undefined,
        selectedAddons: []
      },
      {
        id: 'orditem_hist_6',
        itemId: 'item_2_ramen_miso',
        name: 'Hokkaido Spicy Miso Ramen',
        quantity: 1,
        price: 16.50,
        selectedVariant: { id: 'var_2_ram_mild', name: 'Mild Heat', price: 0 },
        selectedAddons: [{ id: 'add_2_chashu', name: 'Extra Pork Chashu (2pc)', price: 3.50 }]
      }
    ],
    subtotal: 38.50,
    gstAmount: 1.93,
    serviceChargeAmount: 1.93,
    discountAmount: 0,
    totalAmount: 42.36,
    createdAt: '2026-07-01T19:15:00-07:00',
    updatedAt: '2026-07-01T19:50:00-07:00'
  },
  {
    id: 'ord_hist_4',
    sessionId: 'sess_hist_4',
    restaurantId: 'rest_3',
    branchId: 'branch_3a',
    tableId: 'table_3_2',
    tableNumber: 'A2',
    status: OrderStatus.ACCEPTED,
    items: [
      {
        id: 'orditem_hist_7',
        itemId: 'item_3_smash',
        name: 'The Double Smash Smokehouse',
        quantity: 2,
        price: 13.99,
        selectedVariant: { id: 'var_3_double', name: 'Double Patty (1/3 lb)', price: 0 },
        selectedAddons: [{ id: 'add_3_bacon', name: 'Extra Hickory Bacon', price: 2.00 }]
      },
      {
        id: 'orditem_hist_8',
        itemId: 'item_3_truffle_fries',
        name: 'Crispy Lab Truffle Fries',
        quantity: 2,
        price: 6.99,
        selectedVariant: undefined,
        selectedAddons: []
      }
    ],
    subtotal: 45.96,
    gstAmount: 2.30,
    serviceChargeAmount: 0,
    discountAmount: 3.00, // LABBURGER used
    totalAmount: 45.26,
    createdAt: '2026-07-01T21:45:00-07:00',
    updatedAt: '2026-07-01T21:50:00-07:00'
  }
];
