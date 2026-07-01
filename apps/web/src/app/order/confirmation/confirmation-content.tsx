'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('id') || 'N/A';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Commande confirmée !
          </h1>

          <p className="text-muted-foreground mb-6">
            Merci pour votre commande. Votre numéro de commande est :
          </p>

          <div className="rounded-md bg-muted p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Numéro de commande</p>
            <p className="text-xl font-bold text-primary">{orderNumber}</p>
          </div>

          <div className="rounded-md bg-blue-50 border border-blue-200 p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Prochaines étapes :</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Le restaurant prépare votre commande</li>
              <li>2. Un livreur est assigné à votre livraison</li>
              <li>3. Vous recevez votre commande chez vous</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Home className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/search"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background px-8 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <ShoppingBag className="h-4 w-4" />
              Commander à nouveau
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}