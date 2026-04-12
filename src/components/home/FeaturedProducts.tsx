import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';

export function FeaturedProducts() {
  const { data: products = [], isLoading } = useFeaturedProducts();
  const featuredProducts = products.slice(0, 4);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black">Featured Products</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Handpicked products just for you</p>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-sm text-primary hover:underline font-semibold">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`animate-slide-up animate-stagger-${index + 1}`}
            >
              <ProductCard product={product as any} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
