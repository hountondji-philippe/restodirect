'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

export interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  restaurantId?: string;
  restaurantName?: string;
  currency?: string;
}

export function MenuItem({ id, name, description, price, image, category, restaurantId, restaurantName, currency }: MenuItemProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      id,
      name,
      description,
      price,
      image,
      restaurantId: restaurantId || '',
      restaurantName: restaurantName || '',
      currency: currency || 'XOF',
    });
  };

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">{name}</h3>
            <span className="text-sm font-bold text-primary">
              {price.toFixed(2)} FCFA
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {category}
          </span>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleAdd}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}