/**
 * Client-side rate limiting utilities
 * Provides rate limiting for API calls, user actions, and form submissions
 */

interface RateLimitOptions {
  maxRequests: number;
  timeWindow: number; // in milliseconds
  keyPrefix?: string;
  storage?: Storage;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiter {
  private options: Required<RateLimitOptions>;
  private storage: Storage;

  constructor(options: RateLimitOptions) {
    this.options = {
      keyPrefix: 'rl_',
      storage: localStorage,
      ...options,
    };
    this.storage = this.options.storage;
  }

  /**
   * Check if a request is allowed for the given key
   * @param key - Unique identifier for the rate limit (e.g., user ID, IP, action type)
   * @returns Rate limit result
   */
  check(key: string): RateLimitResult {
    const storageKey = `${this.options.keyPrefix}${key}`;
    const now = Date.now();
    
    try {
      const stored = this.storage.getItem(storageKey);
      
      if (!stored) {
        // First request
        const newRecord = {
          count: 1,
          firstRequestTime: now,
          lastRequestTime: now,
        };
        this.storage.setItem(storageKey, JSON.stringify(newRecord));
        
        return {
          allowed: true,
          remaining: this.options.maxRequests - 1,
          resetTime: now + this.options.timeWindow,
        };
      }
      
      const record = JSON.parse(stored);
      const timeSinceFirstRequest = now - record.firstRequestTime;
      
      if (timeSinceFirstRequest > this.options.timeWindow) {
        // Time window has expired, reset the counter
        const newRecord = {
          count: 1,
          firstRequestTime: now,
          lastRequestTime: now,
        };
        this.storage.setItem(storageKey, JSON.stringify(newRecord));
        
        return {
          allowed: true,
          remaining: this.options.maxRequests - 1,
          resetTime: now + this.options.timeWindow,
        };
      }
      
      // Still within time window
      if (record.count >= this.options.maxRequests) {
        // Rate limit exceeded
        const resetTime = record.firstRequestTime + this.options.timeWindow;
        const retryAfter = resetTime - now;
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.max(0, retryAfter),
        };
      }
      
      // Increment counter
      record.count++;
      record.lastRequestTime = now;
      this.storage.setItem(storageKey, JSON.stringify(record));
      
      return {
        allowed: true,
        remaining: this.options.maxRequests - record.count,
        resetTime: record.firstRequestTime + this.options.timeWindow,
      };
    } catch (error) {
      // If storage fails, allow the request (fail-open for better UX)
      console.warn('Rate limiter storage error:', error);
      return {
        allowed: true,
        remaining: this.options.maxRequests - 1,
        resetTime: now + this.options.timeWindow,
      };
    }
  }

  /**
   * Clear rate limit for a specific key
   * @param key - Key to clear
   */
  clear(key: string): void {
    const storageKey = `${this.options.keyPrefix}${key}`;
    this.storage.removeItem(storageKey);
  }

  /**
   * Get current rate limit status for a key
   * @param key - Key to check
   * @returns Current status or null if no record exists
   */
  getStatus(key: string): Omit<RateLimitResult, 'allowed'> | null {
    const storageKey = `${this.options.keyPrefix}${key}`;
    const now = Date.now();
    
    try {
      const stored = this.storage.getItem(storageKey);
      if (!stored) return null;
      
      const record = JSON.parse(stored);
      const timeSinceFirstRequest = now - record.firstRequestTime;
      
      if (timeSinceFirstRequest > this.options.timeWindow) {
        return null;
      }
      
      const remaining = Math.max(0, this.options.maxRequests - record.count);
      const resetTime = record.firstRequestTime + this.options.timeWindow;
      
      return {
        remaining,
        resetTime,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // API calls: 10 requests per minute
  api: new RateLimiter({
    maxRequests: 10,
    timeWindow: 60 * 1000, // 1 minute
    keyPrefix: 'api_',
  }),
  
  // Form submissions: 5 submissions per minute
  form: new RateLimiter({
    maxRequests: 5,
    timeWindow: 60 * 1000,
    keyPrefix: 'form_',
  }),
  
  // Authentication attempts: 3 attempts per minute
  auth: new RateLimiter({
    maxRequests: 3,
    timeWindow: 60 * 1000,
    keyPrefix: 'auth_',
  }),
  
  // Search requests: 20 requests per minute
  search: new RateLimiter({
    maxRequests: 20,
    timeWindow: 60 * 1000,
    keyPrefix: 'search_',
  }),
};

/**
 * Higher-order function to create a rate-limited function
 * @param fn - Function to rate limit
 * @param limiter - Rate limiter instance
 * @param keyGenerator - Function to generate rate limit key
 * @returns Rate-limited function
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  limiter: RateLimiter,
  keyGenerator: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGenerator(...args);
    const result = limiter.check(key);
    
    if (!result.allowed) {
      throw new RateLimitError(
        'Rate limit exceeded',
        result.remaining,
        result.resetTime,
        result.retryAfter
      );
    }
    
    return fn(...args);
  };
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public remaining: number,
    public resetTime: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * React hook for rate limiting (conceptual example)
 * Note: This would need to be implemented in a React component file
 */
// export function useRateLimit(
//   action: string,
//   options: Partial<RateLimitOptions> = {}
// ) {
//   const [limiter] = useState(() => new RateLimiter({
//     maxRequests: 5,
//     timeWindow: 60000,
//     ...options,
//   }));
//   
//   const check = useCallback((key: string) => {
//     return limiter.check(`${action}_${key}`);
//   }, [limiter, action]);
//   
//   return { check };
// }

/**
 * Utility to format rate limit messages for users
 */
export function formatRateLimitMessage(error: RateLimitError): string {
  if (error.retryAfter) {
    const seconds = Math.ceil(error.retryAfter / 1000);
    if (seconds < 60) {
      return `Please try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      return `Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
    }
  }
  
  return 'Too many requests. Please try again later.';
}

/**
 * Clear all rate limit records (useful for testing or logout)
 */
export function clearAllRateLimits(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('rl_') || key?.startsWith('api_') || 
        key?.startsWith('form_') || key?.startsWith('auth_') || 
        key?.startsWith('search_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export default RateLimiter;