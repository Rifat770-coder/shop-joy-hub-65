import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names from profiles
      const reviewsWithNames = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', review.user_id)
            .maybeSingle();

          return {
            ...review,
            author_name: profile?.full_name || profile?.username || 'Anonymous User',
          };
        })
      );

      setReviews(reviewsWithNames);

      // Check if current user has already reviewed
      if (user) {
        const existing = reviewsWithNames.find((r) => r.user_id === user.id);
        setUserReview(existing || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to submit a review.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title,
        content,
      });

      if (error) throw error;

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });

      await fetchReviews();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateReview = async (reviewId: string, rating: number, title: string, content: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ rating, title, content })
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Review updated',
        description: 'Your review has been updated.',
      });

      await fetchReviews();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update review.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });

      await fetchReviews();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete review.',
        variant: 'destructive',
      });
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
