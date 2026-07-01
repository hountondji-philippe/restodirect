'use client';

import { Clock, CheckCircle, Truck, ChefHat } from 'lucide-react';
import type { Order } from '@/store/order-store';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const statusConfig = {
    pending: { label: 'En attente', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    preparing: { label: 'En préparation', icon: ChefHat, color: 'text-blue-600 bg-blue-100' },
    delivering: { label: 'En livraison', icon: Truck, color: 'text-orange-600 bg-orange-100' },
    delivered: { label: 'Livré', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  };

  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Commande du {new Date(order.date).toLocaleDateString('fr-FR')}</p>
          <p className="mt-1 font-mono text-sm font-bold text-foreground">{order.id}</p>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
            <span className="font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-muted-foreground">+ {order.items.length - 3} autre(s) article(s)</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total payé</span>
        <span className="text-lg font-bold text-primary">{order.total.toFixed(2)} €</span>
      </div>
    </div>
  );
}