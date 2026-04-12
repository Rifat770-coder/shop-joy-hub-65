#!/usr/bin/env node

/**
 * Appwrite Project Setup Script
 * 
 * This script helps set up the Appwrite project with all required collections,
 * attributes, and permissions for the RealGadget BD e-commerce application.
 * 
 * ⚡ CAN BE RUN MULTIPLE TIMES: This script is safe to run multiple times. It will:
 *   - Skip creating collections that already exist
 *   - Add new attributes to existing collections
 *   - Create new indexes
 *   - Skip attributes/indexes that already exist
 * 
 * USE CASE: When you get errors like "Invalid document structure: Unknown attribute"
 *   1. Update this script with new attributes in the collection definitions
 *   2. Run the script again: node scripts/setup-appwrite.js
 *   3. It will add the missing attributes to your existing collections
 * 
 * Prerequisites:
 * 1. Install Appwrite CLI: npm install -g appwrite-cli
 * 2. Create an Appwrite project at https://cloud.appwrite.io
 * 3. Get your project ID and API key
 * 4. Login to Appwrite CLI: appwrite login
 * 
 * Usage:
 * node scripts/setup-appwrite.js
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
  console.log('🚀 RealGadget BD Appwrite Setup Script');
  console.log('=====================================\n');

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
    console.log('\n📦 Creating database...');
    
    // Create database
    try {
      await databases.create(databaseId, 'RealGadget BD Database');
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Collection definitions
    const collections = [
      {
        id: 'profiles',
        name: 'User Profiles',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'username', type: 'string', size: 255, required: false },
          { key: 'fullName', type: 'string', size: 255, required: false },
          { key: 'avatarUrl', type: 'url', required: false },
          { key: 'phone', type: 'string', size: 50, required: false },
          { key: 'shippingAddress', type: 'string', size: 1000, required: false },
        ],
        indexes: [
          { key: 'userId', type: 'key', attributes: ['userId'] }
        ]
      },
      {
        id: 'products',
        name: 'Products',
        attributes: [
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'description', type: 'string', size: 2000, required: false },
          { key: 'price', type: 'double', required: true },
          { key: 'image', type: 'url', required: false },
          { key: 'category', type: 'string', size: 100, required: true },
          { key: 'rating', type: 'double', required: false, default: 0 },
          { key: 'reviews', type: 'integer', required: false, default: 0 },
          { key: 'stock', type: 'integer', required: false, default: 0 },
          { key: 'featured', type: 'boolean', required: false, default: false },
        ],
        indexes: [
          { key: 'category', type: 'key', attributes: ['category'] },
          { key: 'featured', type: 'key', attributes: ['featured'] }
        ]
      },
      {
        id: 'orders',
        name: 'Orders',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'items', type: 'string', size: 10000, required: true }, // JSON string
          { key: 'total', type: 'double', required: true },
          { key: 'status', type: 'enum', elements: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], required: false, default: 'pending' },
          { key: 'shippingAddress', type: 'string', size: 1000, required: true },
          { key: 'shippingMethod', type: 'string', size: 1000, required: false }, // JSON string
          // Payment Integration attributes
          { key: 'paymentMethod', type: 'string', size: 100, required: false }, // stripe, paypal, bkash, nagad, cod
          { key: 'paymentStatus', type: 'enum', elements: ['pending', 'authorized', 'paid', 'failed', 'refunded'], required: false, default: 'pending' },
          { key: 'transactionId', type: 'string', size: 255, required: false }, // bKash / Nagad transaction ID
          { key: 'refundedAmount', type: 'double', required: false, default: 0 },
          { key: 'refundReason', type: 'string', size: 500, required: false },
          { key: 'refundedAt', type: 'datetime', required: false },
        ],
        indexes: [
          { key: 'userId', type: 'key', attributes: ['userId'] },
          { key: 'status', type: 'key', attributes: ['status'] },
          { key: 'paymentStatus', type: 'key', attributes: ['paymentStatus'] }
        ]
      },
      {
        id: 'favorites',
        name: 'User Favorites',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'productId', type: 'string', size: 255, required: true },
        ],
        indexes: [
          { key: 'userId', type: 'key', attributes: ['userId'] },
          { key: 'productId', type: 'key', attributes: ['productId'] },
          { key: 'userProduct', type: 'unique', attributes: ['userId', 'productId'] }
        ]
      },
      {
        id: 'reviews',
        name: 'Product Reviews',
        attributes: [
          { key: 'productId', type: 'string', size: 255, required: true },
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'rating', type: 'integer', required: true, min: 1, max: 5 },
          { key: 'title', type: 'string', size: 255, required: true },
          { key: 'content', type: 'string', size: 2000, required: true },
          { key: 'helpfulCount', type: 'integer', required: false, default: 0 },
          { key: 'verifiedPurchase', type: 'boolean', required: false, default: false },
          { key: 'authorName', type: 'string', size: 255, required: false },
        ],
        indexes: [
          { key: 'productId', type: 'key', attributes: ['productId'] },
          { key: 'userId', type: 'key', attributes: ['userId'] }
        ]
      },
      {
        id: 'coupons',
        name: 'Discount Coupons',
        attributes: [
          { key: 'code', type: 'string', size: 50, required: true },
          { key: 'description', type: 'string', size: 255, required: false },
          { key: 'discountType', type: 'enum', elements: ['percentage', 'fixed'], required: true },
          { key: 'discountValue', type: 'double', required: true },
          { key: 'minimumOrder', type: 'double', required: false, default: 0 },
          { key: 'maxUses', type: 'integer', required: false },
          { key: 'usedCount', type: 'integer', required: false, default: 0 },
          { key: 'startsAt', type: 'datetime', required: false },
          { key: 'expiresAt', type: 'datetime', required: false },
          { key: 'isActive', type: 'boolean', required: false, default: true },
        ],
        indexes: [
          { key: 'code', type: 'unique', attributes: ['code'] },
          { key: 'isActive', type: 'key', attributes: ['isActive'] }
        ]
      },
      {
        id: 'store_settings',
        name: 'Store Settings',
        attributes: [
          { key: 'key', type: 'string', size: 100, required: true },
          { key: 'value', type: 'string', size: 2000, required: true }, // JSON string
        ],
        indexes: [
          { key: 'key', type: 'unique', attributes: ['key'] }
        ]
      },
      {
        id: 'user_roles',
        name: 'User Roles',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'role', type: 'enum', elements: ['admin', 'moderator', 'user'], required: false, default: 'user' },
        ],
        indexes: [
          { key: 'userId', type: 'unique', attributes: ['userId'] },
          { key: 'role', type: 'key', attributes: ['role'] }
        ]
      },
      {
        id: 'newsletter_subscriptions',
        name: 'Newsletter Subscriptions',
        attributes: [
          { key: 'email', type: 'email', required: true },
          { key: 'subscribedAt', type: 'datetime', required: true },
        ],
        indexes: [
          { key: 'email', type: 'unique', attributes: ['email'] }
        ]
      },
      {
        id: 'user_behavior_events',
        name: 'User Behavior Events',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: false },
          { key: 'sessionId', type: 'string', size: 255, required: true },
          { key: 'eventType', type: 'string', size: 50, required: true },
          { key: 'eventData', type: 'string', size: 5000, required: false },
          { key: 'page', type: 'string', size: 500, required: true },
          { key: 'coordinates', type: 'string', size: 5000, required: false },
          { key: 'timestamp', type: 'datetime', required: true },
        ],
        indexes: [
          { key: 'eventType', type: 'key', attributes: ['eventType'] },
          { key: 'page', type: 'key', attributes: ['page'] },
          { key: 'timestamp', type: 'key', attributes: ['timestamp'] }
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
                attr.required, 
                attr.default
              );
              break;
            case 'url':
              attributePromise = databases.createUrlAttribute(
                databaseId, 
                collection.id, 
                attr.key, 
                attr.required, 
                attr.default
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
          }

          await attributePromise;
          console.log(`    ✅ Attribute '${attr.key}' created`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          if (error.code === 409) {
            console.log(`    ℹ️  Attribute '${attr.key}' already exists`);
          } else {
            console.error(`    ❌ Error creating attribute '${attr.key}':`, error.message);
          }
        }
      }

      // Create indexes
      if (collection.indexes) {
        console.log(`  🔍 Creating indexes for ${collection.name}...`);
        for (const index of collection.indexes) {
          try {
            await databases.createIndex(
              databaseId,
              collection.id,
              index.key,
              index.type,
              index.attributes
            );
            console.log(`    ✅ Index '${index.key}' created`);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            if (error.code === 409) {
              console.log(`    ℹ️  Index '${index.key}' already exists`);
            } else {
              console.error(`    ❌ Error creating index '${index.key}':`, error.message);
            }
          }
        }
      }
    }

    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with the correct values:');
    console.log(`   VITE_APPWRITE_PROJECT_ID="${projectId}"`);
    console.log(`   VITE_APPWRITE_ENDPOINT="${endpoint}"`);
    console.log(`   VITE_APPWRITE_DATABASE_ID="${databaseId}"`);
    console.log('2. Deploy the Appwrite Functions in the appwrite/functions/ directory');
    console.log('3. Set up appropriate permissions for each collection');
    console.log('4. Import your existing data using the data migration script');
    console.log('5. Test all functionality');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);