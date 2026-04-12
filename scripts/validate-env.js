#!/usr/bin/env node

/**
 * Environment validation script
 * Validates that all required environment variables are set and have valid values
 */

// Load .env file before reading process.env
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '../.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env not found — rely on actual environment variables
}

const requiredEnvVars = [
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_ADMIN_EMAILS'
];

const envValidators = {
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

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const missingVars = [];
  const invalidVars = [];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    
    if (value === undefined || value === '') {
      missingVars.push(envVar);
      continue;
    }
    
    const validator = envValidators[envVar];
    if (validator) {
      const error = validator(value);
      if (error) {
        invalidVars.push({ envVar, value, error });
      }
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please set these variables in your .env file');
    process.exit(1);
  }
  
  if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variable values:');
    invalidVars.forEach(({ envVar, value, error }) => {
      console.error(`   - ${envVar}=${value}`);
      console.error(`     ${error}`);
    });
    process.exit(1);
  }
  
  console.log('✅ All environment variables are valid!\n');
  console.log('Environment Summary:');
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    const displayValue = envVar.includes('KEY') || envVar.includes('SECRET') 
      ? '***' + value.slice(-4) 
      : value;
    console.log(`   ${envVar}=${displayValue}`);
  });
  
  // Additional validation for development vs production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.log('\n⚠️  Production environment detected');
    
    // Check for development values in production
    const devPatterns = [
      { var: 'VITE_APPWRITE_ENDPOINT', pattern: /localhost|127\.0\.0\.1/, message: 'Using localhost endpoint in production' },
      { var: 'VITE_APPWRITE_PROJECT_ID', pattern: /test|demo|example/, message: 'Using test/demo project ID in production' },
    ];
    
    const warnings = [];
    devPatterns.forEach(({ var: envVar, pattern, message }) => {
      const value = process.env[envVar];
      if (value && pattern.test(value.toLowerCase())) {
        warnings.push({ envVar, message });
      }
    });
    
    if (warnings.length > 0) {
      console.warn('\n⚠️  Production warnings:');
      warnings.forEach(({ envVar, message }) => {
        console.warn(`   - ${envVar}: ${message}`);
      });
    }
  }
}

// Run validation
import { fileURLToPath as _ftu } from 'url';
if (process.argv[1] === _ftu(import.meta.url)) {
  validateEnvironment();
}

export { validateEnvironment, requiredEnvVars, envValidators };