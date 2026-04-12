import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useReviews } from './useReviews';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Query } from 'appwrite';

// Mock Appwrite
vi.mock('@/integrations/appwrite/config', () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    REVIEWS: 'reviews',
    PROFILES: 'profiles',
    PRODUCTS: 'products',
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock auth context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { $id: 'user-1', email: 'test@example.com' },
  }),
}));

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('useReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch reviews successfully', async () => {
    const mockReviews = [
      {
        $id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        title: 'Great product',
        content: 'Really loved it',
        helpfulCount: 10,
        verifiedPurchase: true,
        $createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockProfile = {
      $id: 'profile-1',
      userId: 'user-1',
      fullName: 'John Doe',
      username: 'johndoe',
    };

    (databases.listDocuments as any)
      .mockResolvedValueOnce({
        documents: mockReviews,
      })
      .mockResolvedValueOnce({
        documents: [mockProfile],
      });

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(databases.listDocuments).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTIONS.REVIEWS,
      [
        Query.equal('productId', 'product-1'),
        Query.orderDesc('$createdAt')
      ]
    );

    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0].$id).toBe('review-1');
    expect(result.current.reviews[0].authorName).toBe('John Doe');
    expect(result.current.averageRating).toBe(5);
    expect(result.current.ratingDistribution).toHaveLength(5);
  });

  it('should handle profile fetch failure gracefully', async () => {
    const mockReviews = [
      {
        $id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 4,
        title: 'Good product',
        content: 'Pretty good',
        helpfulCount: 5,
        verifiedPurchase: false,
        $createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    (databases.listDocuments as any)
      .mockResolvedValueOnce({
        documents: mockReviews,
      })
      .mockRejectedValueOnce(new Error('Profile not found'));

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0].authorName).toBe('Anonymous User');
  });

  it('should submit review successfully', async () => {
    const mockReview = {
      $id: 'new-review-id',
      productId: 'product-1',
      userId: 'user-1',
      rating: 5,
      title: 'Amazing!',
      content: 'Best purchase ever',
      helpfulCount: 0,
      verifiedPurchase: false,
    };

    (databases.createDocument as any).mockResolvedValue(mockReview);
    (databases.listDocuments as any).mockResolvedValue({ documents: [] });

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const success = await result.current.submitReview(5, 'Amazing!', 'Best purchase ever');

    expect(success).toBe(true);
    expect(databases.createDocument).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTIONS.REVIEWS,
      expect.any(String),
      {
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        title: 'Amazing!',
        content: 'Best purchase ever',
        helpfulCount: 0,
        verifiedPurchase: false,
      }
    );
  });

  it('should handle review submission failure', async () => {
    (databases.createDocument as any).mockRejectedValue(new Error('Submission failed'));

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const success = await result.current.submitReview(4, 'Good', 'Nice product');

    expect(success).toBe(false);
  });

  it('should update product stats after review operations', async () => {
    const mockReviews = [
      { $id: 'review-1', productId: 'product-1', rating: 5 },
      { $id: 'review-2', productId: 'product-1', rating: 3 },
    ];

    (databases.listDocuments as any).mockResolvedValue({ documents: mockReviews });
    (databases.createDocument as any).mockResolvedValue({});
    (databases.updateDocument as any).mockResolvedValue({});

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.submitReview(4, 'Great', 'Love it');

    expect(databases.updateDocument).toHaveBeenCalledWith(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      'product-1',
      {
        rating: 4.0, // Average of [5, 3, 4] = 4.0
        reviews: 3,
      }
    );
  });

  it('should calculate rating distribution correctly', async () => {
    const mockReviews = [
      { $id: '1', productId: 'product-1', rating: 5, $createdAt: '2024-01-01' },
      { $id: '2', productId: 'product-1', rating: 5, $createdAt: '2024-01-02' },
      { $id: '3', productId: 'product-1', rating: 4, $createdAt: '2024-01-03' },
      { $id: '4', productId: 'product-1', rating: 3, $createdAt: '2024-01-04' },
    ];

    (databases.listDocuments as any)
      .mockResolvedValueOnce({ documents: mockReviews })
      .mockResolvedValue({ documents: [] });

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.averageRating).toBe(4.25);
    expect(result.current.ratingDistribution).toEqual([
      { star: 5, count: 2, percentage: 50 },
      { star: 4, count: 1, percentage: 25 },
      { star: 3, count: 1, percentage: 25 },
      { star: 2, count: 0, percentage: 0 },
      { star: 1, count: 0, percentage: 0 },
    ]);
  });
});