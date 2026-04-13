import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, Heart, ChevronDown, Lock, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Badge } from '@/components/ui/badge';
import { SearchAutocomplete } from '@/components/search/SearchAutocomplete';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSettings } from "@/hooks/useSettings";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { isAdmin, loading: permissionsLoading } = useUserPermissions();
  const location = useLocation();
  const { storeSettings } = useSettings();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/categories', label: 'Categories' },
    { href: '/deals', label: 'Deals' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="container flex h-14 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/2.png" alt="RealGadget BD" className="h-7 w-7 rounded-md object-contain" />
          <span className="text-lg font-black tracking-tight text-foreground">
            {storeSettings.storeName.replace(/\s*BD$/i, "").trim()}
            <span className="text-primary"> BD</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden flex-1 max-w-xs lg:block">
          <SearchAutocomplete />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {user && (
            <Link to="/wishlist" aria-label="Wishlist">
              <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 text-muted-foreground hover:text-foreground">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <Link to="/cart" aria-label="Cart">
            <div className="relative inline-flex">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-white border-2 border-white pointer-events-none z-10">
                  {totalItems}
                </span>
              )}
            </div>
          </Link>

          {user ? (
            <Link to="/profile" className="hidden sm:block">
              <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs font-medium">
                <User className="h-3.5 w-3.5" />
                Profile
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth" className="hidden sm:block">
              <Button size="sm" className="h-8 px-4 text-xs font-semibold">
                Sign In
              </Button>
            </Link>
          )}

          {!permissionsLoading && (
            isAdmin ? (
              <Link to="/admin" className="hidden sm:block">
                <Button size="sm" variant="secondary" className="h-8 px-3 gap-1.5 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Admin
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="ghost" className="hidden sm:flex h-8 px-3 gap-1.5 text-xs text-muted-foreground/50 cursor-not-allowed" disabled>
                <Lock className="h-3.5 w-3.5" />
                Admin
              </Button>
            )
          )}

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-5 border-b">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                    <img src="/2.png" alt="RealGadget BD" className="h-7 w-7 rounded-md object-contain" />
                    <span className="text-base font-black">{storeSettings.storeName.replace(/\s*BD$/i, "").trim()}<span className="text-primary"> BD</span></span>
                  </Link>
                </div>
                <div className="p-4">
                  <SearchAutocomplete placeholder="Search products..." />
                </div>
                <nav className="flex-1 px-4 space-y-1">
                  {navLinks.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.href) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                      }`}>
                      {link.label}
                    </Link>
                  ))}
                  <div className="pt-2 border-t mt-2 space-y-1">
                    {user ? (
                      <>
                        <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted"><Heart className="h-4 w-4 mr-2 opacity-60" />Wishlist</Link>
                        <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted"><ShoppingCart className="h-4 w-4 mr-2 opacity-60" />Orders</Link>
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted"><User className="h-4 w-4 mr-2 opacity-60" />Profile</Link>
                      </>
                    ) : (
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10"><User className="h-4 w-4 mr-2" />Sign In</Link>
                    )}
                    {!permissionsLoading && isAdmin && (
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"><LayoutDashboard className="h-4 w-4 mr-2" />Admin Panel</Link>
                    )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile nav pills */}
      <div className="md:hidden border-t bg-background overflow-x-auto scrollbar-none">
        <div className="container flex items-center gap-1.5 py-2">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                isActive(link.href) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
