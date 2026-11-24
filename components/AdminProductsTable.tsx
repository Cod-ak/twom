"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
} from "@/app/admin/(dashboard)/actions";

export type BannerBreakdownCounts = Record<
  string,
  { apparel: number; accessories: number }
>;

interface AdminProductsTableProps {
  initialProducts: Product[];
  bannerBreakdownCounts?: BannerBreakdownCounts;
}

type ProductFilterTab =
  | "all"
  | "single"
  | "banners"
  | "featured"
  | "archived";

const FILTER_TABS: Array<{ id: ProductFilterTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "single", label: "Single Pieces" },
  { id: "banners", label: "Campaign Banners" },
  { id: "featured", label: "★ Featured" },
  { id: "archived", label: "Archived" },
];

export default function AdminProductsTable({
  initialProducts,
  bannerBreakdownCounts = {},
}: AdminProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductFilterTab>("all");
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const featuredCount = products.filter(
    (p) => !p.is_campaign_banner && p.is_featured && p.is_active,
  ).length;
  const bannersCount = products.filter((p) => p.is_campaign_banner).length;

  const filteredProducts = products
    .filter((p) => {
      switch (statusFilter) {
        case "single":
          if (p.is_campaign_banner || !p.is_active) return false;
          break;
        case "banners":
          if (!p.is_campaign_banner) return false;
          break;
        case "featured":
          if (p.is_campaign_banner || !p.is_featured) return false;
          break;
        case "archived":
          if (p.is_active) return false;
          break;
        case "all":
        default:
          break;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (p.name || "").toLowerCase();
        const bannerTitle = (p.banner_title || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        return (
          name.includes(q) ||
          bannerTitle.includes(q) ||
          cat.includes(q) ||
          sku.includes(q)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // When viewing Campaign Banners, show them in exact Homepage Display Order
      if (statusFilter === "banners") {
        return (a.banner_order ?? 0) - (b.banner_order ?? 0);
      }
      return 0;
    });

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    setTogglingId(productId);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, is_active: !currentStatus } : item,
      ),
    );

    startTransition(async () => {
      const res = await toggleProductActive(productId, currentStatus);
      if (res?.error) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId
              ? { ...item, is_active: currentStatus }
              : item,
          ),
        );
        alert(`Error updating product status: ${res.error}`);
      }
      setTogglingId(null);
    });
  };

  const handleToggleFeatured = (product: Product) => {
    if (product.is_campaign_banner) return;
    const currentFeatured = Boolean(product.is_featured);
    setFeaturingId(product.id);

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, is_featured: !currentFeatured }
          : item,
      ),
    );

    startTransition(async () => {
      const res = await toggleProductFeatured(product.id, currentFeatured);
      if (res?.error) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === product.id
              ? { ...item, is_featured: currentFeatured }
              : item,
          ),
        );
        alert(res.error);
      }
      setFeaturingId(null);
    });
  };

  const handleDelete = (product: Product) => {
    if (
      !confirm(
        `Permanently delete "${product.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(product.id);
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res?.error) {
        alert(res.error);
      } else {
        setProducts((prev) => prev.filter((item) => item.id !== product.id));
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="w-full">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, banner title, category, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-black cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => {
            const countLabel =
              tab.id === "banners"
                ? ` (${bannersCount})`
                : tab.id === "featured"
                ? ` (${featuredCount})`
                : "";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-black text-white font-bold"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-black"
                }`}
              >
                {tab.label}
                {countLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Helpful hint when viewing Featured */}
      {statusFilter === "featured" && (
        <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong>Top Featured Row:</strong> Single Pieces starred here appear in the carousel right below your Hero video &amp; marquee. (If none are starred, the store automatically shows your 4 newest Single Pieces.)
          </span>
        </div>
      )}

      {/* Table Container */}
      <div className="w-full overflow-x-auto bg-white border border-zinc-200 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-500 font-mono uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Piece</th>
              <th className="py-3.5 px-4 font-semibold">Category</th>
              <th className="py-3.5 px-4 font-semibold">Price</th>
              <th className="py-3.5 px-4 font-semibold">Inventory</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredProducts.map((product) => {
              const isTogglingThis = togglingId === product.id && isPending;
              const isFeaturingThis = featuringId === product.id && isPending;
              const isDeletingThis = deletingId === product.id && isPending;
              const isStockOut = product.stock_quantity <= 0;
              const isStockLow =
                product.stock_quantity > 0 && product.stock_quantity < 5;
              const isBanner = Boolean(product.is_campaign_banner);
              const isFeatured = !isBanner && Boolean(product.is_featured);
              const breakdown = bannerBreakdownCounts[product.id];

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-zinc-50/60 transition-colors ${
                    !product.is_active ? "opacity-60 bg-zinc-50/30" : ""
                  }`}
                >
                  {/* Thumbnail, Title & Role Badges */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-14 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/80">
                        <Image
                          src={product.image_url || "/TWOM.png"}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-bold text-black text-sm hover:underline truncate"
                          >
                            {product.name}
                          </Link>
                          {isBanner && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-white font-semibold">
                              Banner #{product.banner_order ?? 0}
                            </span>
                          )}
                          {isFeatured && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ffce27] text-black font-bold border border-black/15">
                              ★ Featured
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[11px] font-mono text-zinc-400">
                            {product.sku || "NO-SKU"}
                          </span>
                          {isBanner && product.banner_title && (
                            <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                              Overlay: &ldquo;{product.banner_title}&rdquo;
                            </span>
                          )}
                          {isBanner && breakdown && (
                            <span className="text-[10px] font-mono text-zinc-500">
                              Apparel ({breakdown.apparel}) · Accessories (
                              {breakdown.accessories})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 uppercase tracking-wider text-zinc-600 font-medium">
                    {product.category}
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 font-bold text-black text-sm">
                    {formatNaira(product.price)}
                  </td>

                  {/* Stock Quantity */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                        isStockOut
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : isStockLow
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isStockOut
                            ? "bg-red-500"
                            : isStockLow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      {product.stock_quantity}{" "}
                      {product.stock_quantity === 1 ? "unit" : "units"}
                    </span>
                  </td>

                  {/* Active / Soft-Deleted Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        product.is_active
                          ? "bg-black text-white"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {product.is_active ? "Active" : "Archived"}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* One-Click ★ Featured Pin (Single Pieces only) */}
                      {!isBanner && (
                        <button
                          type="button"
                          disabled={isFeaturingThis}
                          onClick={() => handleToggleFeatured(product)}
                          title={
                            isFeatured
                              ? "Unpin from Top Featured Row"
                              : "Pin to Top Featured Row"
                          }
                          className={`px-2.5 py-1.5 rounded-md border font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                            isFeatured
                              ? "bg-[#ffce27] border-black/20 text-black hover:bg-[#f2c11d]"
                              : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                          }`}
                        >
                          ★
                        </button>
                      )}

                      {/* View Storefront */}
                      {product.is_active && (
                        <Link
                          href={`/products/${product.slug || product.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on Storefront"
                          className="px-2.5 py-1.5 rounded-md border border-zinc-200 hover:border-black text-zinc-600 hover:text-black transition-colors"
                        >
                          ↗
                        </Link>
                      )}

                      {/* Edit Button */}
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="px-3 py-1.5 rounded-md bg-black hover:bg-zinc-800 text-white font-medium transition-colors cursor-pointer"
                      >
                        Edit
                      </Link>

                      {/* Soft Delete / Restore Toggle Button */}
                      <button
                        type="button"
                        disabled={isTogglingThis || isDeletingThis}
                        onClick={() =>
                          handleToggleActive(product.id, product.is_active)
                        }
                        className={`px-3 py-1.5 rounded-md border font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                          product.is_active
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {isTogglingThis
                          ? "Updating..."
                          : product.is_active
                          ? "Archive"
                          : "Restore"}
                      </button>

                      {/* Permanent Delete Button (Archived items only) */}
                      {!product.is_active && (
                        <button
                          type="button"
                          disabled={isDeletingThis || isTogglingThis}
                          onClick={() => handleDelete(product)}
                          className="px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingThis ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty Search/Filter State */}
        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-zinc-400">
            <p className="text-sm">No products found matching your filter.</p>
            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-2 text-xs uppercase tracking-wider text-black underline underline-offset-4 cursor-pointer font-bold"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
