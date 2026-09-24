import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export type CartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

export const CartStore = signalStore(
  { protectedState: false },
  withState<CartState>(initialState),
  withComputed(({ items }) => ({
    itemCount: computed(() => items().reduce((total, item) => total + item.quantity, 0)),
    totalAmount: computed(() =>
      items().reduce((total, item) => total + item.quantity * item.unitPrice, 0),
    ),
  })),
  withMethods((store) => ({
    addItem(item: CartItem) {
      const current = store.items();
      const existing = current.find((entry) => entry.id === item.id);

      if (existing) {
        patchState(store, {
          items: current.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry,
          ),
        });
        return;
      }

      patchState(store, {
        items: [...current, item],
      });
    },
    removeItem(productId: string) {
      patchState(store, {
        items: store.items().filter((item) => item.id !== productId),
      });
    },
    clearCart() {
      patchState(store, { items: [] });
    },
  })),
);
