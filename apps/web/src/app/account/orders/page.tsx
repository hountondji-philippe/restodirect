'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, Package, Trash2, ArrowLeft, Eye } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  restaurant: {
    name: string;
    currency: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: { name: string };
  }>;
  delivery?: {
    status: string;
    deliveredAt: string | null;
    confirmedByClient: boolean;
  };
}

export default function AccountOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirection si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/auth/login?callbackUrl=/account/orders';
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/account/orders');
      
      // Si l'API retourne 401, rediriger vers login
      if (res.status === 401) {
        window.location.href = '/auth/login?callbackUrl=/account/orders';
        return;
      }
      
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      } else {
        setError(data.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Supprimer cette commande de votre historique ?')) return;
    
    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/account/orders?orderId=${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-purple-100 text-purple-800',
      READY: 'bg-indigo-100 text-indigo-800',
      DELIVERING: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PREPARING: 'En préparation',
      READY: 'Prête',
      DELIVERING: 'En livraison',
      DELIVERED: 'Livrée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    };
    return { style: styles[status] || 'bg-gray-100', label: labels[status] || status };
  };

  // Afficher un loader pendant la vérification de session
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Si pas de session, ne rien afficher (redirection en cours)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header avec retour */}
      <div className="border-b border-border bg-background sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/profile" className="p-2 -ml-2 hover:bg-accent rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Mes commandes</h1>
            <p className="text-xs text-muted-foreground truncate">Historique de vos commandes</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 sm:p-12 text-center">
            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucune commande</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Vous n'avez pas encore passé de commande
            </p>
            <Link
              href="/search"
              className="inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Découvrir les restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              return (
                <div key={order.id} className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-foreground">
                          Commande #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {order.restaurant.name} • {new Date(order.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(order.total, order.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Articles</p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.price * item.quantity, order.currency)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/order/tracking/${order.orderNumber.replace('RD-', '')}`}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background text-xs sm:text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Voir le suivi
                    </Link>
                    
                    {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                      <button
                        onClick={() => deleteOrder(order.id)}
                        disabled={deletingId === order.id}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-50 text-red-700 border border-red-200 px-4 text-xs sm:text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </>
                        )}
                      </button>
                    )}
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