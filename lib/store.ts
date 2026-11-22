import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './types';
import { trackAddToCart } from './analytics';

// This is what an item in the cart looks like
export interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
}

export interface AppliedDiscount {
  code: string;
  percent: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minOrderAmount?: number;
  fixedAmount?: number;
}

interface CartStore {
  items: CartItem[];
  discount: AppliedDiscount | null;
  addItem: (product: Product, size?: string, color?: string) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  applyDiscount: (
    code: string,
    percent: number,
    options?: {
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      minOrderAmount?: number;
      fixedAmount?: number;
    }
  ) => void;
  removeDiscount: () => void;
  clearCart: () => void;
}

const isSameCartItem = (
  item: CartItem,
  id: string,
  size?: string,
  color?: string
) =>
  item.id === id &&
  (item.size || undefined) === (size || undefined) &&
  (item.color || undefined) === (color || undefined);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: null,

      addItem: (product, size, color) => {
        trackAddToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          category: String(product.category),
          size,
          quantity: 1,
        });

        const currentItems = get().items;
        const existingItem = currentItems.find((item) =>
          isSameCartItem(item, product.id, size, color)
        );

        if (existingItem) {
          // If matching item + size + color is already in the cart, increase quantity
          set({
            items: currentItems.map((item) =>
              isSameCartItem(item, product.id, size, color)
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Otherwise, add it as a new item with size & color
          set({
            items: [
              ...currentItems,
              {
                ...product,
                quantity: 1,
                ...(size ? { size } : {}),
                ...(color ? { color } : {}),
              },
            ],
          });
        }
      },

      removeItem: (id, size, color) => {
        const remainingItems = get().items.filter(
          (item) => !isSameCartItem(item, id, size, color)
        );
        const currentDiscount = get().discount;
        let validDiscount = currentDiscount;
        if (currentDiscount?.minOrderAmount) {
          const newSubtotal = remainingItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
          );
          if (newSubtotal < currentDiscount.minOrderAmount) {
            validDiscount = null;
          }
        }
        set({
          items: remainingItems,
          discount: validDiscount,
        });
      },

      updateQuantity: (id, quantity, size, color) => {
        if (quantity <= 0) {
          get().removeItem(id, size, color);
          return;
        }
        const updatedItems = get().items.map((item) =>
          isSameCartItem(item, id, size, color)
            ? { ...item, quantity }
            : item
        );
        const currentDiscount = get().discount;
        let validDiscount = currentDiscount;
        if (currentDiscount?.minOrderAmount) {
          const newSubtotal = updatedItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
          );
          if (newSubtotal < currentDiscount.minOrderAmount) {
            validDiscount = null;
          }
        }
        set({
          items: updatedItems,
          discount: validDiscount,
        });
      },

      applyDiscount: (code, percent, options) => {
        set({
          discount: {
            code,
            percent,
            discountType: options?.discountType || "percentage",
            discountValue: options?.discountValue || percent,
            minOrderAmount: options?.minOrderAmount,
            fixedAmount: options?.fixedAmount,
          },
        });
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
