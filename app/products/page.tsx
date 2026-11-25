import { supabase } from "@/lib/supabase";
import {
  ShowcaseItem,
  SHOWCASE_SAMPLES,
} from "@/lib/showcase-catalog";
import ProductCatalogView from "@/components/ProductCatalogView";

export const instant = false;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  let products: ShowcaseItem[] | null = null;

  try {
    const res = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    products = (res.data as ShowcaseItem[] | null) || null;
  } catch {
    products = null;
  }

  // Fall back to showcase previews when DB has no live active items
  const allProducts: ShowcaseItem[] =
    products && products.length > 0 ? products : SHOWCASE_SAMPLES;

  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4">
      <div className="w-full">
        <ProductCatalogView
          initialProducts={allProducts}
          initialCategory={category}
        />
      </div>
    </div>
  );
}
