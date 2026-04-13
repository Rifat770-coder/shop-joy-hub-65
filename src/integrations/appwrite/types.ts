// Appwrite Document Types
export interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
}

// User Profile
export interface Profile extends AppwriteDocument {
  userId: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  shippingAddress?: string;
}

// Product
export interface Product extends AppwriteDocument {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category: string;
  rating: number;
  reviews: number;
  stock: number;
  featured: boolean;
}

// Order
export interface Order extends AppwriteDocument {
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: 'stripe' | 'paypal' | 'bkash' | 'nagad' | 'cod' | 'card';
  paymentStatus?: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  refundedAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  shippingAddress: string;
  shippingMethod?: ShippingMethod;
}

export interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  quantity: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

// Favorite
export interface Favorite extends AppwriteDocument {
  userId: string;
  productId: string;
}

// Review
export interface Review extends AppwriteDocument {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
  authorName?: string;
}

// Coupon
export interface Coupon extends AppwriteDocument {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  maxUses?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
}

// Store Settings
export interface StoreSetting extends AppwriteDocument {
  key: string;
  value: any;
}

// User Role
export interface UserRole extends AppwriteDocument {
  userId: string;
  role: 'admin' | 'moderator' | 'user';
}

// App Role Enum
export type AppRole = 'admin' | 'moderator' | 'user';

// Store Settings Types
export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  timezone: string;
  showFlashSale: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  enabled: boolean;
}

export interface TaxSettings {
  enableTax: boolean;
  taxRate: number;
  taxName: string;
  includeTaxInPrice: boolean;
}

// Marketplace Features
export interface Vendor extends AppwriteDocument {
  userId: string;
  storeName: string;
  storeDescription?: string;
  logo?: string;
  banner?: string;
  contactEmail: string;
  contactPhone?: string;
  businessAddress: string;
  taxId?: string;
  commissionRate?: number;
  isActive: boolean;
  approvedAt?: string;
  approvedBy?: string;
  totalSales?: number;
  totalCommissions?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Commission extends AppwriteDocument {
  orderId: string;
  vendorId: string;
  productId: string;
  amount: number;
  rate: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  payoutId?: string;
  createdAt?: string;
}

export interface VendorPayout extends AppwriteDocument {
  vendorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paymentMethod?: string;
  reference?: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  createdAt?: string;
}

// Advanced Analytics
export interface CustomerSegment extends AppwriteDocument {
  name: string;
  description?: string;
  criteria: string; // JSON criteria
  customerCount?: number;
  totalValue?: number;
  avgOrderValue?: number;
  createdBy: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalyticsEvent extends AppwriteDocument {
  userId?: string;
  eventType: string;
  eventData: string; // JSON data
  sessionId?: string;
  page?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface InventoryForecast extends AppwriteDocument {
  productId: string;
  forecastDate: string;
  predictedDemand: number;
  confidence?: number; // 0-1 confidence score
  factors?: string; // JSON factors
  createdAt?: string;
}

// Extended Types
export type ExtendedAppRole = 'admin' | 'moderator' | 'user' | 'vendor';

export interface ExtendedUserRole extends UserRole {
  role: ExtendedAppRole;
}

// Extended Product with Vendor
export interface VendorProduct extends Product {
  vendorId?: string;
  vendor?: Vendor;
}
