"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";
import GlassSurface from "@/components/GlassSurface";

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

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    openQuickBuy(product);
  };

  const productHref = `/products/${product.slug || product.id}`;

  return (
    <GlassSurface
      borderRadius={24}
      borderWidth={0.08}
      distortionScale={-140}
      displace={0.5}
      backgroundOpacity={0.08}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      className="group w-full h-full hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55)] transition-all duration-300"
      contentClassName="relative z-[1] flex flex-col justify-between w-full h-full p-3"
    >
      {/* Inner Rounded Image Container */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-zinc-100 isolate shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
        <Link
          href={productHref}
          className="relative block w-full h-full cursor-pointer"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 70vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out ${
                isOutOfStock ? "opacity-60 grayscale-30" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-zinc-500">
              No Image
            </div>
          )}
        </Link>

        {/* Vertical Badge in Top-Right Position */}
        {isOutOfStock ? (
          <span className="pointer-events-none absolute top-0 right-0 z-10 bg-zinc-900/90 text-zinc-300 backdrop-blur-md border-b border-l border-white/10 text-[9px] font-bold tracking-widest px-1.5 py-2.5 [writing-mode:vertical-rl] select-none uppercase font-mono shadow-xs rounded-tr-2xl rounded-bl-lg">
            SOLD OUT
          </span>
        ) : product.saveBadge ? (
          <span className="pointer-events-none absolute top-0 right-0 z-10 bg-rose-600/90 text-white backdrop-blur-md border-b border-l border-white/20 text-[9px] font-bold tracking-widest px-1.5 py-2.5 [writing-mode:vertical-rl] select-none uppercase font-mono shadow-xs rounded-tr-2xl rounded-bl-lg">
            {product.saveBadge}
          </span>
        ) : isNew ? (
          <span className="pointer-events-none absolute top-0 right-0 z-10 bg-white text-black font-black text-[10px] tracking-widest px-1.5 py-2.5 [writing-mode:vertical-rl] select-none uppercase shadow-xs rounded-tr-2xl rounded-bl-lg">
            NEW
          </span>
        ) : null}
      </div>

      {/* Product Title Only */}
      <Link
        href={productHref}
        className="hover:opacity-75 transition-opacity block mt-3 mb-1.5 relative z-2"
      >
        <h3 className="text-sm font-semibold text-black leading-snug line-clamp-1 tracking-wide">
          {product.name}
        </h3>
      </Link>

      {/* Inventory Stock Pill Slot - reserves space when stock > 10 so all cards have identical length */}
      <div className="min-h-5.5 mb-2.5 flex items-center relative z-2">
        {stock <= 10 &&
          (isOutOfStock ? (
            <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Out of stock
            </span>
          ) : stock <= 5 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Only {stock} left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Only {stock} left
            </span>
          ))}
      </div>

      {/* Bottom Action Row: Price Pill (Left) + Cart Pill Button (Right) */}
      <div className="flex items-center justify-between gap-2 mt-auto relative z-2">
        <div className="liquid-glass-pill text-black rounded-full px-3.5 py-1.5 text-xs md:text-sm font-bold flex items-center gap-1.5 shrink min-w-0">
          <span className="truncate">{formatNaira(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-zinc-500 line-through text-[11px] font-medium shrink-0">
              {formatNaira(product.originalPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleQuickBuy}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : `Quick buy ${product.name}`
          }
          className={`liquid-glass-pill rounded-full px-4 py-2 flex items-center justify-center transition-all shrink-0 touch-manipulation ${
            isOutOfStock
              ? "opacity-40 cursor-not-allowed"
              : "text-black hover:scale-105 active:scale-95 cursor-pointer"
          }`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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
    </GlassSurface>
  );
}
