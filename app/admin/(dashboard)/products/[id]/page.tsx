import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import UnifiedProductForm from "@/components/UnifiedProductForm";
import type { Product } from "@/lib/types";

export const instant = false;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: product, error },
    { data: existingProductsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("*").order("name", { ascending: true }),
  ]);

  if (error || !product) {
    notFound();
  }

  // Load any attached Apparel & Accessories breakdown items safely
  const initialBreakdownItems: {
    tab_type: "apparel" | "accessories";
    product: Product;
  }[] = [];

  try {
    const { data: itemsData } = await supabase
      .from("campaign_banner_items")
      .select(
        `
        tab_type,
        sort_order,
        item_product:products!campaign_banner_items_item_product_id_fkey(*)
      `,
      )
      .eq("banner_product_id", id)
      .order("sort_order", { ascending: true });

    if (itemsData) {
      for (const row of itemsData as unknown as Array<{
        tab_type: "apparel" | "accessories";
        item_product: Product | null;
      }>) {
        if (row.item_product) {
          initialBreakdownItems.push({
            tab_type: row.tab_type,
            product: row.item_product,
          });
        }
      }
    }
  } catch {
    // Graceful no-op if migration hasn't been executed yet
  }

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <AdminHeaderNav currentTab="products" userEmail={user?.email} />

        <div className="bg-white p-6 sm:p-8 border border-zinc-200 shadow-xs rounded-xl">
          <div className="mb-6 pb-4 border-b border-zinc-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400 block">
                Edit Atelier Piece
              </span>
              <h2 className="font-zodiak text-2xl text-twom-title mt-0.5">
                {product.name}
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400 shrink-0">
              SKU: {product.sku || "N/A"}
            </span>
          </div>

          <UnifiedProductForm
            formActionType="edit"
            product={product as Product}
            initialBreakdownItems={initialBreakdownItems}
            existingProducts={(existingProductsData as Product[]) || []}
          />
        </div>
      </div>
    </div>
  );
}
