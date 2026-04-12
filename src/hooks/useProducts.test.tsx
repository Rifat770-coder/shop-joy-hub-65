import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { 
  useProducts, 
  useFeaturedProducts, 
  useProductsByCategory, 
  useProduct, 
  useAddProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from './useProducts';
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
    PRODUCTS: 'products',
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
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

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { $id: '1', name: 'Product 1', price: 100, category: 'Electronics', featured: false },
        { $id: '2', name: 'Product 2', price: 200, category: 'Fashion', featured: true },
      ];

      (databases.listDocuments as any).mockResolvedValue({
        documents: mockProducts,
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(databases.listDocuments).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.orderDesc('$createdAt')]
      );
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('1');
      expect(result.current.data?.[0].name).toBe('Product 1');
    });

    it('should handle error when fetching products', async () => {
      (databases.listDocuments as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useFeaturedProducts', () => {
    it('should fetch featured products successfully', async () => {
      const mockProducts = [
        { $id: '1', name: 'Featured Product', price: 100, category: 'Electronics', featured: true },
      ];

      (databases.listDocuments as any).mockResolvedValue({
        documents: mockProducts,
      });

      const { result } = renderHook(() => useFeaturedProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(databases.listDocuments).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [
          Query.equal('featured', true),
          Query.orderDesc('$createdAt'),
          Query.limit(8),
        ]
      );
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].featured).toBe(true);
    });
  });

  describe('useProductsByCategory', () => {
    it('should fetch products by category successfully', async () => {
      const mockProducts = [
        { $id: '1', name: 'Electronics Product', price: 100, category: 'Electronics' },
      ];

      (databases.listDocuments as any).mockResolvedValue({
        documents: mockProducts,
      });

      const { result } = renderHook(() => useProductsByCategory('Electronics'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(databases.listDocuments).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [
          Query.equal('category', 'Electronics'),
          Query.orderDesc('$createdAt'),
        ]
      );
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].category).toBe('Electronics');
    });
  });

  describe('useProduct', () => {
    it('should fetch a single product successfully', async () => {
      const mockProduct = { $id: '123', name: 'Test Product', price: 99.99, category: 'Test' };

      (databases.getDocument as any).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(databases.getDocument).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        '123'
      );
      expect(result.current.data?.id).toBe('123');
      expect(result.current.data?.name).toBe('Test Product');
    });

    it('should return null when productId is not provided', async () => {
      const { result } = renderHook(() => useProduct(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useAddProduct', () => {
    it('should create a product successfully', async () => {
      const mockProduct = { $id: 'new-123', name: 'New Product', price: 50, category: 'New' };
      const newProductData = {
        name: 'New Product',
        price: 50,
        category: 'New',
        description: 'Test description',
      };

      (databases.createDocument as any).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useAddProduct(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync(newProductData);

      expect(databases.createDocument).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        'unique()',
        expect.objectContaining({
          name: 'New Product',
          price: 50,
          category: 'New',
          description: 'Test description',
        })
      );
      expect(mutationResult.id).toBe('new-123');
    });
  });

  describe('useUpdateProduct', () => {
    it('should update a product successfully', async () => {
      const mockProduct = { $id: '123', name: 'Updated Product', price: 75, category: 'Updated' };
      const updateData = { name: 'Updated Product', price: 75 };

      (databases.updateDocument as any).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({ id: '123', data: updateData });

      expect(databases.updateDocument).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        '123',
        updateData
      );
      expect(mutationResult.id).toBe('123');
    });
  });

  describe('useDeleteProduct', () => {
    it('should delete a product successfully', async () => {
      (databases.deleteDocument as any).mockResolvedValue(true);

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('123');

      expect(databases.deleteDocument).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        '123'
      );
    });
  });
});