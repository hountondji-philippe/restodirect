'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Clock, Package, Truck, CheckCircle, Home, RefreshCw, AlertCircle, Loader2, ShieldCheck, Star, Smartphone, Send, Camera, X } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ASSIGNED' | 'DELIVERING' | 'DELIVERED' | 'COMPLETED' | 'AUTO_CONFIRMED' | 'CANCELLED';

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
  status: OrderStatus;
  total: number;
  deliveryAddress: string;
  city: string;
  notes: string | null;
  createdAt: string;
  currency: string;
  userId: string;
  confirmedAt: string | null;
  autoConfirmedAt: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentProvider: string | null;
  momoTransactionId: string | null;
  momoPaymentConfirmed: boolean;
  momoRejectedAt: string | null;
  momoRejectionReason: string | null;
  userEmail: string | null;
  user: {
    name: string;
    phone: string;
  };
  restaurant: {
    name: string;
    phone: string;
    currency: string;
    momoMTN: string | null;
    momoMTNName: string | null;
    momoMoov: string | null;
    momoMoovName: string | null;
    momoCeltiis: string | null;
    momoCeltiisName: string | null;
    momoInstructions: string | null;
  };
  items: OrderItem[];
  delivery?: {
    id: string;
    status: string;
    deliveredAt: string | null;
    confirmedByClient: boolean;
  };
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState('');
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const isFirstLoad = useRef(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrder = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      
      const cleanNumber = orderId.replace('#', '').trim();
      const res = await fetch(`/api/orders/track/${cleanNumber}`);
      
      if (!res.ok) throw new Error('Commande non trouvée');
      
      const data = await res.json();
      setOrder(data);
      setLastUpdate(new Date());

      if (data.status === 'COMPLETED' || data.delivery?.confirmedByClient) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };

  useEffect(() => {
    fetchOrder(true);
    
    pollIntervalRef.current = setInterval(() => {
      fetchOrder(false);
    }, 5000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (!order?.delivery?.deliveredAt) return;
    
    const updateTimer = () => {
      const deliveredAt = new Date(order.delivery!.deliveredAt!);
      const autoConfirmAt = new Date(deliveredAt.getTime() + 48 * 60 * 60 * 1000);
      const now = new Date();
      const diff = autoConfirmAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Confirmée automatiquement');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}min avant confirmation automatique`);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [order]);

  const handleConfirm = async () => {
    if (!order) return;
    
    if (session?.user && (session.user as any).id !== order.userId) {
      setConfirmError('Vous n\'êtes pas autorisé à confirmer cette commande');
      return;
    }
    
    if (!confirm('Confirmez-vous avoir reçu cette commande complète et en bon état ?')) return;

    setConfirming(true);
    setConfirmError('');
    
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la confirmation');

      setJustConfirmed(true);
      await fetchOrder(true);

      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setConfirmError(err.message || 'Erreur lors de la confirmation');
    } finally {
      setConfirming(false);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      setTransactionError('L\'image ne doit pas dépasser 5Mo');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setTransactionError('Veuillez sélectionner une image');
      return;
    }
    setTransactionError('');
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }
};

  const handleSubmitTransaction = async (e: React.FormEvent) => {
  e.preventDefault();
  setTransactionError('');
  setSubmittingTransaction(true);

  try {
    let paymentProofUrl = '';

    if (proofFile) {
      setUploadingProof(true);
      const formDataUpload = new FormData();
      formDataUpload.append('proof', proofFile);
      
      const uploadRes = await fetch(`/api/orders/${order!.id}/payment-proof`, {
        method: 'POST',
        body: formDataUpload,
      });
      
      const uploadData = await uploadRes.json();
      setUploadingProof(false);
      
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Erreur upload capture');
      }
      
      paymentProofUrl = uploadData.url;
    }

    const res = await fetch(`/api/orders/${order!.id}/momo`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transactionId,
        paymentProofUrl: paymentProofUrl || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');

    setTransactionSuccess(true);
    setProofFile(null);
    setProofPreview('');
    await fetchOrder(true);
  } catch (err: any) {
    setTransactionError(err.message || 'Erreur');
  } finally {
    setSubmittingTransaction(false);
  }
};

  const getStatusStep = (status: OrderStatus) => {
    const steps: Record<string, number> = {
      'PENDING': 0, 'CONFIRMED': 1, 'PREPARING': 2, 'READY': 3,
      'ASSIGNED': 3, 'DELIVERING': 4, 'DELIVERED': 5,
      'COMPLETED': 6, 'AUTO_CONFIRMED': 6, 'CANCELLED': -1,
    };
    return steps[status] || 0;
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<string, string> = {
      'PENDING': 'En attente', 'CONFIRMED': 'Confirmée', 'PREPARING': 'En préparation',
      'READY': 'Prête', 'ASSIGNED': 'Livreur assigné', 'DELIVERING': 'En livraison',
      'DELIVERED': 'Livrée', 'COMPLETED': 'Confirmée par le client',
      'AUTO_CONFIRMED': 'Confirmée automatiquement', 'CANCELLED': 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<string, string> = {
      'PENDING': 'text-yellow-600', 'CONFIRMED': 'text-blue-600',
      'PREPARING': 'text-purple-600', 'READY': 'text-green-600',
      'ASSIGNED': 'text-indigo-600', 'DELIVERING': 'text-orange-600',
      'DELIVERED': 'text-gray-600', 'COMPLETED': 'text-green-700',
      'AUTO_CONFIRMED': 'text-green-700', 'CANCELLED': 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const isAlreadyConfirmed = order?.status === 'COMPLETED' || order?.status === 'AUTO_CONFIRMED' || order?.delivery?.confirmedByClient;
  const canConfirm = order?.status === 'DELIVERED' && !isAlreadyConfirmed && !justConfirmed;
  const isMobileMoney = order?.paymentMethod === 'MOBILE_MONEY';
  const isAwaitingPayment = isMobileMoney && order?.paymentStatus !== 'PAID' && order?.status !== 'CANCELLED';
  const needsTransactionId = isAwaitingPayment && !order?.momoTransactionId && !transactionSuccess;

  if (isAlreadyConfirmed || justConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {justConfirmed ? 'Merci pour votre confirmation !' : 'Commande terminée !'}
            </h1>
            <p className="text-gray-600 mb-6">
              {justConfirmed 
                ? 'Votre confirmation a été enregistrée avec succès.'
                : 'Merci d\'avoir confirmé la réception de votre commande.'}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Commande #{order?.orderNumber} finalisée avec succès.
              </p>
              {order?.confirmedAt && (
                <p className="text-xs text-green-700 mt-2">
                  Confirmée le {new Date(order.confirmedAt).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/order/${order?.orderNumber}/review`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-6 text-base font-medium text-white shadow-lg transition-all hover:shadow-xl hover:from-yellow-600 hover:to-orange-600"
              >
                <Star className="h-5 w-5" />
                Laisser un avis
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600"
              >
                <Home className="h-5 w-5" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Commande non trouvée</h1>
          <p className="text-gray-600 mb-8 text-sm sm:text-base">{error}</p>
          <Link
            href="/order/track"
            className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-orange-500 px-6 sm:px-8 text-sm sm:text-base font-medium text-white shadow-lg transition-all hover:bg-orange-600 w-full sm:w-auto"
          >
            Suivre une autre commande
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = getStatusStep(order.status);
  const currency = order.currency || 'XOF';
  const steps = [
    { id: 0, label: 'Reçue', icon: CheckCircle, description: 'Commande reçue' },
    { id: 1, label: 'Confirmée', icon: CheckCircle, description: 'Restaurant confirmé' },
    { id: 2, label: 'Préparation', icon: Package, description: 'En préparation' },
    { id: 3, label: 'Prête', icon: Package, description: 'Prête à livrer' },
    { id: 4, label: 'En livraison', icon: Truck, description: 'Livreur en route' },
    { id: 5, label: 'Livrée', icon: Truck, description: 'Commande livrée' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium text-sm sm:text-base"
          >
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 text-center">
            <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg mb-4 sm:mb-6">
              <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Suivi de votre commande</h1>
            <p className="text-gray-600 text-sm sm:text-lg mb-4">
              N° : <span className="font-bold text-orange-500">#{order.orderNumber}</span>
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Mise à jour en temps réel</span>
              <span className="sm:hidden">Temps réel</span>
              {lastUpdate && (
                <span className="text-xs ml-2">
                  ({lastUpdate.toLocaleTimeString('fr-FR')})
                </span>
              )}
            </div>
          </div>
        </div>

        {needsTransactionId && !transactionSuccess && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 sm:p-8 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-1">
                  Complétez votre paiement Mobile Money
                </h2>
                <p className="text-sm sm:text-base text-blue-800">
                  Effectuez le transfert au numéro ci-dessous, puis entrez l'ID de transaction reçu.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Montant à payer :</p>
              <p className="text-3xl font-bold text-blue-600">{formatPrice(order.total, currency)}</p>
            </div>

            <div className="space-y-3 mb-4">
              {order.paymentProvider === 'MTN_MOMO' && order.restaurant.momoMTN && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                    <Image src="/logos/mtn.png" alt="MTN" width={40} height={40} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">Numéro MTN</p>
                    <p className="text-lg font-bold text-gray-900">{order.restaurant.momoMTN}</p>
                    {order.restaurant.momoMTNName && (
                      <p className="text-xs text-gray-600">{order.restaurant.momoMTNName}</p>
                    )}
                  </div>
                </div>
              )}

              {order.paymentProvider === 'MOOV_MONEY' && order.restaurant.momoMoov && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                    <Image src="/logos/moov.png" alt="Moov" width={40} height={40} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">Numéro Moov</p>
                    <p className="text-lg font-bold text-gray-900">{order.restaurant.momoMoov}</p>
                    {order.restaurant.momoMoovName && (
                      <p className="text-xs text-gray-600">{order.restaurant.momoMoovName}</p>
                    )}
                  </div>
                </div>
              )}

              {order.paymentProvider === 'CELTIIS_MONEY' && order.restaurant.momoCeltiis && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                    <Image src="/logos/celtiis.png" alt="Celtiis" width={40} height={40} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">Numéro Celtiis</p>
                    <p className="text-lg font-bold text-gray-900">{order.restaurant.momoCeltiis}</p>
                    {order.restaurant.momoCeltiisName && (
                      <p className="text-xs text-gray-600">{order.restaurant.momoCeltiisName}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {order.restaurant.momoInstructions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  {order.restaurant.momoInstructions}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitTransaction} className="space-y-3">
        {/* Upload de la capture d'écran */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📸 Capture d'écran du transfert (recommandé)
          </label>
          {proofPreview && (
            <div className="mb-2 relative h-32 w-full rounded-lg overflow-hidden border border-blue-300">
              <Image 
                src={proofPreview} 
                alt="Aperçu capture" 
                fill
                className="object-contain bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  setProofFile(null);
                  setProofPreview('');
                }}
                className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <label className="flex items-center justify-center w-full h-24 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="flex flex-col items-center">
              <Camera className="h-6 w-6 text-blue-500 mb-1" />
              <span className="text-xs text-blue-700 font-medium">
                {proofFile ? proofFile.name : 'Cliquez pour ajouter une capture'}
              </span>
              <span className="text-xs text-blue-600">(PNG, JPG - Max 5Mo)</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleProofFileChange}
              className="hidden"
            />
          </label>
        </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID de transaction (reçu après le transfert) *
            </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                  minLength={4}
                  maxLength={50}
                  placeholder="Ex: 1234567890"
                  className="flex h-11 w-full rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {transactionError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {transactionError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingTransaction || uploadingProof}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-base shadow-lg transition-all hover:shadow-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 active:scale-95"
              >
                {submittingTransaction ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Envoi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span className="text-sm">Confirmer le paiement</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-blue-700 text-center mt-3">
              Le restaurant vérifiera la réception du paiement avant de traiter votre commande
            </p>
          </div>
        )}

        {isMobileMoney && order.momoTransactionId && order.paymentStatus === 'PENDING_VERIFICATION' && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-5 sm:p-8 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-yellow-900 mb-1">
                  En attente de confirmation
                </h2>
                <p className="text-sm sm:text-base text-yellow-800 mb-2">
                  Votre ID de transaction <span className="font-bold">{order.momoTransactionId}</span> a été reçu.
                </p>
                <p className="text-xs sm:text-sm text-yellow-700">
                  Le restaurant est en train de vérifier la réception du paiement. Vous serez notifié dès qu'il aura confirmé.
                </p>
              </div>
            </div>
          </div>
        )}

        {order.paymentStatus === 'REJECTED' && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-5 sm:p-8 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-1">
                  Paiement refusé
                </h2>
                <p className="text-sm sm:text-base text-red-800 mb-2">
                  Le restaurant n'a pas pu confirmer votre paiement.
                </p>
                {order.momoRejectionReason && (
                  <p className="text-xs sm:text-sm text-red-700 bg-red-100 p-3 rounded-lg">
                    <strong>Motif :</strong> {order.momoRejectionReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {order.paymentStatus === 'PAID' && isMobileMoney && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 sm:p-8 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-1">
                  Paiement confirmé
                </h2>
                <p className="text-sm sm:text-base text-green-800">
                  Votre paiement Mobile Money a été confirmé par le restaurant. Votre commande est en cours de traitement.
                </p>
              </div>
            </div>
          </div>
        )}

        {canConfirm && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 sm:p-8 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-1">
                  Confirmer la réception
                </h2>
                <p className="text-sm sm:text-base text-green-800">
                  Votre commande a été livrée. Confirmez que vous l'avez bien reçue complète et en bon état.
                </p>
                {timeLeft && (
                  <p className="text-xs sm:text-sm text-green-700 mt-2 font-medium">
                    {timeLeft}
                  </p>
                )}
              </div>
            </div>

            {confirmError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {confirmError}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-base sm:text-lg shadow-lg transition-all hover:shadow-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 active:scale-95"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm sm:text-base">Confirmation en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm sm:text-base">Oui, j'ai reçu ma commande</span>
                </>
              )}
            </button>

            <p className="text-xs text-green-700 text-center mt-3">
              En cliquant, vous confirmez avoir reçu votre commande complète
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-gray-100 overflow-x-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8 min-w-[600px] sm:min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Progression</h2>
            <button
              onClick={() => fetchOrder(true)}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs sm:text-sm font-medium"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Rafraîchir</span>
            </button>
          </div>
          
          <div className="relative min-w-[600px] sm:min-w-0">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-orange-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((currentStep / 5) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="relative grid grid-cols-6 gap-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep >= step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={`relative z-10 h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg scale-110' 
                          : 'bg-gray-200'
                      } ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-300 animate-pulse' : ''}`}
                    >
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="mt-3 sm:mt-4 text-center">
                      <h3 className={`font-bold text-xs sm:text-sm mb-1 ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </h3>
                      <p className="text-xs text-gray-500 hidden lg:block">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-opacity-10 ${getStatusColor(order.status).replace('text-', 'bg-')}`}>
                <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${getStatusColor(order.status)}`} />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-gray-900">Statut actuel</h3>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${getStatusColor(order.status)} mb-1 sm:mb-2`}>
              {getStatusLabel(order.status)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-gray-900">Total</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1 sm:mb-2">
              {formatPrice(order.total, currency)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {order.paymentMethod === 'CASH' ? 'Paiement à la livraison' : 'Mobile Money'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Détails de la commande</h3>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Restaurant</h4>
              <p className="text-gray-700 text-sm sm:text-base">{order.restaurant.name}</p>
              <p className="text-xs sm:text-sm text-gray-600">{order.restaurant.phone}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Livraison</h4>
              <p className="text-gray-700 text-sm sm:text-base break-words">{order.deliveryAddress}</p>
              <p className="text-xs sm:text-sm text-gray-600">{order.city}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Articles</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Besoin d'aide ?</h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Contactez notre service client ou suivez une autre commande
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/order/track"
              className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-lg bg-gray-100 px-5 sm:px-6 text-sm sm:text-base font-medium text-gray-700 shadow transition-all hover:bg-gray-200"
            >
              Suivre une commande
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-6 text-sm sm:text-base font-medium text-white shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700"
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