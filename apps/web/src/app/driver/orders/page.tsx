'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Loader2, MapPin, Phone, Package, CheckCircle, 
  Truck, Clock, RefreshCw, ShoppingBag, Banknote, Smartphone, AlertCircle, Trash2
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface MenuItem {
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: MenuItem;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  currency: string;
}

interface User {
  name: string;
  phone: string;
  email: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryAddress: string;
  city: string;
  notes: string | null;
  createdAt: string;
  currency: string;
  restaurant: Restaurant;
  user: User;
  items: OrderItem[];
  paymentMethod: string;
  paymentStatus: string;
  delivery?: {
    id: string;
    status: string;
    acceptedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    earnings: number;
  };
}

export default function DriverOrdersPage() {
  const [available, setAvailable] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'my' | 'history'>('available');
  const isMountedRef = useRef(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/driver/orders');
      const data = await res.json();

      if (!isMountedRef.current) return;

      if (!res.ok) throw new Error(data.error || 'Erreur chargement');

      setAvailable(data.available || []);
      setMyOrders(data.myOrders || []);
      setHistory(data.history || []);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Erreur de connexion');
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

  const acceptOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      await fetchOrders();
      setTab('my');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(null);
    }
  };

  const pickupOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/pickup`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const deliverOrder = async (orderId: string) => {
    if (!confirm('Confirmez-vous avoir livré cette commande ?')) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/deliver`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      await fetchOrders();
      setTab('history');
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteFromHistory = async (deliveryId: string) => {
    if (!confirm('Supprimer cette livraison de votre historique ?')) return;
    
    setActionLoading(deliveryId);
    try {
      const res = await fetch(`/api/driver/orders/${deliveryId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const getPaymentInfo = (method: string, status: string) => {
    const methods: Record<string, { label: string; icon: any; color: string }> = {
      CASH: { label: 'Espèces à la livraison', icon: Banknote, color: 'green' },
      MTN_MOMO: { label: 'MTN Mobile Money', icon: Smartphone, color: 'yellow' },
      MOOV_MONEY: { label: 'Moov Money', icon: Smartphone, color: 'blue' },
    };
    const m = methods[method] || methods.CASH;
    const Icon = m.icon;
    return {
      label: m.label,
      paid: status === 'PAID',
      icon: <Icon className={`h-4 w-4 ${m.color === 'green' ? 'text-green-600' : m.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'}`} />,
      bg: m.color === 'green' ? 'bg-green-50 border-green-200' : m.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200',
    };
  };

  if (loading && available.length === 0 && myOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mes commandes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {available.length} disponible{available.length > 1 ? 's' : ''} • {myOrders.length} en cours
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Onglets */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-4 sm:gap-6">
          <button
            onClick={() => setTab('available')}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
              tab === 'available' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Disponibles</span>
              <span className="sm:hidden">Dispo</span>
              ({available.length})
            </span>
          </button>
          <button
            onClick={() => setTab('my')}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
              tab === 'my' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">En cours</span>
              <span className="sm:hidden">Cours</span>
              ({myOrders.length})
            </span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
              tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique ({history.length})
            </span>
          </button>
        </div>
      </div>

      {/* Disponibles */}
      {tab === 'available' && (
        <div className="space-y-4">
          {available.length === 0 ? (
            <div className="rounded-lg border border-border bg-background p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune commande disponible</p>
            </div>
          ) : (
            available.map((order) => {
              const payInfo = getPaymentInfo(order.paymentMethod, order.paymentStatus);
              return (
                <div key={order.id} className="rounded-lg border border-border bg-background p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Commande #{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{order.restaurant.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatPrice(order.total, order.currency)}</p>
                      <p className="text-xs text-muted-foreground">+ {formatPrice(order.deliveryFee, order.currency)} livraison</p>
                    </div>
                  </div>

                  <div className={`mb-4 p-3 rounded-md border ${payInfo.bg} flex items-center gap-2`}>
                    {payInfo.icon}
                    <span className="text-xs sm:text-sm font-medium text-gray-800">{payInfo.label}</span>
                    {payInfo.paid && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                    {!payInfo.paid && <AlertCircle className="h-4 w-4 text-orange-600 ml-auto" />}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Livraison</p>
                        <p className="text-muted-foreground truncate">{order.deliveryAddress}</p>
                        <p className="text-muted-foreground">{order.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Client</p>
                        <p className="text-muted-foreground truncate">{order.user.name}</p>
                        <p className="text-muted-foreground font-medium">{order.user.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{order.items.length} article{order.items.length > 1 ? 's' : ''}</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.quantity}x {item.menuItem.name}</span>
                          <span className="font-medium text-foreground">{formatPrice(item.price * item.quantity, order.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => acceptOrder(order.id)}
                    disabled={actionLoading === order.id}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-md bg-green-600 text-white px-4 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === order.id ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Acceptation...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4" /> Accepter cette commande</>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* En cours */}
      {tab === 'my' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="rounded-lg border border-border bg-background p-12 text-center">
              <Truck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune commande en cours</p>
            </div>
          ) : (
            myOrders.map((order) => {
              const deliveryStatus = order.delivery?.status;
              const payInfo = getPaymentInfo(order.paymentMethod, order.paymentStatus);
              return (
                <div key={order.id} className="rounded-lg border-2 border-primary/30 bg-background p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Commande #{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{order.restaurant.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatPrice(order.total, order.currency)}</p>
                      <p className="text-xs text-green-600 font-medium">+ {formatPrice(order.delivery?.earnings || 0, order.currency)} pour vous</p>
                    </div>
                  </div>

                  <div className={`mb-4 p-3 rounded-md border ${payInfo.bg} flex items-center gap-2`}>
                    {payInfo.icon}
                    <span className="text-xs sm:text-sm font-medium text-gray-800">{payInfo.label}</span>
                    {payInfo.paid ? (
                      <span className="ml-auto text-xs text-green-700 font-bold">PAYÉ</span>
                    ) : (
                      <span className="ml-auto text-xs text-orange-700 font-bold">À ENCAISSER</span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Livraison</p>
                        <p className="text-muted-foreground truncate">{order.deliveryAddress}</p>
                        <p className="text-muted-foreground">{order.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Client</p>
                        <p className="text-muted-foreground truncate">{order.user.name}</p>
                        <p className="text-muted-foreground font-bold">{order.user.phone}</p>
                      </div>
                    </div>
                  </div>

                  {deliveryStatus === 'ACCEPTED' && (
                    <button
                      onClick={() => pickupOrder(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === order.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Confirmation...</>
                      ) : (
                        <><Package className="h-4 w-4" /> Marquer comme récupérée</>
                      )}
                    </button>
                  )}

                  {deliveryStatus === 'PICKED_UP' && (
                    <button
                      onClick={() => deliverOrder(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-md bg-green-600 text-white px-4 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === order.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Confirmation...</>
                      ) : (
                        <><CheckCircle className="h-4 w-4" /> Marquer comme livrée</>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Historique */}
      {tab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="rounded-lg border border-border bg-background p-12 text-center">
              <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun historique</p>
              <p className="text-xs text-muted-foreground mt-2">
                Vos livraisons terminées apparaîtront ici
              </p>
            </div>
          ) : (
            history.map((order) => {
              const payInfo = getPaymentInfo(order.paymentMethod, order.paymentStatus);
              const isCompleted = order.status === 'COMPLETED' || order.delivery?.status === 'COMPLETED';
              return (
                <div key={order.id} className="rounded-lg border border-border bg-background p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-foreground">
                          Commande #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          isCompleted 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {isCompleted ? '✓ Confirmée par client' : 'Livrée'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{order.restaurant.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Livrée le {order.delivery?.deliveredAt ? new Date(order.delivery.deliveredAt).toLocaleString('fr-FR') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{formatPrice(order.delivery?.earnings || 0, order.currency)}
                      </p>
                      <div className={`mt-1 inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${payInfo.bg}`}>
                        {payInfo.icon}
                        <span>{payInfo.paid ? 'Payé' : 'Cash'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 mb-4 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Livraison</p>
                        <p className="text-muted-foreground truncate">{order.deliveryAddress}</p>
                        <p className="text-muted-foreground">{order.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Client</p>
                        <p className="text-muted-foreground truncate">{order.user.name}</p>
                        <p className="text-muted-foreground font-medium">{order.user.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <button
                      onClick={() => deleteFromHistory(order.delivery?.id || order.id)}
                      disabled={actionLoading === (order.delivery?.id || order.id)}
                      className="w-full sm:w-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-50 text-red-700 border border-red-200 px-4 text-xs sm:text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === (order.delivery?.id || order.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Supprimer de l'historique
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}