'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Banknote, Phone, Star, ChefHat } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
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
  currency: string;
  rating: number;
  reviewCount: number;
  menuItems: MenuItem[];
}

const getPriceRangeLabel = (priceRange: string): string => {
  const labels: Record<string, string> = {
    '€': 'Budget',
    '€€': 'Moyen',
    '€€€': 'Haut de gamme',
  };
  return labels[priceRange] || priceRange;
};

const getPriceRangeDescription = (priceRange: string): string => {
  const descriptions: Record<string, string> = {
    '€': 'Budget (< 2 000 FCFA)',
    '€€': 'Moyen (2 000 - 5 000 FCFA)',
    '€€€': 'Haut de gamme (> 5 000 FCFA)',
  };
  return descriptions[priceRange] || priceRange;
};

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`);
      const data = await res.json();

      if (res.ok) {
        setRestaurant(data);
      } else {
        setError(data.error || 'Restaurant non trouvé');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      currency: restaurant.currency || 'XOF',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Restaurant non trouvé</h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          Ce restaurant n'existe pas ou a été supprimé.
        </p>
        <Link
          href="/search"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 sm:px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Voir les restaurants
        </Link>
      </div>
    );
  }

  const itemsByCategory = restaurant.menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const currency = restaurant.currency || 'XOF';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden mb-6 sm:mb-8">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{restaurant.name}</h1>
          <p className="text-white/90 text-sm sm:text-base">{restaurant.cuisine}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6 sm:mb-8">
        <div className="md:col-span-2">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">À propos</h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{restaurant.description}</p>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base">Adresse</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {restaurant.address}, {restaurant.city}, {restaurant.country}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Temps de livraison</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{restaurant.deliveryTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Gamme de prix</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {getPriceRangeLabel(restaurant.priceRange)} - {getPriceRangeDescription(restaurant.priceRange)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Téléphone</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-all">{restaurant.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Informations</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
              <span className="text-xs sm:text-sm">
                {restaurant.rating > 0 ? `${restaurant.rating.toFixed(1)} (${restaurant.reviewCount} avis)` : 'Nouveau'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm">{restaurant.cuisine}</span>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(itemsByCategory).length > 0 ? (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Notre Menu</h2>
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 pb-2 border-b border-border">
                  {category}
                </h3>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 sm:gap-4 rounded-lg border border-border bg-card p-3 sm:p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.name}</h4>
                            <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                              {formatPrice(item.price, currency)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="mt-2 sm:mt-3 inline-flex h-8 sm:h-9 items-center justify-center gap-1 rounded-md border border-input bg-background px-2 sm:px-3 text-xs sm:text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 sm:p-12 text-center">
          <ChefHat className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Aucun plat disponible</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Le restaurant n'a pas encore ajouté de plats à son menu.
          </p>
        </div>
      )}
    </div>
  );
}