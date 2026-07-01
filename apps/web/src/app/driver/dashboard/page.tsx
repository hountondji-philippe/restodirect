'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Phone, MapPin, Clock, CheckCircle, Truck, ArrowLeft, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

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
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  user?: {
    name: string;
    phone: string;
    address: string;
  } | null;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    currency: string;
  };
  items: OrderItem[];
}

export default function DriverDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [takingOrder, setTakingOrder] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');

  // Redirection si pas connecté ou pas livreur
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/driver/dashboard');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== 'LIVREUR') {
        router.push('/');
      }
    }
  }, [status, session, router]);

  const fetchOrders = async () => {
    try {
      setError('');
      const res = await fetch('/api/deliveries');
      const data = await res.json();

      if (res.ok) {
        setOrders(data);
        if (data.length > 0) {
          setRestaurantName(data[0].restaurant.name);
        }
      } else {
        setError(data.error || 'Erreur chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const takeOrder = async (orderId: string) => {
    setTakingOrder(orderId);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        alert('Commande prise avec succès ! Vous êtes maintenant responsable de cette livraison.');
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur prise de commande');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setTakingOrder(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Commandes disponibles</h1>
              <p className="text-gray-600 text-lg">
                {restaurantName ? `Restaurant : ${restaurantName}` : 'Commandes prêtes à être livrées'}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Rafraîchir
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune commande disponible</h2>
            <p className="text-gray-600">Revenez plus tard pour voir les nouvelles commandes</p>
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Info :</strong> Vous ne voyez que les commandes du restaurant où vous êtes inscrit.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">
                  Vous êtes connecté en tant que livreur pour <strong>{restaurantName}</strong>
                </p>
              </div>
            </div>

            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-gray-100">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-6 w-6 text-orange-500" />
                      <h2 className="text-2xl font-bold text-gray-900">Commande #{order.orderNumber}</h2>
                    </div>
                    <p className="text-gray-600">
                      Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-500">
                      {order.total.toFixed(2)} {order.currency || 'XOF'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Restaurant
                    </h3>
                    <p className="text-blue-800 font-semibold mb-1">{order.restaurant.name}</p>
                    <p className="text-blue-700 text-sm">{order.restaurant.address}</p>
                    <p className="text-blue-700 text-sm mt-2 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.restaurant.phone}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6 border-2 border-green-100">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Client
                    </h3>
                    <p className="text-green-800 font-semibold mb-1">
                      {order.userName || order.user?.name || 'Client anonyme'}
                    </p>
                    <p className="text-green-700 text-sm">
                      {order.deliveryAddress || order.user?.address || 'Adresse non spécifiée'}
                    </p>
                    <p className="text-green-700 text-sm">
                      {order.city}
                    </p>
                    <p className="text-green-700 text-sm mt-2 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.userPhone || order.user?.phone || 'Non spécifié'}
                    </p>
                    {order.userEmail && (
                      <p className="text-green-700 text-sm mt-1 break-all">
                        {order.userEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Articles</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">x{item.quantity}</span>
                          <span className="text-gray-700">{item.menuItem.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {(item.price * item.quantity).toFixed(2)} {order.currency || 'XOF'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <p className="font-bold text-yellow-900 mb-1">Notes du client :</p>
                    <p className="text-yellow-800 text-sm">{order.notes}</p>
                  </div>
                )}

                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-orange-900 mb-1">Important</p>
                      <p className="text-sm text-orange-800">
                        En prenant cette commande, vous vous engagez à la livrer. 
                        Elle ne sera plus visible pour les autres livreurs.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => takeOrder(order.id)}
                  disabled={takingOrder === order.id}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {takingOrder === order.id ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Prise en cours...
                    </span>
                  ) : (
                    'Prendre cette commande'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}