#!/usr/bin/env node
/**
 * Migration: Add transactionId attribute to orders collection
 * Run: node scripts/add-transaction-id.js
 */

import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

if (!projectId || !apiKey || !databaseId) {
  console.error('❌ Missing required env vars: VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, VITE_APPWRITE_DATABASE_ID');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('Adding transactionId attribute to orders collection...');
  try {
    await databases.createStringAttribute(databaseId, 'orders', 'transactionId', 255, false);
    console.log('✅ transactionId attribute added successfully.');
    console.log('   Wait ~30 seconds for Appwrite to process, then try placing an order again.');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  transactionId attribute already exists — nothing to do.');
    } else {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    }
  }
}

main();
