import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';

const Wishlist = () => {
  const { user } = useAuth();
  const { favorites, loading: favoritesLoading, toggleFavorite } = useFavorites();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { addToCart } = useCart();

  const loading = favoritesLoading || productsLoading;

  // Get full product details for favorites from Supabase products
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const handleRemove = (productId: string) => {
    toggleFavorite(productId);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view wishlist</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to save and view your favorites.
            </p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-5xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">
              {favoriteProducts.length} item{favoriteProducts.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <Skeleton className="aspect-square rounded-lg mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Save items you love by clicking the heart icon on products.
              </p>
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteProducts.map((product) => {
                return (
                  <div
                    key={product.id}
                    className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-lg transition-shadow"
                  >
                    {/* Product Image */}
                    <Link to={`/products/${product.id}`} className="block relative">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 right-3 bg-warning/10 text-warning border-warning/30"
                        >
                          Only {product.stock} left
                        </Badge>
                      )}
                      {product.stock === 0 && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 right-3 bg-destructive/10 text-destructive border-destructive/30"
                        >
                          Out of stock
                        </Badge>
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link to={`/products/${product.id}`}>
                        <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                          {product.category}
                        </p>
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
