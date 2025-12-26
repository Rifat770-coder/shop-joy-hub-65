import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';

export function PromoBanner() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 md:p-12 lg:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(0_0%_100%/0.1)_0%,transparent_50%)]" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
              <Clock className="h-4 w-4" />
              <span>Limited Time Offer</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Mega Sale is Live!
            </h2>
            
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-lg">
              Get up to 70% off on electronics, fashion, and more. Don't miss out on these incredible deals!
            </p>

            {/* Countdown Timer Placeholder */}
            <div className="flex gap-4 mb-8">
              {[
                { value: '02', label: 'Days' },
                { value: '14', label: 'Hours' },
                { value: '36', label: 'Mins' },
                { value: '52', label: 'Secs' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-primary-foreground/20 rounded-xl text-2xl font-bold text-primary-foreground">
                    {item.value}
                  </div>
                  <span className="text-xs text-primary-foreground/80 mt-1 block">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/deals">
              <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2">
                Shop the Sale
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
