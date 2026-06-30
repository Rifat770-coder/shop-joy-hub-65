import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useCurrency } from '@/hooks/useCurrency';
import { getPrimaryImage } from '@/lib/image-utils';
import { productSlug } from '@/lib/slug';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/cart');
  };

  const favorite = isFavorite(product.id);

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-fade-in flex flex-col">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to={`/products/${productSlug(product.name, product.id)}`}>
          <img
            src={getPrimaryImage(product.image)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
        </Link>

        {/* Discount badge — top right, green, like image */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[11px] font-bold px-2 py-1 rounded-full z-10 shadow">
            {discount}% OFF
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={() => toggleFavorite(product.id)}
          aria-label={favorite ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            favorite
              ? 'bg-red-500 text-white opacity-100'
              : 'bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${favorite ? 'fill-white' : ''}`} />
        </button>

        {/* Quick actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button onClick={() => addToCart(product)} size="sm"
            className="flex-1 h-8 text-xs gap-1 bg-white/95 text-foreground hover:bg-white border border-border shadow-sm font-medium"
            variant="outline">
            <ShoppingCart className="h-3.5 w-3.5" />
            Cart
          </Button>
          <Button onClick={handleBuyNow} size="sm"
            className="flex-1 h-8 text-xs gap-1 font-semibold shadow-sm">
            <Zap className="h-3.5 w-3.5" />
            Buy Now
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">{product.category}</p>

        <Link to={`/products/${productSlug(product.name, product.id)}`}>
          <h3 className="text-sm font-semibold line-clamp-2 text-foreground hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-auto">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-black text-primary">{formatCurrency(product.price)}</span>
          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
