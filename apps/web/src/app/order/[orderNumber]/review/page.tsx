'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');

  const [restaurantRating, setRestaurantRating] = useState(5);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/track/${orderNumber.replace('RD-', '')}`);
      const data = await res.json();

      if (res.ok) {
        if (data.status !== 'COMPLETED') {
          setError('Cette commande n\'est pas encore complétée');
        } else {
          setOrder(data);
          if (data.userEmail) {
            setUserEmail(data.userEmail);
          }
        }
      } else {
        setError(data.error || 'Commande non trouvée');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantRating,
          restaurantComment: restaurantComment || undefined,
          driverRating: order.delivery ? driverRating : undefined,
          driverComment: order.delivery ? driverComment || undefined : undefined,
          userEmail: userEmail || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, setRating, label }: { rating: number; setRating: (r: number) => void; label: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre avis !</h1>
          <p className="text-gray-600 mb-6">
            Votre feedback nous aide à améliorer notre service
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laissez votre avis</h1>
          <p className="text-gray-600 mb-6">
            Commande #{order.orderNumber} - {order.restaurant.name}
          </p>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email pour vérification si non connecté */}
            {!order.userId && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Votre email *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'email utilisé lors de la commande
                </p>
              </div>
            )}

            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Comment s'est passé votre expérience au restaurant ?
              </h2>
              <StarRating
                rating={restaurantRating}
                setRating={setRestaurantRating}
                label="Note du restaurant"
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={restaurantComment}
                  onChange={(e) => setRestaurantComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Partagez votre expérience..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {order.delivery && (
              <div className="border-b border-border pb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Comment s'est passée la livraison ?
                </h2>
                <StarRating
                  rating={driverRating}
                  setRating={setDriverRating}
                  label="Note du livreur"
                />
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={driverComment}
                    onChange={(e) => setDriverComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Partagez votre expérience de livraison..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link
                href="/"
                className="flex-1 inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Publier mon avis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}