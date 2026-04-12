import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Error handling utilities
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

export class ApplicationError extends Error implements AppError {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.details = details;
  }
}

// Standardized error handler for async operations
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  errorMessage = 'An error occurred'
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);

    // In development, re-throw for debugging
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }

    return fallbackValue;
  }
};

// Error logging utility
export const logError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage;

  console.error(logMessage, error);
};

// Safe JSON parse with fallback
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

// Type guard for checking if value is an error
export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};
