import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

interface ReviewFormProps {
  onSubmit: (rating: number, title: string, content: string) => Promise<boolean>;
  initialRating?: number;
  initialTitle?: string;
  initialContent?: string;
  isEdit?: boolean;
  onCancel?: () => void;
}

export const ReviewForm = ({
  onSubmit,
  initialRating = 0,
  initialTitle = '',
  initialContent = '',
  isEdit = false,
  onCancel,
}: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="bg-secondary/50 rounded-xl p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Please sign in to leave a review.
        </p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    const success = await onSubmit(rating, title, content);
    setSubmitting(false);

    if (success && !isEdit) {
      setRating(0);
      setTitle('');
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-secondary/50 rounded-xl p-6 space-y-4">
      <h4 className="font-semibold">{isEdit ? 'Edit Your Review' : 'Write a Review'}</h4>

      {/* Star Rating */}
      <div className="space-y-2">
        <Label>Your Rating *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  star <= (hoverRating || rating)
                    ? 'fill-warning text-warning'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="review-title">Review Title *</Label>
        <Input
          id="review-title"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="review-content">Your Review *</Label>
        <Textarea
          id="review-content"
          placeholder="Tell others about your experience with this product..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          maxLength={1000}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting || rating === 0 || !title.trim() || !content.trim()}
        >
          {submitting ? 'Submitting...' : isEdit ? 'Update Review' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
