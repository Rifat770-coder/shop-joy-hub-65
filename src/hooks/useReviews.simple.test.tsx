import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useReviews } from './useReviews';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';

// Mock Appwrite
vi.mock('@/integrations/appwrite/config', () => ({
  databases: {
    listDocuments: vi.fn(),
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
    (databases.listDocuments as any).mockResolvedValue({ documents: [] });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.reviews).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.userReview).toBe(null);
    expect(result.current.averageRating).toBe(0);
    expect(result.current.ratingDistribution).toHaveLength(5);
    expect(typeof result.current.submitReview).toBe('function');
    expect(typeof result.current.updateReview).toBe('function');
    expect(typeof result.current.deleteReview).toBe('function');
  });

  it('should handle review submission', async () => {
    (databases.createDocument as any).mockResolvedValue({
      $id: 'new-review',
      productId: 'product-1',
      userId: 'user-1',
      rating: 5,
      title: 'Great!',
      content: 'Love it',
    });
    (databases.updateDocument as any).mockResolvedValue({});

    const { result } = renderHook(() => useReviews('product-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const success = await result.current.submitReview(5, 'Great!', 'Love it');

    expect(success).toBe(true);
    expect(databases.createDocument).toHaveBeenCalled();
    expect(databases.updateDocument).toHaveBeenCalled(); // Product stats update
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
});