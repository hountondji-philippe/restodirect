import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, Euro } from 'lucide-react';

export interface RestaurantCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  address: string;
  deliveryTime: string;
  priceRange: string;
}

export function RestaurantCard({
  id,
  name,
  description,
  image,
  cuisine,
  rating,
  reviewCount,
  address,
  deliveryTime,
  priceRange,
}: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${id}`}>
      <article className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur">
            {cuisine}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          </div>

          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{address}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              <span>{priceRange}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}