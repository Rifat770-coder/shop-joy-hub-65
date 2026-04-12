/**
 * Input sanitization utilities
 * Provides functions to sanitize and validate user inputs to prevent XSS and injection attacks
 */

/**
 * Sanitizes a string by removing potentially dangerous HTML/script tags
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(
    /(on\w+\s*=|javascript:|data:\s*text\/html)/gi,
    match => match.replace(/./g, '*')
  );
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitizes an object by recursively sanitizing all string properties
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, any> = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

/**
 * Validates and sanitizes email address
 * @param email - Email to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes URL
 * @param url - URL to validate
 * @param allowedProtocols - Array of allowed protocols (default: ['http:', 'https:'])
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(
  url: string, 
  allowedProtocols: string[] = ['http:', 'https:']
): string | null {
  if (!url) return null;
  
  try {
    const parsedUrl = new URL(url);
    
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return null;
    }
    
    // Basic sanitization of URL components
    parsedUrl.hash = '';
    
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitizes numeric input
 * @param input - Input to sanitize
 * @param options - Sanitization options
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}
): number | null {
  const { min, max, integer = false, positive = false } = options;
  
  let num: number;
  
  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleaned = input.replace(/[^\d.-]/g, '');
    num = parseFloat(cleaned);
    
    if (isNaN(num)) {
      return null;
    }
  } else {
    return null;
  }
  
  if (integer) {
    num = Math.floor(num);
  }
  
  if (positive && num < 0) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return null;
  }
  
  if (max !== undefined && num > max) {
    return null;
  }
  
  return num;
}

/**
 * Sanitizes password input
 * @param password - Password to sanitize
 * @param options - Password requirements
 * @returns Object with sanitized password and validation result
 */
export function sanitizePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecial?: boolean;
  } = {}
): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
} {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = false,
  } = options;
  
  const errors: string[] = [];
  const sanitized = password.trim();
  
  if (sanitized.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(sanitized)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(sanitized)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(sanitized)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(sanitized)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Remove control characters
  const finalSanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return {
    sanitized: finalSanitized,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Escapes special characters for use in regular expressions
 * @param string - String to escape
 * @returns Escaped string
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates and sanitizes search query
 * @param query - Search query to sanitize
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  let sanitized = sanitizeString(query);
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Creates a sanitization middleware for Express-like applications
 * Note: This is a conceptual example, not tied to any specific framework
 */
export function createSanitizationMiddleware() {
  return (req: any, res: any, next: any) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  };
}

// Export type definitions
export type SanitizationOptions = {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
};