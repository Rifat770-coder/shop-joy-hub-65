#!/usr/bin/env node

/**
 * Phase 4 Enterprise Features Migration Script
 *
 * This script adds the database schema changes required for Phase 4 Enterprise Features:
 * - Marketplace Features: Multi-vendor support, Commission management, Vendor dashboards
 * - Advanced Analytics: Predictive analytics, Customer segmentation, Inventory forecasting
 *
 * ⚡ CAN BE RUN MULTIPLE TIMES: This script is safe to run multiple times.
 *
 * Prerequisites:
 * 1. Install Appwrite CLI: npm install -g appwrite-cli
 * 2. Have an existing Appwrite project with the base RealGadget BD collections
 * 3. Login to Appwrite CLI: appwrite login
 *
 * Usage:
 * node scripts/migrate-phase4-enterprise.js
 */

import { Client, Databases, ID } from 'node-appwrite';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 RealGadget BD Phase 4 Enterprise Features Migration');
  console.log('================================================\n');

  // Get project details from user
  const endpoint = await question('Enter your Appwrite endpoint (default: https://cloud.appwrite.io/v1): ') || 'https://cloud.appwrite.io/v1';
  const projectId = await question('Enter your Appwrite project ID: ');
  const apiKey = await question('Enter your Appwrite API key: ');
  const databaseId = await question('Enter database ID (default: main-database): ') || 'main-database';

  if (!projectId || !apiKey) {
    console.error('❌ Project ID and API key are required!');
    process.exit(1);
  }

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    console.log('\n📦 Checking database...');

    // Verify database exists
    try {
      await databases.get(databaseId);
      console.log('✅ Database found');
    } catch (error) {
      console.error('❌ Database not found. Please run the base setup script first.');
      process.exit(1);
    }

    // Phase 4 Collection definitions
    const collections = [
      // Marketplace Features Collections
      {
        id: 'vendors',
        name: 'Vendors',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'storeName', type: 'string', size: 255, required: true },
          { key: 'storeDescription', type: 'string', size: 1000, required: false },
          { key: 'logo', type: 'url', required: false },
          { key: 'banner', type: 'url', required: false },
          { key: 'contactEmail', type: 'email', required: true },
          { key: 'contactPhone', type: 'string', size: 50, required: false },
          { key: 'businessAddress', type: 'string', size: 1000, required: true },
          { key: 'taxId', type: 'string', size: 100, required: false },
          { key: 'commissionRate', type: 'double', required: false, default: 10.0 },
          { key: 'isActive', type: 'boolean', required: false, default: false },
          { key: 'approvedAt', type: 'datetime', required: false },
          { key: 'approvedBy', type: 'string', size: 255, required: false },
          { key: 'totalSales', type: 'double', required: false, default: 0 },
          { key: 'totalCommissions', type: 'double', required: false, default: 0 },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'userId', type: 'unique', attributes: ['userId'] },
          { key: 'storeName', type: 'key', attributes: ['storeName'] },
          { key: 'isActive', type: 'key', attributes: ['isActive'] }
        ]
      },
      {
        id: 'commissions',
        name: 'Commissions',
        attributes: [
          { key: 'orderId', type: 'string', size: 255, required: true },
          { key: 'vendorId', type: 'string', size: 255, required: true },
          { key: 'productId', type: 'string', size: 255, required: true },
          { key: 'amount', type: 'double', required: true },
          { key: 'rate', type: 'double', required: true },
          { key: 'status', type: 'enum', elements: ['pending', 'paid', 'cancelled'], required: true, default: 'pending' },
          { key: 'paidAt', type: 'datetime', required: false },
          { key: 'payoutId', type: 'string', size: 255, required: false },
          { key: 'createdAt', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'orderId', type: 'key', attributes: ['orderId'] },
          { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
          { key: 'productId', type: 'key', attributes: ['productId'] },
          { key: 'status', type: 'key', attributes: ['status'] }
        ]
      },
      {
        id: 'vendor_payouts',
        name: 'Vendor Payouts',
        attributes: [
          { key: 'vendorId', type: 'string', size: 255, required: true },
          { key: 'amount', type: 'double', required: true },
          { key: 'status', type: 'enum', elements: ['pending', 'processing', 'paid', 'failed'], required: true, default: 'pending' },
          { key: 'paymentMethod', type: 'string', size: 100, required: false },
          { key: 'reference', type: 'string', size: 255, required: false },
          { key: 'processedAt', type: 'datetime', required: false },
          { key: 'processedBy', type: 'string', size: 255, required: false },
          { key: 'notes', type: 'string', size: 500, required: false },
          { key: 'createdAt', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
          { key: 'status', type: 'key', attributes: ['status'] }
        ]
      },

      // Advanced Analytics Collections
      {
        id: 'customer_segments',
        name: 'Customer Segments',
        attributes: [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'description', type: 'string', size: 500, required: false },
          { key: 'criteria', type: 'string', size: 2000, required: true }, // JSON criteria
          { key: 'customerCount', type: 'integer', required: false, default: 0 },
          { key: 'totalValue', type: 'double', required: false, default: 0 },
          { key: 'avgOrderValue', type: 'double', required: false, default: 0 },
          { key: 'createdBy', type: 'string', size: 255, required: true },
          { key: 'isActive', type: 'boolean', required: false, default: true },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'name', type: 'key', attributes: ['name'] },
          { key: 'isActive', type: 'key', attributes: ['isActive'] },
          { key: 'createdBy', type: 'key', attributes: ['createdBy'] }
        ]
      },
      {
        id: 'analytics_events',
        name: 'Analytics Events',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: false },
          { key: 'eventType', type: 'string', size: 100, required: true },
          { key: 'eventData', type: 'string', size: 2000, required: true }, // JSON data
          { key: 'sessionId', type: 'string', size: 255, required: false },
          { key: 'page', type: 'string', size: 500, required: false },
          { key: 'timestamp', type: 'datetime', required: true },
          { key: 'userAgent', type: 'string', size: 500, required: false },
          { key: 'ipAddress', type: 'string', size: 45, required: false }
        ],
        indexes: [
          { key: 'userId', type: 'key', attributes: ['userId'] },
          { key: 'eventType', type: 'key', attributes: ['eventType'] },
          { key: 'timestamp', type: 'key', attributes: ['timestamp'] }
        ]
      },
      {
        id: 'inventory_forecasts',
        name: 'Inventory Forecasts',
        attributes: [
          { key: 'productId', type: 'string', size: 255, required: true },
          { key: 'forecastDate', type: 'datetime', required: true },
          { key: 'predictedDemand', type: 'integer', required: true },
          { key: 'confidence', type: 'double', required: false }, // 0-1 confidence score
          { key: 'factors', type: 'string', size: 1000, required: false }, // JSON factors
          { key: 'createdAt', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'productId', type: 'key', attributes: ['productId'] },
          { key: 'forecastDate', type: 'key', attributes: ['forecastDate'] }
        ]
      }
    ];

    // Create collections
    for (const collection of collections) {
      console.log(`\n📁 Creating collection: ${collection.name}...`);

      try {
        await databases.createCollection(databaseId, collection.id, collection.name);
        console.log(`✅ Collection '${collection.name}' created`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Collection '${collection.name}' already exists`);
        } else {
          throw error;
        }
      }

      // Create attributes
      console.log(`  📝 Creating attributes for ${collection.name}...`);
      for (const attr of collection.attributes) {
        try {
          let attributePromise;

          switch (attr.type) {
            case 'string':
              attributePromise = databases.createStringAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.size,
                attr.required,
                attr.default
              );
              break;
            case 'integer':
              attributePromise = databases.createIntegerAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                attr.min,
                attr.max,
                attr.default
              );
              break;
            case 'double':
              attributePromise = databases.createFloatAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                attr.min,
                attr.max,
                attr.default
              );
              break;
            case 'boolean':
              attributePromise = databases.createBooleanAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                attr.default
              );
              break;
            case 'datetime':
              attributePromise = databases.createDatetimeAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                attr.default
              );
              break;
            case 'email':
              attributePromise = databases.createEmailAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required
              );
              break;
            case 'enum':
              attributePromise = databases.createEnumAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.elements,
                attr.required,
                attr.default
              );
              break;
            case 'url':
              attributePromise = databases.createUrlAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required
              );
              break;
            default:
              console.log(`⚠️  Skipping unknown attribute type: ${attr.type}`);
              continue;
          }

          await attributePromise;
          console.log(`    ✅ Created attribute: ${attr.key}`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`    ℹ️  Attribute '${attr.key}' already exists`);
          } else {
            console.log(`    ❌ Failed to create attribute '${attr.key}': ${error.message}`);
          }
        }
      }

      // Create indexes
      console.log(`  🔍 Creating indexes for ${collection.name}...`);
      for (const index of collection.indexes || []) {
        try {
          await databases.createIndex(
            databaseId,
            collection.id,
            index.key,
            index.type,
            index.attributes
          );
          console.log(`    ✅ Created index: ${index.key}`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`    ℹ️  Index '${index.key}' already exists`);
          } else {
            console.log(`    ❌ Failed to create index '${index.key}': ${error.message}`);
          }
        }
      }
    }

    // Extend existing collections with new attributes
    console.log('\n🔧 Extending existing collections...');

    // Extend products collection with vendorId
    console.log('  📝 Adding vendorId to products collection...');
    try {
      await databases.createStringAttribute(
        databaseId,
        'products',
        'vendorId',
        255,
        false, // not required for backward compatibility
        null
      );
      console.log('    ✅ Added vendorId to products');
    } catch (error) {
      if (error.code === 409) {
        console.log('    ℹ️  vendorId already exists in products');
      } else {
        console.log(`    ❌ Failed to add vendorId: ${error.message}`);
      }
    }

    // Extend user_roles with new roles
    console.log('  📝 Updating user_roles enum...');
    try {
      // Note: Appwrite doesn't allow modifying enum elements directly
      // We'll handle this in the application logic
      console.log('    ℹ️  User roles will be extended in application logic');
    } catch (error) {
      console.log(`    ❌ Error updating roles: ${error.message}`);
    }

    console.log('\n🎉 Phase 4 Enterprise Features migration completed!');
    console.log('\nNext steps:');
    console.log('1. Update your TypeScript types in src/types/index.ts');
    console.log('2. Implement the new hooks and components');
    console.log('3. Update authentication and routing');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);