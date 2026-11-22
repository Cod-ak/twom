"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

interface ProductCardProps {
  product: Product & {
    originalPrice?: number;
    saveBadge?: string;
  };
  isNew?: boolean;
}

export default function ProductCard({ product, isNew }: ProductCardProps) {
  const openQuickBuy = useUIStore((state) => state.openQuickBuy);

  const stock =
    typeof product.stock_quantity === "number" ? product.stock_quantity : 999;
  const isOutOfStock = stock <= 0;

  // Automated "NEW" badge logic:
  const isItemNew = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof isNew === "boolean") return isNew;
      if (typeof product.is_new === "boolean") return product.is_new;
      if (product.created_at) {
        const createdTime = new Date(product.created_at).getTime();
        if (!Number.isNaN(createdTime)) {
          const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
          return Date.now() - createdTime <= FOURTEEN_DAYS_MS;
        }
      }
      return false;
    },
    () => {
      if (typeof isNew === "boolean") return isNew;
      if (typeof product.is_new === "boolean") return product.is_new;
      return false;
    },
  );

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    openQuickBuy(product);
  };

  const productHref = `/products/${product.slug || product.id}`;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="group relative flex flex-col justify-between w-full h-full bg-white rounded-2xl sm:rounded-[32px] border border-zinc-200/90 p-2 sm:p-3 shadow-xs hover:shadow-lg transition-all duration-300">
      {/* Tall Editorial Image Container matching reference aspect ratio (~1:1.6) */}
      <div className="relative aspect-[1/1.6] w-full overflow-hidden rounded-xl sm:rounded-[24px] bg-zinc-100 isolate">
        <Link
          href={productHref}
          className="relative block w-full h-full cursor-pointer"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out ${
                isOutOfStock ? "opacity-60 grayscale-30" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-zinc-400">
              No Image
            </div>
          )}
        </Link>

        {/* Top-Right Ribbon Badges */}
        {isOutOfStock ? (
          <span className="pointer-events-none absolute top-0 right-0 z-10 inline-flex items-center justify-center bg-[#222222] text-white text-[9px] sm:text-[10px] font-mono font-bold tracking-wider px-1.5 sm:px-2 pt-2 pb-3 rounded-bl-xl [writing-mode:vertical-rl] select-none uppercase shadow-xs">
            SOLD OUT
          </span>
        ) : hasDiscount ? (
          <span className="pointer-events-none absolute top-0 right-0 z-10 inline-flex items-center justify-center bg-[#dc2626] text-white text-[9px] sm:text-[10px] font-mono font-bold tracking-wider px-1.5 sm:px-2 pt-2 pb-3 rounded-bl-xl [writing-mode:vertical-rl] select-none uppercase shadow-xs">
            SAVE {formatNaira((product.originalPrice || 0) - product.price)}
          </span>
        ) : isItemNew ? (
          <span className="pointer-events-none absolute top-0 right-0 z-10 inline-flex items-center justify-center bg-[#ffce27] text-black text-[9px] sm:text-[10px] font-mono font-black tracking-wider px-1.5 sm:px-2 pt-2 pb-3 rounded-bl-xl [writing-mode:vertical-rl] select-none uppercase shadow-xs">
            NEW
          </span>
        ) : null}
      </div>

      {/* Content Area */}
      <div className="flex flex-col grow justify-between pt-2.5 sm:pt-3">
        <div>
          {/* Product Title */}
          <Link
            href={productHref}
            className="hover:opacity-75 transition-opacity block mb-1"
          >
            <h3 className="text-xs sm:text-sm md:text-base font-bold text-twom-title leading-snug line-clamp-1 tracking-tight">
              {product.name}
            </h3>
          </Link>

          {/* Low Stock Indicator (e.g. • ONLY 10 LEFT) */}
          {stock > 0 && stock <= 15 ? (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-amber-900">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                ONLY {stock} LEFT
              </span>
            </div>
          ) : null}
        </div>

        {/* Bottom Action Row: Price Pill (Left) + Black Circle Cart Button (Right) */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1.5">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-zinc-100/90 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full min-w-0">
            <span className="text-xs sm:text-sm font-bold text-black tracking-tight leading-none whitespace-nowrap">
              {formatNaira(product.price)}
            </span>
            {hasDiscount ? (
              <span className="text-zinc-400 line-through text-[10px] sm:text-xs font-normal whitespace-nowrap">
                {formatNaira(product.originalPrice!)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickBuy}
            aria-label={
              isOutOfStock
                ? `${product.name} is sold out`
                : `Quick buy ${product.name}`
            }
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all touch-manipulation cursor-pointer ${
              isOutOfStock
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-xs"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
