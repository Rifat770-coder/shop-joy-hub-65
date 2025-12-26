import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { categories, products } from '@/data/products';
import { ArrowRight } from 'lucide-react';

// Category images mapping
const categoryImages: Record<string, string> = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
  'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
  'Home & Garden': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  'Sports': 'https://images.unsplash.com/photo-1461896836934- voices08e5d3?w=600&h=400&fit=crop',
  'Books': 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop',
  'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop',
  'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&h=400&fit=crop',
  'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop',
};

// Get random products for each category
const getCategoryProducts = (categoryName: string) => {
  return products.filter(p => p.category === categoryName).slice(0, 3);
};

const Categories = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Shop by <span className="text-gradient">Category</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const categoryProducts = getCategoryProducts(category.name);
              
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.name}`}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Background Image */}
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={categoryImages[category.name] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop'}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-glow">
                      {category.icon}
                    </div>

                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.productCount} products
                    </p>

                    {/* Preview Products */}
                    {categoryProducts.length > 0 && (
                      <div className="flex -space-x-2 mb-4">
                        {categoryProducts.map((product) => (
                          <div
                            key={product.id}
                            className="w-10 h-10 rounded-full border-2 border-background overflow-hidden"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {category.productCount > 3 && (
                          <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                            +{category.productCount - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span>Shop Now</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Featured Categories */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Featured Collections</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Electronics Banner */}
              <Link
                to="/products?category=Electronics"
                className="group relative overflow-hidden rounded-2xl aspect-[16/9]"
              >
                <img
                  src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=450&fit=crop"
                  alt="Electronics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8">
                  <span className="text-primary font-medium mb-2">Up to 40% Off</span>
                  <h3 className="text-3xl font-bold mb-2">Electronics</h3>
                  <p className="text-muted-foreground mb-4 max-w-xs">
                    Discover the latest gadgets and tech accessories
                  </p>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Fashion Banner */}
              <Link
                to="/products?category=Fashion"
                className="group relative overflow-hidden rounded-2xl aspect-[16/9]"
              >
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=450&fit=crop"
                  alt="Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8">
                  <span className="text-primary font-medium mb-2">New Arrivals</span>
                  <h3 className="text-3xl font-bold mb-2">Fashion</h3>
                  <p className="text-muted-foreground mb-4 max-w-xs">
                    Trendy styles for every occasion
                  </p>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
