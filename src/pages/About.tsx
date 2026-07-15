import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageCircle,
  ShoppingBag,
  Star,
  ChevronRight,
  Quote,
  Target,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useInView } from "@/hooks/useInView";
import { useSettings } from "@/hooks/useSettings";
import {
  aboutConfig,
  SUPPORT_HOURS,
  getWhatsAppNumber,
} from "@/data/about";

// ============================================================
// AboutPage — Main Component
// ============================================================

export default function About() {
  const { storeSettings } = useSettings();

  useEffect(() => {
    // --- SEO ---
    document.title = aboutConfig.seo.title;

    // Helper to set or create meta tags
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        el.setAttribute("data-injected", "about-page");
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    setMeta("description", aboutConfig.seo.description);

    // Open Graph
    setMeta("og:title", aboutConfig.seo.ogTitle, true);
    setMeta("og:description", aboutConfig.seo.ogDescription, true);
    setMeta("og:image", aboutConfig.seo.ogImage, true);
    setMeta("og:url", aboutConfig.seo.canonical, true);
    setMeta("og:type", "website", true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", aboutConfig.seo.ogTitle);
    setMeta("twitter:description", aboutConfig.seo.ogDescription);
    setMeta("twitter:image", aboutConfig.seo.ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", aboutConfig.seo.canonical);

    // --- JSON-LD Structured Data ---
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://realgadgetbd.com/" },
        { "@type": "ListItem", position: 2, name: "About", item: "https://realgadgetbd.com/about" },
      ],
    };

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: storeSettings.storeName || "RealGadget BD",
      url: "https://realgadgetbd.com",
      description: aboutConfig.seo.description,
    };

    const schemas = [breadcrumbSchema, organizationSchema];
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.title = "RealGadget BD";
      // Remove injected JSON-LD scripts
      document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
      // Remove OG/Twitter meta tags we injected (they have no corresponding original to restore)
      document.querySelectorAll('[data-injected="about-page"]').forEach(el => el.remove());
      // Reset description meta
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute("content", "RealGadget BD - Your trusted gadget store in Bangladesh");
      }
    };
  }, [storeSettings.storeName]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="bg-muted/30 border-b border-border">
          <div className="container py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-foreground font-medium" aria-current="page">About</span>
            </nav>
          </div>
        </section>

        <AboutHero />
        <BrandStory />
        <TrustStatistics />
        <WhyChooseUs />
        <MissionVision />
        <CoreValues />
        <TrustProcess />
        <PolicyLinks />
        <CustomerTestimonials />
        <SupportSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

// ============================================================
// 1. Hero Section
// ============================================================

function AboutHero() {
  const { ref, isVisible } = useInView({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-transparent dark:from-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-teal-200/30 to-transparent dark:from-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-orange-400/20 dark:bg-orange-400/10 rounded-full animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-teal-400/20 dark:bg-teal-400/10 rounded-full animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container relative py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div
            className={`space-y-6 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm font-medium border-primary/30 text-primary bg-primary/5 rounded-full"
            >
              {aboutConfig.hero.badge}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {aboutConfig.hero.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              {aboutConfig.hero.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button size="lg" asChild className="gap-2 text-base shadow-lg shadow-primary/20">
                <Link to={aboutConfig.hero.primaryCta.href}>
                  <ShoppingBag className="h-5 w-5" />
                  {aboutConfig.hero.primaryCta.label}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 text-base">
                <Link to={aboutConfig.hero.secondaryCta.href}>
                  <MessageCircle className="h-5 w-5" />
                  {aboutConfig.hero.secondaryCta.label}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div
            className={`relative transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
            aria-hidden="true"
          >
            <div className="relative aspect-square max-w-md mx-auto lg:max-w-full">
              {/* Decorative frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/20 dark:to-teal-900/20 rounded-3xl -rotate-3 scale-105" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 to-teal-200/50 dark:from-orange-800/20 dark:to-teal-800/20 rounded-3xl rotate-3 scale-105" />

              {/* Main image area */}
              <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">RealGadgetBD</h3>
                  <p className="text-sm text-muted-foreground mt-1">Premium Gadgets & Accessories</p>
                  <div className="flex items-center justify-center gap-1 mt-3" aria-label="5 stars">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  {/* Floating badges */}
                  <div className="absolute top-4 right-4 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    Trusted
                  </div>
                  <div className="absolute bottom-4 left-4 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    Authentic
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

// ============================================================
// 2. Brand Story
// ============================================================

function BrandStory() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Image */}
          <div
            className={`relative transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            aria-hidden="true"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-teal-100 dark:from-slate-800 dark:to-slate-900 shadow-xl">
              <div className="w-full h-full flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[
                    { label: "Gadgets", color: "from-orange-400 to-orange-500" },
                    { label: "Quality", color: "from-teal-400 to-teal-500" },
                    { label: "Trust", color: "from-orange-500 to-orange-600" },
                    { label: "Support", color: "from-teal-500 to-teal-600" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`aspect-square rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-white font-bold text-sm sm:text-base">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full -z-10" aria-hidden="true" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-teal-100 dark:bg-teal-900/20 rounded-full -z-10" aria-hidden="true" />
          </div>

          {/* Right - Content */}
          <div
            className={`space-y-5 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <Badge
              variant="outline"
              className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full"
            >
              Our Story
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {aboutConfig.brandStory.title}
            </h2>

            {aboutConfig.brandStory.paragraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-muted-foreground leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 3. Trust Statistics
// ============================================================

function TrustStatistics() {
  const { ref, isVisible } = useInView({ threshold: 0.3 });
  const [counts, setCounts] = useState<number[]>(
    aboutConfig.trustStats.map(() => 0)
  );

  useEffect(() => {
    if (!isVisible) return;

    const timers: ReturnType<typeof setInterval>[] = [];

    aboutConfig.trustStats.forEach((stat, idx) => {
      const numeric = parseInt(stat.value.replace(/[^0-9]/g, ""));
      if (isNaN(numeric)) return;

      const duration = 2000;
      const steps = 30;
      const increment = numeric / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numeric) {
          setCounts((prev) => {
            const next = [...prev];
            next[idx] = numeric;
            return next;
          });
          clearInterval(timer);
        } else {
          setCounts((prev) => {
            const next = [...prev];
            next[idx] = Math.floor(current);
            return next;
          });
        }
      }, duration / steps);

      timers.push(timer);
    });

    return () => {
      timers.forEach(clearInterval);
    };
  }, [isVisible]);

  const displayValue = (stat: { label: string; value: string; suffix?: string }, index: number) => {
    const numeric = parseInt(stat.value.replace(/[^0-9]/g, ""));
    if (isNaN(numeric)) {
      return stat.value + (stat.suffix ? ` ${stat.suffix}` : "");
    }
    const suffix = stat.value.includes("+") ? "+" : "";
    const extra = stat.suffix ? ` ${stat.suffix}` : "";
    return `${counts[index]}${suffix}${extra}`;
  };

  return (
    <section
      ref={ref}
      className="py-16 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700"
    >
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {aboutConfig.trustStats.map((stat, idx) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
                {displayValue(stat, idx)}
              </div>
              <p className="text-orange-100 text-sm sm:text-base mt-2 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 4. Why Choose Us
// ============================================================

function WhyChooseUs() {
  const { ref, isVisible } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-muted/20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full mb-4"
          >
            Why Customers Choose Us
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Why Customers Choose RealGadgetBD
          </h2>
          <p className="text-muted-foreground">
            Every aspect of our service is designed with your trust and satisfaction in mind.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {aboutConfig.whyChooseUs.map((card, idx) => (
            <Card
              key={card.title}
              className={`group border-border/50 hover:border-primary/30 transition-all duration-500 hover-lift ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/30 dark:to-teal-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 5. Mission & Vision
// ============================================================

function MissionVision() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });

  const { mission, vision } = aboutConfig;

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <Card
            className={`border-l-4 border-l-orange-500 border-t-border/50 border-r-border/50 border-b-border/50 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center mb-5">
                <Target className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{mission.title}</h3>
              <ul className="space-y-3">
                {mission.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Vision Card */}
          <Card
            className={`border-l-4 border-l-teal-500 border-t-border/50 border-r-border/50 border-b-border/50 transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 flex items-center justify-center mb-5">
                <Lightbulb className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{vision.title}</h3>
              <ul className="space-y-3">
                {vision.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 6. Core Values
// ============================================================

function CoreValues() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-muted/20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full mb-4"
          >
            Our Core Values
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            What Guides Everything We Do
          </h2>
          <p className="text-muted-foreground">
            These core principles shape our decisions, our service, and our relationship with customers.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" aria-hidden="true" />

          <div className="space-y-12 md:space-y-0 relative">
            {aboutConfig.coreValues.map((value, idx) => (
              <div
                key={value.title}
                className="md:grid md:grid-cols-2 md:gap-8 items-center transition-all duration-700"
                style={{
                  transitionDelay: `${idx * 150}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(24px)",
                }}
              >
                <div
                  className={`${
                    idx % 2 === 0 ? "md:pr-12 md:text-right md:col-start-1" : "md:pl-12 md:col-start-2"
                  } mb-4 md:mb-0`}
                >
                  <div
                    className={`inline-flex items-center gap-4 ${
                      idx % 2 === 0 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0">
                      <value.icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className={idx % 2 === 0 ? "md:text-right" : ""}>
                      <h3 className="text-xl font-bold">{value.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 7. Trust Process
// ============================================================

function TrustProcess() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full mb-4"
          >
            How We Build Trust
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How We Build Customer Trust
          </h2>
          <p className="text-muted-foreground">
            Every step of the way, we focus on transparency and reliability.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden md:block relative">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-8 h-0.5 bg-border" aria-hidden="true">
            <div
              className={`h-full bg-gradient-to-r from-orange-400 to-teal-500 transition-all duration-1000 ${
                isVisible ? "w-full" : "w-0"
              }`}
            />
          </div>

          <div className="relative grid grid-cols-5 gap-6">
            {aboutConfig.trustProcess.map((step, idx) => (
              <div
                key={step.step}
                className={`text-center transition-all duration-700 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/30 dark:to-teal-900/30 flex items-center justify-center mb-4 relative z-10 border-4 border-background">
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Vertical Steps */}
        <div className="md:hidden space-y-6">
          {aboutConfig.trustProcess.map((step, idx) => (
            <div
              key={step.step}
              className={`flex gap-4 transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-teal-100 dark:from-orange-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 border-2 border-background">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {step.step}
                  </span>
                </div>
                {idx < aboutConfig.trustProcess.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-1" aria-hidden="true" />
                )}
              </div>
              <div className="pb-6">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 8. Shopping Confidence — Policy Links
// ============================================================

function PolicyLinks() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });

  const { shoppingConfidence } = aboutConfig;

  return (
    <section
      ref={ref}
      className="py-16 md:py-24 bg-gradient-to-br from-orange-50 to-teal-50 dark:from-slate-900 dark:to-slate-950"
    >
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full mb-4"
          >
            Your Peace of Mind
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {shoppingConfidence.title}
          </h2>
          <p className="text-muted-foreground">
            {shoppingConfidence.description}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {shoppingConfidence.policies.map((policy, idx) => (
            <Link
              key={policy.title}
              to={policy.href}
              className={`group block p-6 rounded-xl bg-white dark:bg-slate-800 border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                {policy.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {policy.description}
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Read more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 9. Customer Reviews / Testimonials
// ============================================================

function CustomerTestimonials() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full mb-4"
          >
            Customer Feedback
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground">
            Real feedback from people who have shopped with us.
          </p>
        </div>

        {/* Empty state — real reviews will be shown when available */}
        <div
          className={`max-w-lg mx-auto text-center p-10 rounded-2xl bg-muted/30 border border-dashed border-border transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Quote className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground mb-4">
            Customer stories will appear here soon.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-6">
            We believe in real feedback from real customers. Reviews will be
            displayed once verified purchases are made.
          </p>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/products">
              Be the first to review
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 10. Support Section
// ============================================================

function SupportSection() {
  const { ref, isVisible } = useInView({ threshold: 0.15 });
  const { storeSettings } = useSettings();

  const { support } = aboutConfig;
  const whatsappNumber = getWhatsAppNumber(storeSettings.storePhone);

  return (
    <section
      ref={ref}
      className="py-16 md:py-24 bg-muted/20"
    >
      <div className="container">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5 rounded-full mb-4"
          >
            We're Here to Help
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {support.title}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            {support.description}
          </p>

          {/* Contact methods */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
            {[
              {
                label: "Phone",
                value: "Support Number",
                note: "Call us for immediate assistance",
              },
              {
                label: "WhatsApp",
                value: "Chat on WhatsApp",
                note: "Quick replies via messaging",
              },
              {
                label: "Email",
                value: "support@realgadgetbd.com",
                note: "We respond within 24 hours",
              },
              {
                label: "Support Hours",
                value: SUPPORT_HOURS,
                note: "We're available most days",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-border/50"
              >
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className="font-semibold text-sm">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="gap-2 text-base shadow-lg shadow-primary/20"
            >
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello RealGadgetBD, I need help regarding a product or order.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                {support.buttons[0].label}
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 text-base">
              <Link to={support.buttons[1].href}>
                {support.buttons[1].label}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 11. Final CTA
// ============================================================

function FinalCTA() {
  const { ref, isVisible } = useInView({ threshold: 0.2 });

  const { finalCta } = aboutConfig;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-8 right-12 w-2 h-2 bg-orange-400/30 rounded-full animate-float" />
        <div className="absolute bottom-12 left-16 w-3 h-3 bg-teal-400/30 rounded-full animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div
        className={`container relative text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Badge className="px-4 py-1.5 text-sm bg-orange-500/20 text-orange-300 border-orange-500/30 rounded-full mb-6">
          Get Started Today
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
          {finalCta.title}
        </h2>
        <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8">
          {finalCta.description}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="gap-2 text-base shadow-lg shadow-orange-500/30 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Link to={finalCta.primaryCta.href}>
              <ShoppingBag className="h-5 w-5" />
              {finalCta.primaryCta.label}
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="gap-2 text-base border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <Link to={finalCta.secondaryCta.href}>
              <MessageCircle className="h-5 w-5" />
              {finalCta.secondaryCta.label}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
