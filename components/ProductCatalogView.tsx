"use client";

import { useState, useMemo } from "react";
import { ShowcaseItem } from "@/lib/showcase-catalog";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

interface ProductCatalogViewProps {
  initialProducts: ShowcaseItem[];
  initialCategory?: string;
}

type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

export default function ProductCatalogView({
  initialProducts,
  initialCategory,
}: ProductCatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Available categories: "All" + list from PRODUCT_CATEGORIES
  const categories = useMemo(() => ["all", ...PRODUCT_CATEGORIES], []);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    let list = initialProducts;
    if (selectedCategory && selectedCategory.toLowerCase() !== "all") {
      list = list.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort products
    const sorted = [...list];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        sorted.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "featured":
      default:
        // Keep natural ordering or order_priority
        break;
    }

    return sorted;
  }, [initialProducts, selectedCategory, sortBy]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    // Smoothly update URL query without refreshing
    const url = new URL(window.location.href);
    if (cat === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", cat);
    }
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "price-asc":
        return "Price: Low to High";
      case "price-desc":
        return "Price: High to Low";
      case "newest":
        return "Newest First";
      case "featured":
      default:
        return "Featured";
    }
  };

  return (
    <div className="w-full">
      {/* 1. Header Section */}
      <div className="flex flex-row justify-between items-end mb-4 gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-twom-muted font-mono block">
            The Collection
          </span>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <h1 className="font-zodiak text-2xl text-twom-title font-bold capitalize tracking-tight leading-none">
              {selectedCategory === "all" ? "Shop All" : selectedCategory}
            </h1>
            <span className="text-[11px] uppercase tracking-wider text-twom-muted font-mono">
              ({filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "Piece" : "Pieces"})
            </span>
          </div>
        </div>

        {selectedCategory !== "all" && (
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className="text-[11px] uppercase tracking-wider text-black font-bold underline underline-offset-4 hover:opacity-70 transition-opacity cursor-pointer shrink-0 pb-0.5"
          >
            Reset ✕
          </button>
        )}
      </div>

      {/* 2. Top Filter & Sort Bar (Matching Screenshot 1) */}
      <div className="flex items-center justify-between border-y border-zinc-200/80 py-3 mb-4 gap-2">
        {/* Filter Trigger / Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
              <line x1="21" x2="14" y1="4" y2="4" />
              <line x1="10" x2="3" y1="4" y2="4" />
              <line x1="21" x2="12" y1="12" y2="12" />
              <line x1="8" x2="3" y1="12" y2="12" />
              <line x1="21" x2="16" y1="20" y2="20" />
              <line x1="12" x2="3" y1="20" y2="20" />
              <line x1="14" x2="14" y1="2" y2="6" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
            <span>Filter</span>
          </div>

          {selectedCategory !== "all" && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              1 Active
            </span>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortDropdown((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-75 transition-opacity cursor-pointer py-1 px-2.5 rounded-lg border border-zinc-200/80 bg-white/70"
          >
            <span>Sort:</span>
            <span className="text-zinc-600 font-medium capitalize">
              {getSortLabel(sortBy)}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${
                showSortDropdown ? "rotate-180" : ""
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Sort Dropdown Menu */}
          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-40 py-1.5 text-xs overflow-hidden">
                {(
                  [
                    "featured",
                    "newest",
                    "price-asc",
                    "price-desc",
                  ] as SortOption[]
                ).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSortBy(opt);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-between ${
                      sortBy === opt
                        ? "font-bold text-black bg-zinc-50"
                        : "text-zinc-700 font-normal"
                    }`}
                  >
                    <span>{getSortLabel(opt)}</span>
                    {sortBy === opt && <span className="text-black font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Horizontal Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4">
        {categories.map((cat) => {
          const isActive =
            selectedCategory.toLowerCase() === cat.toLowerCase();
          const displayLabel = cat === "all" ? "All" : cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-black text-white font-bold shadow-xs scale-102"
                  : "bg-white/80 hover:bg-white text-zinc-700 hover:text-black border border-zinc-200/80"
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* 4. Products Grid: Locked to 2 columns mobile layout */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 items-stretch mt-2">
          {filteredProducts.map((product: ShowcaseItem) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm uppercase tracking-widest text-twom-muted">
            No pieces found under &quot;{selectedCategory}&quot;.
          </p>
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className="text-xs uppercase tracking-widest text-black underline underline-offset-4 font-bold hover:opacity-75 cursor-pointer"
          >
            ← View All Pieces
          </button>
        </div>
      )}
    </div>
  );
}
