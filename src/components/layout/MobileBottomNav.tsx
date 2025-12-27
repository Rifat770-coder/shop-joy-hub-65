import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, User, Heart } from 'lucide-react';

export function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { href: '/orders', label: 'Order History', icon: ClipboardList },
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/wishlist', label: 'My Wishlist', icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border safe-area-bottom">
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
