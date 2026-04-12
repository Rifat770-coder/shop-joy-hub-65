import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Zap } from 'lucide-react';
import { useFlashSaleSettings, useFlashSaleCountdown, useIsFlashSaleActive } from '@/hooks/useFlashSale';

export function PromoBanner() {
  const { data: settings, isLoading } = useFlashSaleSettings();
  const isActive = useIsFlashSaleActive();
  const countdown = useFlashSaleCountdown(settings?.endDate || new Date().toISOString());

  // Don't show if not active or loading
  if (isLoading || !settings || !isActive || countdown.isExpired) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${settings.backgroundColor} p-6 md:p-10 lg:p-14`}>
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold uppercase tracking-wider mb-5 border border-white/20">
                <Zap className="h-3.5 w-3.5" />
                <span>Flash Sale</span>
              </div>
              
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold ${settings.textColor} mb-3 leading-tight`}>
                {settings.title.includes('%') ? (
                  settings.title
                ) : (
                  <>
                    {settings.title} <span className="text-yellow-300">{settings.discountPercentage}% Off</span>
                  </>
                )}
              </h2>
              
              <p className={`text-base md:text-lg ${settings.textColor}/80 mb-6 leading-relaxed`}>
                {settings.subtitle}
              </p>

              <Link to={settings.targetUrl}>
                <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg gap-2 transition-all hover:scale-105">
                  {settings.buttonText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Dynamic Countdown Timer */}
            <div className="flex gap-3 md:gap-4">
              {[
                {
                  value: formatNumber(countdown.days),
                  label: 'Days'
                },
                {
                  value: formatNumber(countdown.hours),
                  label: 'Hrs'
                },
                {
                  value: formatNumber(countdown.minutes),
                  label: 'Min'
                },
                {
                  value: formatNumber(countdown.seconds),
                  label: 'Sec'
                }
              ].map((item, index) => (
                <div key={item.label} className="text-center group">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl text-xl md:text-2xl font-bold text-white border border-white/20 shadow-lg hover:scale-110 hover:bg-white/20 transition-all duration-300 animate-flip cursor-pointer" style={{ animationDelay: `${index * 0.2}s` }}>
                    {item.value}
                  </div>
                  <span className="text-[10px] md:text-xs text-white/70 mt-1.5 block font-medium uppercase tracking-wide group-hover:text-white transition-colors duration-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative z-10 mt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-sm font-medium">Sale Progress</span>
              <span className="text-white/80 text-sm">
                {Math.max(0, Math.floor((new Date(settings.endDate).getTime() - Date.now()) / (1000 * 60 * 60)))} hours left
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(10, Math.min(90, 
                    ((new Date().getTime() - new Date(settings.startDate).getTime()) / 
                    (new Date(settings.endDate).getTime() - new Date(settings.startDate).getTime())) * 100
                  ))}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}