import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Sparkles, Zap } from 'lucide-react';

export function PromoBanner() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-10 lg:p-14">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          
          {/* Floating sparkles */}
          <Sparkles className="absolute top-8 right-12 h-6 w-6 text-yellow-300/60 animate-pulse" />
          <Zap className="absolute bottom-12 right-24 h-5 w-5 text-yellow-300/40 animate-pulse delay-150" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold uppercase tracking-wider mb-5 border border-white/20">
                <Clock className="h-3.5 w-3.5" />
                <span>Flash Sale</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight">
                Up to <span className="text-yellow-300">70% Off</span>
              </h2>
              
              <p className="text-base md:text-lg text-white/80 mb-6 leading-relaxed">
                Electronics, fashion & more. Limited stock available!
              </p>

              <Link to="/deals">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-lg shadow-purple-900/30 gap-2 transition-all hover:scale-105"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Countdown Timer */}
            <div className="flex gap-3 md:gap-4">
              {[
                { value: '02', label: 'Days' },
                { value: '14', label: 'Hrs' },
                { value: '36', label: 'Min' },
                { value: '52', label: 'Sec' },
              ].map((item, index) => (
                <div key={item.label} className="text-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl text-xl md:text-2xl font-bold text-white border border-white/20 shadow-lg">
                    {item.value}
                  </div>
                  <span className="text-[10px] md:text-xs text-white/70 mt-1.5 block font-medium uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
