"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";
import GlassSurface from "./GlassSurface";

interface ProductCardProps {
  product: Product & {
    originalPrice?: number;
    saveBadge?: string;
  };
  isNew?: boolean;
}

export default function ProductCard({ product, isNew }: ProductCardProps) {
  const openQuickBuy = useUIStore((state) => state.openQuickBuy);
  const [isLiked, setIsLiked] = useState(false);

  const stock =
    typeof product.stock_quantity === "number" ? product.stock_quantity : 999;
  const isOutOfStock = stock <= 0;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    openQuickBuy(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  const productHref = `/products/${product.slug || product.id}`;

  return (
    <div className="group relative flex flex-col justify-between w-full h-full bg-white rounded-[32px] sm:rounded-[36px] border-[3.5px] border-black p-3.5 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300">
      {/* Inner Rounded Image Container */}
      <div className="relative aspect-[4/4.3] w-full overflow-hidden rounded-[22px] sm:rounded-[26px] bg-zinc-100 isolate">
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
            <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-zinc-400">
              No Image
            </div>
          )}
        </Link>

        {/* Wishlist Heart Button in Top-Left Position */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 left-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-md cursor-pointer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isLiked ? "text-rose-500 fill-rose-500" : "text-white"}
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Vertical Badge in Top-Right Position */}
        {isOutOfStock ? (
          <span className="pointer-events-none absolute top-3 right-3 z-10 bg-zinc-900 text-white text-[9px] font-black tracking-widest px-2 py-3.5 rounded-full [writing-mode:vertical-rl] select-none uppercase shadow-md">
            SOLD OUT
          </span>
        ) : product.saveBadge ? (
          <span className="pointer-events-none absolute top-3 right-3 z-10 bg-rose-600 text-white text-[10px] font-black tracking-widest px-2 py-3.5 rounded-full [writing-mode:vertical-rl] select-none uppercase shadow-md">
            {product.saveBadge}
          </span>
        ) : isNew ? (
          <span className="pointer-events-none absolute top-3 right-3 z-10 bg-white text-black font-black text-[10px] tracking-widest px-2 py-3.5 rounded-full [writing-mode:vertical-rl] select-none uppercase shadow-md">
            NEW
          </span>
        ) : null}
      </div>

      {/* Product Title */}
      <Link
        href={productHref}
        className="hover:opacity-75 transition-opacity block mt-3.5 mb-2"
      >
        <h3 className="text-lg sm:text-xl font-bold text-black leading-snug line-clamp-1 tracking-tight">
          {product.name}
        </h3>
      </Link>

      {/* Clear Glass Inventory Stock Pill */}
      <div className="flex items-center min-h-6 mb-3">
        <GlassSurface
          borderRadius={9999}
          borderWidth={0.07}
          distortionScale={-180}
          displace={0.5}
          backgroundOpacity={0.1}
          brightness={50}
          opacity={0.93}
          blur={11}
          saturation={1}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          refraction
          renderer="auto"
          className="shadow-xs"
          contentClassName="relative z-[1] inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black tracking-wider uppercase text-black"
        >
          {isOutOfStock ? (
            <>
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span className="text-zinc-500">OUT OF STOCK</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-black" />
              <span>{stock <= 10 ? `ONLY ${stock} LEFT` : "IN STOCK"}</span>
            </>
          )}
        </GlassSurface>
      </div>

      {/* Bottom Action Row: Bold Price (Left) + Clear Glass Cart Button (Right) */}
      <div className="flex items-center justify-between gap-3 mt-auto pt-2">
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">
            {formatNaira(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-zinc-400 line-through text-xs font-semibold mt-1">
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
          className={`relative rounded-full shrink-0 transition-all touch-manipulation cursor-pointer ${
            isOutOfStock
              ? "opacity-40 cursor-not-allowed"
              : "hover:scale-105 active:scale-95 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          }`}
        >
          <GlassSurface
            width={48}
            height={48}
            borderRadius={24}
            borderWidth={0.07}
            distortionScale={-180}
            displace={0.5}
            backgroundOpacity={0.1}
            brightness={50}
            opacity={0.93}
            blur={11}
            saturation={1}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            refraction
            renderer="auto"
            contentClassName="relative z-[1] flex items-center justify-center w-full h-full text-black"
          >
            <svg
              width="20"
              height="20"
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
          </GlassSurface>
        </button>
      </div>
    </div>
  );
}
