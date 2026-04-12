import { useQuery } from '@tanstack/react-query';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Query } from 'appwrite';
import { Product as AppwriteProduct } from '@/integrations/appwrite/types';

export type PopularProduct = AppwriteProduct & {
  id: string;
  popularityScore: number;
};

/**
 * Hook to fetch popular products based on ratings, reviews, and other factors
 */
export const usePopularProducts = (limit: number = 8) => {
  return useQuery({
    queryKey: ['products', 'popular', limit],
    queryFn: async (): Promise<PopularProduct[]> => {
      try {
        // Fetch products with high ratings and reviews first
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [
            Query.orderDesc('rating'),
            Query.orderDesc('reviews'),
            Query.limit(limit * 2) // Fetch more to filter and sort
          ]
        );

        const products = response.documents as AppwriteProduct[];

        // Calculate popularity score and sort
        const popularProducts = products
          .map(product => {
            // Calculate popularity score based on multiple factors
            const reviewScore = (product.reviews || 0) * 0.3; // 30% weight for review count
            const ratingScore = (product.rating || 0) * 15; // Rating out of 5, scaled
            const stockScore = product.stock > 0 ? 10 : 0; // Bonus for in-stock items
            const featuredScore = product.featured ? 20 : 0; // Bonus for featured items
            
            // Recency bonus (newer products get slight boost)
            const createdAt = new Date(product.$createdAt);
            const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const recencyScore = Math.max(0, 10 - (daysSinceCreated / 30)); // Decreases over time
            
            const popularityScore = reviewScore + ratingScore + stockScore + featuredScore + recencyScore;
            
            return {
              ...product,
              id: product.$id,
              popularityScore
            } as PopularProduct;
          })
          .sort((a, b) => b.popularityScore - a.popularityScore)
          .slice(0, limit);

        return popularProducts;
      } catch (error) {
        console.error('Error fetching popular products:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get trending products (products with recent activity)
 */
export const useTrendingProducts = (limit: number = 4) => {
  return useQuery({
    queryKey: ['products', 'trending', limit],
    queryFn: async (): Promise<PopularProduct[]> => {
      try {
        // Fetch recently created or updated products
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [
            Query.orderDesc('$updatedAt'),
            Query.limit(limit * 2)
          ]
        );

        const products = response.documents as AppwriteProduct[];

        // Filter and score trending products
        const trendingProducts = products
          .map(product => {
            const updatedAt = new Date(product.$updatedAt);
            const daysSinceUpdate = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
            
            // Trending score based on recency and engagement
            const recencyScore = Math.max(0, 50 - daysSinceUpdate); // Higher for recent updates
            const engagementScore = (product.reviews || 0) * 2 + (product.rating || 0) * 5;
            const stockScore = product.stock > 0 ? 10 : 0;
            
            const trendingScore = recencyScore + engagementScore + stockScore;
            
            return {
              ...product,
              id: product.$id,
              popularityScore: trendingScore
            } as PopularProduct;
          })
          .filter(product => product.popularityScore > 20) // Filter out low-scoring items
          .sort((a, b) => b.popularityScore - a.popularityScore)
          .slice(0, limit);

        return trendingProducts;
      } catch (error) {
        console.error('Error fetching trending products:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get best-selling products (based on review count as proxy for sales)
 */
export const useBestSellingProducts = (limit: number = 6) => {
  return useQuery({
    queryKey: ['products', 'best-selling', limit],
    queryFn: async (): Promise<PopularProduct[]> => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [
            Query.orderDesc('reviews'), // Use reviews as proxy for sales
            Query.greaterThan('reviews', 0), // Only products with reviews
            Query.limit(limit)
          ]
        );

        const products = response.documents as AppwriteProduct[];

        return products.map(product => ({
          ...product,
          id: product.$id,
          popularityScore: (product.reviews || 0) * 10 + (product.rating || 0) * 5
        })) as PopularProduct[];
      } catch (error) {
        console.error('Error fetching best-selling products:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });
};