/**
 * Shared normalization utilities for Appwrite data
 * Provides consistent camelCase field names across the application
 */

export interface NormalizedOrder {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

export interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

export interface NormalizedCustomer {
  id: string;
  userId: string;
  fullName: string | null;
  username: string | null;
  phone: string | null;
  shippingAddress: string | null;
  createdAt: string;
  email?: string;
  orders: NormalizedOrder[];
}

export interface NormalizedProfile {
  id: string;
  userId: string;
  fullName: string | null;
  username: string | null;
  phone: string | null;
  shippingAddress: string | null;
  avatarUrl: string | null;
  createdAt: string;
  email?: string;
}

export interface NormalizedUserRole {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
}

/**
 * Normalize an order document from Appwrite
 * Handles both camelCase and snake_case field names for backward compatibility
 */
export function normalizeOrder(doc: Record<string, unknown>): NormalizedOrder {
  const rawItems = doc.items;
  let parsedItems: OrderItem[] = [];

  // Parse items which might be array, JSON string, or undefined
  if (Array.isArray(rawItems)) {
    parsedItems = rawItems as OrderItem[];
  } else if (typeof rawItems === 'string') {
    try {
      const candidate = JSON.parse(rawItems);
      if (Array.isArray(candidate)) {
        parsedItems = candidate as OrderItem[];
      }
    } catch {
      parsedItems = [];
    }
  }

  // Determine field values with fallback for both naming conventions
  const id = (doc.$id as string) || (doc.id as string) || '';
  const total = Number(doc.total || 0);
  const status = (doc.status as string) || 'pending';
  
  // shippingAddress: prefer camelCase, fallback to snake_case
  const shippingAddress = 
    (doc.shippingAddress as string) || 
    (doc.shipping_address as string) || 
    '';
  
  // createdAt: prefer Appwrite's $createdAt, fallback to snake_case, then camelCase
  const createdAt = 
    (doc.$createdAt as string) || 
    (doc.created_at as string) || 
    (doc.createdAt as string) || 
    new Date().toISOString();
  
  // updatedAt: similar fallback chain
  const updatedAt = 
    (doc.$updatedAt as string) || 
    (doc.updated_at as string) || 
    (doc.updatedAt as string) || 
    undefined;
  
  // userId: prefer camelCase, fallback to snake_case
  const userId = 
    (doc.userId as string) || 
    (doc.user_id as string) || 
    undefined;

  return {
    id,
    items: parsedItems,
    total,
    status,
    shippingAddress,
    createdAt,
    updatedAt,
    userId,
  };
}

/**
 * Normalize a customer/profile document from Appwrite
 */
export function normalizeProfile(doc: Record<string, unknown>): NormalizedProfile {
  // userId: prefer camelCase, fallback to snake_case
  const userId = (doc.userId as string) || (doc.user_id as string) || '';
  
  // Determine field values with fallback for both naming conventions
  const id = (doc.$id as string) || (doc.id as string) || userId;
  
  // fullName: prefer camelCase, fallback to snake_case
  const fullName = 
    (doc.fullName as string) || 
    (doc.full_name as string) || 
    null;
  
  const username = (doc.username as string) || null;
  const phone = (doc.phone as string) || null;
  
  // shippingAddress: prefer camelCase, fallback to snake_case
  const shippingAddress = 
    (doc.shippingAddress as string) || 
    (doc.shipping_address as string) || 
    null;
  
  // avatarUrl: prefer camelCase, fallback to snake_case  
  const avatarUrl = 
    (doc.avatarUrl as string) || 
    (doc.avatar_url as string) || 
    null;
  
  // createdAt: prefer Appwrite's $createdAt, fallback to snake_case, then camelCase
  const createdAt = 
    (doc.$createdAt as string) || 
    (doc.created_at as string) || 
    (doc.createdAt as string) || 
    new Date().toISOString();
  
  const email = (doc.email as string) || undefined;

  return {
    id,
    userId,
    fullName,
    username,
    phone,
    shippingAddress,
    avatarUrl,
    createdAt,
    email,
  };
}

/**
 * Normalize a customer with their orders
 */
export function normalizeCustomer(
  doc: Record<string, unknown>,
  allOrders: NormalizedOrder[]
): NormalizedCustomer {
  const profile = normalizeProfile(doc);
  const userId = profile.userId;
  
  // Filter orders by userId
  const orders = allOrders.filter((order) => order.userId === userId);

  return {
    ...profile,
    orders,
  };
}

/**
 * Normalize a user role document
 */
export function normalizeUserRole(doc: Record<string, unknown>): NormalizedUserRole {
  const id = (doc.$id as string) || (doc.id as string) || '';
  
  // userId: prefer camelCase, fallback to snake_case
  const userId = 
    (doc.userId as string) || 
    (doc.user_id as string) || 
    '';
  
  const role = (doc.role as string) || 'user';
  
  // createdAt: prefer Appwrite's $createdAt, fallback to snake_case, then camelCase
  const createdAt = 
    (doc.$createdAt as string) || 
    (doc.created_at as string) || 
    (doc.createdAt as string) || 
    new Date().toISOString();

  return {
    id,
    userId,
    role,
    createdAt,
  };
}

/**
 * Helper to extract a field value with camelCase priority
 */
export function getField<T>(
  doc: Record<string, unknown>, 
  camelCaseKey: string, 
  snakeCaseKey: string, 
  defaultValue: T
): T {
  return (doc[camelCaseKey] as T) || (doc[snakeCaseKey] as T) || defaultValue;
}

/**
 * Convert snake_case object keys to camelCase
 * Useful for data migration
 */
export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  
  return result;
}