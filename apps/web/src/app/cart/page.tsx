'use client';

import { useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/currency';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShoppingBasket } from 'lucide-react';

export default function CartPage() {
const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const total = getTotal();
  const currency = items[0]?.currency || 'XOF';
  const deliveryFee = 1500;
  const finalTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg mb-6">
            <ShoppingBag className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Votre panier est vide</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Ajoutez des plats pour commencer votre commande
          </p>
          <Link
            href="/search"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5"
          >
            Voir les restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10">
          <Link 
            href="/search" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuer mes achats
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Panier</h1>
                <p className="text-gray-600 text-lg">{items.length} article{items.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Voulez-vous vraiment vider le panier ?')) {
                    clearCart();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <Trash2 className="h-5 w-5" />
                Vider le panier
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ShoppingBasket className="h-6 w-6 text-orange-500" />
                Vos articles
              </h2>
              
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all border border-gray-200 ${
                      index !== items.length - 1 ? 'mb-6 pb-6 border-b-2 border-gray-200' : ''
                    }`}
                  >
                    <div className="flex gap-5">
                      <div className="relative h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-gray-200 shadow-md">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-500 font-medium">{item.restaurantName}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all ml-3"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-3 hover:bg-gray-100 rounded-l-lg transition-colors border-r border-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-bold text-lg text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-3 hover:bg-gray-100 rounded-r-lg transition-colors border-l border-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-2xl font-bold text-orange-500">
                            {formatPrice(item.price * item.quantity, item.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Récapitulatif</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600 py-3 border-b border-gray-100">
                  <span className="font-medium">Sous-total</span>
                  <span className="font-semibold text-gray-900">{formatPrice(total, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600 py-3 border-b border-gray-100">
                  <span className="font-medium">Livraison</span>
                  <span className="font-semibold text-gray-900">{formatPrice(deliveryFee, currency)}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6"></div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-orange-500">{formatPrice(finalTotal, currency)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full h-14 flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5"
              >
                Passer la commande
              </Link>

              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Paiement sécurisé
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Livraison en 30-45 min
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}