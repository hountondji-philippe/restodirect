'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, Phone, Mail, CheckCircle, XCircle, Clock, 
  RefreshCw, UserPlus, Send, Truck, Users, MailOpen,
  Power, Trash2, Loader2, AlertCircle
} from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  token: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

interface DriverApproval {
  id: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  driver: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    rating: number;
    totalDeliveries: number;
    isAvailable: boolean;
    createdAt: string;
  };
}

export default function DriversManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<'invitations' | 'drivers'>('invitations');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [drivers, setDrivers] = useState<DriverApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      if ((session.user as any).role !== 'RESTAURATEUR') {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [invRes, drvRes] = await Promise.all([
        fetch('/api/dashboard/drivers/invitations'),
        fetch('/api/dashboard/drivers'),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData);
      }

      if (drvRes.ok) {
        const drvData = await drvRes.json();
        setDrivers(drvData);
      }
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/dashboard/drivers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.join(', ') || 'Erreur');

      setSuccess(data.message);
      setFormData({ email: '', name: '', phone: '' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDriverAvailability = async (driverId: string, currentStatus: boolean) => {
    setActionLoading(driverId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (res.ok) {
        setDrivers(drivers.map(d => 
          d.driver.id === driverId 
            ? { ...d, driver: { ...d.driver, isAvailable: !currentStatus } }
            : d
        ));
        setSuccess(`Livreur ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const removeDriver = async (driverId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce livreur de votre restaurant ?\n\nLe compte du livreur ne sera pas supprimé, il pourra travailler pour d\'autres restaurants.')) {
      return;
    }

    setActionLoading(driverId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDrivers(drivers.filter(d => d.driver.id !== driverId));
        setSuccess('Livreur retiré de votre restaurant');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      USED: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      USED: 'Utilisée',
      EXPIRED: 'Expirée',
    };
    return { style: styles[status] || 'bg-gray-100', label: labels[status] || status };
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mes livreurs</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Invitez et gérez les livreurs de votre restaurant
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Inviter un livreur</span>
            <span className="sm:hidden">Inviter</span>
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 sm:p-4 text-xs sm:text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-100 border border-green-200 p-3 sm:p-4 text-xs sm:text-sm text-green-800 flex items-start gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-background p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Inviter un nouveau livreur</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Email du livreur *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                maxLength={100}
                className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Nom complet *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
                className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Téléphone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                maxLength={20}
                className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer l'invitation
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex h-10 sm:h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-xs sm:text-sm font-medium hover:bg-accent min-h-[44px]"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onglets */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-4 sm:gap-6">
          <button
            onClick={() => setTab('invitations')}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
              tab === 'invitations'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <MailOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
              <span className="sm:hidden">Inv.</span>
              ({invitations.length})
            </span>
          </button>
          <button
            onClick={() => setTab('drivers')}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
              tab === 'drivers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Livreurs actifs</span>
              <span className="sm:hidden">Livreurs</span>
              ({drivers.length})
            </span>
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {tab === 'invitations' && (
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <div className="rounded-lg border border-border bg-background p-12 text-center">
              <MailOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune invitation envoyée</p>
              <p className="text-xs text-muted-foreground mt-2">
                Cliquez sur "Inviter un livreur" pour commencer
              </p>
            </div>
          ) : (
            invitations.map((inv) => {
              const statusInfo = getStatusBadge(inv.status);
              const expired = inv.status === 'PENDING' && isExpired(inv.expiresAt);
              return (
                <div key={inv.id} className="rounded-lg border border-border bg-background p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Envoyée le {new Date(inv.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs rounded-full shrink-0 ${
                      expired ? 'bg-gray-100 text-gray-800' : statusInfo.style
                    }`}>
                      {expired ? 'Expirée' : statusInfo.label}
                    </span>
                  </div>
                  {inv.status === 'USED' && inv.usedAt && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Compte activé le {new Date(inv.usedAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'drivers' && (
        <div className="space-y-3">
          {drivers.length === 0 ? (
            <div className="rounded-lg border border-border bg-background p-12 text-center">
              <Truck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun livreur actif pour le moment</p>
              <p className="text-xs text-muted-foreground mt-2">
                Les livreurs apparaîtront ici après avoir activé leur compte
              </p>
            </div>
          ) : (
            drivers.map((drv) => (
              <div key={drv.id} className="rounded-lg border border-border bg-background p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {drv.driver.name || 'Sans nom'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>Inscrit le {new Date(drv.driver.createdAt).toLocaleDateString('fr-FR')}</span>
                            {drv.approvedAt && (
                              <>
                                <span>•</span>
                                <span>Approuvé le {new Date(drv.approvedAt).toLocaleDateString('fr-FR')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs rounded-full shrink-0 ${
                          drv.driver.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {drv.driver.isAvailable ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{drv.driver.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{drv.driver.phone || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>{drv.driver.totalDeliveries} livraisons</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span>Note: {drv.driver.rating > 0 ? drv.driver.rating.toFixed(1) : 'N/A'} / 5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => toggleDriverAvailability(drv.driver.id, drv.driver.isAvailable)}
                      disabled={actionLoading === drv.driver.id}
                      className={`flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-xs sm:text-sm font-medium disabled:opacity-50 ${
                        drv.driver.isAvailable
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {actionLoading === drv.driver.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Power className="h-4 w-4" />
                          {drv.driver.isAvailable ? 'Désactiver' : 'Activer'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => removeDriver(drv.driver.id)}
                      disabled={actionLoading === drv.driver.id}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-100 text-red-800 hover:bg-red-200 px-4 text-xs sm:text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === drv.driver.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Retirer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
