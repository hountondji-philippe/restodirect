'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Clock, Star, ShoppingBag, Truck, CheckCircle, ArrowRight, TrendingUp, Quote, Send } from 'lucide-react';
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
  menuItems?: any[];
}

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  comment: string;
  rating: number;
  location: string;
}

const initialTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Marie K.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    comment: 'Service excellent et livraison rapide ! J\'adore commander sur RestoDirect.',
    rating: 5,
    location: 'Cotonou',
  },
  {
    id: 2,
    name: 'Jean-Paul D.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    comment: 'Grande variété de restaurants et de plats. Le suivi est très pratique.',
    rating: 5,
    location: 'Paris',
  },
  {
    id: 3,
    name: 'Fatou B.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    comment: 'Interface simple et intuitive. Je recommande vivement !',
    rating: 5,
    location: 'Porto-Novo',
  },
];

const cityImages: Record<string, string> = {
  'Cotonou': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Porto-Novo': 'https://images.unsplash.com/photo-1523539693385-eae22f96e458?w=600',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600',
  'Lagos': 'https://images.unsplash.com/photo-1577493340887-b7bfff580145?w=600',
  'Dakar': 'https://images.unsplash.com/photo-1535295912678-823543119054?w=600',
  'Abidjan': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Bamako': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Kinshasa': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Conakry': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Lomé': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Yaoundé': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
  'Mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600',
  'Beijing': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600',
  'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600',
};

const getPriceRangeLabel = (priceRange: string): string => {
  const labels: Record<string, string> = {
    '€': 'Budget',
    '€€': 'Moyen',
    '€€€': 'Haut de gamme',
  };
  return labels[priceRange] || priceRange;
};

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [popularDishes, setPopularDishes] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', comment: '', rating: 5, location: '' });
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('testimonials');
    if (saved) {
      setTestimonials([...initialTestimonials, ...JSON.parse(saved)]);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const resumeOnInteraction = () => {
            video.play().catch(() => {});
            window.removeEventListener('click', resumeOnInteraction);
            window.removeEventListener('touchstart', resumeOnInteraction);
          };
          window.addEventListener('click', resumeOnInteraction, { once: true });
          window.addEventListener('touchstart', resumeOnInteraction, { once: true });
        });
      }
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', tryPlay);
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/restaurants');
      const data = await res.json();

      if (res.ok) {
        const restaurantsList = Array.isArray(data) ? data : (data.restaurants || []);
        setRestaurants(restaurantsList);

        const dishesWithOrders: any[] = [];
        restaurantsList.forEach((r: Restaurant) => {
          if (r.menuItems && r.menuItems.length > 0) {
            r.menuItems.forEach((item: any) => {
              dishesWithOrders.push({
                ...item,
                restaurantName: r.name,
                restaurantId: r.id,
                orderCount: Math.floor(Math.random() * 100) + 10,
              });
            });
          }
        });

        const sortedDishes = dishesWithOrders
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 8);
        setPopularDishes(sortedDishes);

        const cityMap = new Map();
        restaurantsList.forEach((r: Restaurant) => {
          if (r.city) {
            const existing = cityMap.get(r.city);
            if (existing) {
              existing.count++;
            } else {
              cityMap.set(r.city, {
                name: r.city,
                country: r.country || '',
                count: 1,
                image: cityImages[r.city] || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600'
              });
            }
          }
        });

        const cityList = Array.from(cityMap.values())
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 6);
        setCities(cityList);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTestimonial.name && newTestimonial.comment) {
      const testimonial: Testimonial = {
        id: Date.now(),
        ...newTestimonial,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newTestimonial.name)}&background=0D8ABC&color=fff`,
      };
      const updated = [...testimonials, testimonial];
      setTestimonials(updated);
      const newOnes = updated.filter(t => !initialTestimonials.find(it => it.id === t.id));
      localStorage.setItem('testimonials', JSON.stringify(newOnes));
      setNewTestimonial({ name: '', comment: '', rating: 5, location: '' });
      setShowTestimonialForm(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setNewsletterSuccess(true);
      setEmail('');
      setTimeout(() => setNewsletterSuccess(false), 3000);
    }
  };

  const popularRestaurants = restaurants.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden bg-black">
        {!videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 z-0 w-full h-full object-cover"
            poster="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920"
            onError={() => setVideoFailed(true)}
          >
          <source
            src="/videos/hero.mp4"
            type="video/mp4"
          />
          </video>
        )}

        {videoFailed && (
          <div
            className="absolute inset-0 z-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920')" }}
          />
        )}

        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>

        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 max-w-5xl">
            Vos plats préférés,
            <span className="text-orange-400"> livrés chez vous</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl px-2">
            Découvrez les meilleurs restaurants d'Afrique et d'Europe. Commandez en quelques clics.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8 px-4">
            <Link
              href="/search"
              className="inline-flex h-11 sm:h-12 items-center justify-center rounded-md bg-orange-500 px-6 sm:px-8 text-sm sm:text-base font-medium text-white shadow-lg transition-colors hover:bg-orange-600"
            >
              Voir les restaurants
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Restaurants populaires
              </h2>
              <p className="text-base sm:text-lg text-gray-600">Les restaurants les plus appréciés</p>
            </div>
            <Link href="/search" className="hidden md:inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="h-44 sm:h-48 bg-gray-200"></div>
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : popularRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {popularRestaurants.map((restaurant) => (
                <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`} className="group rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-200">
                    <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" unoptimized />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-gray-700">
                      {getPriceRangeLabel(restaurant.priceRange)}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors">{restaurant.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'Nouveau'}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{restaurant.deliveryTime}</span></div>
                      <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{restaurant.city}</span></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500">Aucun restaurant trouvé</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/search" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium">
              Voir tous les restaurants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-orange-50 to-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Ce que disent nos clients</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6">Découvrez les avis de nos utilisateurs satisfaits</p>
            <button
              onClick={() => setShowTestimonialForm(!showTestimonialForm)}
              className="inline-flex h-11 items-center justify-center rounded-md bg-orange-500 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-orange-600"
            >
              {showTestimonialForm ? 'Annuler' : 'Donner mon avis'}
            </button>
          </div>

          {showTestimonialForm && (
            <div className="max-w-2xl mx-auto mb-8 sm:mb-12 bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Laissez votre avis</h3>
              <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom</label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
                    required
                    className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Votre ville</label>
                  <input
                    type="text"
                    value={newTestimonial.location}
                    onChange={(e) => setNewTestimonial({...newTestimonial, location: e.target.value})}
                    required
                    className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Votre avis</label>
                  <textarea
                    value={newTestimonial.comment}
                    onChange={(e) => setNewTestimonial({...newTestimonial, comment: e.target.value})}
                    required
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-4 py-2 text-sm"
                  />
                </div>
                <button type="submit" className="w-full h-11 items-center justify-center rounded-md bg-orange-500 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-orange-600 flex gap-2">
                  <Send className="h-4 w-4" /> Publier mon avis
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                  <Quote className="inline-block h-4 w-4 text-orange-400 mr-2 -mt-1" />
                  {testimonial.comment}
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                    <Image src={testimonial.avatar} alt={testimonial.name} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Comment ça marche ?</h2>
            <p className="text-base sm:text-lg text-gray-600">Commandez en 3 étapes simples</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: Search, title: 'Choisissez votre restaurant', description: 'Parcourez les restaurants près de chez vous', step: '01' },
              { icon: ShoppingBag, title: 'Passez votre commande', description: 'Ajoutez au panier et validez', step: '02' },
              { icon: Truck, title: 'Recevez chez vous', description: 'Suivez votre livraison en temps réel', step: '03' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                {index < 2 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-orange-200"></div>}
                <div className="relative z-10 inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-orange-100 mb-4 sm:mb-6">
                  <item.icon className="h-10 w-10 sm:h-12 sm:w-12 text-orange-500" />
                </div>
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {popularDishes.length > 0 && (
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Les plus commandés</h2>
                <p className="text-base sm:text-lg text-gray-600">Les plats préférés de nos clients</p>
              </div>
              <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {popularDishes.map((dish) => (
                <Link key={dish.id} href={`/restaurants/${dish.restaurantId}`} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative h-36 sm:h-40 bg-gray-200">
                    <Image src={dish.image} alt={dish.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">{dish.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{dish.description}</p>
                    <p className="text-xs text-gray-500 mb-3">{dish.restaurantName}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-bold text-orange-500">{formatPrice(dish.price, 'XOF')}</span>
                      <span className="bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap">{dish.orderCount} commandes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Explorez par ville</h2>
            <p className="text-base sm:text-lg text-gray-600">Découvrez les restaurants dans votre ville</p>
          </div>

          {cities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {cities.map((city: any) => (
                <Link key={city.name} href={`/search?city=${encodeURIComponent(city.name)}`} className="group relative h-56 sm:h-64 rounded-xl overflow-hidden">
                  <Image src={city.image} alt={city.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{city.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-200">{city.count} restaurant{city.count > 1 ? 's' : ''} {city.country && `• ${city.country}`}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Aucune ville disponible</p>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-white text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Vous êtes restaurateur ?</h2>
              <p className="text-base sm:text-lg text-orange-100 mb-6 sm:mb-8">Rejoignez RestoDirect et développez votre activité.</p>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {['Augmentez vos ventes en ligne', 'Gestion simplifiée des commandes', 'Support dédié 24/7'].map((advantage, index) => (
                  <div key={index} className="flex items-center gap-3 justify-center md:justify-start">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white shrink-0" />
                    <span className="text-sm sm:text-base text-orange-50">{advantage}</span>
                  </div>
                ))}
              </div>
              <Link href="/partner" className="inline-flex h-11 sm:h-12 items-center justify-center rounded-md bg-white px-6 sm:px-8 text-sm sm:text-base font-medium text-orange-500 shadow-lg transition-colors hover:bg-gray-100">
                Devenir partenaire
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
                  <p className="text-2xl sm:text-3xl font-bold mb-1">{restaurants.length}+</p>
                  <p className="text-xs sm:text-sm text-orange-100">Restaurants partenaires</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
                  <p className="text-2xl sm:text-3xl font-bold mb-1">{popularDishes.length * 50}+</p>
                  <p className="text-xs sm:text-sm text-orange-100">Plats disponibles</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
                  <p className="text-2xl sm:text-3xl font-bold mb-1">{cities.length}+</p>
                  <p className="text-xs sm:text-sm text-orange-100">Villes couvertes</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
                  <p className="text-2xl sm:text-3xl font-bold mb-1">1000+</p>
                  <p className="text-xs sm:text-sm text-orange-100">Clients satisfaits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-900">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Restez informé de nos offres</h2>
          <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8">Inscrivez-vous à notre newsletter</p>

          {newsletterSuccess ? (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-green-800 font-medium">Merci pour votre inscription !</p>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 h-12 rounded-md bg-gray-800 border border-gray-700 px-4 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button type="submit" className="h-12 bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-md font-medium transition-colors">
                S'inscrire
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}