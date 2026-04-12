#!/usr/bin/env node

/**
 * Script to seed popular products in Appwrite database
 * Run with: node scripts/seed-popular-products.js
 */

import { Client, Databases, ID } from 'appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = 'products';

const popularProducts = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Latest iPhone with advanced camera system and A17 Pro chip',
    price: 1199,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    category: 'Electronics',
    rating: 4.8,
    reviews: 156,
    stock: 25,
    featured: true
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen and incredible camera',
    price: 1099,
    originalPrice: 1199,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    category: 'Electronics',
    rating: 4.7,
    reviews: 89,
    stock: 18,
    featured: true
  },
  {
    name: 'Apple MacBook Air M3',
    description: 'Ultra-thin laptop with M3 chip for incredible performance',
    price: 1299,
    originalPrice: 1399,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    category: 'Electronics',
    rating: 4.9,
    reviews: 234,
    stock: 12,
    featured: true
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones',
    price: 349,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    category: 'Electronics',
    rating: 4.6,
    reviews: 178,
    stock: 45,
    featured: false
  },
  {
    name: 'Apple Watch Series 9',
    description: 'Advanced smartwatch with health monitoring and fitness tracking',
    price: 429,
    originalPrice: 499,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'Electronics',
    rating: 4.5,
    reviews: 267,
    stock: 33,
    featured: true
  },
  {
    name: 'Nike Air Jordan 1 Retro',
    description: 'Classic basketball sneakers with iconic design',
    price: 170,
    originalPrice: 200,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    category: 'Fashion',
    rating: 4.4,
    reviews: 145,
    stock: 67,
    featured: false
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-leg jeans with authentic fit and feel',
    price: 89,
    originalPrice: 120,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    category: 'Fashion',
    rating: 4.3,
    reviews: 89,
    stock: 124,
    featured: false
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Powerful cordless vacuum with laser dust detection',
    price: 649,
    originalPrice: 749,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    category: 'Home & Garden',
    rating: 4.7,
    reviews: 203,
    stock: 15,
    featured: true
  }
];

async function seedPopularProducts() {
  console.log('🌱 Starting to seed popular products...');
  
  try {
    for (const product of popularProducts) {
      try {
        const documentId = ID.unique();
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          documentId,
          {
            ...product,
            documentId
          }
        );
        console.log(`✅ Created product: ${product.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Product already exists: ${product.name}`);
        } else {
          console.error(`❌ Error creating product ${product.name}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Popular products seeding completed!');
    console.log(`📊 Total products processed: ${popularProducts.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding popular products:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedPopularProducts();