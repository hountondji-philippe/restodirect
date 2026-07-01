'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Package, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export default function DriverStatsPage() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    completedThisWeek: 0,
    earningsThisWeek: 0,
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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Statistiques</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Vos performances de livraison</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total livraisons</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gains totaux</p>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(stats.totalEarnings, 'XOF')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Note moyenne</p>
              <p className="text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}/5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-lg font-semibold mb-4">Cette semaine</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Livraisons effectuées</p>
            <p className="text-2xl font-bold text-foreground">{stats.completedThisWeek}</p>
          </div>
          <div className="p-4 rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Gains</p>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(stats.earningsThisWeek, 'XOF')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}