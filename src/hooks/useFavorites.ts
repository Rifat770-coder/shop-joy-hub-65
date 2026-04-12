import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Favorite } from '@/integrations/appwrite/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Query, ID } from 'appwrite';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FAVORITES,
        [Query.equal('userId', user.$id)]
      );
      
      const favoriteProducts = response.documents.map((doc: Favorite) => doc.productId);
      setFavorites(favoriteProducts);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save favorites.',
        variant: 'destructive',
      });
      return;
    }

    const isFavorite = favorites.includes(productId);

    try {
      if (isFavorite) {
        // Find and delete the favorite
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FAVORITES,
          [
            Query.equal('userId', user.$id),
            Query.equal('productId', productId)
          ]
        );

        if (response.documents.length > 0) {
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.FAVORITES,
            response.documents[0].$id
          );
        }

        setFavorites((prev) => prev.filter((id) => id !== productId));
        toast({
          title: 'Removed from favorites',
          description: 'Product removed from your favorites.',
        });
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.FAVORITES,
          ID.unique(),
          {
            userId: user.$id,
            productId: productId,
          }
        );

        setFavorites((prev) => [...prev, productId]);
        toast({
          title: 'Added to favorites',
          description: 'Product added to your favorites.',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites.',
        variant: 'destructive',
      });
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return { favorites, loading, toggleFavorite, isFavorite };
}
