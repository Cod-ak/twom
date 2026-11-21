"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { toggleProductActive } from "@/app/admin/(dashboard)/actions";

interface AdminProductsTableProps {
  initialProducts: Product[];
}

export default function AdminProductsTable({
  initialProducts,
}: AdminProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    // 1. Status Filter
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "archived" && p.is_active) return false;

    // 2. Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || sku.includes(q);
    }

    return true;
  });

  const handleToggle = (productId: string, currentStatus: boolean) => {
    setTogglingId(productId);
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, is_active: !currentStatus } : item
      )
    );

    startTransition(async () => {
      const res = await toggleProductActive(productId, currentStatus);
      if (res?.error) {
        // Revert on error
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId ? { ...item, is_active: currentStatus } : item
          )
        );
        alert(`Error updating product status: ${res.error}`);
      }
      setTogglingId(null);
    });
  };

  return (
    <div className="w-full">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, category, or SKU..."
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

        <div className="flex items-center gap-2">
          {(["all", "active", "archived"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                statusFilter === filter
                  ? "bg-black text-white font-bold"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:border-black"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

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
              const isStockOut = product.stock_quantity <= 0;
              const isStockLow = product.stock_quantity > 0 && product.stock_quantity < 5;

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-zinc-50/60 transition-colors ${
                    !product.is_active ? "opacity-60 bg-zinc-50/30" : ""
                  }`}
                >
                  {/* Thumbnail & Title */}
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
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-bold text-black text-sm hover:underline block truncate"
                        >
                          {product.name}
                        </Link>
                        <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                          {product.sku || "NO-SKU"}
                        </span>
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
                        disabled={isTogglingThis}
                        onClick={() => handleToggle(product.id, product.is_active)}
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
