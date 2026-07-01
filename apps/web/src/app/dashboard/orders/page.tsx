'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle, XCircle, Clock, ChefHat, Truck, Bell, Trash2, PackageCheck, CreditCard, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  deliveryAddress: string;
  city: string;
  notes: string | null;
  createdAt: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentProvider?: string;
  momoTransactionId?: string | null;
  momoPaymentProof?: string | null;
  momoPaymentConfirmed?: boolean;
  momoConfirmedAt?: string | null;
  momoRejectedAt?: string | null;
  momoRejectionReason?: string | null;
  items: OrderItem[];
  delivery?: {
    id: string;
    status: string;
    driver: {
      name: string;
      phone: string;
    };
    deliveredAt: string | null;
    confirmedByClient: boolean;
  };
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: string; message: string; createdAt: string}>>([]);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audio] = useState(typeof window !== 'undefined' ? new Audio('/sounds/notification.mp3') : null);
  const isMountedRef = useRef(true);
  const [momoModal, setMomoModal] = useState<{ orderId: string; action: 'confirm' | 'reject' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== 'RESTAURATEUR') {
        router.push('/');
        return;
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const playSound = () => {
    if (audio && soundEnabled) {
      audio.currentTime = 0;
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const showBrowserNotification = (order: Order) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Nouvelle commande !', {
        body: `Commande #${order.orderNumber} - ${formatPrice(order.total, order.currency)}`,
        icon: '/favicon.ico',
        tag: order.id,
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/dashboard/orders');
      const data = await res.json();

      if (!isMountedRef.current) return;

      if (res.ok) {
        if (data.length > lastOrderCount && lastOrderCount > 0) {
          const newOrders = data.filter((order: Order) => 
            !orders.some(existing => existing.id === order.id)
          );
          
          if (newOrders.length > 0) {
            const latestOrder = newOrders[0];
            setNewOrderNotification(latestOrder);
            playSound();
            showBrowserNotification(latestOrder);
            
            setTimeout(() => {
              setNewOrderNotification(null);
            }, 8000);
          }
        }
        
        setOrders(data);
        setLastOrderCount(data.length);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError('Erreur de connexion');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/dashboard/notifications');
      const data = await res.json();
      if (isMountedRef.current && res.ok) setNotifications(data);
    } catch (err) { /* Silencieux */ }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    isMountedRef.current = true;
    fetchOrders();
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchNotifications();
    }, 5000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [status]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMomoAction = async (orderId: string, action: 'confirm' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Veuillez entrer un motif de refus');
      return;
    }

    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/momo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? rejectReason : undefined,
        }),
      });

      if (res.ok) {
        fetchOrders();
        setMomoModal(null);
        setRejectReason('');
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?\n\nCette action est IRRÉVERSIBLE.')) return;

    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
      PREPARING: 'bg-purple-100 text-purple-800 border-purple-200',
      READY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
      DELIVERING: 'bg-orange-100 text-orange-800 border-orange-200',
      DELIVERED: 'bg-gray-100 text-gray-800 border-gray-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
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
      CANCELLED: 'Annulée',
    };
    return { style: styles[status] || 'bg-gray-100 text-gray-800', label: labels[status] || status };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {newOrderNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in">
          <div className="flex items-start gap-3">
            <Bell className="h-6 w-6 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Nouvelle commande !</p>
              <p className="text-sm mt-1">
                #{newOrderNotification.orderNumber} - {formatPrice(newOrderNotification.total, newOrderNotification.currency)}
              </p>
            </div>
            <button
              onClick={() => setNewOrderNotification(null)}
              className="text-white/80 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Commandes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gérez les commandes de votre restaurant</p>
        </div>
        
        <button
          onClick={() => {
            const newState = !soundEnabled;
            setSoundEnabled(newState);
            if (newState && audio) {
              audio.play().catch(err => console.log('Test son:', err));
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            soundEnabled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundEnabled ? 'Sons activés' : 'Sons désactivés'}
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.slice(0, 3).map((notif) => (
            <div key={notif.id} className="rounded-md bg-blue-50 border border-blue-200 p-3 flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">{notif.message}</p>
                <p className="text-xs text-blue-700 mt-1">{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-12 text-center">
          <p className="text-muted-foreground">Aucune commande pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            return (
              <div key={order.id} className="rounded-lg border border-border bg-background p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        Commande #{order.orderNumber}
                      </h3>
                      <span className={`inline-flex px-2.5 py-1 text-xs rounded-full border ${statusInfo.style}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {formatPrice(order.total, order.currency)}
                    </p>
                  </div>
                </div>

                {order.delivery && order.delivery.driver && (
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs sm:text-sm font-medium text-indigo-900">Livreur assigné</span>
                    </div>
                    <p className="text-xs sm:text-sm text-indigo-800">{order.delivery.driver.name}</p>
                    <p className="text-xs text-indigo-700">{order.delivery.driver.phone}</p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Client</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{order.userName || 'Client'}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{order.userPhone || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Livraison</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{order.deliveryAddress}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{order.city}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Articles</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">{item.quantity}x {item.menuItem.name}</span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity, order.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.paymentMethod === 'MOBILE_MONEY' && order.momoTransactionId && (
                  <div className="mb-4 p-4 rounded-md border border-yellow-200 bg-yellow-50">
                    <div className="flex items-center gap-2 mb-3">
                      {order.paymentProvider === 'MTN_MOMO' && (
                        <div className="h-8 w-8 rounded overflow-hidden bg-white flex items-center justify-center border border-yellow-300">
                          <Image src="/logos/mtn.png" alt="MTN" width={32} height={32} className="object-contain" />
                        </div>
                      )}
                      {order.paymentProvider === 'MOOV_MONEY' && (
                        <div className="h-8 w-8 rounded overflow-hidden bg-white flex items-center justify-center border border-blue-300">
                          <Image src="/logos/moov.png" alt="Moov" width={32} height={32} className="object-contain" />
                        </div>
                      )}
                      {order.paymentProvider === 'CELTIIS_MONEY' && (
                        <div className="h-8 w-8 rounded overflow-hidden bg-white flex items-center justify-center border border-indigo-300">
                          <Image src="/logos/celtiis.png" alt="Celtiis" width={32} height={32} className="object-contain" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-800">
                        {order.paymentProvider === 'MTN_MOMO' ? 'MTN Mobile Money' :
                         order.paymentProvider === 'MOOV_MONEY' ? 'Moov Money' :
                         order.paymentProvider === 'CELTIIS_MONEY' ? 'Celtiis Money' : 'Mobile Money'}
                      </span>
                      <span className={`ml-auto text-xs font-bold ${
                        order.paymentStatus === 'PAID' ? 'text-green-700' :
                        order.paymentStatus === 'PENDING_VERIFICATION' ? 'text-yellow-700' :
                        order.paymentStatus === 'REJECTED' ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {order.paymentStatus === 'PAID' ? 'PAYÉ' :
                         order.paymentStatus === 'PENDING_VERIFICATION' ? 'À VÉRIFIER' :
                         order.paymentStatus === 'REJECTED' ? 'REFUSÉ' : 'EN ATTENTE'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-yellow-200 space-y-3">
                      <div>
                        <p className="text-xs text-gray-700 mb-1">ID Transaction :</p>
                        <p className="text-sm font-mono bg-white px-3 py-1.5 rounded border border-yellow-300 font-bold">
                          {order.momoTransactionId}
                        </p>
                      </div>

                      {order.momoPaymentProof && (
                        <div>
                          <p className="text-xs text-gray-700 mb-2 font-semibold">📸 Capture de paiement :</p>
                          <a 
                            href={order.momoPaymentProof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block relative w-full max-w-xs h-48 rounded-lg overflow-hidden border-2 border-yellow-400 hover:border-yellow-600 transition-colors group cursor-pointer"
                          >
                            <Image 
                              src={order.momoPaymentProof} 
                              alt="Capture de paiement"
                              fill
                              className="object-contain bg-white"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                🔍 Voir en grand
                              </span>
                            </div>
                          </a>
                        </div>
                      )}
                      
                      {order.momoPaymentConfirmed ? (
                        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                          <span className="text-xs text-green-800 font-medium">
                            Paiement confirmé {order.momoConfirmedAt && `le ${new Date(order.momoConfirmedAt).toLocaleString('fr-FR')}`}
                          </span>
                        </div>
                      ) : order.momoRejectedAt ? (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4 text-red-700" />
                            <span className="text-xs text-red-800 font-medium">Paiement refusé</span>
                          </div>
                          {order.momoRejectionReason && (
                            <p className="text-xs text-red-700 ml-6">Motif : {order.momoRejectionReason}</p>
                          )}
                        </div>
                      ) : order.paymentStatus === 'PENDING_VERIFICATION' ? (
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleMomoAction(order.id, 'confirm')}
                            disabled={actionLoading === order.id}
                            className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-green-600 text-white px-3 text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Confirmer paiement
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setMomoModal({ orderId: order.id, action: 'reject' })}
                            disabled={actionLoading === order.id}
                            className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-600 text-white px-3 text-xs sm:text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Refuser
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <button
                    onClick={() => deleteOrder(order.id)}
                    disabled={actionLoading === order.id}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 text-xs sm:text-sm font-medium disabled:opacity-50 sm:ml-auto order-last sm:order-none"
                  >
                    {actionLoading === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </>
                    )}
                  </button>

                  {order.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                        disabled={actionLoading === order.id}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-green-600 text-white px-4 text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" /> Accepter
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        disabled={actionLoading === order.id}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gray-600 text-white px-4 text-xs sm:text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Refuser
                      </button>
                    </div>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      disabled={actionLoading === order.id}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <ChefHat className="h-4 w-4" /> Commencer la préparation
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      disabled={actionLoading === order.id}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" /> Marquer comme prête
                    </button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <div className="flex-1 flex items-center gap-2 py-2 text-sm text-green-700 font-medium bg-green-50 px-3 rounded-md border border-green-200">
                      <PackageCheck className="h-4 w-4" />
                      Commande finalisée avec succès
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {momoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Refuser le paiement Mobile Money</h3>
            <p className="text-sm text-gray-600 mb-4">Entrez le motif du refus.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ex: ID de transaction invalide..."
              className="flex w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setMomoModal(null); setRejectReason(''); }}
                disabled={actionLoading !== null}
                className="flex-1 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleMomoAction(momoModal.orderId, 'reject')}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === momoModal.orderId ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : ('Confirmer le refus')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}