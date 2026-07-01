'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Clock, ArrowRight, ShoppingBag } from 'lucide-react';

interface Order {
  id: string;
  date: string;
  items: any[];
  total: number;
  status: string;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Charger les commandes depuis localStorage
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(savedOrders.reverse()); // Les plus recentes d'abord
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmee',
      preparing: 'En preparation',
      ready: 'Prete',
      delivering: 'En livraison',
      delivered: 'Livree',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-purple-100 text-purple-700',
      delivering: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg mb-6">
            <ShoppingBag className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Aucune commande</h1>
          <p className="text-gray-600 mb-8">
            Vous n'avez pas encore passe de commande
          </p>
          <Link
            href="/search"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600"
          >
            Voir les restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* En-tete */}
        <div className="mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Retour a l'accueil
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes commandes</h1>
            <p className="text-gray-600 text-lg">Retrouvez toutes vos commandes</p>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="h-6 w-6 text-orange-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Commande #{order.id}</h2>
                  </div>
                  <p className="text-gray-600">
                    Passee le {new Date(order.date).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Articles */}
              <div className="border-t-2 border-gray-100 pt-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Articles commandes</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-500">x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} EUR</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total et actions */}
              <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-orange-500">{order.total.toFixed(2)} EUR</p>
                </div>
                <Link
                  href={`/order/tracking/${order.id}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-base font-medium text-white shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700"
                >
                  Suivre la commande
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}