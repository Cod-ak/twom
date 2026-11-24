"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addProduct,
  updateProduct,
  type BreakdownManifestItem,
} from "@/app/admin/(dashboard)/actions";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";
import { compressImages } from "@/lib/compress-image";
import BreakdownRowEditor, {
  type BreakdownRowState,
} from "@/components/BreakdownRowEditor";

interface UnifiedProductFormProps {
  formActionType: "create" | "edit";
  initialMode?: "single" | "banner";
  product?: Product;
  initialBreakdownItems?: {
    tab_type: "apparel" | "accessories";
    product: Product;
  }[];
  existingProducts: Product[];
}

function buildInitialBreakdownRows(
  initialItems?: { tab_type: "apparel" | "accessories"; product: Product }[],
): BreakdownRowState[] {
  if (!initialItems || initialItems.length === 0) return [];
  return initialItems.map((entry, idx) => ({
    clientKey: `existing_${entry.tab_type}_${entry.product.id}_${idx}`,
    tabType: entry.tab_type,
    kind: "existing",
    existingProduct: entry.product,
    name: entry.product.name,
    category: entry.product.category,
    price: (entry.product.price / 100).toString(),
    stock: String(entry.product.stock_quantity ?? 0),
    description: entry.product.description || "",
    previews: [],
    files: [],
    compressing: false,
  }));
}

export default function UnifiedProductForm({
  formActionType,
  initialMode,
  product,
  initialBreakdownItems,
  existingProducts,
}: UnifiedProductFormProps) {
  const router = useRouter();
  const isEditing = formActionType === "edit" && !!product;

  const resolvedInitialMode: "single" | "banner" =
    product?.is_campaign_banner ? "banner" : initialMode || "single";

  const [mode, setMode] = useState<"single" | "banner">(resolvedInitialMode);
  const [isActive, setIsActive] = useState<boolean>(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState<boolean>(
    !product?.is_campaign_banner && Boolean(product?.is_featured),
  );
  const [bannerTitle, setBannerTitle] = useState<string>(
    product?.banner_title || "",
  );
  const [bannerOrder, setBannerOrder] = useState<string>(
    String(product?.banner_order ?? 1),
  );

  // Primary product photo state
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);
  const [compressing, setCompressing] = useState(false);

  // Inline Apparel & Accessories breakdown state
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRowState[]>(() =>
    buildInitialBreakdownRows(initialBreakdownItems),
  );
  const rowCounterRef = useRef(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    slug?: string;
  } | null>(null);

  const existingImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image_url
      ? [product.image_url]
      : [];

  const handlePrimaryImagesChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setCompressedFiles([]);
      return;
    }

    const rawFiles = Array.from(files);
    previews.forEach((u) => URL.revokeObjectURL(u));
    const rawUrls = rawFiles.map((f) => URL.createObjectURL(f));
    setPreviews(rawUrls);

    setCompressing(true);
    try {
      const compressed = await compressImages(rawFiles, {
        maxDimension: 1400,
        quality: 0.82,
      });
      setCompressedFiles(compressed);
      rawUrls.forEach((u) => URL.revokeObjectURL(u));
      setPreviews(compressed.map((f) => URL.createObjectURL(f)));
    } finally {
      setCompressing(false);
    }
  };

  const addBreakdownRow = (tabType: "apparel" | "accessories") => {
    rowCounterRef.current += 1;
    const clientKey = `${tabType}_${Date.now()}_${rowCounterRef.current}`;
    const defaultCategory =
      tabType === "accessories" ? "Accessories" : "Shirts";

    setBreakdownRows((prev) => [
      ...prev,
      {
        clientKey,
        tabType,
        kind: "new",
        name: "",
        category: defaultCategory,
        price: "",
        stock: "10",
        description: "",
        previews: [],
        files: [],
        compressing: false,
      },
    ]);
  };

  const updateBreakdownRow = (
    clientKey: string,
    patch: Partial<BreakdownRowState>,
  ) => {
    setBreakdownRows((prev) =>
      prev.map((row) =>
        row.clientKey === clientKey ? { ...row, ...patch } : row,
      ),
    );
  };

  const removeBreakdownRow = (clientKey: string) => {
    setBreakdownRows((prev) => {
      const target = prev.find((r) => r.clientKey === clientKey);
      target?.previews.forEach((u) => URL.revokeObjectURL(u));
      return prev.filter((r) => r.clientKey !== clientKey);
    });
  };

  const apparelRows = breakdownRows.filter((r) => r.tabType === "apparel");
  const accessoriesRows = breakdownRows.filter(
    (r) => r.tabType === "accessories",
  );

  // Exclude self (on edit) + already-linked products in a given tab from duplicate suggestions
  const getExcludedIdsForRow = (row: BreakdownRowState) => {
    const ids = new Set<string>();
    if (product?.id) ids.add(product.id);
    breakdownRows.forEach((other) => {
      if (
        other.clientKey !== row.clientKey &&
        other.tabType === row.tabType &&
        other.kind === "existing" &&
        other.existingProduct
      ) {
        ids.add(other.existingProduct.id);
      }
    });
    return ids;
  };

  const anyRowCompressing = breakdownRows.some((r) => r.compressing);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (compressing || anyRowCompressing) {
      setError("Please wait a moment for image compression to finish.");
      return;
    }

    setIsSubmitting(true);
    const formEl = e.currentTarget;

    try {
      const raw = new FormData(formEl);
      const formData = new FormData();

      for (const [key, value] of raw.entries()) {
        if (key !== "images") formData.append(key, value);
      }

      formData.set("mode", mode);
      formData.set("is_active", String(isActive));
      formData.set(
        "is_featured",
        mode === "single" ? String(isFeatured) : "false",
      );

      if (mode === "banner") {
        formData.set("banner_title", bannerTitle);
        formData.set("banner_order", bannerOrder || "0");
      }

      const filesToUpload =
        compressedFiles.length > 0
          ? compressedFiles
          : Array.from(
              (
                formEl.querySelector(
                  'input[name="images"]',
                ) as HTMLInputElement
              )?.files ?? [],
            );

      for (const file of filesToUpload) {
        formData.append("images", file);
      }

      // Attach inline Apparel & Accessories breakdown manifest + compressed images
      if (mode === "banner") {
        const manifest: BreakdownManifestItem[] = breakdownRows.map(
          (row, idx) => {
            if (row.kind === "existing" && row.existingProduct) {
              return {
                kind: "existing",
                tab_type: row.tabType,
                product_id: row.existingProduct.id,
                sort_order: idx,
              };
            }

            row.files.forEach((f) => {
              formData.append(`item_images_${row.clientKey}`, f);
            });

            return {
              kind: "new",
              client_key: row.clientKey,
              tab_type: row.tabType,
              name: row.name,
              category: row.category,
              price: row.price,
              stock: row.stock,
              description: row.description,
              sort_order: idx,
            };
          },
        );

        formData.set("breakdown_manifest", JSON.stringify(manifest));
      }

      const result = isEditing
        ? await updateProduct(product.id, formData)
        : await addProduct(formData);

      if (result.error) {
        setError(result.error);
      } else if (isEditing) {
        setSuccessInfo({
          message:
            mode === "banner"
              ? "Campaign Banner & breakdown changes saved!"
              : "Product changes saved successfully!",
          slug: product.slug,
        });
        previews.forEach((u) => URL.revokeObjectURL(u));
        setPreviews([]);
        setCompressedFiles([]);
        router.refresh();
      } else {
        const rawSlug = (result as { slug?: unknown }).slug;
        const createdSlug = typeof rawSlug === "string" ? rawSlug : undefined;
        setSuccessInfo({
          message:
            mode === "banner"
              ? "Campaign Banner & breakdown pieces published live!"
              : "Product published successfully!",
          slug: createdSlug,
        });
        previews.forEach((u) => URL.revokeObjectURL(u));
        setPreviews([]);
        setCompressedFiles([]);
        breakdownRows.forEach((r) =>
          r.previews.forEach((u) => URL.revokeObjectURL(u)),
        );
        setBreakdownRows([]);
        setBannerTitle("");
        setIsFeatured(false);
        formEl.reset();
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs sm:text-sm rounded-xl">
          {error}
        </div>
      )}

      {successInfo && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs sm:text-sm rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-medium">✓ {successInfo.message}</span>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin/products"
              className="text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:opacity-75"
            >
              View All Products →
            </Link>
            {successInfo.slug && (
              <Link
                href={`/products/${successInfo.slug}`}
                target="_blank"
                className="text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:opacity-75"
              >
                View Live PDP ↗
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 1. Display Format Mode Switcher */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
        <span className="block text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted mb-2.5">
          Publishing Format *
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === "single"
                ? "bg-black text-white border-black shadow-sm"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider">
              Single Piece
            </span>
            <span
              className={`block text-[11px] mt-1 ${
                mode === "single" ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              Standard garment or accessory card for catalog & sliders.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("banner")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === "banner"
                ? "bg-black text-white border-black shadow-sm"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider">
              Campaign Banner (Full Outfit)
            </span>
            <span
              className={`block text-[11px] mt-1 ${
                mode === "banner" ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              Homepage editorial banner + inline Apparel & Accessories breakdown.
            </span>
          </button>
        </div>
      </div>

      {/* 2. Primary Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            {mode === "banner" ? "Banner Product Name *" : "Product Name *"}
          </label>
          <input
            required
            name="name"
            defaultValue={product?.name || ""}
            placeholder={
              mode === "banner"
                ? "e.g. TWOM Tailored 2-Piece Linen Suit"
                : "e.g. Heavyweight Boxy Tee"
            }
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded-lg bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="category-select"
            className="block text-xs uppercase tracking-wider text-twom-muted mb-2"
          >
            Category *
          </label>
          <select
            id="category-select"
            required
            name="category"
            defaultValue={product?.category || ""}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title bg-white cursor-pointer rounded-lg"
          >
            <option value="" disabled>
              Select a category
            </option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            Price (Naira) *
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            name="price"
            defaultValue={product?.price ? product.price / 100 : ""}
            placeholder="25000"
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded-lg bg-white"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            Stock Quantity *
          </label>
          <input
            required
            type="number"
            min="0"
            name="stock"
            defaultValue={product?.stock_quantity ?? 10}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded-lg bg-white"
          />
        </div>
      </div>

      {/* Edit Mode Visibility Toggle */}
      {isEditing && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-xs uppercase tracking-wider text-black">
              Storefront Visibility
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isActive
                ? "Live and visible across the storefront."
                : "Archived/hidden (soft-deleted). Order history remains intact."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
              isActive
                ? "bg-black text-white hover:bg-zinc-800"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            {isActive ? "Active (Visible)" : "Archived (Hidden)"}
          </button>
        </div>
      )}

      {/* Single Piece Only: Pin to Top Featured Row */}
      {mode === "single" && (
        <label className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-black block">
              ★ Feature at Top of Homepage
            </span>
            <span className="text-xs text-zinc-600 mt-0.5 block">
              Pin this Single Piece to the Featured Row right below the Hero video & marquee.
            </span>
          </div>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-5 h-5 accent-black rounded cursor-pointer shrink-0"
          />
        </label>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description || ""}
          placeholder="Tailoring notes, fabric composition, fit guidance..."
          className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded-lg bg-white"
        />
      </div>

      {/* 3. Multi-Image Uploader */}
      <div className="border-t border-zinc-200 pt-6">
        {isEditing && existingImages.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-wider text-twom-muted mb-3 font-semibold">
              Current Photos
            </label>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((src, index) => (
                <div
                  key={index}
                  className="relative w-24 h-28 rounded-lg overflow-hidden border border-zinc-300 bg-white shadow-2xs"
                >
                  <Image
                    src={src}
                    alt={`Current image ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-1 left-1 right-1 bg-black/85 text-white text-[9px] font-bold py-0.5 text-center rounded-xs uppercase tracking-wider">
                    {index === 0
                      ? mode === "banner"
                        ? "★ Banner"
                        : "★ Cover"
                      : `Slide ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wider text-twom-muted">
            {isEditing
              ? "Upload Replacement Photos (Optional)"
              : mode === "banner"
              ? "Banner & PDP Photos * (Photo #1 = Homepage Banner, #2+ = PDP Slides)"
              : "Product Images * (Select 1 or more angles)"}
          </label>
          <span className="text-[11px] text-twom-muted font-mono">
            {compressing
              ? "Compressing…"
              : previews.length > 0
              ? `${previews.length} photo${previews.length > 1 ? "s" : ""} ready`
              : isEditing
              ? "Leave blank to keep existing"
              : mode === "banner"
              ? "Photo #1 = ★ Banner Cover"
              : "Photo #1 = ★ Cover photo"}
          </span>
        </div>

        <input
          required={!isEditing}
          type="file"
          accept="image/*"
          name="images"
          multiple
          onChange={handlePrimaryImagesChange}
          className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-twom-title hover:file:bg-zinc-200 cursor-pointer rounded-lg bg-white"
        />

        {previews.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative w-24 h-28 rounded-lg overflow-hidden border border-zinc-300 bg-white shadow-2xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Preview angle ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute bottom-1 left-1 right-1 text-white text-[9px] font-bold py-0.5 text-center rounded-xs uppercase tracking-wider ${
                    index === 0 ? "bg-black/85" : "bg-zinc-800/80"
                  }`}
                >
                  {index === 0
                    ? mode === "banner"
                      ? "★ Banner"
                      : "★ Cover"
                    : `Slide ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Conditional Campaign Banner Settings & Inline Breakdown Tables */}
      {mode === "banner" && (
        <div className="border border-zinc-200 bg-zinc-50/70 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="border-b border-zinc-200 pb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Campaign Drop Configuration
            </span>
            <h3 className="font-zodiak text-xl text-twom-title mt-0.5">
              Homepage Banner &amp; [ APPAREL | ACCESSORIES ] Breakdown
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Clicking &ldquo;Shop Now&rdquo; on this banner routes shoppers directly to this piece&apos;s Product Description Page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-twom-muted mb-1.5">
                Short Banner Overlay Title (Optional)
              </label>
              <input
                type="text"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="e.g. SUITS (Leave blank to use Product Name)"
                className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-twom-muted mb-1.5">
                Homepage Display Order
              </label>
              <input
                type="number"
                min="0"
                value={bannerOrder}
                onChange={(e) => setBannerOrder(e.target.value)}
                className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Inline Sub-Table A: APPAREL */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-nippo italic font-black uppercase tracking-wider text-black">
                  APPAREL Pieces ({apparelRows.length})
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Individual garments in this look (jackets, trousers, shirts) sold single-handedly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addBreakdownRow("apparel")}
                className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                + Add Apparel Piece
              </button>
            </div>

            {apparelRows.length === 0 ? (
              <div className="p-4 border border-dashed border-zinc-300 rounded-xl text-center text-xs text-zinc-500 bg-white/60">
                No apparel pieces attached yet. Click &ldquo;+ Add Apparel Piece&rdquo; to add one inline.
              </div>
            ) : (
              <div className="space-y-3">
                {apparelRows.map((row, idx) => (
                  <BreakdownRowEditor
                    key={row.clientKey}
                    row={row}
                    index={idx}
                    existingProducts={existingProducts}
                    excludeProductIds={getExcludedIdsForRow(row)}
                    onChange={updateBreakdownRow}
                    onRemove={removeBreakdownRow}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Inline Sub-Table B: ACCESSORIES */}
          <div className="space-y-3 pt-2 border-t border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-nippo italic font-black uppercase tracking-wider text-black">
                  ACCESSORIES ({accessoriesRows.length})
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Optional. If left empty, the ACCESSORIES toggle button will be muted and disabled on the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addBreakdownRow("accessories")}
                className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                + Add Accessory
              </button>
            </div>

            {accessoriesRows.length === 0 ? (
              <div className="p-4 border border-dashed border-zinc-300 rounded-xl text-center text-xs text-zinc-500 bg-white/60">
                No accessories added — the storefront ACCESSORIES toggle will stay muted &amp; unclickable.
              </div>
            ) : (
              <div className="space-y-3">
                {accessoriesRows.map((row, idx) => (
                  <BreakdownRowEditor
                    key={row.clientKey}
                    row={row}
                    index={idx}
                    existingProducts={existingProducts}
                    excludeProductIds={getExcludedIdsForRow(row)}
                    onChange={updateBreakdownRow}
                    onRemove={removeBreakdownRow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-wider text-zinc-600 hover:text-black transition-colors"
        >
          ← Back to All Products
        </Link>

        <button
          type="submit"
          disabled={isSubmitting || compressing || anyRowCompressing}
          className="bg-black text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {compressing || anyRowCompressing
            ? "Compressing Photos…"
            : isSubmitting
            ? "Uploading & Saving…"
            : isEditing
            ? "Save Changes"
            : mode === "banner"
            ? "Publish Campaign Drop"
            : "Publish Single Piece"}
        </button>
      </div>
    </form>
  );
}
