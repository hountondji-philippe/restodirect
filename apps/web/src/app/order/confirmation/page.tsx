'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Home, Clock, Package, ArrowRight, Phone, Mail, Copy, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { Suspense, useState, useEffect } from 'react';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '';
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/track/${orderNumber.replace('RD-', '')}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error('Erreur chargement commande:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <Clock className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Aucune commande trouvée</h1>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const isMobileMoney = order?.paymentMethod === 'MOBILE_MONEY';
  const paymentProvider = order?.paymentProvider;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 border border-gray-100">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm mb-4 sm:mb-6">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            Commande confirmée
          </div>

          <div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg mb-6 sm:mb-8">
            <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
            Commande confirmée !
          </h1>
          
          <p className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8 text-center">
            {isMobileMoney 
              ? 'Votre commande a été reçue. Veuillez effectuer le paiement Mobile Money ci-dessous.'
              : 'Votre commande a été reçue et est en cours de traitement.'}
          </p>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 border-2 border-orange-200">
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Votre numéro de commande</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <p className="text-3xl sm:text-5xl font-bold text-orange-600">{orderNumber}</p>
              <button
                onClick={copyOrderNumber}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-300 transition-colors text-xs sm:text-sm font-medium text-orange-600"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center">
              Conservez ce numéro pour suivre votre commande
            </p>
          </div>

          {isMobileMoney && order && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Paiement Mobile Money</h2>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Montant à payer :</p>
                <p className="text-3xl font-bold text-blue-600">{order.total.toFixed(0)} FCFA</p>
              </div>

              <div className="space-y-3 mb-4">
                {paymentProvider === 'MTN_MOMO' && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <Image src="/logos/mtn.png" alt="MTN" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Numéro MTN</p>
                      <p className="text-lg font-bold text-gray-900">{order.restaurant?.momoMTN || 'Non configuré'}</p>
                      {order.restaurant?.momoMTNName && (
                        <p className="text-xs text-gray-600">{order.restaurant.momoMTNName}</p>
                      )}
                    </div>
                  </div>
                )}

                {paymentProvider === 'MOOV_MONEY' && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <Image src="/logos/moov.png" alt="Moov" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Numéro Moov</p>
                      <p className="text-lg font-bold text-gray-900">{order.restaurant?.momoMoov || 'Non configuré'}</p>
                      {order.restaurant?.momoMoovName && (
                        <p className="text-xs text-gray-600">{order.restaurant.momoMoovName}</p>
                      )}
                    </div>
                  </div>
                )}

                {paymentProvider === 'CELTIIS_MONEY' && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <Image src="/logos/celtiis.png" alt="Celtiis" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Numéro Celtiis</p>
                      <p className="text-lg font-bold text-gray-900">{order.restaurant?.momoCeltiis || 'Non configuré'}</p>
                      {order.restaurant?.momoCeltiisName && (
                        <p className="text-xs text-gray-600">{order.restaurant.momoCeltiisName}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-1">Instructions importantes :</p>
                    <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                      <li>Effectuez le transfert au numéro ci-dessus</li>
                      <li>Notez l'ID de transaction reçu</li>
                      <li>Entrez cet ID dans la page de suivi</li>
                      <li>Le restaurant confirmera la réception</li>
                      <li>Votre commande sera alors traitée</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Link
            href={`/order/tracking/${orderNumber.replace('RD-', '')}`}
            className="w-full inline-flex h-12 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 sm:px-8 text-base sm:text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 mb-4"
          >
            {isMobileMoney ? 'Continuer vers le paiement' : 'Suivre ma commande en temps réel'}
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>

          <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 border-2 border-blue-100">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-blue-900 text-sm sm:text-base mb-1">
                  Email de confirmation envoyé
                </h3>
                <p className="text-blue-700 text-xs sm:text-sm">
                  Un email avec les détails de votre commande et le lien de suivi a été envoyé à l'adresse que vous avez fournie.
                </p>
                <p className="text-blue-600 text-xs sm:text-sm mt-2 font-medium">
                  Vérifiez vos spams si vous ne le voyez pas
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/order/track"
              className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-lg bg-gray-100 px-5 sm:px-6 text-sm sm:text-base font-medium text-gray-700 shadow transition-all hover:bg-gray-200"
            >
              Suivre une autre commande
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-lg bg-white border-2 border-gray-200 px-5 sm:px-6 text-sm sm:text-base font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}