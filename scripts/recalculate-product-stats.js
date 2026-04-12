#!/usr/bin/env node

/**
 * Recalculate Product Review Statistics Script
 *
 * This script recalculates and updates the rating and review count for all products
 * based on their existing reviews. This is needed when reviews exist but product
 * statistics haven't been updated.
 *
 * Usage:
 * node scripts/recalculate-product-stats.js
 */

import { Client, Databases, Query } from 'node-appwrite';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔄 Recalculating Product Review Statistics');
  console.log('==========================================\n');

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
      console.error('❌ Database not found.');
      process.exit(1);
    }

    // Get all products
    console.log('\n📦 Fetching products...');
    const productsResponse = await databases.listDocuments(
      databaseId,
      'products'
    );

    const products = productsResponse.documents;
    console.log(`📦 Found ${products.length} products`);

    // Get all reviews
    console.log('\n📦 Fetching reviews...');
    const reviewsResponse = await databases.listDocuments(
      databaseId,
      'reviews'
    );

    const reviews = reviewsResponse.documents;
    console.log(`📦 Found ${reviews.length} reviews`);

    // Group reviews by productId
    const reviewsByProduct = reviews.reduce((acc, review) => {
      const productId = review.productId;
      if (!acc[productId]) {
        acc[productId] = [];
      }
      acc[productId].push(review);
      return acc;
    }, {});

    console.log('\n🔄 Updating product statistics...');

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const productReviews = reviewsByProduct[product.$id] || [];
        const totalReviews = productReviews.length;
        const averageRating = totalReviews > 0
          ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        // Round to 1 decimal place
        const roundedRating = Math.round(averageRating * 10) / 10;

        await databases.updateDocument(
          databaseId,
          'products',
          product.$id,
          {
            rating: roundedRating,
            reviews: totalReviews,
          }
        );

        if (totalReviews > 0) {
          console.log(`✅ Updated ${product.name}: ${totalReviews} reviews, ${roundedRating} rating`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to update ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Statistics recalculation completed!');
    console.log(`✅ Updated ${updatedCount} products`);
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} products had errors`);
    }

  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);