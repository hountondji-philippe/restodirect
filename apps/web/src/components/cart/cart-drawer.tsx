'use client';

import { useRouter } from 'next/navigation';
import { X, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { CartItemComponent } from './cart-item';

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, toggleCart, getTotal } = useCartStore();
  const total = getTotal();

  const handleCheckout = () => {
    toggleCart();
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={toggleCart} />

      <div className="relative flex h-full w-full max-w-md flex-col bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Mon Panier</h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {items.length}
            </span>
          </div>
          <button onClick={toggleCart} className="rounded-md p-2 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Votre panier est vide</p>
              <p className="text-sm text-muted-foreground">Ajoutez des plats pour commencer</p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItemComponent key={item.id} {...item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">{total.toFixed(2)} FCFA</span>
            </div>

            <button
              onClick={handleCheckout}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Passer la commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}