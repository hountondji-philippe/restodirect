'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered';
  total: number;
  items: { id: string; name: string; quantity: number; price: number; image: string }[];
  address: string;
  paymentMethod: string;
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrders: () => Order[];
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      getOrders: () => get().orders,
    }),
    {
      name: 'restodirect-orders',
    }
  )
);