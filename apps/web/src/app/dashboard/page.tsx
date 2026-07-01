'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChefHat,
  Truck,
  Package
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      name: string;
    };
  }>;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const isMountedRef = useRef(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/dashboard/orders');
      const data = await res.json();

      if (!isMountedRef.current) return;

      if (res.ok) {
        setOrders(data);
        
        const totalOrders = data.length;
        const totalRevenue = data.reduce((sum: number, order: Order) => sum + order.total, 0);
        const pendingOrders = data.filter((o: Order) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length;
        const completedOrders = data.filter((o: Order) => ['DELIVERED', 'COMPLETED', 'AUTO_CONFIRMED'].includes(o.status)).length;

        setStats({
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders,
        });
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchOrders();
    
    const interval = setInterval(fetchOrders, 10000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-purple-100 text-purple-800',
      READY: 'bg-green-100 text-green-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      DELIVERING: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-green-100 text-green-800',
      AUTO_CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PREPARING: 'En préparation',
      READY: 'Prête',
      ASSIGNED: 'Assignée',
      DELIVERING: 'En livraison',
      DELIVERED: 'Livrée',
      COMPLETED: 'Livrée & Confirmée',
      AUTO_CONFIRMED: 'Confirmée auto',
      CANCELLED: 'Annulée',
    };
    return { style: styles[status] || 'bg-gray-100', label: labels[status] || status };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Commandes</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.totalOrders}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-blue-100">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Revenus</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                {formatPrice(stats.totalRevenue, 'XOF')}
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-green-100">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">En cours</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-orange-100">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Terminées</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.completedOrders}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Link 
          href="/dashboard/orders" 
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Voir les commandes</p>
            <p className="text-xs text-muted-foreground">Gérer les commandes en cours</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/menu" 
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Gérer le menu</p>
            <p className="text-xs text-muted-foreground">Modifier vos plats</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/drivers" 
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Livreurs</p>
            <p className="text-xs text-muted-foreground">Gérer vos livreurs</p>
          </div>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Commandes récentes</h2>
          <Link 
            href="/dashboard/orders" 
            className="text-xs sm:text-sm text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              return (
                <div 
                  key={order.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        #{order.orderNumber}
                      </p>
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${statusInfo.style}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {order.userName || 'Client'} • {new Date(order.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {order.items.map((item) => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-primary">
                      {formatPrice(order.total, order.currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}