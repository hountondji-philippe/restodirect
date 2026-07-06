'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, Wallet, Clock, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export default function DriverDashboard() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    activeDeliveries: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/driver/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Erreur stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Livraisons</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 truncate">{stats.totalDeliveries}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-blue-100 self-start sm:self-auto">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Gains</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mt-1 truncate">
                {formatPrice(stats.totalEarnings, 'XOF')}
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-green-100 self-start sm:self-auto">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">En cours</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 truncate">{stats.activeDeliveries}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-orange-100 self-start sm:self-auto">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Note</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 truncate">{stats.rating.toFixed(1)}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-yellow-100 self-start sm:self-auto">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link 
            href="/driver/orders" 
            className="flex items-center gap-3 p-4 rounded-md border border-border hover:bg-accent transition-colors"
          >
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Voir les commandes</p>
              <p className="text-xs text-muted-foreground">Accepter et gérer les livraisons</p>
            </div>
          </Link>
          <Link 
            href="/driver/settings" 
            className="flex items-center gap-3 p-4 rounded-md border border-border hover:bg-accent transition-colors"
          >
            <Wallet className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Paramètres</p>
              <p className="text-xs text-muted-foreground">Gérer votre compte</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}