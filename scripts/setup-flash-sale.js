#!/usr/bin/env node

/**
 * Script to setup Flash Sale collection in Appwrite database
 * Run with: node scripts/setup-flash-sale.js
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

const API_KEY = process.env.APPWRITE_API_KEY || '';
if (!API_KEY) {
  console.error('❌ Missing APPWRITE_API_KEY. Create a server API key with collections.write scope.');
  process.exit(1);
}

client.setKey(API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';

async function setupFlashSaleCollection() {
  console.log('🚀 Setting up Flash Sale collection...');
  
  try {
    // Create flash_sale_settings collection
    try {
      await databases.createCollection(
        DATABASE_ID,
        'flash_sale_settings',
        'Flash Sale Settings',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );

      console.log('✅ Created flash_sale_settings collection');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠️  Flash Sale collection already exists');
      } else {
        throw error;
      }
    }

    // Create attributes
    const attributes = [
      { key: 'isActive', type: 'boolean', required: true, default: false },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'subtitle', type: 'string', size: 500, required: false },
      { key: 'discountPercentage', type: 'integer', required: true, min: 1, max: 99 },
      { key: 'startDate', type: 'datetime', required: true },
      { key: 'endDate', type: 'datetime', required: true },
      { key: 'backgroundColor', type: 'string', size: 255, required: true },
      { key: 'textColor', type: 'string', size: 100, required: true },
      { key: 'buttonText', type: 'string', size: 100, required: true },
      { key: 'targetUrl', type: 'string', size: 255, required: true },
      { key: 'categories', type: 'string', size: 1000, required: false, array: true },
      { key: 'products', type: 'string', size: 1000, required: false, array: true }
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            'flash_sale_settings',
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            'flash_sale_settings',
            attr.key,
            attr.required,
            attr.min,
            attr.max
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            'flash_sale_settings',
            attr.key,
            attr.required
          );
        } else if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'flash_sale_settings',
            attr.key,
            attr.size,
            attr.required,
            undefined,
            attr.array || false
          );
        }
        
        console.log(`✅ Created attribute: ${attr.key}`);
        
        // Wait a bit between attribute creations
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`❌ Error creating attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Create a default flash sale setting
    try {
      const defaultFlashSale = {
        isActive: false,
        title: 'Up to 70% Off',
        subtitle: 'Electronics, fashion & more. Limited stock available!',
        discountPercentage: 70,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        backgroundColor: 'from-orange-400 via-pink-400 to-purple-500',
        textColor: 'text-white',
        buttonText: 'Shop Now',
        targetUrl: '/deals',
        categories: [],
        products: []
      };

      await databases.createDocument(
        DATABASE_ID,
        'flash_sale_settings',
        ID.unique(),
        defaultFlashSale
      );

      console.log('✅ Created default flash sale settings');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠️  Default flash sale settings already exist');
      } else {
        console.error('❌ Error creating default flash sale settings:', error.message);
      }
    }

    console.log('🎉 Flash Sale collection setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up Flash Sale collection:', error);
    process.exit(1);
  }
}

// Run the setup function
setupFlashSaleCollection();