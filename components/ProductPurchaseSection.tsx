"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useUIStore } from "@/lib/ui-store";
import { ShowcaseItem } from "@/lib/showcase-catalog";
import { trackViewItem } from "@/lib/analytics";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

interface ProductColor {
  name: string;
  hex: string;
}

// Generate palette suited to TWOM's luxury apparel palette
function getProductColors(name: string, category: string): ProductColor[] {
  const lower = (name + " " + category).toLowerCase();

  const colors: ProductColor[] = [];

  if (lower.includes("white") || lower.includes("bone") || lower.includes("cream")) {
    colors.push({ name: "Vintage White", hex: "#F5F2EB" });
  }
  if (lower.includes("choc") || lower.includes("brown")) {
    colors.push({ name: "Dark Chocolate", hex: "#38281E" });
  }
  if (lower.includes("black") || lower.includes("dark")) {
    colors.push({ name: "Off-Black", hex: "#1C1B1A" });
  }
  if (lower.includes("slate") || lower.includes("grey") || lower.includes("gray")) {
    colors.push({ name: "Washed Slate", hex: "#4A5568" });
  }

  // Ensure default luxury neutrals if few matched
  if (colors.length < 2) {
    return [
      { name: "Onyx Black", hex: "#18181B" },
      { name: "Vintage White", hex: "#F5F2EB" },
      { name: "Dark Chocolate", hex: "#38281E" },
      { name: "Bone", hex: "#E5DFD5" },
    ];
  }

  return colors;
}

// Deterministic review count based on name
function getDeterministicReviewCount(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return 120 + Math.abs(hash % 280);
}

interface ProductPurchaseSectionProps {
  product: ShowcaseItem;
  isSample?: boolean;
}

export default function ProductPurchaseSection({
  product,
  isSample,
}: ProductPurchaseSectionProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);

  const colors = getProductColors(product.name, product.category);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>("S");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = product.stock_quantity <= 0;
  const sku = product.sku || `TWOM-${product.category.toUpperCase().slice(0, 3)}-01`;
  const reviewCount = getDeterministicReviewCount(product.id || product.name);

  useEffect(() => {
    trackViewItem(product);
  }, [product]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedSize, selectedColor.name);
    setIsAdded(true);
    openCart();
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="w-full flex flex-col justify-start">
      {/* 1. Back to Collection Link */}
      <Link
        href="/products"
        className="text-xs uppercase tracking-widest text-twom-muted hover:text-twom-title mb-3 inline-flex items-center gap-1.5 transition-colors self-start font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Collection
      </Link>

      {/* 2. SKU & Category Tag */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs uppercase font-mono tracking-wider text-twom-muted">
          {sku}
        </span>
        <span className="text-zinc-300">•</span>
        <span className="text-xs uppercase tracking-widest text-twom-muted font-medium">
          {product.category}
        </span>
      </div>

      {/* 3. Product Title */}
      <h1 className="font-zodiak text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-twom-title font-bold leading-tight tracking-tight mb-3">
        {product.name}
      </h1>

      {/* 4. Price & Discount Badges */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-2xl sm:text-3xl font-black text-twom-title tracking-tight">
          {formatNaira(product.price)}
        </span>
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-base sm:text-lg text-zinc-400 line-through font-medium">
            {formatNaira(product.originalPrice)}
          </span>
        )}
        {product.saveBadge && (
          <span className="bg-[#ffce27] text-black text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
            {product.saveBadge}
          </span>
        )}
      </div>

      {/* 5. Rating Stars & Review Count */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center text-black">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="w-4 h-4 fill-current text-black"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-xs text-zinc-500 font-medium font-sans">
          ({reviewCount})
        </span>
      </div>

      {/* 6. Color Swatches with Active Outer Ring */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs uppercase tracking-wider font-medium text-twom-muted">
            Color:{" "}
            <strong className="text-twom-title font-bold">
              {selectedColor.name}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {colors.map((color) => {
            const isSelected = selectedColor.name === color.name;
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelectedColor(color)}
                aria-label={`Select color ${color.name}`}
                className={`relative w-8 h-8 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center p-0.5 ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-black scale-105"
                    : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
              >
                <span
                  className="w-full h-full rounded-full border border-black/15 shadow-2xs block"
                  style={{ backgroundColor: color.hex }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Size Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs uppercase tracking-wider font-medium text-twom-muted">
            Size:{" "}
            <strong className="text-twom-title font-bold font-mono">
              {selectedSize}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setShowSizeGuide((prev) => !prev)}
            className="text-[11px] font-nippo italic uppercase font-bold tracking-wider text-twom-title underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer"
          >
            {showSizeGuide ? "Hide Guide" : "Size Chart"}
          </button>
        </div>

        {/* Size Pills Grid */}
        <div className="grid grid-cols-6 gap-2">
          {SIZES.map((size) => {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`h-11 rounded-xl text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? "bg-black text-white shadow-sm scale-102"
                    : "bg-white/80 hover:bg-white text-zinc-900 border border-zinc-200 hover:border-black/40"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>

        {/* Collapsible Size Guide Table */}
        {showSizeGuide && (
          <div className="mt-3 p-3.5 bg-white rounded-xl border border-zinc-200/80 text-xs text-zinc-700 shadow-xs animate-in fade-in duration-200">
            <p className="font-bold text-black uppercase tracking-wider text-[11px] mb-2 font-nippo">
              Standard Apparel Sizing (Inches)
            </p>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-mono border-t border-zinc-100 pt-2">
              <span className="font-bold text-black">Size</span>
              <span className="font-bold text-black">Chest</span>
              <span className="font-bold text-black">Length</span>
              <span className="font-bold text-black">Shoulder</span>
              <span className="text-zinc-500">XS</span>
              <span>36-38</span>
              <span>27.0</span>
              <span>17.5</span>
              <span className="text-zinc-500">S</span>
              <span>38-40</span>
              <span>28.0</span>
              <span>18.5</span>
              <span className="text-zinc-500">M</span>
              <span>40-42</span>
              <span>29.0</span>
              <span>19.5</span>
              <span className="text-zinc-500">L</span>
              <span>42-44</span>
              <span>30.0</span>
              <span>20.5</span>
              <span className="text-zinc-500">XL</span>
              <span>44-46</span>
              <span>31.0</span>
              <span>21.5</span>
              <span className="text-zinc-500">XXL</span>
              <span>46-48</span>
              <span>32.0</span>
              <span>22.5</span>
            </div>
          </div>
        )}
      </div>

      {/* 8. Description */}
      <div className="mb-6 text-sm text-twom-body leading-relaxed border-t border-zinc-200/60 pt-4">
        <p>{product.description || "No description available for this piece."}</p>
      </div>

      {/* 9. Full-Width Add to Cart Button (With Shopping Cart Icon) */}
      <div className="mb-3">
        {!isOutOfStock ? (
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full bg-black hover:bg-zinc-800 text-white py-4 px-6 rounded-2xl text-xs uppercase tracking-[0.2em] font-nippo font-black flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
          >
            {/* Shopping Cart Icon from Reference */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 pointer-events-none"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>{isAdded ? "Added to Cart ✓" : "Add to Cart"}</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-zinc-200 text-zinc-400 py-4 px-6 rounded-2xl text-xs uppercase tracking-[0.2em] font-nippo font-black cursor-not-allowed flex items-center justify-center"
          >
            Out of Stock
          </button>
        )}
      </div>

      {/* 10. Live Stock Status & Delivery */}
      <div className="flex items-center justify-between text-xs text-twom-muted pt-1">
        <div className="flex items-center gap-2 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              !isOutOfStock ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
            }`}
          />
          <span>
            {!isOutOfStock
              ? `In Stock (${product.stock_quantity} available)`
              : "Sold Out"}
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-zinc-400">
          Complimentary Delivery
        </span>
      </div>

      {/* 11. Sample Catalog Preview Banner */}
      {isSample && (
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 mt-4 text-center">
          Catalog Preview — publish matching inventory in Admin for live checkout
        </p>
      )}
    </div>
  );
}
