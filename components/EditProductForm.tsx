"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/app/admin/(dashboard)/actions";
import { Product, PRODUCT_CATEGORIES } from "@/lib/types";
import { compressImages } from "@/lib/compress-image";

interface EditProductFormProps {
  product: Product;
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(product.is_active);

  const [previews, setPreviews] = useState<string[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);

  const existingImages =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : [];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setPreviews([]);
      setCompressedFiles([]);
      return;
    }

    const rawFiles = Array.from(files);
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
      const compressedUrls = compressed.map((f) => URL.createObjectURL(f));
      setPreviews(compressedUrls);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const raw = new FormData(e.currentTarget);
    const formData = new FormData();

    for (const [key, value] of raw.entries()) {
      if (key !== "images") formData.append(key, value);
    }

    formData.append("is_active", String(isActive));

    const filesToUpload =
      compressedFiles.length > 0
        ? compressedFiles
        : Array.from(
            (e.currentTarget.querySelector('input[name="images"]') as HTMLInputElement)
              ?.files ?? []
          );

    for (const file of filesToUpload) {
      formData.append("images", file);
    }

    const result = await updateProduct(product.id, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 text-sm rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 text-sm rounded">
          Product changes saved successfully!
        </div>
      )}

      {/* Row 1: Name and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            Product Name *
          </label>
          <input
            required
            name="name"
            defaultValue={product.name}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded bg-white"
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
            defaultValue={product.category}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title bg-white cursor-pointer rounded"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Price and Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            Price in Naira * (e.g. 25000)
          </label>
          <input
            required
            type="number"
            step="0.01"
            name="price"
            defaultValue={product.price ? product.price / 100 : ""}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded bg-white"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            Stock Quantity *
          </label>
          <input
            required
            type="number"
            name="stock"
            defaultValue={product.stock_quantity ?? 0}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded bg-white"
          />
        </div>
      </div>

      {/* Active / Visibility Status Toggle */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-between">
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-black">
            Storefront Visibility
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isActive
              ? "Piece is currently live and available on the storefront catalog."
              : "Piece is archived/hidden (soft-deleted). Order history remains safe."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive((prev) => !prev)}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-bold rounded transition-colors cursor-pointer ${
            isActive
              ? "bg-black text-white hover:bg-zinc-800"
              : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
          }`}
        >
          {isActive ? "Active (Visible)" : "Archived (Hidden)"}
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product.description || ""}
          className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title rounded bg-white"
        />
      </div>

      {/* Images Section */}
      <div className="border-t border-zinc-200 pt-6">
        <label className="block text-xs uppercase tracking-wider text-twom-muted mb-3 font-semibold">
          Existing Photos
        </label>

        {existingImages.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-6">
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
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 right-1 bg-black/85 text-white text-[9px] font-bold py-0.5 text-center rounded-xs uppercase tracking-wider">
                    ★ Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 mb-4">No images uploaded.</p>
        )}

        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wider text-twom-muted">
            Upload Replacement Photos (Optional)
          </label>
          <span className="text-[11px] text-twom-muted font-mono">
            {compressing
              ? "Compressing…"
              : previews.length > 0
              ? `${previews.length} replacement photo${previews.length > 1 ? "s" : ""}`
              : "Leave blank to keep existing photos"}
          </span>
        </div>

        <input
          type="file"
          accept="image/*"
          name="images"
          multiple
          onChange={handleImageChange}
          className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-twom-title hover:file:bg-zinc-200 cursor-pointer rounded bg-white"
        />

        {/* Replacement previews */}
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
                  alt={`Replacement preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 right-1 bg-emerald-700/90 text-white text-[9px] font-bold py-0.5 text-center rounded-xs uppercase">
                  {index === 0 ? "★ New Cover" : `New Angle ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons Row */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-wider text-zinc-600 hover:text-black transition-colors"
        >
          ← Cancel & Back to Products
        </Link>

        <button
          type="submit"
          disabled={isSubmitting || compressing}
          className="bg-black text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-medium rounded hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {compressing
            ? "Compressing Photos…"
            : isSubmitting
            ? "Saving Changes…"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
