#!/usr/bin/env node

/**
 * Corporate Cleanup Script
 *
 * Removes corporate (B2B) data and schema from Appwrite:
 * - Deletes corporate-related collections: companies, company_users, bulk_orders, purchase_orders
 * - Removes corporate roles from user_roles.role enum
 * - Deletes user_roles documents using corporate roles
 *
 * Usage:
 * node scripts/cleanup-corporate.js
 */

import { Client, Databases, Query } from 'node-appwrite';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function confirmPrompt(message) {
  const answer = (await question(message)).trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
}

async function deleteCollectionIfExists(databases, databaseId, collectionId) {
  try {
    await databases.deleteCollection(databaseId, collectionId);
    console.log(`✅ Deleted collection: ${collectionId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('not found') || message.includes('not exist') || message.includes('404')) {
      console.log(`ℹ️  Collection not found (skipped): ${collectionId}`);
      return;
    }
    throw error;
  }
}

async function deleteCorporateRoleDocs(databases, databaseId, collectionId) {
  const rolesToDelete = ['corporate_admin', 'corporate_user'];
  let deleted = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal('role', rolesToDelete),
        Query.limit(limit),
        Query.offset(offset),
      ]
    );

    if (!response.documents.length) {
      break;
    }

    for (const doc of response.documents) {
      await databases.deleteDocument(databaseId, collectionId, doc.$id);
      deleted += 1;
    }

    if (response.documents.length < limit) {
      break;
    }

    offset += limit;
  }

  console.log(`✅ Deleted ${deleted} corporate role document(s).`);
}

async function updateUserRoleEnum(databases, databaseId, collectionId) {
  try {
    await databases.updateEnumAttribute(
      databaseId,
      collectionId,
      'role',
      ['admin', 'moderator', 'user'],
      false,
      'user'
    );
    console.log('✅ Updated user_roles.role enum to remove corporate roles.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Could not update enum (check permissions or schema state): ${message}`);
  }
}

async function main() {
  console.log('🧹 RealGadget BD Corporate Cleanup');
  console.log('===============================\n');

  const endpoint = (await question('Enter your Appwrite endpoint (default: https://cloud.appwrite.io/v1): ')) || 'https://cloud.appwrite.io/v1';
  const projectId = await question('Enter your Appwrite project ID: ');
  const apiKey = await question('Enter your Appwrite API key: ');
  const databaseId = (await question('Enter database ID (default: main-database): ')) || 'main-database';

  if (!projectId || !apiKey) {
    console.error('❌ Project ID and API key are required!');
    process.exit(1);
  }

  const proceed = await confirmPrompt('\nThis will delete corporate collections and corporate roles. Continue? (y/N): ');
  if (!proceed) {
    console.log('❎ Cancelled. No changes were made.');
    process.exit(0);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    // Delete corporate role docs first (reduces enum update issues with existing docs).
    await deleteCorporateRoleDocs(databases, databaseId, 'user_roles');

    // Update role enum to remove corporate roles.
    await updateUserRoleEnum(databases, databaseId, 'user_roles');

    // Delete corporate collections.
    await deleteCollectionIfExists(databases, databaseId, 'companies');
    await deleteCollectionIfExists(databases, databaseId, 'company_users');
    await deleteCollectionIfExists(databases, databaseId, 'bulk_orders');
    await deleteCollectionIfExists(databases, databaseId, 'purchase_orders');

    console.log('\n✅ Corporate cleanup complete.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
