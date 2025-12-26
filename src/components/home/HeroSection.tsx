import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export function HeroSection() {
  return <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1)_0%,transparent_50%)]" />
      
      <div className="container relative py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="animate-pulse">🔥</span>
              <span>Flash Sale - Up to 50% Off</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Discover Amazing
              <span className="block text-gradient">Products Today</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Shop from millions of products across all categories. Get the best deals with fast, reliable delivery right to your doorstep.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button variant="hero" size="xl" className="gap-2">
                  Shop Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/deals">
                <Button variant="outline" size="xl">
                  View Deals
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-primary/10">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-primary/10">
                  <RefreshCw className="h-4 w-4 text-primary" />
                </div>
                <span>Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-slide-up" style={{
          animationDelay: '0.2s'
        }}>
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 gradient-primary rounded-3xl rotate-6 opacity-20 blur-2xl" />
              <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl" />
              <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop" alt="Shopping" className="relative z-10 w-full h-full object-cover rounded-3xl shadow-xl" />
              
              {/* Floating Cards */}
              <div className="absolute -left-4 top-1/4 bg-card p-4 rounded-xl shadow-lg animate-bounce" style={{
              animationDuration: '3s'
            }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-bold">10K+</p>
                  </div>
                </div>
              </div>
              
              <div style={{
              animationDuration: '3.5s'
            }} className="absolute right-4 bottom-1/4 bg-card p-4 rounded-xl shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="font-bold">4.9/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}