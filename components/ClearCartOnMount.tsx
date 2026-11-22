"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/store";
import { trackPurchase } from "@/lib/analytics";

interface ClearCartOnMountProps {
  order?: {
    id: string;
    total_amount: number;
    order_items?: Array<{
      id: string;
      product_id?: string;
      price_at_time: number;
      quantity: number;
      products?: {
        name: string;
      } | null;
    }>;
  } | null;
}

export default function ClearCartOnMount({ order }: ClearCartOnMountProps) {
  const clearCart = useCartStore((state) => state.clearCart);
  const trackedRef = useRef(false);

  useEffect(() => {
    clearCart();

    if (order && order.id && !trackedRef.current) {
      trackedRef.current = true;
      trackPurchase(
        order.id,
        order.total_amount,
        (order.order_items || []).map((oi) => ({
          id: oi.product_id || oi.id,
          name: oi.products?.name || "TWOM Piece",
          price: oi.price_at_time,
          quantity: oi.quantity,
        }))
      );
    }
  }, [clearCart, order]);

  return null;
}
