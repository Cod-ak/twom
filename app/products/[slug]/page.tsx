import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ShowcaseItem,
  getShowcaseSampleBySlug,
  isSampleProductId,
} from "@/lib/showcase-catalog";
import ProductPurchaseSection from "@/components/ProductPurchaseSection";
import ProductImageGallery from "@/components/ProductImageGallery";
import { formatNaira } from "@/lib/utils";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data: dbProduct } = await supabase
    .from("products")
    .select("name, description, price, image_url, category")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const sample = !dbProduct ? getShowcaseSampleBySlug(slug) : undefined;
  const product = dbProduct || sample;

  if (!product) {
    return {
      title: "Piece Not Found",
      description: "The requested atelier garment is not in the archive.",
    };
  }

  const formattedPrice = formatNaira(product.price);
  const title = `${product.name} (${formattedPrice})`;
  const description =
    product.description ||
    `Acquire ${product.name} from the TWOM Atelier. ${product.category}. Tailored luxury minimalism.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: product.image_url,
          width: 1200,
          height: 1500,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image_url],
    },
  };
}

// In Next.js 16, params is a Promise, so we must await it
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch the specific live product from Supabase by slug
  const { data: dbProduct } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  // 2. Fall back to showcase preview items if DB doesn't have this slug yet
  const sampleProduct = !dbProduct ? getShowcaseSampleBySlug(slug) : undefined;
  const product: ShowcaseItem | null =
    (dbProduct as ShowcaseItem | null) ?? sampleProduct ?? null;

  // 3. If no live or showcase product matches, trigger 404
  if (!product) {
    notFound();
  }

  const isSample = isSampleProductId(product.id);

  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-16 md:pb-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        {/* Left Column: Swipeable Product Image Gallery */}
        <div className="w-full md:w-1/2">
          <ProductImageGallery
            images={
              product.images && product.images.length > 0
                ? product.images
                : [product.image_url]
            }
            name={product.name}
          />
        </div>

        {/* Right Column: Details & Purchase UI (Arranged like reference) */}
        <div className="w-full md:w-1/2">
          <ProductPurchaseSection product={product} isSample={isSample} />
        </div>
      </div>
    </div>
  );
}
