'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Store, 
  Users, 
  Menu, 
  X,
  Smartphone
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  restaurantName: string;
  restaurantActive: boolean;
  userName: string;
  userEmail: string;
}

export default function DashboardLayoutClient({
  children,
  restaurantName,
  restaurantActive,
  userName,
  userEmail,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/menu', label: 'Mon Menu', icon: UtensilsCrossed },
    { href: '/dashboard/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/dashboard/drivers', label: 'Livreurs', icon: Users },
    { href: '/dashboard/settings/payment', label: 'Paiement Mobile Money', icon: Smartphone },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar desktop */}
      <aside className="w-64 border-r border-border bg-background hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-primary">RestoDirect</h2>
          <p className="text-xs text-muted-foreground mt-1">Espace Restaurateur</p>
        </div>
        
        <div className="p-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {restaurantName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`h-2 w-2 rounded-full ${restaurantActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <p className="text-xs text-muted-foreground">
                  {restaurantActive ? 'Restaurant actif' : 'En attente'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{userName[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <Link 
            href="/api/auth/signout" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-md hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {/* Header mobile */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:hidden sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Store className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-primary truncate">{restaurantName}</h2>
              <div className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${restaurantActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <p className="text-xs text-muted-foreground truncate">
                  {restaurantActive ? 'Actif' : 'En attente'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Header desktop */}
        <header className="h-16 border-b border-border bg-background hidden md:flex items-center justify-end px-6 sticky top-0 z-50">
          <NotificationBell />
        </header>

        {/* Menu mobile overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="absolute top-0 right-0 w-72 max-w-[85vw] h-full bg-background shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border bg-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-primary">Menu</h3>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md hover:bg-accent"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{restaurantName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                        active 
                          ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <Link 
                  href="/api/auth/signout" 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-3 rounded-md hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}