import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Menu, Settings, LayoutDashboard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function Header() {
  const { cartCount, seniorMode, toggleSeniorMode } = useApp();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [isSeller, setIsSeller] = useState(false);

  // Check if user has seller role
  useEffect(() => {
    const checkSellerRole = async () => {
      if (!user) {
        setIsSeller(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'seller' });
        
        if (!error) {
          setIsSeller(data === true);
        }
      } catch (err) {
        console.error('Error checking seller role:', err);
      }
    };

    checkSellerRole();
  }, [user]);

  const showAdminLink = isAdmin || isSeller;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-bold">M</span>
          </div>
          <span className="text-xl font-bold text-foreground">MediEase</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/" icon={<Home size={20} />} label="Home" />
          <NavLink to="/medicines" icon={<Search size={20} />} label="Medicines" />
          <NavLink to="/orders" icon={<Menu size={20} />} label="Orders" />
          {showAdminLink && (
            <NavLink to="/admin" icon={<LayoutDashboard size={20} />} label="Admin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSeniorMode}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              seniorMode
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            title="Toggle Senior Mode"
          >
            <Settings size={18} />
            <span className="hidden lg:inline">{seniorMode ? 'Senior Mode' : 'Standard'}</span>
          </button>

          <Link
            to="/cart"
            className="relative p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ShoppingCart size={22} className="text-secondary-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center animate-bounce-soft">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/profile"
            className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <User size={22} className="text-secondary-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const { cartCount } = useApp();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/medicines', icon: Search, label: 'Search' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { to: '/orders', icon: Menu, label: 'Orders' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon size={24} />
                {badge && badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
