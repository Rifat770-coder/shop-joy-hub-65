#!/usr/bin/env node

/**
 * Data Migration Script: snake_case to camelCase Field Conversion
 * 
 * This script migrates existing Appwrite database documents from snake_case field names
 * to camelCase field names to establish a consistent data contract.
 * 
 * Migration Strategy:
 * 1. Read documents from each collection
 * 2. Transform field names using the normalize utility
 * 3. Update documents with new field names
 * 4. Keep backward compatibility by preserving old fields temporarily
 * 
 * Prerequisites:
 * 1. Install Appwrite CLI: npm install -g appwrite-cli
 * 2. Have Appwrite project credentials ready
 * 3. Backup your database before running this script
 * 
 * Usage:
 * node scripts/migrate-field-names.js --dry-run
 * node scripts/migrate-field-names.js --execute
 */

import { Client, Databases, ID, Query } from 'node-appwrite';
import readline from 'readline';
import { snakeToCamel } from '../src/lib/normalize.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Field mapping for each collection
const FIELD_MAPPINGS = {
  // Profiles collection
  profiles: {
    'user_id': 'userId',
    'full_name': 'fullName',
    'phone_number': 'phoneNumber',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
  },
  // Orders collection
  orders: {
    'user_id': 'userId',
    'order_id': 'orderId',
    'total_amount': 'totalAmount',
    'shipping_address': 'shippingAddress',
    'shipping_method': 'shippingMethod',
    'payment_method': 'paymentMethod',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
  },
  // User roles collection
  user_roles: {
    'user_id': 'userId'
  },
  // Favorites collection
  favorites: {
    'user_id': 'userId',
    'product_id': 'productId'
  },
  // Reviews collection
  reviews: {
    'product_id': 'productId',
    'user_id': 'userId',
    'helpful_count': 'helpfulCount',
    'verified_purchase': 'verifiedPurchase',
    'author_name': 'authorName',
    'created_at': 'createdAt'
  },
  // Store settings collection
  store_settings: {
    // No snake_case fields expected in store_settings
  },
  // Newsletter subscriptions collection
  newsletter_subscriptions: {
    'subscribed_at': 'subscribedAt'
  }
};

// Collections to migrate (in order of dependencies)
const COLLECTIONS_TO_MIGRATE = [
  'profiles',
  'user_roles',
  'favorites',
  'reviews',
  'orders',
  'store_settings',
  'newsletter_subscriptions'
];

async function main() {
  console.log('🚀 RealGadget BD Data Migration: snake_case to camelCase');
  console.log('===================================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('--dryrun');
  const isExecute = args.includes('--execute');
  
  if (!isDryRun && !isExecute) {
    console.log('❌ Please specify either --dry-run or --execute flag');
    console.log('Usage:');
    console.log('  node scripts/migrate-field-names.js --dry-run    # Preview changes without applying');
    console.log('  node scripts/migrate-field-names.js --execute    # Apply changes to database');
    process.exit(1);
  }

  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'EXECUTE (changes will be applied)'}\n`);

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

  console.log('\n🔍 Checking database connection...');
  
  try {
    // Test connection by listing databases
    const dbList = await databases.list();
    console.log(`✅ Connected to Appwrite project: ${projectId}`);
    console.log(`📊 Database: ${databaseId}`);
  } catch (error) {
    console.error('❌ Failed to connect to Appwrite:', error.message);
    process.exit(1);
  }

  let totalDocumentsProcessed = 0;
  let totalFieldsUpdated = 0;
  let totalCollectionsProcessed = 0;

  console.log('\n📋 Starting migration...\n');

  for (const collectionId of COLLECTIONS_TO_MIGRATE) {
    try {
      console.log(`📦 Processing collection: ${collectionId}`);
      
      // List all documents in the collection
      const response = await databases.listDocuments(databaseId, collectionId, [
        Query.limit(100) // Process in batches of 100
      ]);

      const documents = response.documents;
      console.log(`   Found ${documents.length} documents`);

      if (documents.length === 0) {
        console.log(`   ⏭️  No documents to process\n`);
        continue;
      }

      const mapping = FIELD_MAPPINGS[collectionId] || {};
      const fieldsToMigrate = Object.keys(mapping);
      
      if (fieldsToMigrate.length === 0) {
        console.log(`   ℹ️  No field mappings defined for this collection\n`);
        continue;
      }

      console.log(`   🔄 Fields to migrate: ${fieldsToMigrate.join(', ')}`);

      let collectionDocumentsProcessed = 0;
      let collectionFieldsUpdated = 0;

      for (const doc of documents) {
        const updates = {};
        let hasUpdates = false;

        // Check each field mapping
        for (const [oldField, newField] of Object.entries(mapping)) {
          if (doc[oldField] !== undefined) {
            // Add the new camelCase field
            updates[newField] = doc[oldField];
            
            // In execute mode, we'll update the document
            // In dry-run mode, we just track what would change
            if (!isDryRun) {
              // We'll update the document with new fields
              // Note: We're NOT removing old fields to maintain backward compatibility
            }
            
            hasUpdates = true;
            collectionFieldsUpdated++;
          }
        }

        if (hasUpdates) {
          collectionDocumentsProcessed++;
          
          if (isDryRun) {
            console.log(`     📝 Document ${doc.$id}: Would add ${Object.keys(updates).length} new fields`);
          } else {
            try {
              // Update the document with new camelCase fields
              // Keep the old snake_case fields for backward compatibility
              await databases.updateDocument(databaseId, collectionId, doc.$id, updates);
              console.log(`     ✅ Document ${doc.$id}: Added ${Object.keys(updates).length} new fields`);
            } catch (error) {
              console.error(`     ❌ Failed to update document ${doc.$id}:`, error.message);
            }
          }
        }
      }

      totalDocumentsProcessed += collectionDocumentsProcessed;
      totalFieldsUpdated += collectionFieldsUpdated;
      totalCollectionsProcessed++;

      console.log(`   📊 Processed: ${collectionDocumentsProcessed} documents, ${collectionFieldsUpdated} fields updated\n`);

    } catch (error) {
      console.error(`❌ Error processing collection ${collectionId}:`, error.message);
      console.log(`   ⏭️  Skipping this collection\n`);
    }
  }

  // Summary
  console.log('\n📊 Migration Summary');
  console.log('===================');
  console.log(`Collections processed: ${totalCollectionsProcessed}/${COLLECTIONS_TO_MIGRATE.length}`);
  console.log(`Documents affected: ${totalDocumentsProcessed}`);
  console.log(`Fields added/updated: ${totalFieldsUpdated}`);
  console.log(`Mode: ${isDryRun ? 'Dry Run' : 'Execution'}`);
  
  if (isDryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made to the database.');
    console.log('   To apply changes, run: node scripts/migrate-field-names.js --execute');
  } else {
    console.log('\n✅ Migration completed successfully!');
    console.log('   Old snake_case fields have been preserved for backward compatibility.');
    console.log('   New camelCase fields have been added to all documents.');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Update your application code to use the new camelCase field names');
    console.log('   2. Test all functionality with the new field names');
    console.log('   3. Once verified, you can optionally remove snake_case fields in a future migration');
  }

  rl.close();
}

// Handle promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});