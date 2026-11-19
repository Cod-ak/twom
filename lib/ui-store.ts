import { create } from "zustand";
import { Product } from "./types";

interface UIStore {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  isQuickBuyOpen: boolean;
  quickBuyProduct: Product | null;
  openQuickBuy: (product: Product) => void;
  closeQuickBuy: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  isQuickBuyOpen: false,
  quickBuyProduct: null,
  openQuickBuy: (product) =>
    set({ isQuickBuyOpen: true, quickBuyProduct: product }),
  closeQuickBuy: () => set({ isQuickBuyOpen: false }),
}));
