import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/checkout');
  };

  const favorite = isFavorite(product.id);

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/50">
        <Link to={`/products/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 gradient-primary border-0">
            -{discount}%
          </Badge>
        )}
        
        {/* Wishlist Button */}
        <Button
          variant="secondary"
          size="icon"
          className={`absolute top-3 right-3 h-8 w-8 transition-all ${
            favorite 
              ? 'opacity-100 bg-destructive/10 hover:bg-destructive/20' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart className={`h-4 w-4 ${favorite ? 'fill-destructive text-destructive' : ''}`} />
        </Button>

        {/* Quick Actions */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <Button
            onClick={() => addToCart(product)}
            variant="secondary"
            className="flex-1 gap-1"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
          </Button>
          <Button
            onClick={handleBuyNow}
            className="flex-1 gap-1"
            size="sm"
          >
            <Zap className="h-4 w-4" />
            Buy Now
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.category}
        </p>
        
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">
            ({product.reviews.toLocaleString()} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
