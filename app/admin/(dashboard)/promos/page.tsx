import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import AdminPromosView from "@/components/AdminPromosView";
import type { PromoCode } from "@/lib/types";

export const instant = false;

export default async function AdminPromosPage() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all promo codes ordered newest first
  const { data: rawPromos } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  const promos: PromoCode[] = rawPromos || [];

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <AdminHeaderNav currentTab="promos" userEmail={user?.email} />

        <AdminPromosView initialPromos={promos} />
      </div>
    </div>
  );
}
