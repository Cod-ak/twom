import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import AddProductForm from "@/components/AddProductForm";

export const instant = false;

export default async function AdminDashboard() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-twom-bg pt-28 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <AdminHeaderNav currentTab="overview" userEmail={user?.email} />

        {/* The Product Form */}
        <div className="bg-white p-8 border border-zinc-200 shadow-sm rounded-xl">
          <h2 className="font-zodiak text-2xl mb-1">Add New Product</h2>
          <p className="text-xs text-twom-muted mb-6">
            Upload high-resolution photography and catalog details to publish to the live storefront.
          </p>
          <AddProductForm />
        </div>
      </div>
    </div>
  );
}
