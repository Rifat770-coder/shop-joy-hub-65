import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Zap, Flame, ArrowRight, Percent } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useCurrency } from '@/hooks/useCurrency';

interface DealProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image: string | null;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
}

// Calculate time remaining for countdown
const calculateTimeRemaining = (endDate: Date) => {
  const now = new Date().getTime();
  const end = endDate.getTime();
  const difference = end - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

// Flash deal end time (3 days from now)
const flashDealEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

const Deals = () => {
  const { data: products = [] } = useProducts();
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(flashDealEndDate));
  const { formatCurrency } = useCurrency();

  const dealProducts: DealProduct[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || null,
    category: product.category,
    image: product.image || null,
    price: Number(product.price),
    originalPrice: (product as unknown as { originalPrice?: number }).originalPrice,
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews || 0),
    stock: product.stock,
  }));

  // Only real Appwrite records that actually include a discount are shown as deals.
  const discountedProducts = dealProducts.filter(
    (product) => typeof product.originalPrice === 'number' && product.originalPrice > product.price
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(flashDealEndDate));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sort products by discount percentage
  const sortedByDiscount = [...discountedProducts].sort((a, b) => {
    const discountA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
    const discountB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
    return discountB - discountA;
  });

  const topDeals = sortedByDiscount.slice(0, 4);
  const flashDeals = sortedByDiscount.slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(0_0%_100%/0.1)_0%,transparent_50%)]" />
          <div className="container relative">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6 animate-fade-in">
                <Flame className="h-4 w-4 animate-pulse" />
                <span>Limited Time Offers</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Mega Sale
                <span className="block">Up to 70% Off</span>
              </h1>
              
              <p className="text-lg text-primary-foreground/90 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Don't miss out on incredible savings across all categories. 
                Shop now before time runs out!
              </p>

              {/* Countdown Timer */}
              <div className="flex gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {[
                  { value: timeRemaining.days, label: 'Days' },
                  { value: timeRemaining.hours, label: 'Hours' },
                  { value: timeRemaining.minutes, label: 'Mins' },
                  { value: timeRemaining.seconds, label: 'Secs' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-primary-foreground/20 backdrop-blur rounded-xl text-2xl md:text-3xl font-bold text-primary-foreground">
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <span className="text-xs md:text-sm text-primary-foreground/80 mt-2 block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link to="/products">
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  Shop All Deals
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Flash Deals */}
        <section className="py-12 bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Flash Deals</h2>
                  <p className="text-muted-foreground">Hurry! These deals won't last long</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-lg">
                <Clock className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Ends in {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {flashDeals.map((product, index) => {
                const discount = Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100);
                
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group relative flex flex-col md:flex-row gap-6 bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Discount Badge */}
                    <Badge className="absolute top-4 right-4 gradient-primary border-0 text-lg px-3 py-1">
                      -{discount}%
                    </Badge>

                    {/* Image */}
                    <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-secondary/50 shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm text-primary font-medium uppercase tracking-wide mb-2">
                        {product.category}
                      </p>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-primary">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-lg text-muted-foreground line-through">
                          {formatCurrency(product.originalPrice!)}
                        </span>
                      </div>

                      {/* Progress Bar - Stock */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Sold: {Math.floor(Math.random() * 50) + 20}</span>
                          <span className="text-destructive font-medium">Only {product.stock} left!</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full gradient-primary rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(90, 100 - (product.stock / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Deals Grid */}
        <section className="py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Top Deals</h2>
                  <p className="text-muted-foreground">Best savings of the week</p>
                </div>
              </div>
              <Link to="/products" className="text-primary hover:underline font-medium flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topDeals.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Discounted Products */}
        <section className="py-12 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">All Deals</h2>
              <p className="text-muted-foreground">
                Browse all {discountedProducts.length} discounted products
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {discountedProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No deals available at the moment</p>
                <Link to="/products">
                  <Button variant="default" className="mt-4">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16">
          <div className="container">
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Never Miss a Deal
              </h2>
              <p className="text-muted-foreground mb-6">
                Subscribe to get notified about exclusive offers and flash sales
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-12 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button variant="hero" size="lg">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Deals;
