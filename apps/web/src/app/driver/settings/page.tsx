'use client';

import { useEffect, useState } from 'react';
import { Loader2, User, Phone, Mail, Clock, TrendingUp, Star, Package, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(data.error || 'Erreur lors du changement');
      }
    } catch (err) {
      setPasswordError('Erreur de connexion');
    } finally {
      setChangingPassword(false);
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

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Changer le mot de passe</h2>
          </div>

          {passwordSuccess && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{passwordSuccess}</p>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{passwordError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Au moins 6 caractères</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Changer le mot de passe
                </>
              )}
            </button>
          </form>
        </div>

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