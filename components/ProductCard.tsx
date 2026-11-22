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
  // 1. Explicit prop `isNew` (if passed as boolean)
  // 2. Database boolean `product.is_new`
  // 3. Fallback: created within the last 14 days (safe hydration / compiler-pure check)
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

  return (
    <div className="group relative flex flex-col justify-between w-full h-full bg-white rounded-2xl sm:rounded-[36px] border-2 sm:border-[3.5px] border-black p-2.5 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300">
      {/* Image container: reduced height by 20% from 1:1.6 -> 1:1.28 */}
      <div className="relative aspect-[1/1.28] w-full overflow-hidden rounded-xl sm:rounded-[26px] bg-zinc-100 isolate">
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

        {/* Vertical Ribbon Badge in Top-Right Position: SOLD OUT overrides NEW */}
        {isOutOfStock ? (
          <span className="pointer-events-none absolute top-0 right-1.5 sm:right-2 z-10 inline-flex items-center justify-center bg-[#222222] backdrop-blur-md border border-white/15 text-white text-[9px] sm:text-[11px] font-black tracking-[0.2em] px-1 sm:px-3 pt-1.5 sm:pt-3 pb-2.5 sm:pb-3.5 rounded-b-full rounded-t-none [writing-mode:vertical-rl] select-none uppercase shadow-sm">
            SOLD OUT
          </span>
        ) : isItemNew ? (
          <span className="pointer-events-none absolute top-0 right-1.5 sm:right-2 z-10 inline-flex items-center justify-center bg-[#ffce27] backdrop-blur-md border border-black/20 text-black text-[10px] sm:text-[13px] font-black tracking-[0.2em] px-1.5 sm:px-4 pt-1.5 sm:pt-3 pb-2 sm:pb-3.5 rounded-b-full rounded-t-none [writing-mode:vertical-rl] select-none uppercase shadow-xs">
            NEW
          </span>
        ) : null}
      </div>

      {/* Product Title */}
      <Link
        href={productHref}
        className="hover:opacity-75 transition-opacity block mt-2 sm:mt-3.5 mb-1 sm:mb-2"
      >
        <h3 className="text-xs sm:text-lg md:text-xl font-bold text-black leading-snug line-clamp-1 tracking-tight">
          {product.name}
        </h3>
      </Link>

      {/* Bottom Action Row: Bold Price (Left) + Signature Yellow Cart Button (Right) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 mt-auto pt-1.5 sm:pt-3">
        <div className="flex flex-col min-w-0">
          <span className="text-sm sm:text-xl md:text-2xl font-black text-black tracking-tight leading-none truncate">
            {formatNaira(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price ? (
            <span className="text-zinc-400 line-through text-[10px] sm:text-xs font-semibold mt-0.5 sm:mt-1 truncate">
              {formatNaira(product.originalPrice)}
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
          className={`w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-all touch-manipulation cursor-pointer ${
            isOutOfStock
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : "bg-[#ffce27] text-black shadow-[0_4px_14px_rgba(255,206,39,0.5)] sm:shadow-[0_8px_20px_rgba(255,206,39,0.7)] hover:scale-105 active:scale-95"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sm:w-5 sm:h-5 pointer-events-none"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
