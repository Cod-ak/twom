import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import EditProductForm from "@/components/EditProductForm";
import { Product } from "@/lib/types";

export const instant = false;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <AdminHeaderNav currentTab="products" userEmail={user?.email} />

        <div className="bg-white p-8 border border-zinc-200 shadow-sm rounded-xl">
          <div className="mb-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400 block">
                Edit Atelier Piece
              </span>
              <h2 className="font-zodiak text-2xl text-twom-title mt-0.5">
                {product.name}
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              SKU: {product.sku || "N/A"}
            </span>
          </div>

          <EditProductForm product={product as Product} />
        </div>
      </div>
    </div>
  );
}
