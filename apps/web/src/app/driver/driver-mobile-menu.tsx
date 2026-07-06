'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, ShoppingBag, Settings, LogOut, BarChart3, Menu, X, Loader2 } from 'lucide-react';

interface DriverMobileMenuProps {
  userName: string;
  userEmail: string;
  isMobile?: boolean;
}

export function DriverMobileMenu({ userName, userEmail, isMobile }: DriverMobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/driver', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/driver/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/driver/stats', label: 'Statistiques', icon: BarChart3 },
    { href: '/driver/settings', label: 'Paramètres', icon: Settings },
  ];

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ 
      callbackUrl: '/auth/login',
      redirect: true 
    });
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50">
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-background shadow-xl flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{userName[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-xl shadow-2xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <LogOut className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Déconnexion</h3>
                  <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="flex-1 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Déconnexion...
                    </>
                  ) : (
                    'Se déconnecter'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-md hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Déconnexion</h3>
                <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir vous déconnecter ?</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Déconnexion...
                  </>
                ) : (
                  'Se déconnecter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}