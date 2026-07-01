'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Trash2, Loader2, User, Phone, Mail, MapPin, Clock, DollarSign } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  deliveryTime: string;
  priceRange: string;
  isActive: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
}

export default function RestaurantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}`);
      const data = await res.json();
      
      if (res.ok) {
        setRestaurant(data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!restaurant) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir ${restaurant.isActive ? 'désactiver' : 'valider'} ce restaurant ?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restaurant.id, isActive: !restaurant.isActive }),
      });

      if (res.ok) {
        setRestaurant({ ...restaurant, isActive: !restaurant.isActive });
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!restaurant) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${restaurant.name}" ?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurants?id=${restaurant.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/admin/restaurants');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error || 'Restaurant non trouvé'}
        </div>
        <Link href="/admin/restaurants" className="mt-4 inline-flex text-primary hover:underline">
          Retour aux restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header avec retour */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/restaurants" className="p-2 hover:bg-accent rounded-md">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Détails du restaurant</h1>
          <p className="text-sm text-muted-foreground">Informations complètes et gérant</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne gauche : Image et statut */}
        <div className="md:col-span-1">
          <div className="rounded-lg border border-border overflow-hidden bg-background">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-foreground">Statut</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  restaurant.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {restaurant.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Actif
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      En attente
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  className={`w-full inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
                    restaurant.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : restaurant.isActive ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Valider le restaurant
                    </>
                  )}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : Informations */}
        <div className="md:col-span-2 space-y-6">
          {/* Informations du restaurant */}
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">{restaurant.name}</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Adresse</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {restaurant.address}
                </p>
                <p className="text-sm text-muted-foreground pl-6">
                  {restaurant.city}, {restaurant.country}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Téléphone du restaurant</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {restaurant.phone}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Gamme de prix</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {restaurant.priceRange}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Temps de livraison</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {restaurant.deliveryTime}
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Type de cuisine</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {restaurant.cuisine}
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-muted-foreground">Description</div>
                <p className="text-sm text-foreground pl-6">
                  {restaurant.description}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du gérant */}
          {restaurant.owner && (
            <div className="rounded-lg border border-border bg-background p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations du gérant
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Nom complet</div>
                  <p className="text-sm font-medium text-foreground">
                    {restaurant.owner.name}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <a 
                    href={`mailto:${restaurant.owner.email}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {restaurant.owner.email}
                  </a>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Téléphone du gérant</span>
                  </div>
                  <a 
                    href={`tel:${restaurant.owner.phone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {restaurant.owner.phone}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliquez pour appeler ou envoyer un email
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-md bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Conseil :</strong> Contactez le gérant par téléphone ou email pour valider son identité avant d'activer le restaurant sur la plateforme.
                </p>
              </div>
            </div>
          )}

          {/* Date de création */}
          <div className="text-xs text-muted-foreground">
            Restaurant créé le {new Date(restaurant.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
}