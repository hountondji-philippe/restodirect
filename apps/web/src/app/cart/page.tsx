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
          <div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white shadow-lg mb-4 sm:mb-6">
            <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-orange-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Votre panier est vide</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">
            Ajoutez des plats pour commencer votre commande
          </p>
          <Link
            href="/search"
            className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-orange-500 px-6 sm:px-8 text-sm sm:text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5"
          >
            Voir les restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12 px-3 sm:px-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-10">
          <Link 
            href="/search" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-3 sm:mb-4 transition-colors font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuer mes achats
          </Link>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Mon Panier</h1>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">{items.length} article{items.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Voulez-vous vraiment vider le panier ?')) {
                    clearCart();
                  }
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm sm:text-base self-start sm:self-auto"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Vider
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <ShoppingBasket className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                Vos articles
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 hover:shadow-md transition-all border border-gray-200 ${
                      index !== items.length - 1 ? 'pb-4 sm:pb-6 border-b-2 border-gray-200' : ''
                    }`}
                  >
                    <div className="flex gap-3 sm:gap-4 lg:gap-5">
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-gray-200 shadow-md">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{item.restaurantName}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-all ml-2 sm:ml-3 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-3 sm:mt-4">
                          <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg shadow-sm border border-gray-200 self-start">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-2 sm:p-3 hover:bg-gray-100 rounded-l-lg transition-colors border-r border-gray-200"
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <span className="w-8 sm:w-10 lg:w-12 text-center font-bold text-sm sm:text-base lg:text-lg text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-2 sm:p-3 hover:bg-gray-100 rounded-r-lg transition-colors border-l border-gray-200"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>

                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-500">
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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 sticky top-4 sm:top-24 border border-gray-100">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Récapitulatif</h2>
              
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex justify-between text-gray-600 py-2 sm:py-3 border-b border-gray-100 text-sm sm:text-base">
                  <span className="font-medium">Sous-total</span>
                  <span className="font-semibold text-gray-900">{formatPrice(total, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600 py-2 sm:py-3 border-b border-gray-100 text-sm sm:text-base">
                  <span className="font-medium">Livraison</span>
                  <span className="font-semibold text-gray-900">{formatPrice(deliveryFee, currency)}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3 sm:my-4 lg:my-6"></div>
                <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Total</span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-500">{formatPrice(finalTotal, currency)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full h-11 sm:h-12 lg:h-14 flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm sm:text-base lg:text-lg shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5"
              >
                Passer la commande
              </Link>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-100">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full shrink-0"></div>
                  Paiement sécurisé
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div className="h-2 w-2 bg-blue-500 rounded-full shrink-0"></div>
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