#!/usr/bin/env node

/**
 * Review Collection Repair Script
 * 
 * Fixes the helpfulCount and verifiedPurchase attributes
 * These attributes need to be optional (not required) to have default values
 */

import { Client, Databases } from 'node-appwrite';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Review Collection Repair Script');
  console.log('=====================================\n');

  const endpoint = await question('Enter your Appwrite endpoint (default: https://cloud.appwrite.io/v1): ') || 'https://cloud.appwrite.io/v1';
  const projectId = await question('Enter your Appwrite project ID: ');
  const apiKey = await question('Enter your Appwrite API key: ');
  const databaseId = await question('Enter database ID (default: main-database): ') || 'main-database';

  if (!projectId || !apiKey) {
    console.error('❌ Project ID and API key are required!');
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    console.log('\n🔍 Checking reviews collection...\n');

    // Get current collection
    const collection = await databases.getCollection(databaseId, 'reviews');
    console.log('📋 Current reviews collection attributes:');
    const attrMap = {};
    collection.attributes.forEach(attr => {
      attrMap[attr.key] = true;
      console.log(`  - ${attr.key}: ${attr.type} (required: ${attr.required})`);
    });

    // Check for missing attributes
    const neededAttributes = [
      { key: 'helpfulCount', type: 'integer', required: false },
      { key: 'verifiedPurchase', type: 'boolean', required: false }
    ];

    const missingAttrs = neededAttributes.filter(attr => !attrMap[attr.key]);

    if (missingAttrs.length === 0) {
      console.log('\n✅ All required attributes exist. Your collection is ready to use!');
      rl.close();
      return;
    }

    console.log('\n⚠️  Missing attributes:');
    missingAttrs.forEach(attr => {
      console.log(`  - ${attr.key}: ${attr.type}`);
    });

    // Add missing attributes
    console.log('\n📝 Adding missing attributes...');
    for (const attr of missingAttrs) {
      try {
        let promise;
        
        switch (attr.type) {
          case 'integer':
            promise = databases.createIntegerAttribute(
              databaseId,
              'reviews',
              attr.key,
              attr.required || false
            );
            break;
          case 'boolean':
            promise = databases.createBooleanAttribute(
              databaseId,
              'reviews',
              attr.key,
              attr.required || false
            );
            break;
          default:
            console.log(`⚠️  Skipping ${attr.key} - unsupported type`);
            continue;
        }

        await promise;
        console.log(`  ✅ Attribute '${attr.key}' created successfully!`);
      } catch (error) {
        console.error(`  ❌ Error creating '${attr.key}':\n    ${error.message}`);
      }
    }

    console.log('\n✅ Reviews collection is now properly configured!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
