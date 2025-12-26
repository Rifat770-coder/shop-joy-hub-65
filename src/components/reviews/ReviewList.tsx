import { useState, useMemo } from 'react';
import { Star, Trash2, Edit2, ArrowUpDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Review } from '@/hooks/useReviews';
import { ReviewForm } from './ReviewForm';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReviewListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { star: number; count: number; percentage: number }[];
  userReview: Review | null;
  onSubmit: (rating: number, title: string, content: string) => Promise<boolean>;
  onUpdate: (reviewId: string, rating: number, title: string, content: string) => Promise<boolean>;
  onDelete: (reviewId: string) => Promise<boolean>;
  loading: boolean;
}

type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful';

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${
        i < rating ? 'fill-warning text-warning' : 'text-muted'
      }`}
    />
  ));
};

export const ReviewList = ({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  userReview,
  onSubmit,
  onUpdate,
  onDelete,
  loading,
}: ReviewListProps) => {
  const { user } = useAuth();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return sorted.sort((a, b) => b.helpful_count - a.helpful_count);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  const handleUpdate = async (rating: number, title: string, content: string) => {
    if (!editingReview) return false;
    const success = await onUpdate(editingReview.id, rating, title, content);
    if (success) setEditingReview(null);
    return success;
  };

  const visibleReviews = sortedReviews.slice(0, visibleCount);

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8">
      {/* Reviews Summary */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-primary mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center md:justify-start mb-2">
            {renderStars(Math.round(averageRating))}
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {totalReviews.toLocaleString()} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>
        <Separator orientation="vertical" className="hidden md:block" />
        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ star, percentage }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm w-8">{star} ★</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12">
                {percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Sorting Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Review Form or Edit Form */}
      {editingReview ? (
        <div className="mb-8">
          <ReviewForm
            onSubmit={handleUpdate}
            initialRating={editingReview.rating}
            initialTitle={editingReview.title}
            initialContent={editingReview.content}
            isEdit
            onCancel={() => setEditingReview(null)}
          />
        </div>
      ) : !userReview ? (
        <div className="mb-8">
          <ReviewForm onSubmit={onSubmit} />
        </div>
      ) : null}

      {/* User's existing review notice */}
      {userReview && !editingReview && (
        <div className="mb-6 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">
            You have already reviewed this product. You can edit or delete your review below.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <div className="space-y-6">
          {visibleReviews.map((review) => (
            <div key={review.id} className="pb-6 border-b border-border last:border-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(review.author_name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{review.author_name}</p>
                        {review.verified_purchase && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {user && review.user_id === user.id && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingReview(review)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete your review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(review.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium mb-1">{review.title}</h4>
                  <p className="text-muted-foreground text-sm">{review.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {visibleCount < reviews.length && (
        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => setVisibleCount((prev) => prev + 5)}
        >
          Load More Reviews ({reviews.length - visibleCount} remaining)
        </Button>
      )}
    </div>
  );
};
