import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Menu,
  LogOut,
  Boxes,
  Tag,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/payment-approvals', icon: Smartphone, label: 'Payment Approvals' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/advanced-analytics', icon: BarChart3, label: 'Advanced Analytics' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo - fixed top */}
      <div className="p-4 sm:p-6 border-b border-sidebar-border flex-shrink-0 max-md:pr-14">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">RealGadget BD</span>
            <p className="text-xs text-sidebar-foreground/70">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation - vertically scrollable */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain p-3 sm:p-4 space-y-0.5"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 max-md:py-3.5 rounded-lg text-sm font-medium transition-colors max-md:min-h-[44px] ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - pinned bottom */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-3 sm:p-4 space-y-2 bg-sidebar">
        <Link to="/" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 max-md:h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ArrowLeft className="h-5 w-5 flex-shrink-0" />
            Back to Store
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 max-md:h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b border-border bg-background">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <span className="font-bold">Admin</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 border-r border-sidebar-border"
            style={{ width: 'min(82vw, 290px)', maxWidth: '290px' }}
          >
            <NavContent />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 max-md:px-4 max-md:py-4 max-md:overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
