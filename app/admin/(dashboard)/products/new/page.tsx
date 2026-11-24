import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import UnifiedProductForm from "@/components/UnifiedProductForm";
import type { Product } from "@/lib/types";

export const instant = false;

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  await connection();
  const { mode } = await searchParams;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: existingProductsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  const existingProducts = (existingProductsData as Product[]) || [];
  const initialMode = mode === "banner" ? "banner" : "single";

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <AdminHeaderNav currentTab="products" userEmail={user?.email} />

        <div className="bg-white p-6 sm:p-8 border border-zinc-200 shadow-xs rounded-xl">
          <div className="mb-6 pb-4 border-b border-zinc-100">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400 block">
              Storefront Publishing
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title mt-0.5">
              {initialMode === "banner"
                ? "Create Campaign Banner Drop"
                : "Add New Atelier Piece"}
            </h2>
            <p className="text-xs text-twom-muted mt-1">
              Publish a standalone Single Piece or an editorial Campaign Banner with inline Apparel &amp; Accessories breakdown.
            </p>
          </div>

          <UnifiedProductForm
            formActionType="create"
            initialMode={initialMode}
            existingProducts={existingProducts}
          />
        </div>
      </div>
    </div>
  );
}
