"use client";

import { Product } from "./types";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

/**
 * Generic GA4 custom event tracker
 */
export function trackEvent(action: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("event", action, params);
  }
}

/**
 * E-Commerce Funnel Step 1: User views a product page
 */
export function trackViewItem(product: Partial<Product>) {
  trackEvent("view_item", {
    currency: "NGN",
    value: (product.price || 0) / 100, // Convert Kobo to Naira
    items: [
      {
        item_id: product.id || product.slug,
        item_name: product.name,
        item_category: product.category,
        price: (product.price || 0) / 100,
        quantity: 1,
      },
    ],
  });
}

/**
 * E-Commerce Funnel Step 2: User adds a product to the cart
 */
export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
  size?: string;
}) {
  trackEvent("add_to_cart", {
    currency: "NGN",
    value: ((item.price || 0) * (item.quantity || 1)) / 100,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        item_variant: item.size,
        price: (item.price || 0) / 100,
        quantity: item.quantity || 1,
      },
    ],
  });
}

/**
 * E-Commerce Funnel Step 3: User enters the checkout page
 */
export function trackBeginCheckout(
  items: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
    quantity: number;
    size?: string;
  }>,
  totalKobo: number
) {
  trackEvent("begin_checkout", {
    currency: "NGN",
    value: totalKobo / 100,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_variant: item.size,
      price: item.price / 100,
      quantity: item.quantity,
    })),
  });
}

/**
 * E-Commerce Funnel Step 4: Paystack payment completed successfully
 */
export function trackPurchase(
  orderId: string,
  totalKobo: number,
  items: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
    quantity: number;
    size?: string;
  }>
) {
  trackEvent("purchase", {
    transaction_id: orderId,
    currency: "NGN",
    value: totalKobo / 100,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_variant: item.size,
      price: item.price / 100,
      quantity: item.quantity,
    })),
  });
}
