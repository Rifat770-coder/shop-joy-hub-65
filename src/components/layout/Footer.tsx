import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, ArrowRight, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { databases, DATABASE_ID } from "@/integrations/appwrite/config";
import { Query } from "appwrite";
import { useSettings } from "@/hooks/useSettings";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { storeSettings } = useSettings();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setIsSubscribing(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await databases.listDocuments(DATABASE_ID, 'newsletter_subscriptions', [Query.equal('email', normalizedEmail)]);
      if (existing.documents.length > 0) {
        toast({ title: "Already subscribed!", description: "You're already on our list." });
      } else {
        await databases.createDocument(DATABASE_ID, 'newsletter_subscriptions', crypto.randomUUID(), { email: normalizedEmail, subscribedAt: new Date().toISOString() });
        toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." });
      }
      setEmail("");
    } catch {
      toast({ title: "Failed", description: "Could not subscribe. Try again later.", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  const storeName = storeSettings.storeName.replace(/\s*BD$/i, "").trim();

  return (
    <footer className="bg-slate-900 text-slate-300 pb-20 md:pb-0">

      {/* Newsletter strip */}
      <div className="bg-orange-500">
        <div className="container py-5">
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Send className="h-5 w-5 shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Get exclusive deals in your inbox</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border-white/30 placeholder:text-white/70 text-white h-9 text-sm flex-1 sm:w-56"
              />
              <Button type="submit" size="sm" disabled={isSubscribing}
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold h-9 px-4 shrink-0">
                {isSubscribing ? "..." : "Subscribe"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand — full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/2.png" alt="RealGadget BD" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-xl font-extrabold text-white tracking-tight">
                {storeName}<span className="text-orange-400"> BD</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your one-stop destination for quality gadgets and electronics. Fast delivery across Bangladesh.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube, href: "#", label: "Youtube" },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-orange-500 hover:text-white transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { label: "All Products", to: "/products" },
                { label: "Categories", to: "/categories" },
                { label: "Deals", to: "/deals" },
                { label: "Wishlist", to: "/wishlist" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-1.5 group">
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: "My Profile", to: "/profile" },
                { label: "Order History", to: "/orders" },
                { label: "Cart", to: "/cart" },
                { label: "Sign In", to: "/auth" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-1.5 group">
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1 space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm">{storeSettings.storeAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-orange-400 shrink-0" />
                <span className="text-slate-400 text-sm">{storeSettings.storePhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-orange-400 shrink-0" />
                <span className="text-slate-400 text-sm break-all">{storeSettings.storeEmail}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">© {new Date().getFullYear()} {storeName} BD. All rights reserved.</p>
          <div className="flex gap-4">
            {["Privacy Policy", "Terms", "Support"].map((item) => (
              <a key={item} href="#" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
