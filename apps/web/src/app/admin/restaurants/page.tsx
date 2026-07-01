'use client';

import { useEffect, useState } from 'react';
import { 
  Store, MapPin, RefreshCw, UserPlus, Send, Users, 
  UtensilsCrossed, Trash2, AlertTriangle, Search, Loader2
} from 'lucide-react';

interface RestaurantData {
  id: string;
  name: string;
  city: string;
  country: string;
  cuisine: string;
  phone: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  _count: {
    menuItems: number;
    orders: number;
  };
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RestaurantData | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    restaurantName: '',
    city: '',
    country: 'Bénin',
    cuisine: '',
    currency: 'XOF',
  });

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/restaurants');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement');
      setRestaurants(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/restaurants/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.join(', ') || 'Erreur');

      setSuccess(data.message);
      setFormData({
        email: '', name: '', phone: '', restaurantName: '',
        city: '', country: 'Bénin', cuisine: '', currency: 'XOF',
      });
      setShowForm(false);
      fetchRestaurants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/restaurants/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur suppression');
      setSuccess(data.message);
      setConfirmDelete(null);
      fetchRestaurants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(s) ||
      r.city.toLowerCase().includes(s) ||
      r.cuisine.toLowerCase().includes(s) ||
      r.owner?.email.toLowerCase().includes(s) ||
      r.owner?.name?.toLowerCase().includes(s)
    );
  });

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des restaurants</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} sur la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un restaurant
          </button>
          <button
            onClick={fetchRestaurants}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-100 border border-green-200 p-3 text-sm text-green-800">{success}</div>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-background p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Inviter un propriétaire de restaurant</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Email du propriétaire *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required maxLength={100} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Nom du propriétaire *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required maxLength={100} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Téléphone *</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required maxLength={20} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Nom du restaurant *</label>
              <input type="text" value={formData.restaurantName} onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })} required maxLength={100} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Ville *</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required maxLength={50} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Pays *</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} required maxLength={50} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Type de cuisine</label>
              <input type="text" value={formData.cuisine} onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })} maxLength={50} className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Devise *</label>
              <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} required className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <button type="submit" disabled={isSubmitting} className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]">
                {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Envoi en cours...</>) : (<><Send className="h-4 w-4" />Envoyer l'invitation</>)}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="inline-flex h-10 sm:h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-xs sm:text-sm font-medium hover:bg-accent min-h-[44px]">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un restaurant, une ville, une cuisine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground">Restaurant</th>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Localisation</th>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Cuisine</th>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground">Propriétaire</th>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Stats</th>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                <th className="px-3 sm:px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {search ? 'Aucun restaurant ne correspond à la recherche' : 'Aucun restaurant enregistré'}
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{r.city}</div>
                          <div className="text-xs text-muted-foreground">{r.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{r.city}, {r.country}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">{r.cuisine}</td>
                    <td className="px-3 sm:px-4 py-3">
                      {r.owner ? (
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.owner.name || 'Non défini'}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Non assigné</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs">
                          <UtensilsCrossed className="h-3 w-3 text-muted-foreground" />
                          <span>{r._count.menuItems} plats</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{r._count.orders} cmd</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {r.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <button
                        onClick={() => setConfirmDelete(r)}
                        disabled={deletingId === r.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 mx-auto"
                        title="Supprimer"
                      >
                        {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg border border-border shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">Supprimer le restaurant ?</h3>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible. Le restaurant <span className="font-semibold">{confirmDelete.name}</span> et toutes ses données seront définitivement supprimés.
                </p>
                {confirmDelete.owner && (
                  <p className="text-xs text-red-600 mt-2">⚠️ Le compte propriétaire ({confirmDelete.owner.email}) sera aussi supprimé.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} disabled={deletingId !== null} className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50">Annuler</button>
              <button onClick={handleDelete} disabled={deletingId !== null} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deletingId ? (<><Loader2 className="h-4 w-4 animate-spin" />Suppression...</>) : (<><Trash2 className="h-4 w-4" />Confirmer</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}