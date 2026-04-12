#!/usr/bin/env node

/**
 * Product Data Seeding Script
 * 
 * This script populates the Appwrite database with sample product data
 * from the local products.ts file.
 * 
 * Prerequisites:
 * 1. Appwrite project must be set up with collections
 * 2. Environment variables must be configured
 * 
 * Usage:
 * node scripts/seed-products.js
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

// Sample product data (converted from TypeScript)
const sampleProducts = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Electronics',
    rating: 4.8,
    reviews: 2547,
    stock: 45,
    featured: true,
  },
  {
    name: 'Smart Watch Pro',
    description: 'Advanced smartwatch with health monitoring, GPS, and seamless connectivity.',
    price: 349.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Electronics',
    rating: 4.6,
    reviews: 1823,
    stock: 32,
    featured: true,
  },
  {
    name: 'Designer Leather Handbag',
    description: 'Elegant genuine leather handbag with premium craftsmanship.',
    price: 159.99,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Fashion',
    rating: 4.9,
    reviews: 967,
    stock: 18,
    featured: true,
  },
  {
    name: 'Running Shoes Ultra',
    description: 'Lightweight running shoes with advanced cushioning technology.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Sports',
    rating: 4.7,
    reviews: 3421,
    stock: 67,
    featured: true,
  },
  {
    name: 'Organic Skincare Set',
    description: 'Complete skincare routine with natural and organic ingredients.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Beauty',
    rating: 4.5,
    reviews: 1256,
    stock: 89,
    featured: false,
  },
  {
    name: 'Mechanical Keyboard RGB',
    description: 'Professional gaming keyboard with RGB lighting and mechanical switches.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Electronics',
    rating: 4.8,
    reviews: 2134,
    stock: 56,
    featured: true,
  },
  {
    name: 'Cozy Throw Blanket',
    description: 'Ultra-soft fleece blanket perfect for cold winter nights.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Home & Garden',
    rating: 4.6,
    reviews: 876,
    stock: 124,
    featured: false,
  },
  {
    name: 'Bestseller Novel Collection',
    description: 'Collection of top-rated novels from award-winning authors.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop&fm=webp&q=80',
    category: 'Books',
    rating: 4.9,
    reviews: 543,
    stock: 234,
    featured: false,
  },
];

async function main() {
  console.log('🌱 RealGadget BD Product Seeding Script');
  console.log('==================================\n');

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
    console.log('\n🌱 Seeding products...');

    // Check if products collection exists and has data
    try {
      const existingProducts = await databases.listDocuments(databaseId, 'products');
      if (existingProducts.documents.length > 0) {
        const overwrite = await question(`\n⚠️  Found ${existingProducts.documents.length} existing products. Overwrite? (y/N): `);
        if (overwrite.toLowerCase() !== 'y') {
          console.log('❌ Seeding cancelled.');
          process.exit(0);
        }
        
        // Delete existing products
        console.log('🗑️  Deleting existing products...');
        for (const product of existingProducts.documents) {
          await databases.deleteDocument(databaseId, 'products', product.$id);
        }
      }
    } catch (error) {
      console.error('❌ Error checking existing products:', error.message);
      console.log('Make sure the products collection exists and you have the correct permissions.');
      process.exit(1);
    }

    // Insert sample products
    let successCount = 0;
    for (const [index, product] of sampleProducts.entries()) {
      try {
        await databases.createDocument(
          databaseId,
          'products',
          ID.unique(),
          product
        );
        successCount++;
        console.log(`✅ Product ${index + 1}/${sampleProducts.length}: ${product.name}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to create product "${product.name}":`, error.message);
      }
    }

    console.log(`\n🎉 Seeding completed! ${successCount}/${sampleProducts.length} products created successfully.`);
    
    if (successCount > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Start your development server');
      console.log('2. Visit the products page to see the seeded data');
      console.log('3. Test the search and filtering functionality');
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);