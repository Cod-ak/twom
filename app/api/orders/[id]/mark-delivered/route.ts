import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Customer hits this endpoint to confirm they received their order.
// Guards: must be authenticated + must own the order + order must be SHIPPED.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch order and verify ownership
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, customer_email")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.customer_email !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "shipped") {
    return NextResponse.json(
      { error: "Only shipped orders can be marked as delivered." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("customer_email", user.email); // extra ownership guard at DB level

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
