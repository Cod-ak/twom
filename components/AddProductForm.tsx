"use client";

import { useState } from "react";
import { addProduct } from "@/app/admin/(dashboard)/actions";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import { compressImages } from "@/lib/compress-image";

export default function AddProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  // Compressed File objects ready for upload (set after user picks files)
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setPreviews([]);
      setCompressedFiles([]);
      return;
    }

    const rawFiles = Array.from(files);

    // Show instant previews from originals while compression runs in background
    const rawUrls = rawFiles.map((f) => URL.createObjectURL(f));
    setPreviews(rawUrls);

    // Compress in the background — no blocker for the editor
    setCompressing(true);
    try {
      const compressed = await compressImages(rawFiles, {
        maxDimension: 1400,
        quality: 0.82,
      });
      setCompressedFiles(compressed);

      // Swap previews to reflect compressed output (dimensions are the same visually)
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

    // Build FormData manually so we can inject compressed files
    const raw = new FormData(e.currentTarget);
    const formData = new FormData();

    // Copy all non-image fields
    for (const [key, value] of raw.entries()) {
      if (key !== "images") formData.append(key, value);
    }

    // Attach compressed files (fall back to raw form files if compression
    // hasn't finished yet — unlikely, but safe)
    const filesToUpload =
      compressedFiles.length > 0
        ? compressedFiles
        : Array.from(
            (e.currentTarget.querySelector('input[name="images"]') as HTMLInputElement)
              ?.files ?? [],
          );

    for (const file of filesToUpload) {
      formData.append("images", file);
    }

    const result = await addProduct(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setPreviews([]);
      setCompressedFiles([]);
      (e.target as HTMLFormElement).reset();
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 text-sm">
          Product added successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
            Product Name *
          </label>
          <input
            required
            name="name"
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title"
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
            defaultValue=""
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title bg-white cursor-pointer"
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
            name="price"
            placeholder="25000"
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title"
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
            defaultValue={10}
            className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-twom-muted mb-2">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wider text-twom-muted">
            Product Images * (Select 1 or more angles)
          </label>
          <span className="text-[11px] text-twom-muted font-mono">
            {compressing
              ? "Compressing…"
              : previews.length > 0
                ? `${previews.length} photo${previews.length > 1 ? "s" : ""} ready`
                : "First photo = ★ Cover photo"}
          </span>
        </div>
        <input
          required
          type="file"
          accept="image/*"
          name="images"
          multiple
          onChange={handleImageChange}
          className="w-full p-3 border border-zinc-300 focus:outline-none focus:border-twom-title file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-twom-title hover:file:bg-zinc-200 cursor-pointer"
        />

        {/* Live Visual Preview Strip */}
        {previews.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative w-24 h-28 rounded-lg overflow-hidden border border-zinc-300 bg-white shadow-2xs group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Preview angle ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 ? (
                  <span className="absolute bottom-1 left-1 right-1 bg-black/85 text-white text-[9px] font-bold py-0.5 text-center rounded-xs uppercase tracking-wider">
                    ★ Cover
                  </span>
                ) : (
                  <span className="absolute bottom-1 left-1 right-1 bg-zinc-800/80 text-white text-[9px] font-medium py-0.5 text-center rounded-xs">
                    Slide {index + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || compressing}
        className="mt-4 bg-twom-title text-white py-4 text-xs uppercase tracking-[0.2em] font-medium disabled:opacity-50 transition-colors hover:bg-black cursor-pointer disabled:cursor-not-allowed"
      >
        {compressing
          ? "Compressing images…"
          : isSubmitting
            ? "Uploading & Saving…"
            : "Add Product"}
      </button>
    </form>
  );
}
