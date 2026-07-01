'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Trash2, Loader2, Edit, Eye, EyeOff, Filter } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
}

export default function MenuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantCurrency, setRestaurantCurrency] = useState('XOF');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== 'RESTAURATEUR') {
        router.push('/');
        return;
      }
      fetchMenu();
    }
  }, [status, session, router]);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/dashboard/restaurant');
      const data = await res.json();

      if (res.ok) {
        setRestaurantName(data.name || '');
        setRestaurantCurrency(data.currency || 'XOF');
        setMenuItems(data.menuItems || []);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    setActionLoading(item.id);
    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isAvailable: !item.isAvailable,
        }),
      });

      if (res.ok) {
        setMenuItems(menuItems.map(i => 
          i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
        ));
        setSuccess(item.isAvailable ? 'Plat marqué comme indisponible' : 'Plat marqué comme disponible');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    setActionLoading(confirmDelete.id);
    try {
      const res = await fetch(`/api/dashboard/menu?id=${confirmDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMenuItems(menuItems.filter(item => item.id !== confirmDelete.id));
        setSuccess('Plat supprimé avec succès');
        setConfirmDelete(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'ALL' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Menu de {restaurantName || 'Mon Restaurant'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {menuItems.length} plat{menuItems.length > 1 ? 's' : ''} dans votre menu
          </p>
        </div>
        <Link
          href="/dashboard/menu/add"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          Ajouter un plat
        </Link>
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

      {/* Filtres par catégorie */}
      {menuItems.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtrer par catégorie</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category === 'ALL' ? 'Toutes' : category}
                <span className="ml-1 text-xs opacity-70">
                  ({category === 'ALL' ? menuItems.length : menuItems.filter(i => i.category === category).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {menuItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-12 text-center">
          <p className="text-muted-foreground mb-4">Aucun plat dans votre menu</p>
          <Link href="/dashboard/menu/add" className="inline-flex text-sm text-primary hover:underline">
            Ajouter votre premier plat
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-12 text-center">
          <p className="text-muted-foreground">Aucun plat dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-background overflow-hidden">
                    <div className="relative h-40 bg-muted">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-background/90 px-3 py-1 text-xs font-medium rounded">
                            Indisponible
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <span className="text-sm font-bold text-primary whitespace-nowrap">
                          {formatPrice(item.price, restaurantCurrency)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {item.description}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAvailability(item)}
                          disabled={actionLoading === item.id}
                          className={`flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:opacity-50 ${
                            item.isAvailable
                              ? 'border-green-300 text-green-700 hover:bg-green-50'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : item.isAvailable ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Disponible
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Indisponible
                            </>
                          )}
                        </button>
                        <Link
                          href={`/dashboard/menu/${item.id}/edit`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setConfirmDelete(item)}
                          disabled={actionLoading === item.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg border border-border shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Supprimer ce plat ?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Êtes-vous sûr de vouloir supprimer "{confirmDelete.name}" ? Cette action est irréversible.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionLoading !== null}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading !== null}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
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