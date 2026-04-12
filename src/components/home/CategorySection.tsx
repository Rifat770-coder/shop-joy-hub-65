import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';

const categoryIcons: Record<string, string> = {
  Electronics: '💻',
  Fashion: '👕',
  'Home & Garden': '🏡',
  Sports: '⚽',
  Books: '📚',
  Beauty: '💄',
  Toys: '🧸',
  Automotive: '🚗',
};

export function CategorySection() {
  const { data: products = [] } = useProducts();

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, productCount]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        icon: categoryIcons[name] || '🛍️',
        productCount,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 8);
  }, [products]);

  return (
    <section className="py-12 md:py-16 bg-muted/40">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black">Shop by Category</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Browse our wide range of categories</p>
          </div>
          <Link to="/categories" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-semibold">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.name}`}
              className={`group flex flex-col items-center p-3 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 animate-slide-up animate-stagger-${Math.min(index + 1, 8)}`}
            >
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors duration-300 mb-2">
                <span className="text-xl">{category.icon}</span>
              </div>
              <span className="text-[11px] font-semibold text-center text-foreground group-hover:text-primary transition-colors leading-tight">
                {category.name}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{category.productCount}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
