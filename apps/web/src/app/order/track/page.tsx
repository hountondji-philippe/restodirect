'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft, Package } from 'lucide-react';

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      setError('Veuillez entrer un numéro de commande');
      return;
    }

    // Accepter les formats : RD-12345678 ou juste les chiffres
    const orderNumber = orderId.trim().replace('RD-', '').replace('#', '');
    
    if (!/^\d+$/.test(orderNumber)) {
      setError('Le numéro de commande doit être valide (ex: RD-12345678)');
      return;
    }

    // Rediriger vers la page de suivi
    router.push(`/order/tracking/${orderNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg mb-6">
            <Package className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Suivre ma commande
          </h1>
          <p className="text-gray-600 text-lg">
            Entrez votre numéro de commande pour suivre sa progression
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Numéro de commande
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setError('');
                  }}
                  placeholder="Ex: RD-12345678"
                  className="flex h-14 w-full rounded-lg border border-gray-300 pl-12 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Format accepté : RD-12345678 ou 12345678
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5"
            >
              Suivre ma commande
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            <p className="text-sm text-gray-600 text-center mb-3">
              Où trouver votre numéro de commande ?
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Dans l'email de confirmation</p>
              <p>• Dans le SMS de confirmation</p>
              <p>• Sur votre ticket de commande</p>
            </div>
          </div>
        </div>

        {/* Exemple */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Astuce :
          </p>
          <p className="text-sm text-blue-700">
            Votre numéro de commande commence par RD- suivi de 8 chiffres. 
            Exemple : <span className="font-bold">RD-69837295</span>
          </p>
        </div>
      </div>
    </div>
  );
}