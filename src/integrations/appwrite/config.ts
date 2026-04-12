import { Client, Account, Databases, Storage, Functions, Realtime, ExecutionMethod } from 'appwrite';

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || 'your-appwrite-project-id';
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'your-appwrite-database-id';

const isConfigValid = () => {
  return (
    APPWRITE_PROJECT_ID !== 'your-appwrite-project-id' &&
    DATABASE_ID !== 'your-appwrite-database-id'
  );
};

export const isAppwriteConfigured = isConfigValid();

if (!isAppwriteConfigured && typeof window !== 'undefined') {
  console.warn(
    'Appwrite is not configured. Please set your Appwrite credentials in .env file:\n' +
    'VITE_APPWRITE_ENDPOINT=your-endpoint\n' +
    'VITE_APPWRITE_PROJECT_ID=your-project-id\n' +
    'VITE_APPWRITE_DATABASE_ID=your-database-id'
  );
}

// Collection IDs - these will be created in Appwrite
export const COLLECTIONS = {
  PROFILES: 'profiles',
  ORDERS: 'orders',
  FAVORITES: 'favorites',
  REVIEWS: 'reviews',
  PRODUCTS: 'products',
  COUPONS: 'coupons',
  STORE_SETTINGS: 'store_settings',
  FLASH_SALE: 'flash_sale_settings',
  USER_ROLES: 'user_roles',
  USER_BEHAVIOR_EVENTS: 'user_behavior_events',
} as const;

// Function IDs - these should match your deployed Appwrite functions
export const FUNCTION_IDS = {
  CREATE_ORDER: 'create-order',
  SEND_ORDER_CONFIRMATION: 'send-order-confirmation',
  VALIDATE_COUPON: 'validate-coupon',
} as const;

// Initialize Appwrite client
export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);

/**
 * Check if an Appwrite function is available (deployed and accessible)
 * Returns true if function exists and can be called, false otherwise
 */
export async function checkFunctionHealth(functionId: string): Promise<boolean> {
  try {
    // Try to get function details - this will throw if function doesn't exist
    // Note: Appwrite SDK doesn't have a direct "getFunction" method in Functions service
    // Instead, we'll try a lightweight execution or list functions
    // For now, we'll use a simple ping approach
    await functions.createExecution(
      functionId,
      JSON.stringify({ ping: true }),
      false,
      '/',
      ExecutionMethod.GET
    );
    return true;
  } catch (error) {
    // Check error type to determine if function is missing vs other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Function not found errors
    if (
      errorMessage.includes('Function with the requested ID could not be found') ||
      errorMessage.includes('Function with the requested ID could not found') ||
      errorMessage.includes('requested ID could not be found') ||
      errorMessage.includes('Function not found') ||
      errorMessage.includes('function not found')
    ) {
      return false;
    }
    
    // Other errors (permissions, runtime errors) - function exists but may have issues
    // We consider it "healthy" for availability check since it exists
    return true;
  }
}

/**
 * Pre-check function availability and return a fallback-aware executor
 */
export async function createFunctionExecutor(functionId: string) {
  const isAvailable = await checkFunctionHealth(functionId);
  
  return {
    isAvailable,
    async execute<T = unknown>(data?: unknown, fallback?: () => Promise<T>): Promise<T> {
      if (!isAvailable && fallback) {
        console.warn(`Function ${functionId} not available, using fallback`);
        return fallback();
      }
      
      try {
        const response = await functions.createExecution(
          functionId,
          data ? JSON.stringify(data) : '{}',
          false,
          '/',
          ExecutionMethod.POST
        );
        
        return JSON.parse(response.responseBody) as T;
      } catch (error) {
        if (fallback) {
          console.warn(`Function ${functionId} execution failed, using fallback`, error);
          return fallback();
        }
        throw error;
      }
    }
  };
}