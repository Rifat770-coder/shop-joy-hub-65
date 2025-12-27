import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email },
      });

      if (error) {
        throw error;
      }

      // Check if already subscribed
      if (data?.already_subscribed) {
        toast({
          title: "Already subscribed",
          description: "This email is already subscribed to our newsletter.",
        });
        setEmail("");
        return;
      }

      toast({
        title: "Subscribed!",
        description: "Thanks for subscribing to our newsletter.",
      });

      setEmail("");
    } catch (error: unknown) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription failed",
        description: "Could not subscribe. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-secondary/50 pb-20 md:pb-0">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.05)_0%,transparent_50%)]" />

      {/* Newsletter Section */}
      <div className="relative border-b border-border/50">
        <div className="container py-12">
          <div className="relative rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 md:p-12 backdrop-blur-sm border border-primary/10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  Stay in the <span className="text-primary">Loop</span>
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Get exclusive deals, new arrivals, and insider-only discounts straight to your inbox.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/80 border-border/50 backdrop-blur-sm min-w-[280px] h-12"
                />
                <Button type="submit" size="lg" className="gap-2 h-12 px-6" disabled={isSubscribing}>
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-12 md:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-6 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <span className="text-xl font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Shop<span className="text-primary">Hub</span>
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              Your one-stop destination for all your shopping needs. Quality products, great prices, fast delivery.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "Youtube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-8 h-0.5 bg-primary rounded-full" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {["About Us", "Contact Us", "FAQs", "Shipping Info", "Returns Policy"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-8 h-0.5 bg-primary rounded-full" />
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-muted-foreground pt-2">123 Commerce Street, Business District, NY 10001</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="text-muted-foreground">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-muted-foreground">support@shophub.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2024 ShopHub. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a key={item} href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
