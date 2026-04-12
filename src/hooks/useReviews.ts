import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Review, Profile } from '@/integrations/appwrite/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Query, ID } from 'appwrite';
import { handleAsyncError, logError } from '@/lib/utils';

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    setLoading(true);
    const result = await handleAsyncError(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [
          Query.equal('productId', productId),
          Query.orderDesc('$createdAt')
        ]
      );

      // Fetch author names from profiles
      const reviewsWithNames = await Promise.all(
        response.documents.map(async (review: Review) => {
          const profileResult = await handleAsyncError(async () => {
            const profileResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.PROFILES,
              [Query.equal('userId', review.userId)]
            );
            return profileResponse.documents[0] as Profile;
          }, null, `Failed to fetch profile for user ${review.userId}`);

          return {
            ...review,
            authorName: profileResult?.fullName || profileResult?.username || 'Anonymous User',
          };
        })
      );

      setReviews(reviewsWithNames);

      // Check if current user has already reviewed
      if (user) {
        const existing = reviewsWithNames.find((r) => r.userId === user.$id);
        setUserReview(existing || null);
      }
    }, undefined, 'Failed to fetch reviews');

    if (!result) {
      setReviews([]);
      setUserReview(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, user]);

  const submitReview = async (rating: number, title: string, content: string) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to submit a review.',
        variant: 'destructive',
      });
      return false;
    }

    const result = await handleAsyncError(async () => {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        ID.unique(),
        {
          productId: productId,
          userId: user.$id,
          rating: rating,
          title: title,
          content: content,
          helpfulCount: 0,
          verifiedPurchase: false,
        }
      );

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });

      await fetchReviews();
      await updateProductStats(productId);
      return true;
    }, false, 'Failed to submit review');

    if (!result) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    }

    return result;
  };

  const updateProductStats = async (productId: string) => {
    await handleAsyncError(async () => {
      // Fetch all reviews for this product
      const reviewsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [Query.equal('productId', productId)]
      );

      const reviews = reviewsResponse.documents as Review[];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Update product with new stats
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        productId,
        {
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviews: totalReviews,
        }
      );
    }, undefined, 'Failed to update product statistics');
  };

  const updateReview = async (reviewId: string, rating: number, title: string, content: string) => {
    if (!user) return false;

    const result = await handleAsyncError(async () => {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        reviewId,
        {
          rating: rating,
          title: title,
          content: content,
        }
      );

      toast({
        title: 'Review updated',
        description: 'Your review has been updated.',
      });

      await fetchReviews();
      await updateProductStats(productId);
      return true;
    }, false, 'Failed to update review');

    if (!result) {
      toast({
        title: 'Error',
        description: 'Failed to update review. Please try again.',
        variant: 'destructive',
      });
    }

    return result;
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return false;

    const result = await handleAsyncError(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        reviewId
      );

      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });

      await fetchReviews();
      await updateProductStats(productId);
      return true;
    }, false, 'Failed to delete review');

    if (!result) {
      toast({
        title: 'Error',
        description: 'Failed to delete review. Please try again.',
        variant: 'destructive',
      });
    }

    return result;
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  return {
    reviews,
    loading,
    userReview,
    averageRating,
    ratingDistribution,
    submitReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews,
  };
};
