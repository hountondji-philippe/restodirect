'use client';

import { useEffect, useState } from 'react';
import { Loader2, User, Phone, Mail, MapPin, Clock, TrendingUp, Star, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface DriverStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
  recentDeliveries: Array<{
    id: string;
    earnings: number;
    deliveredAt: string;
    order: {
      orderNumber: string;
      total: number;
    };
  }>;
  totalEarnings: number;
}

export default function DriverSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [stats, setStats] = useState<DriverStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/driver/settings/availability');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleToggleAvailability = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/driver/settings/availability', {
        method: 'PATCH',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType('success');
        // Mettre à jour le statut localement
        if (stats) {
          setStats({ ...stats, isAvailable: data.isAvailable });
        }
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Erreur lors de la mise à jour');
        setMessageType('error');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setMessage('Erreur de connexion au serveur');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Paramètres livreur</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Gérez votre disponibilité et consultez vos statistiques</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-md p-3 text-sm flex items-start gap-2 ${
          messageType === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p>{message}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Statut de disponibilité - Grande carte */}
        <div className={`rounded-xl border-2 p-6 transition-all ${
          stats?.isAvailable 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                stats?.isAvailable ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                <div className={`h-3 w-3 rounded-full bg-white ${stats?.isAvailable ? 'animate-pulse' : ''}`}></div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {stats?.isAvailable ? 'Vous êtes DISPONIBLE' : 'Vous êtes INDISPONIBLE'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stats?.isAvailable 
                    ? 'Vous pouvez recevoir de nouvelles demandes de livraison' 
                    : 'Vous ne recevrez pas de nouvelles demandes'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={loading}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold shadow-lg transition-all disabled:opacity-50 ${
                stats?.isAvailable 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  {stats?.isAvailable ? (
                    <>
                      <Clock className="h-5 w-5" />
                      Se rendre indisponible
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Se rendre disponible
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Livraisons</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.totalDeliveries || 0}</p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <p className="text-xs text-muted-foreground">Note</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.rating ? stats.rating.toFixed(1) : 'N/A'}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Gains récents</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {(stats?.totalEarnings || 0).toLocaleString()} F
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <p className="text-xs text-muted-foreground">Membre depuis</p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {stats?.createdAt ? new Date(stats.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-lg font-semibold mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <p className="text-foreground">{stats?.name || session?.user?.name || 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                <p className="text-foreground">{stats?.phone || (session?.user as any)?.phone || 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{stats?.email || session?.user?.email || 'Non défini'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Livraisons récentes */}
        {stats?.recentDeliveries && stats.recentDeliveries.length > 0 && (
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">Dernières livraisons</h2>
            <div className="space-y-2">
              {stats.recentDeliveries.slice(0, 5).map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Commande #{delivery.order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      +{(delivery.earnings || 0).toLocaleString()} F
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}