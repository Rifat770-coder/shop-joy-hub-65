import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, User, Heart, Search } from 'lucide-react';

// Pages where bottom nav should not appear
const HIDDEN_ON = ['/auth', '/checkout', '/payment'];

export function MobileBottomNav() {
  const location = useLocation();

  if (HIDDEN_ON.some((path) => location.pathname.startsWith(path))) {
    return null;
  }

  const navItems = [
    { href: '/orders', label: 'Orders', icon: ClipboardList },
    { href: '/track-order', label: 'Track', icon: Search },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
