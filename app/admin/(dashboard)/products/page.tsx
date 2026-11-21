import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import AdminProductsTable from "@/components/AdminProductsTable";
import { Product } from "@/lib/types";
import Link from "next/link";

export const instant = false;

export default async function AdminProductsPage() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all products (both active and inactive) sorted newest first
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-twom-bg pt-28 pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <AdminHeaderNav currentTab="products" userEmail={user?.email} />

        {/* Section Header & Quick Add Link */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-zodiak text-2xl text-twom-title">
              All Atelier Pieces
            </h2>
            <p className="text-xs text-twom-muted mt-0.5">
              Manage inventory, update pricing, or soft-delete discontinued items.
            </p>
          </div>

          <Link
            href="/admin"
            className="bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium transition-colors"
          >
            + Add New Piece
          </Link>
        </div>

        {/* Interactive Products Table */}
        <AdminProductsTable initialProducts={(products as Product[]) || []} />
      </div>
    </div>
  );
}
