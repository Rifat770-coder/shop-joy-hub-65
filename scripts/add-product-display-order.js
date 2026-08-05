#!/usr/bin/env node
/**
 * Migration: Add the optional displayOrder attribute to products.
 * Run: node scripts/add-product-display-order.js
 */

import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(scriptDirectory, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
// Tolerate an accidentally unmatched quote around the key in local .env.
const apiKey = process.env.APPWRITE_API_KEY?.trim().replace(/^["']|["']$/g, '');
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

if (!projectId || !apiKey || !databaseId) {
  console.error(
    'Missing required env vars: VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, VITE_APPWRITE_DATABASE_ID'
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log('Adding displayOrder attribute to products collection...');
  try {
    await databases.createIntegerAttribute(
      databaseId,
      'products',
      'displayOrder',
      false,
      1
    );
    console.log('displayOrder attribute added successfully.');
  } catch (error) {
    if (error.code === 409) {
      console.log('displayOrder attribute already exists — nothing to do.');
      return;
    }
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

main();
