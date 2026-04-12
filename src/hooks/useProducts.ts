import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Product as AppwriteProduct } from '@/integrations/appwrite/types';
import { toast } from '@/hooks/use-toast';
import { Query } from 'appwrite';

export type Product = AppwriteProduct & {
  id: string;
  documentId?: string;
};

export interface ProductInsert {
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  stock?: number;
  featured?: boolean;
}

const normalizeProduct = (product: AppwriteProduct): Product => ({
  ...product,
  id: product.$id,
  documentId: (product as any).documentId || product.$id,
});

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.orderDesc('$createdAt')]
      );
      return response.documents.map((doc) => normalizeProduct(doc as AppwriteProduct));
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [
          Query.equal('featured', true),
          Query.orderDesc('$createdAt')
        ]
      );
      return response.documents.map((doc) => normalizeProduct(doc as AppwriteProduct));
    },
  });
};

export const useProductsByCategory = (category: string) => {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [
          Query.equal('category', category),
          Query.orderDesc('$createdAt')
        ]
      );
      return response.documents.map((doc) => normalizeProduct(doc as AppwriteProduct));
    },
    enabled: !!category,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      );
      return normalizeProduct(response as AppwriteProduct);
    },
    enabled: !!id,
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const documentId = crypto.randomUUID();
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        documentId,
        {
          ...product,
          documentId,
          rating: 0,
          reviews: 0,
          stock: product.stock || 0,
          featured: product.featured || false,
        }
      );
      return normalizeProduct(response as AppwriteProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product added',
        description: 'Product has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, $id, ...updates }: Partial<Product> & { id?: string; $id?: string }) => {
      const targetId = $id || id;
      if (!targetId) {
        throw new Error('Missing product document id for update');
      }

      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        targetId,
        updates
      );
      return normalizeProduct(response as AppwriteProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product updated',
        description: 'Product has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product deleted',
        description: 'Product has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
