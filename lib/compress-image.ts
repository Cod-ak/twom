/**
 * Client-side image compression using the browser Canvas API.
 * Runs entirely in the browser — no server round-trip, no package needed.
 *
 * Strategy:
 *  - Resize so the longest edge is at most `maxDimension` pixels.
 *  - Re-encode as JPEG at `quality` (0–1). JPEG is universally supported
 *    and far smaller than PNG for photos.
 *  - If the compressed result is somehow *larger* than the original
 *    (e.g. a tiny PNG), we return the original unchanged.
 */

export interface CompressOptions {
  /** Max width or height in pixels. Default: 1400 */
  maxDimension?: number;
  /** JPEG quality, 0–1. Default: 0.82 */
  quality?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const { maxDimension = 1400, quality = 0.82 } = options;

  // Only compress raster images; skip SVG / GIF
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate scaled dimensions
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // Fallback: return original if canvas unavailable
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compressed is no smaller — keep original
            resolve(file);
            return;
          }

          // Keep the original filename but reflect the new type
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg", lastModified: Date.now() },
          );
          resolve(compressed);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback: return original on decode error
    };

    img.src = objectUrl;
  });
}

/** Compress an array of files in parallel */
export async function compressImages(
  files: File[],
  options?: CompressOptions,
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
