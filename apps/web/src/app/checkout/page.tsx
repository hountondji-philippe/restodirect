'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart-store';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Phone, CreditCard, User, Mail, Banknote, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type PaymentMethod = 'CASH' | 'MTN_MOMO' | 'MOOV_MONEY' | 'CELTIIS_MONEY';

interface MomoConfig {
  momoMTN: string | null;
  momoMTNName: string | null;
  momoMoov: string | null;
  momoMoovName: string | null;
  momoCeltiis: string | null;
  momoCeltiisName: string | null;
  momoInstructions: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();
  const deliveryFee = 500;
  const finalTotal = total + deliveryFee;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'CASH' as PaymentMethod,
  });

  const [momoConfig, setMomoConfig] = useState<MomoConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const fetchUserData = async () => {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const userData = await res.json();
            setFormData(prev => ({
              ...prev,
              fullName: userData.name || '',
              email: userData.email || '',
              phone: userData.phone || '',
            }));
          }
        } catch (err) {
          console.error('Erreur chargement utilisateur:', err);
        }
      };
      fetchUserData();
    }
  }, [status, session]);

  useEffect(() => {
    if (items.length > 0 && items[0]?.restaurantId) {
      fetchMomoConfig(items[0].restaurantId);
    } else {
      setLoading(false);
    }
  }, [items]);

  const fetchMomoConfig = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/momo`);
      if (res.ok) {
        const data = await res.json();
        setMomoConfig(data);
      }
    } catch (err) {
      console.error('Erreur chargement config Mobile Money:', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const restaurantId = items[0]?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">Erreur: Restaurant non identifié</p>
          <Link href="/cart" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium">
            <ArrowLeft className="h-4 w-4" />
            Retour au panier
          </Link>
        </div>
      </div>
    );
  }

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'L\'email est requis';
    if (!regex.test(email)) return 'Format d\'email invalide';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setFormData({ ...formData, email: newEmail });
    setEmailError(validateEmail(newEmail));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(formData.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    if (!restaurantId) {
      setError('Restaurant non identifié');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentMethodMap: Record<PaymentMethod, string> = {
        'CASH': 'CASH',
        'MTN_MOMO': 'MOBILE_MONEY',
        'MOOV_MONEY': 'MOBILE_MONEY',
        'CELTIIS_MONEY': 'MOBILE_MONEY',
      };

      const orderData = {
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: formData.address,
        city: formData.city,
        paymentMethod: paymentMethodMap[formData.paymentMethod],
        paymentProvider: formData.paymentMethod,
        notes: formData.notes,
        userEmail: formData.email,
        userName: formData.fullName,
        userPhone: formData.phone,
        deliveryFee,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur sauvegarde commande');
      }

      clearCart();
      window.location.href = `/order/confirmation?order=${responseData.order.orderNumber}`;
    } catch (err: any) {
      console.error('Erreur commande:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    {
      value: 'CASH' as PaymentMethod,
      label: 'Espèces à la livraison',
      description: 'Payez en cash quand vous recevez votre commande',
      icon: Banknote,
      logo: null,
      color: 'green',
      available: true,
    },
    {
      value: 'MTN_MOMO' as PaymentMethod,
      label: 'MTN Mobile Money',
      description: momoConfig?.momoMTN ? `Paiement via MTN MoMo` : 'Non disponible',
      icon: Smartphone,
      logo: '/logos/mtn.png',
      color: 'yellow',
      available: !!momoConfig?.momoMTN,
    },
    {
      value: 'MOOV_MONEY' as PaymentMethod,
      label: 'Moov Money',
      description: momoConfig?.momoMoov ? `Paiement via Moov Money` : 'Non disponible',
      icon: Smartphone,
      logo: '/logos/moov.png',
      color: 'blue',
      available: !!momoConfig?.momoMoov,
    },
    {
      value: 'CELTIIS_MONEY' as PaymentMethod,
      label: 'Celtiis Money',
      description: momoConfig?.momoCeltiis ? `Paiement via Celtiis Money` : 'Non disponible',
      icon: Smartphone,
      logo: '/logos/celtiis.png',
      color: 'indigo',
      available: !!momoConfig?.momoCeltiis,
    },
  ].filter(method => method.available);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 sm:mb-10">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4" />
            Retour au panier
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Finaliser la commande</h1>
            <p className="text-gray-600 text-sm sm:text-lg">Remplissez vos informations de livraison</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b-2 border-gray-100">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Informations personnelles</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Nom complet *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Jean Dupont"
                      className="flex h-11 sm:h-12 w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Adresse email *
                      <span className="text-xs text-gray-400 font-normal ml-2">- Pour recevoir votre confirmation</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleEmailChange}
                        required
                        placeholder="votre@email.com"
                        className={`flex h-11 sm:h-12 w-full rounded-lg border ${
                          emailError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                        } pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Téléphone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        minLength={8}
                        maxLength={20}
                        placeholder="+229 XX XX XX XX"
                        className="flex h-11 sm:h-12 w-full rounded-lg border border-gray-300 pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b-2 border-gray-100">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Adresse de livraison</h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Adresse complète *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      minLength={5}
                      maxLength={200}
                      placeholder="Quartier, rue, numéro..."
                      className="flex h-11 sm:h-12 w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Ville *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                      minLength={2}
                      maxLength={50}
                      placeholder="Cotonou"
                      className="flex h-11 sm:h-12 w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Notes (optionnel)
                      <span className="text-gray-400 font-normal ml-2">- Instructions spéciales</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      maxLength={500}
                      placeholder="Ex: Sonner à la porte, appeler avant d'arriver..."
                      className="flex w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b-2 border-gray-100">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Mode de paiement</h2>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = formData.paymentMethod === method.value;
                    return (
                      <label 
                        key={method.value}
                        className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-50 shadow-md' 
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={isSelected}
                          onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                          className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                        />
                        {method.logo ? (
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white border border-gray-200">
                            <Image
                              src={method.logo}
                              alt={method.label}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center shrink-0 bg-${method.color}-100`}>
                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${method.color}-600`} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm sm:text-lg">{method.label}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{method.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {formData.paymentMethod !== 'CASH' && momoConfig && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Instructions de paiement :</p>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Faites le transfert au numéro affiché après la commande</li>
                      <li>Entrez l'ID de transaction reçu</li>
                      <li>Le restaurant confirmera la réception du paiement</li>
                      <li>Votre commande sera alors traitée</li>
                    </ol>
                    {momoConfig.momoInstructions && (
                      <p className="text-xs text-blue-700 mt-2 italic">
                        {momoConfig.momoInstructions}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 sm:gap-3">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Paiement sécurisé :</strong> Vos informations sont protégées et ne sont jamais partagées.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 sm:h-14 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base sm:text-lg shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-95"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm sm:text-base">Traitement en cours...</span>
                  </span>
                ) : (
                  <span className="text-sm sm:text-base">Confirmer la commande - {finalTotal.toFixed(2)} FCFA</span>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 sticky top-4 sm:top-24 border border-gray-100">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Votre commande</h2>
              
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-h-60 sm:max-h-80 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 sm:gap-4 py-2 sm:py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 font-medium">x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                      {(item.price * item.quantity).toFixed(2)} FCFA
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t-2 border-gray-100">
                <div className="flex justify-between text-gray-600 py-1 sm:py-2 text-sm sm:text-base">
                  <span className="font-medium">Sous-total</span>
                  <span className="font-semibold text-gray-900">{total.toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600 py-1 sm:py-2 text-sm sm:text-base">
                  <span className="font-medium">Livraison</span>
                  <span className="font-semibold text-gray-900">{deliveryFee.toFixed(2)} FCFA</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2 sm:my-4"></div>
                <div className="flex justify-between items-center py-2 sm:py-3">
                  <span className="text-base sm:text-xl font-bold text-gray-900">Total</span>
                  <span className="text-xl sm:text-3xl font-bold text-orange-500">{finalTotal.toFixed(2)} FCFA</span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800 flex items-start gap-2">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Un email de confirmation sera envoyé à <strong>{formData.email || 'votre email'}</strong></span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}