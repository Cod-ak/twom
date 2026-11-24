"use client";

import { useMemo } from "react";
import Image from "next/image";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";
import { compressImages } from "@/lib/compress-image";
import { formatNaira } from "@/lib/utils";

export interface BreakdownRowState {
  clientKey: string;
  tabType: "apparel" | "accessories";
  kind: "new" | "existing";
  existingProduct?: Product;
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  previews: string[];
  files: File[];
  compressing: boolean;
}

interface BreakdownRowEditorProps {
  row: BreakdownRowState;
  index: number;
  existingProducts: Product[];
  excludeProductIds: Set<string>;
  onChange: (clientKey: string, patch: Partial<BreakdownRowState>) => void;
  onRemove: (clientKey: string) => void;
}

export default function BreakdownRowEditor({
  row,
  index,
  existingProducts,
  excludeProductIds,
  onChange,
  onRemove,
}: BreakdownRowEditorProps) {
  const isApparel = row.tabType === "apparel";

  // Smart live duplicate detector: find matching single pieces in catalog while typing
  const duplicateMatches = useMemo(() => {
    if (row.kind !== "new") return [];
    const query = row.name.trim().toLowerCase();
    if (query.length < 2) return [];

    return existingProducts
      .filter((p) => {
        if (p.is_campaign_banner) return false;
        if (excludeProductIds.has(p.id)) return false;
        const nameMatch = p.name.toLowerCase().includes(query);
        const skuMatch = (p.sku || "").toLowerCase().includes(query);
        return nameMatch || skuMatch;
      })
      .slice(0, 4);
  }, [row.kind, row.name, existingProducts, excludeProductIds]);

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) {
      row.previews.forEach((u) => URL.revokeObjectURL(u));
      onChange(row.clientKey, { previews: [], files: [], compressing: false });
      return;
    }

    const rawFiles = Array.from(fileList);
    row.previews.forEach((u) => URL.revokeObjectURL(u));
    const rawUrls = rawFiles.map((f) => URL.createObjectURL(f));
    onChange(row.clientKey, { previews: rawUrls, compressing: true });

    try {
      const compressed = await compressImages(rawFiles, {
        maxDimension: 1400,
        quality: 0.82,
      });
      rawUrls.forEach((u) => URL.revokeObjectURL(u));
      const compressedUrls = compressed.map((f) => URL.createObjectURL(f));
      onChange(row.clientKey, {
        previews: compressedUrls,
        files: compressed,
        compressing: false,
      });
    } catch {
      onChange(row.clientKey, { files: rawFiles, compressing: false });
    }
  };

  const handleUseExisting = (product: Product) => {
    row.previews.forEach((u) => URL.revokeObjectURL(u));
    onChange(row.clientKey, {
      kind: "existing",
      existingProduct: product,
      name: product.name,
      previews: [],
      files: [],
      compressing: false,
    });
  };

  const handleSwitchToNew = () => {
    onChange(row.clientKey, {
      kind: "new",
      existingProduct: undefined,
      name: "",
    });
  };

  // Linked existing catalog piece view (prevents duplicates cleanly)
  if (row.kind === "existing" && row.existingProduct) {
    const p = row.existingProduct;
    return (
      <div className="bg-white border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
            <Image
              src={p.image_url || "/TWOM.png"}
              alt={p.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Linked Existing Piece
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {p.category}
              </span>
            </div>
            <p className="text-sm font-bold text-black truncate mt-0.5">
              {p.name}
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              {formatNaira(p.price)} · {p.stock_quantity} in stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSwitchToNew}
            className="text-[11px] font-mono text-zinc-500 hover:text-black underline underline-offset-2 cursor-pointer"
          >
            Create New Instead
          </button>
          <button
            type="button"
            onClick={() => onRemove(row.clientKey)}
            className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-twom-title">
          {isApparel ? `Apparel Piece #${index + 1}` : `Accessory #${index + 1}`}
        </span>
        <button
          type="button"
          onClick={() => onRemove(row.clientKey)}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
        >
          ✕ Remove
        </button>
      </div>

      {/* Name (with Smart Duplicate Detector) + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-[11px] uppercase tracking-wider text-twom-muted mb-1.5">
            Piece Name *
          </label>
          <input
            type="text"
            required
            placeholder={
              isApparel
                ? "e.g. Tailored Linen Jacket"
                : "e.g. Onyx Silk Tie"
            }
            value={row.name}
            onChange={(e) => onChange(row.clientKey, { name: e.target.value })}
            className="w-full p-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
          />

          {/* Smart Live Duplicate Detector Dropdown */}
          {duplicateMatches.length > 0 && (
            <div className="mt-2 bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-bold">
                Already in catalog — use existing to avoid duplicate:
              </p>
              <div className="space-y-1.5">
                {duplicateMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between gap-2 bg-white border border-amber-200/80 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative w-8 h-9 rounded overflow-hidden bg-zinc-100 shrink-0">
                        <Image
                          src={match.image_url || "/TWOM.png"}
                          alt={match.name}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-black truncate">
                          {match.name}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          {formatNaira(match.price)} · {match.stock_quantity} left
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUseExisting(match)}
                      className="shrink-0 px-2.5 py-1 bg-black hover:bg-zinc-800 text-white text-[10px] uppercase tracking-wider font-semibold rounded cursor-pointer transition-colors"
                    >
                      Use Existing
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-twom-muted mb-1.5">
            Category *
          </label>
          <select
            required
            value={row.category}
            onChange={(e) => onChange(row.clientKey, { category: e.target.value })}
            className="w-full p-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white cursor-pointer"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-twom-muted mb-1.5">
            Price (Naira) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="45000"
            value={row.price}
            onChange={(e) => onChange(row.clientKey, { price: e.target.value })}
            className="w-full p-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-twom-muted mb-1.5">
            Stock Quantity *
          </label>
          <input
            type="number"
            min="0"
            required
            value={row.stock}
            onChange={(e) => onChange(row.clientKey, { stock: e.target.value })}
            className="w-full p-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-twom-muted mb-1.5">
          Description
        </label>
        <textarea
          rows={2}
          placeholder="Brief tailoring & fabric details..."
          value={row.description}
          onChange={(e) =>
            onChange(row.clientKey, { description: e.target.value })
          }
          className="w-full p-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
        />
      </div>

      {/* Multi-Image Upload */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] uppercase tracking-wider text-twom-muted">
            Piece Photos * (1 or more angles)
          </label>
          <span className="text-[10px] font-mono text-twom-muted">
            {row.compressing
              ? "Compressing…"
              : row.previews.length > 0
              ? `${row.previews.length} ready`
              : "First photo = ★ Cover"}
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          required={row.files.length === 0}
          onChange={handleImagesChange}
          className="w-full p-2 border border-zinc-300 rounded-lg text-xs file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-twom-title hover:file:bg-zinc-200 cursor-pointer bg-white"
        />

        {row.previews.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
            {row.previews.map((src, idx) => (
              <div
                key={idx}
                className="relative w-16 h-20 rounded-md overflow-hidden border border-zinc-300 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Breakdown preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold py-0.5 text-center rounded-xs uppercase">
                  {idx === 0 ? "★ Cover" : `Slide ${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
