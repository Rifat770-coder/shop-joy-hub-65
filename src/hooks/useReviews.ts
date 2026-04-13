import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Review, Profile } from '@/integrations/appwrite/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Query, ID } from 'appwrite';

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [Query.equal('productId', productId), Query.orderDesc('$createdAt')]
      );

      const reviewsWithNames = await Promise.all(
        response.documents.map(async (review: Review) => {
          try {
            const profileResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.PROFILES,
              [Query.equal('userId', review.userId)]
            );
            const profile = profileResponse.documents[0] as Profile | undefined;
            return {
              ...review,
              authorName: profile?.fullName || profile?.username || 'Anonymous User',
            };
          } catch {
            return { ...review, authorName: 'Anonymous User' };
          }
        })
      );

      setReviews(reviewsWithNames);

      if (user) {
        const existing = reviewsWithNames.find((r) => r.userId === user.$id);
        setUserReview(existing || null);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
      setUserReview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, user]);

  const submitReview = async (rating: number, title: string, content: string) => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to submit a review.', variant: 'destructive' });
      return false;
    }
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.REVIEWS, ID.unique(), {
        productId,
        userId: user.$id,
        rating,
        title,
        content,
        helpfulCount: 0,
        verifiedPurchase: false,
      });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      await fetchReviews();
      await updateProductStats(productId);
      return true;
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
      return false;
    }
  };

  const updateProductStats = async (productId: string) => {
    try {
      const reviewsResponse = await databases.listDocuments(
        DATABASE_ID, COLLECTIONS.REVIEWS, [Query.equal('productId', productId)]
      );
      const allReviews = reviewsResponse.documents as Review[];
      const total = allReviews.length;
      const avg = total > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId, {
        rating: Math.round(avg * 10) / 10,
        reviews: total,
      });
    } catch (error) {
      console.error('Failed to update product stats:', error);
    }
  };

  const updateReview = async (reviewId: string, rating: number, title: string, content: string) => {
    if (!user) return false;
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.REVIEWS, reviewId, { rating, title, content });
      toast({ title: 'Review updated', description: 'Your review has been updated.' });
      await fetchReviews();
      await updateProductStats(productId);
      return true;
    } catch (error) {
      console.error('Failed to update review:', error);
      toast({ title: 'Error', description: 'Failed to update review. Please try again.', variant: 'destructive' });
      return false;
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return false;
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.REVIEWS, reviewId);
      toast({ title: 'Review deleted', description: 'Your review has been removed.' });
      await fetchReviews();
      await updateProductStats(productId);
      return true;
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast({ title: 'Error', description: 'Failed to delete review. Please try again.', variant: 'destructive' });
      return false;
    }
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
