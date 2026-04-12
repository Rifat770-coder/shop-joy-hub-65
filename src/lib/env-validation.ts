/**
 * Runtime environment validation utilities
 * Ensures environment variables are properly configured at application startup
 */

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  invalidVars: Array<{ var: string; value: string; error: string }>;
  warnings: Array<{ var: string; message: string }>;
}

interface EnvValidator {
  (value: string): string | null; // Returns error message or null if valid
}

const requiredEnvVars = [
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_ADMIN_EMAILS'
] as const;

const envValidators: Record<string, EnvValidator> = {
  'VITE_APPWRITE_PROJECT_ID': (value) => {
    if (!value || value === 'your-appwrite-project-id') {
      return 'Must be a valid Appwrite project ID';
    }
    return null;
  },
  'VITE_APPWRITE_ENDPOINT': (value) => {
    if (!value) {
      return 'Appwrite endpoint is required';
    }
    try {
      new URL(value);
    } catch {
      return 'Must be a valid URL';
    }
    return null;
  },
  'VITE_APPWRITE_DATABASE_ID': (value) => {
    if (!value || value === 'your-appwrite-database-id') {
      return 'Must be a valid Appwrite database ID';
    }
    return null;
  },
  'VITE_ADMIN_EMAILS': (value) => {
    if (!value) {
      return 'At least one admin email is required';
    }
    const emails = value.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return `Invalid email(s): ${invalidEmails.join(', ')}`;
    }
    return null;
  }
};

/**
 * Validates all required environment variables at runtime
 */
export function validateEnvironment(): EnvValidationResult {
  const missingVars: string[] = [];
  const invalidVars: Array<{ var: string; value: string; error: string }> = [];
  const warnings: Array<{ var: string; message: string }> = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = import.meta.env[envVar];

    if (value === undefined || value === '') {
      missingVars.push(envVar);
      continue;
    }

    const validator = envValidators[envVar];
    if (validator) {
      const error = validator(value);
      if (error) {
        invalidVars.push({ var: envVar, value, error });
      }
    }
  }

  // Production-specific warnings
  const isProduction = import.meta.env.PROD;
  if (isProduction) {
    const devPatterns = [
      {
        var: 'VITE_APPWRITE_ENDPOINT',
        pattern: /localhost|127\.0\.0\.1/,
        message: 'Using localhost endpoint in production'
      },
      {
        var: 'VITE_APPWRITE_PROJECT_ID',
        pattern: /test|demo|example/,
        message: 'Using test/demo project ID in production'
      },
    ];

    devPatterns.forEach(({ var: envVar, pattern, message }) => {
      const value = import.meta.env[envVar];
      if (value && pattern.test(value.toLowerCase())) {
        warnings.push({ var: envVar, message });
      }
    });
  }

  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars,
    warnings
  };
}

/**
 * Gets a validated environment variable with type safety
 */
export function getEnvVar<T extends string>(key: string, defaultValue?: T): string | T {
  const value = import.meta.env[key];
  return value !== undefined ? value : (defaultValue as T);
}

/**
 * Ensures environment is valid, throws error if not
 */
export function ensureValidEnvironment(): void {
  const result = validateEnvironment();

  if (!result.isValid) {
    const errors: string[] = [];

    if (result.missingVars.length > 0) {
      errors.push(`Missing required environment variables: ${result.missingVars.join(', ')}`);
    }

    if (result.invalidVars.length > 0) {
      errors.push('Invalid environment variables:');
      result.invalidVars.forEach(({ var: envVar, error }) => {
        errors.push(`  - ${envVar}: ${error}`);
      });
    }

    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('Environment warnings:');
    result.warnings.forEach(({ var: envVar, message }) => {
      console.warn(`  - ${envVar}: ${message}`);
    });
  }
}