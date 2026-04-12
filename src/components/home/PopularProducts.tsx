import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart, Eye, TrendingUp } from 'lucide-react';
import { usePopularProducts } from '@/hooks/usePopularProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useUserBehaviorTracking } from '@/hooks/useAnalytics';
import { useCart } from '@/context/CartContext';
import { getPrimaryImage } from '@/lib/image-utils';
import { useCurrency } from '@/hooks/useCurrency';

export function PopularProducts() {
  const { data: popularProducts = [], isLoading } = usePopularProducts(8);
  const { trackProductView, trackAddToCart } = useUserBehaviorTracking();
  const { addToCart } = useCart();
  const { formatCurrency } = useCurrency();

  const handleProductView = (product: any) => {
    trackProductView(product.id, product.name, '/');
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    trackAddToCart(product.id, 1, product.price, '/');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i < rating
            ? 'fill-yellow-200 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Popular Products</h2>
              <p className="text-muted-foreground mt-1">Trending items loved by our customers</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black">Popular Products</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Trending items loved by our customers</p>
          </div>
          <Link to="/products" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-semibold">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {popularProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Products Available</h3>
            <p className="text-muted-foreground">
              Products will appear here once they are added to your store.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {popularProducts.map((product, index) => (
              <Card
                key={product.id}
                className={`group hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-slide-up animate-stagger-${Math.min(index + 1, 8)} border-border bg-card`}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 relative group-hover:scale-105 transition-transform duration-500">
                      {product.image ? (
                        <img
                          src={getPrimaryImage(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <ShoppingCart className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {product.popularityScore > 50 && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Popular
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                            Featured
                          </Badge>
                        )}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <Badge variant="destructive" className="text-xs">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </Badge>
                        )}
                        {product.reviews > 50 && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                            Best Seller
                          </Badge>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white"
                          onClick={() => handleProductView(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Stock Status */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-red-500 text-white">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link
                        to={`/products/${product.id}`}
                        onClick={() => handleProductView(product)}
                        className="block"
                      >
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center">
                          {renderStars(product.rating || 0)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({product.reviews || 0})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-black text-base text-primary">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        className="w-full font-semibold"
                        size="sm"
                        disabled={product.stock <= 0}
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6 sm:hidden">
          <Link to="/products">
            <Button variant="outline" className="font-semibold">
              View All Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}