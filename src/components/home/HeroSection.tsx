import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative bg-[#0f172a]">
      <div className="container relative py-10 md:py-14 lg:py-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-5 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/25">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Flash Sale — Up to 50% Off
            </div>

            <h1 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.75rem] font-black tracking-tight leading-[1.05] text-white">
              Discover<br />
              <span className="text-primary">Amazing</span> Products<br />
              <span className="text-slate-300">Today</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md">
              Shop from thousands of quality gadgets and electronics. Fast delivery across Bangladesh with secure payment.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg" className="gap-2 px-6 h-11 text-sm font-bold rounded-lg shadow-lg shadow-primary/30">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/deals">
                <Button variant="outline" size="lg" className="px-6 h-11 text-sm font-semibold rounded-lg border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 bg-transparent">
                  View Deals
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1">
              {[
                { icon: Truck, label: 'Free Shipping' },
                { icon: Shield, label: 'Secure Payment' },
                { icon: RefreshCw, label: 'Easy Returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative px-4 sm:px-0">
            <div className="relative aspect-square max-w-[17rem] sm:max-w-[22rem] lg:max-w-[28rem] mx-auto">
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 shadow-2xl" />
              <img
                src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=900&h=900&fit=crop&fm=webp&q=80"
                alt="Premium products"
                className="relative z-10 w-full h-full object-cover rounded-2xl"
                fetchpriority="high"
                decoding="async"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/20 via-transparent to-transparent z-20 pointer-events-none" />

              {/* Stat cards */}
              <div className="absolute left-3 top-[32%] z-30 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-2 shadow-xl border border-white/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-[10px] text-slate-500 leading-none">Orders</p>
                    <p className="font-black text-base text-slate-900 leading-tight">10K+</p>
                  </div>
                </div>
              </div>

              <div className="absolute right-3 bottom-[22%] z-30 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-2 shadow-xl border border-white/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <div>
                    <p className="text-[10px] text-slate-500 leading-none">Rating</p>
                    <p className="font-black text-base text-slate-900 leading-tight">4.9/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
