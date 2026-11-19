import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

// Next.js 16: Explicitly allow blocking execution for server-side auth redirect
export const instant = false;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Opt into request-time dynamic execution before reading auth tokens
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
