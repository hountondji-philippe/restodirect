'use client';

import { useEffect, useState } from 'react';
import { 
  User, Mail, Phone, Shield, RefreshCw, Trash2, 
  AlertTriangle, CheckCircle, XCircle, Loader2, Search
} from 'lucide-react';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  isApproved: boolean;
  isAvailable: boolean;
  totalDeliveries: number;
  rating: number | null;
  createdAt: string;
  _count: {
    restaurants: number;
    orders: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete.id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/users/${confirmDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur suppression');

      setSuccess(data.message);
      setConfirmDelete(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      RESTAURATEUR: 'bg-blue-100 text-blue-800',
      LIVREUR: 'bg-green-100 text-green-800',
      CLIENT: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      RESTAURATEUR: 'Restaurateur',
      LIVREUR: 'Livreur',
      CLIENT: 'Client',
    };
    return { style: styles[role] || 'bg-gray-100', label: labels[role] || role };
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || 
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = {
    ALL: users.length,
    SUPER_ADMIN: users.filter(u => u.role === 'SUPER_ADMIN').length,
    RESTAURATEUR: users.filter(u => u.role === 'RESTAURATEUR').length,
    LIVREUR: users.filter(u => u.role === 'LIVREUR').length,
    CLIENT: users.filter(u => u.role === 'CLIENT').length,
  };

  if (loading && users.length === 0) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-100 border border-green-200 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="mb-4 rounded-lg border border-border bg-background p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {Object.entries(roleCounts).map(([role, count]) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  roleFilter === role
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {role === 'ALL' ? 'Tous' : getRoleBadge(role).label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search || roleFilter !== 'ALL' 
                ? 'Aucun utilisateur ne correspond aux filtres'
                : 'Aucun utilisateur enregistré'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleBadge(user.role);
              return (
                <div key={user.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {(user.name || user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">
                            {user.name || 'Sans nom'}
                          </h3>
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${roleInfo.style}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground sm:text-right">
                      {user.role === 'LIVREUR' && (
                        <div>
                          <p>{user.totalDeliveries || 0} livraisons</p>
                          <p>Note: {user.rating ? user.rating.toFixed(1) : 'N/A'}/5</p>
                        </div>
                      )}
                      {user.role === 'RESTAURATEUR' && (
                        <div>
                          <p>{user._count?.restaurants || 0} restaurant{user._count?.restaurants !== 1 ? 's' : ''}</p>
                          <p>{user._count?.orders || 0} commande{user._count?.orders !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                      <div className="text-xs">
                        Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    {user.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => setConfirmDelete(user)}
                        disabled={deletingId === user.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                        title="Supprimer"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg border border-border shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Supprimer cet utilisateur ?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible. L'utilisateur <span className="font-semibold">{confirmDelete.name || confirmDelete.email}</span> sera définitivement supprimé.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Toutes ses données associées seront également supprimées.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId !== null}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}