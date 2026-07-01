'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface CartItemComponentProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export function CartItemComponent({ id, name, price, quantity, image }: CartItemComponentProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex gap-3 border-b border-border py-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground line-clamp-1">
            {name}
          </h4>
          <p className="text-sm font-semibold text-primary">
            {(price * quantity).toFixed(2)} €
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(id, quantity - 1)}
              className="flex h-6 w-6 items-center justify-center rounded border border-input hover:bg-accent"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium">{quantity}</span>
            <button
              onClick={() => updateQuantity(id, quantity + 1)}
              className="flex h-6 w-6 items-center justify-center rounded border border-input hover:bg-accent"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={() => removeItem(id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}