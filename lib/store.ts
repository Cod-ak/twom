import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './types';

// This is what an item in the cart looks like
export interface CartItem extends Product {
  quantity: number;
  size?: string;
}

export interface AppliedDiscount {
  code: string;
  percent: number;
}

interface CartStore {
  items: CartItem[];
  discount: AppliedDiscount | null;
  addItem: (product: Product, size?: string) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string) => void;
  applyDiscount: (code: string, percent: number) => void;
  removeDiscount: () => void;
  clearCart: () => void;
}

const isSameCartItem = (item: CartItem, id: string, size?: string) =>
  item.id === id && (item.size || undefined) === (size || undefined);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: null,

      addItem: (product, size) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) =>
          isSameCartItem(item, product.id, size)
        );

        if (existingItem) {
          // If matching item + size is already in the cart, increase quantity
          set({
            items: currentItems.map((item) =>
              isSameCartItem(item, product.id, size)
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Otherwise, add it as a new item with size
          set({
            items: [
              ...currentItems,
              { ...product, quantity: 1, ...(size ? { size } : {}) },
            ],
          });
        }
      },

      removeItem: (id, size) => {
        set({
          items: get().items.filter(
            (item) => !isSameCartItem(item, id, size)
          ),
        });
      },

      updateQuantity: (id, quantity, size) => {
        if (quantity <= 0) {
          get().removeItem(id, size);
          return;
        }
        set({
          items: get().items.map((item) =>
            isSameCartItem(item, id, size)
              ? { ...item, quantity }
              : item
          ),
        });
      },

      applyDiscount: (code, percent) => {
        set({ discount: { code, percent } });
      },

      removeDiscount: () => {
        set({ discount: null });
      },

      clearCart: () => set({ items: [], discount: null }),
    }),
    {
      name: 'twom-cart-storage', // This is the key it saves to in Local Storage
    }
  )
);
