import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import AdminProductsTable, {
  type BannerBreakdownCounts,
} from "@/components/AdminProductsTable";
import { Product } from "@/lib/types";
import Link from "next/link";

export const instant = false;

export default async function AdminProductsPage() {
  await connection();
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: products },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  // Fetch breakdown item counts for Campaign Banner products safely
  const bannerBreakdownCounts: BannerBreakdownCounts = {};
  try {
    const { data: itemsData } = await supabase
      .from("campaign_banner_items")
      .select("banner_product_id, tab_type");

    if (itemsData) {
      for (const row of itemsData as Array<{
        banner_product_id: string;
        tab_type: "apparel" | "accessories";
      }>) {
        if (!bannerBreakdownCounts[row.banner_product_id]) {
          bannerBreakdownCounts[row.banner_product_id] = {
            apparel: 0,
            accessories: 0,
          };
        }
        if (row.tab_type === "apparel") {
          bannerBreakdownCounts[row.banner_product_id].apparel += 1;
        } else if (row.tab_type === "accessories") {
          bannerBreakdownCounts[row.banner_product_id].accessories += 1;
        }
      }
    }
  } catch {
    // Graceful fallback if migration hasn't run yet
  }

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <AdminHeaderNav currentTab="products" userEmail={user?.email} />

        {/* Section Header & Quick Add Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-zodiak text-2xl text-twom-title">
              All Atelier Pieces &amp; Banners
            </h2>
            <p className="text-xs text-twom-muted mt-0.5">
              Pin Single Pieces (★) to the Top Featured Row, manage Campaign Banners, or update inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/admin/products/new"
              className="bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium transition-colors"
            >
              + Add Single Piece
            </Link>
            <Link
              href="/admin/products/new?mode=banner"
              className="border border-black hover:bg-zinc-100 text-black px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium transition-colors bg-white"
            >
              + Create Campaign Banner
            </Link>
          </div>
        </div>

        {/* Interactive Products Table */}
        <AdminProductsTable
          initialProducts={(products as Product[]) || []}
          bannerBreakdownCounts={bannerBreakdownCounts}
        />
      </div>
    </div>
  );
}
