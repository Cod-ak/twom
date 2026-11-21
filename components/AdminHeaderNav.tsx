import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

interface AdminHeaderNavProps {
  currentTab?: "overview" | "products" | "orders";
  userEmail?: string;
}

export default async function AdminHeaderNav({
  currentTab = "overview",
  userEmail,
}: AdminHeaderNavProps) {
  const handleSignOut = async () => {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/admin/login");
  };

  return (
    <header className="mb-8 pb-6 border-b border-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-twom-muted font-mono block">
            Atelier Management
          </span>
          <h1 className="font-zodiak text-3xl sm:text-4xl text-twom-title mt-0.5">
            Admin Portal
          </h1>
          {userEmail && (
            <p className="text-xs text-twom-muted mt-1 font-mono">
              Signed in as {userEmail}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 text-xs uppercase tracking-wider text-twom-muted hover:text-black border border-zinc-200 hover:border-black transition-colors"
          >
            Live Store ↗
          </Link>

          <form action={handleSignOut}>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs uppercase tracking-wider text-zinc-600 border border-zinc-300 hover:text-black hover:border-black transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </form>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Link
          href="/admin"
          className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
            currentTab === "overview"
              ? "bg-black text-white font-bold shadow-xs"
              : "bg-white/80 hover:bg-white text-zinc-700 hover:text-black border border-zinc-200/80"
          }`}
        >
          Add Product
        </Link>

        <Link
          href="/admin/products"
          className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
            currentTab === "products"
              ? "bg-black text-white font-bold shadow-xs"
              : "bg-white/80 hover:bg-white text-zinc-700 hover:text-black border border-zinc-200/80"
          }`}
        >
          All Products
        </Link>

        <Link
          href="/admin/orders"
          className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
            currentTab === "orders"
              ? "bg-black text-white font-bold shadow-xs"
              : "bg-white/80 hover:bg-white text-zinc-700 hover:text-black border border-zinc-200/80"
          }`}
        >
          Orders
        </Link>
      </nav>
    </header>
  );
}
