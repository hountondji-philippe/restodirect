'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Clock, Star, X, Filter, SlidersHorizontal } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  image: string;
  city: string;
  country: string;
  deliveryTime: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  currency: string;
}

interface Filters {
  q: string;
  cuisine: string;
  city: string;
  priceRange: string;
  sort: string;
}

const getPriceRangeLabel = (priceRange: string): string => {
  const labels: Record<string, string> = {
    '€': 'Budget',
    '€€': 'Moyen',
    '€€€': 'Haut de gamme',
  };
  return labels[priceRange] || priceRange;
};

export default function SearchPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    q: '',
    cuisine: '',
    city: '',
    priceRange: '',
    sort: 'popular',
  });

  useEffect(() => {
    fetchRestaurants();
  }, [filters, page]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.cuisine) params.set('cuisine', filters.cuisine);
      if (filters.city) params.set('city', filters.city);
      if (filters.priceRange) params.set('priceRange', filters.priceRange);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setRestaurants(data.restaurants || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      cuisine: '',
      city: '',
      priceRange: '',
      sort: 'popular',
    });
    setPage(1);
  };

  const hasActiveFilters = filters.cuisine || filters.city || filters.priceRange || filters.sort !== 'popular';

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200 py-8 sm:py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-center">
            Tous nos restaurants
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 text-center">
            Trouvez votre restaurant idéal
          </p>

          <div className="relative max-w-3xl mx-auto">
            <div className="flex gap-2 sm:gap-3 bg-gray-100 rounded-xl sm:rounded-2xl p-2 shadow-lg">
              <Search className="h-5 w-5 text-gray-400 mt-1 ml-2 sm:ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher par nom, cuisine ou ville..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none bg-white rounded-lg sm:rounded-xl px-3 sm:px-4"
              />
              {filters.q && (
                <button 
                  onClick={() => handleFilterChange('q', '')} 
                  className="text-gray-400 hover:text-gray-600 p-2 shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-center md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl py-6 sm:py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Trier par</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="popular">Plus populaire</option>
                    <option value="rating">Meilleure note</option>
                    <option value="deliveryTime">Temps de livraison</option>
                    <option value="name">Nom (A-Z)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Type de cuisine</label>
                  <input
                    type="text"
                    value={filters.cuisine}
                    onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                    placeholder="Ex: Italienne, Béninoise..."
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Ville</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Ex: Cotonou"
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Gamme de prix</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Tous les prix</option>
                    <option value="€">Budget</option>
                    <option value="€€">Moyen</option>
                    <option value="€€€">Haut de gamme</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {showFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Filtres</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Trier par</label>
                    <select
                      value={filters.sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="popular">Plus populaire</option>
                      <option value="rating">Meilleure note</option>
                      <option value="deliveryTime">Temps de livraison</option>
                      <option value="name">Nom (A-Z)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Type de cuisine</label>
                    <input
                      type="text"
                      value={filters.cuisine}
                      onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                      placeholder="Ex: Italienne"
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Ville</label>
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      placeholder="Ex: Cotonou"
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Gamme de prix</label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="">Tous les prix</option>
                      <option value="€">Budget</option>
                      <option value="€€">Moyen</option>
                      <option value="€€€">Haut de gamme</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={clearFilters}
                      className="flex-1 h-11 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 h-11 rounded-md bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-bold text-gray-900 text-base sm:text-lg">{total}</span> restaurant{total > 1 ? 's' : ''}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md animate-pulse">
                    <div className="h-40 sm:h-56 bg-gray-200"></div>
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : restaurants.length > 0 ? (
              <>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {restaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/restaurants/${restaurant.id}`}
                      className="group rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="relative h-40 sm:h-56 overflow-hidden bg-gray-200">
                        <Image
                          src={restaurant.image}
                          alt={restaurant.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/95 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-gray-700 shadow">
                          {getPriceRangeLabel(restaurant.priceRange)}
                        </div>
                        {restaurant.rating > 4.5 && (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-orange-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold shadow">
                            Populaire
                          </div>
                        )}
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors flex-1 min-w-0 truncate pr-2">
                            {restaurant.name}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold text-gray-700">
                              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'Nouveau'}
                            </span>
                          </div>
                        </div>
                        <p className="text-orange-600 font-semibold mb-2 text-xs sm:text-sm">{restaurant.cuisine}</p>
                        <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed text-xs sm:text-sm">{restaurant.description}</p>
                        <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
                            <span className="font-medium">{restaurant.deliveryTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
                            <span className="font-medium truncate">{restaurant.city}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {page} sur {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-md">
                <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gray-100 mb-4 sm:mb-5">
                  <Search className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Aucun restaurant trouvé</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Essayez une autre recherche
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex h-10 sm:h-11 items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-medium text-white shadow hover:bg-orange-600"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}