import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { getPrimaryImage } from '@/lib/image-utils';

const categoryImages: Record<string, string> = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
  'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
  'Home & Garden': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe08e5d3?w=600&h=400&fit=crop',
  'Books': 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop',
  'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop',
  'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&h=400&fit=crop',
  'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop',
};

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

const Categories = () => {
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
      .sort((a, b) => b.productCount - a.productCount);
  }, [products]);

  const getCategoryProducts = (categoryName: string) => {
    return products.filter((p) => p.category === categoryName).slice(0, 3);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Page Header */}
        <div className="bg-[#0f172a] py-10 md:py-14">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/25 mb-4">
              <Grid3X3 className="h-3.5 w-3.5" />
              All Categories
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3">
              Shop by <span className="text-primary">Category</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </div>
        </div>

        <div className="container py-8 md:py-12">

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {categories.map((category, index) => {
              const categoryProducts = getCategoryProducts(category.name);
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.name}`}
                  className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={categoryImages[category.name] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop'}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-primary/90 flex items-center justify-center text-lg sm:text-xl mb-2 sm:mb-3 shadow-lg">
                      {category.icon}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight mb-0.5">
                      {category.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-white/60 mb-2">
                      {category.productCount} products
                    </p>

                    {/* Preview avatars */}
                    {categoryProducts.length > 0 && (
                      <div className="hidden sm:flex -space-x-2 mb-3">
                        {categoryProducts.map((product) => (
                          <div key={product.id} className="w-7 h-7 rounded-full border-2 border-white/20 overflow-hidden">
                            <img src={getPrimaryImage(product.image)} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {category.productCount > 3 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white/20 bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                            +{category.productCount - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                      <span>Shop Now</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Featured Collections */}
          <section className="mt-10 md:mt-14">
            <h2 className="text-lg sm:text-xl font-black mb-4 md:mb-6">Featured Collections</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                to="/products?category=Electronics"
                className="group relative overflow-hidden rounded-xl aspect-[16/9]"
              >
                <img
                  src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=450&fit=crop"
                  alt="Electronics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-5 sm:p-8">
                  <span className="text-primary text-xs font-bold uppercase tracking-wider mb-1.5">Up to 40% Off</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Electronics</h3>
                  <p className="text-white/60 text-xs sm:text-sm mb-3 max-w-[200px]">
                    Discover the latest gadgets and tech accessories
                  </p>
                  <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                    <span>Explore</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              <Link
                to="/products?category=Fashion"
                className="group relative overflow-hidden rounded-xl aspect-[16/9]"
              >
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=450&fit=crop"
                  alt="Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-5 sm:p-8">
                  <span className="text-primary text-xs font-bold uppercase tracking-wider mb-1.5">New Arrivals</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Fashion</h3>
                  <p className="text-white/60 text-xs sm:text-sm mb-3 max-w-[200px]">
                    Trendy styles for every occasion
                  </p>
                  <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                    <span>Explore</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
