import { Link } from 'react-router-dom';
import { categories } from '@/data/products';
import { ArrowRight } from 'lucide-react';

export function CategorySection() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Browse our wide range of categories</p>
          </div>
          <Link 
            to="/categories" 
            className="hidden sm:flex items-center gap-1 text-primary hover:underline font-medium"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.name}`}
              className="group flex flex-col items-center p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-secondary group-hover:bg-primary/10 transition-colors mb-3">
                <span className="text-2xl">{category.icon}</span>
              </div>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {category.productCount} items
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
