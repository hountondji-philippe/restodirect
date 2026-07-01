'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, AlertCircle, Home } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  deliveryAddress: string;
  city: string;
  createdAt: string;
  restaurant: {
    name: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      name: string;
    };
  }>;
  delivery?: {
    id: string;
    status: string;
    deliveredAt: string | null;
    confirmedByClient: boolean;
  };
}

export default function OrderConfirmPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Commande non trouvée');
      
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleConfirm = async () => {
    if (!confirm('Confirmez-vous avoir reçu cette commande ?')) return;

    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      setConfirmed(true);
      fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la confirmation');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Commande non trouvée</h1>
          <p className="text-gray-600 mb-8">{error || 'Le numéro de commande est invalide'}</p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (confirmed || order.delivery?.confirmedByClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Commande confirmée !</h1>
          <p className="text-gray-600 mb-8">
            Merci d'avoir confirmé la réception de votre commande #{order.orderNumber}
          </p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (order.status !== 'DELIVERED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 mb-6">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Commande non livrée</h1>
          <p className="text-gray-600 mb-8">
            Cette commande n'a pas encore été livrée. Statut actuel : {order.status}
          </p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirmer la livraison</h1>
            <p className="text-gray-600">
              Commande #{order.orderNumber}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Important :</strong> En confirmant, vous attestez avoir reçu votre commande complète et en bon état.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Restaurant</span>
              <span className="font-medium text-gray-900">{order.restaurant.name}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Livraison</span>
              <span className="font-medium text-gray-900">{order.deliveryAddress}, {order.city}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Articles</span>
              <span className="font-medium text-gray-900">{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-orange-500">
                {formatPrice(order.total, order.currency)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Oui, j'ai reçu ma commande
                </>
              )}
            </button>

            <Link
              href="/"
              className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-gray-100 text-gray-700 font-medium text-lg transition-all hover:bg-gray-200"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Si vous ne confirmez pas dans les 48h, la commande sera automatiquement confirmée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}