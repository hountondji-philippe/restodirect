'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, X, Package, Search, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cart-store';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleSignOut = async () => {
  const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
  if (confirmed) {
    await signOut({ 
      callbackUrl: '/auth/login',
      redirect: true 
    });
  }
};

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500">RestoDirect</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un restaurant..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
              Restaurants
            </Link>
            <Link href="/order/track" className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors flex items-center gap-1">
              <Package className="h-4 w-4" />
              Suivre
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">
                      {(session.user as any).name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`hidden sm:block h-4 w-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {(session.user as any).name || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {(session.user as any).email || ''}
                      </p>
                    </div>
                    
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Mon Profil
                    </Link>
                    
                    <Link
                      href="/account/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      Mes Commandes
                    </Link>

                    {(session.user as any).role === 'RESTAURATEUR' && (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Dashboard Restaurant
                      </Link>
                    )}

                    {(session.user as any).role === 'LIVREUR' && (
                      <Link
                        href="/driver/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Dashboard Livreur
                      </Link>
                    )}

                    {(session.user as any).role === 'SUPER_ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Administration
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
              >
                Connexion
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="lg:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un restaurant..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </form>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 bg-white">
            <nav className="flex flex-col gap-1">
              <Link
                href="/search"
                className="text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 transition-colors px-3 py-2 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Restaurants
              </Link>
              <Link
                href="/order/track"
                className="text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 transition-colors px-3 py-2 rounded-lg flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="h-4 w-4" />
                Suivre ma commande
              </Link>

              {session?.user ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 transition-colors px-3 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Mon Profil
                  </Link>
                  <Link
                    href="/account/orders"
                    className="text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 transition-colors px-3 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    Mes Commandes
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors px-3 py-2 rounded-lg flex items-center gap-2 text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors px-3 py-2 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}