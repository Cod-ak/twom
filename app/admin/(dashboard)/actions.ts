"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { type OrderStatus, PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/types";
import { sendDispatchNotification, sendCancellationNotification } from "@/lib/email";

export async function addProduct(formData: FormData) {
  const supabase = await createClient();

  // 1. Zero-Trust Auth: Verify user is logged in AND is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden: Admin access required." };

  // 2. Extract Form Data
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const priceString = formData.get("price") as string; // e.g., "25000"
  const stockString = formData.get("stock") as string;

  // Extract multiple files (with fallback to single 'image')
  const rawFiles = formData.getAll("images") as File[];
  const imageFiles = rawFiles.filter((f) => f && f.size > 0);
  if (imageFiles.length === 0) {
    const single = formData.get("image") as File;
    if (single && single.size > 0) imageFiles.push(single);
  }

  if (!name || !category || !priceString || imageFiles.length === 0) {
    return { error: "Missing required fields or at least one image." };
  }

  // Validate category against allowed list
  if (!PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
    return { error: `Invalid category selected: ${category}` };
  }

  // 3. Convert Naira to Kobo (Multiply by 100 with rounding to prevent float precision issues)
  const priceInKobo = Math.round(parseFloat(priceString) * 100);
  const stock = parseInt(stockString) || 0;

  // 4. Generate a unique Slug (e.g., "heavy-coat-1234")
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug || "piece"}-${Date.now().toString().slice(-4)}`;

  // 5. Upload all Images to Supabase Storage
  const publicUrls: string[] = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const fileExt = (file.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const fileName = `${Date.now()}-${i}-${slug}.${fileExt || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Failed to upload image ${i + 1}: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    publicUrls.push(publicUrl);
  }

  const primaryCover = publicUrls[0];

  // 6. Insert Product into Database with fail-safe backwards compatibility
  const insertPayload: Record<string, unknown> = {
    name,
    slug,
    category,
    description,
    price: priceInKobo,
    image_url: primaryCover,
    images: publicUrls,
    stock_quantity: stock,
    is_active: true,
    sku: `TWOM-${Date.now().toString().slice(-6)}`,
  };

  let { error: dbError } = await supabase
    .from("products")
    .insert(insertPayload);

  // If the user hasn't run the ALTER TABLE command yet in Supabase,
  // Postgres returns column "images" does not exist. We retry gracefully with image_url only.
  if (dbError && dbError.message.includes("images")) {
    delete insertPayload.images;
    const retry = await supabase.from("products").insert(insertPayload);
    dbError = retry.error;
  }

  if (dbError) return { error: "Database error: " + dbError.message };

  // 7. Tell Next.js to refresh the storefront cache immediately!
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);

  return { success: true };
}

// ── Courier tracking URL map (no API, just deep-linking) ──────────────────
const COURIER_TRACKING_URLS: Record<string, string | null> = {
  "GIG Logistics":    "https://giglogistics.com/track?waybill={waybill}",
  "DHL Nigeria":      "https://www.dhl.com/ng-en/home/tracking.html?tracking-id={waybill}",
  "Red Star Express": "https://www.redstarexpress.com/track/?waybill={waybill}",
  "Kwik":             null,
  "Other":            null,
};

// Helper: verify admin identity (zero-trust, re-used across actions)
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { supabase, user, error: "Forbidden: Admin access required." };
  return { supabase, user, error: null };
}

// ── 1. Acknowledge Order (PAID → PROCESSING) ───────────────────────────────
export async function acknowledgeOrder(orderId: string) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (order?.status !== "paid") {
    return { error: "Only PAID orders can be acknowledged." };
  }

  const { error: dbError } = await supabase
    .from("orders")
    .update({ status: "processing", processing_at: new Date().toISOString() })
    .eq("id", orderId);

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/orders");
  return { success: true };
}

// ── 2. Mark as Dispatched (PROCESSING → SHIPPED) ──────────────────────────
export async function dispatchOrder(orderId: string, formData: FormData) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  const courierName = (formData.get("courier_name") as string)?.trim();
  const trackingNumber = (formData.get("tracking_number") as string)?.trim();

  if (!courierName || !trackingNumber) {
    return { error: "Courier name and tracking number are required." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("status, customer_name, customer_email, id")
    .eq("id", orderId)
    .single();

  if (order?.status !== "processing") {
    return { error: "Only orders in PROCESSING state can be dispatched." };
  }

  // Build tracking URL from static courier config
  const urlPattern = COURIER_TRACKING_URLS[courierName] ?? null;
  const trackingUrl = urlPattern
    ? urlPattern.replace("{waybill}", encodeURIComponent(trackingNumber))
    : null;

  const { error: dbError } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      courier_name: courierName,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (dbError) return { error: dbError.message };

  // Fire dispatch email to customer (non-blocking)
  if (order.customer_email) {
    await sendDispatchNotification({
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      orderId: order.id,
      courierName,
      trackingNumber,
      trackingUrl,
    });
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

// ── 3. Mark as Delivered (SHIPPED → DELIVERED) ───────────────────────────
export async function markOrderDelivered(orderId: string) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (order?.status !== "shipped") {
    return { error: "Only SHIPPED orders can be marked as delivered." };
  }

  const { error: dbError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/orders");
  return { success: true };
}

// ── 4. Cancel Order + Restock + Paystack Refund (PAID/PROCESSING → CANCELLED) ─
export async function cancelAndRefundOrder(orderId: string) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_reference, total_amount, customer_name, customer_email, id")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };
  if (!["paid", "processing"].includes(order.status)) {
    return { error: "Only PAID or PROCESSING orders can be cancelled and refunded." };
  }

  // 1. Restock inventory: add back quantities for all items in the order
  const { error: restockError } = await supabase.rpc("restock_order_items", {
    order_id_param: orderId,
  });
  if (restockError) {
    console.error("[Cancel] Restock failed:", restockError);
    // Non-fatal — still proceed with status update
  }

  // 2. Initiate Paystack refund if payment reference exists
  let refundReference: string | null = null;
  if (order.payment_reference && process.env.PAYSTACK_SECRET_KEY) {
    try {
      const refundRes = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transaction: order.payment_reference }),
      });
      const refundData = await refundRes.json();
      if (refundData.status) {
        refundReference = refundData.data?.id?.toString() ?? null;
      } else {
        console.error("[Refund] Paystack refund failed:", refundData.message);
      }
    } catch (err) {
      console.error("[Refund] Network error calling Paystack:", err);
    }
  }

  // 3. Update order status
  const { error: dbError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      refunded_at: new Date().toISOString(),
      refund_reference: refundReference,
    })
    .eq("id", orderId);

  if (dbError) return { error: dbError.message };

  // 4. Send cancellation + refund email to customer
  await sendCancellationNotification({
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    orderId: order.id,
    totalAmount: order.total_amount,
  });

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function toggleProductActive(productId: string, currentStatus: boolean) {
  const supabase = await createClient();

  // 1. Verify Admin (Zero-Trust)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden: Admin access required." };

  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentStatus })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient();

  // 1. Verify Admin (Zero-Trust)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden: Admin access required." };

  // 2. Extract fields
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const priceString = formData.get("price") as string;
  const stockString = formData.get("stock") as string;
  const isActiveString = formData.get("is_active") as string;
  const is_active = isActiveString === "true" || isActiveString === "on";

  if (!name || !category || !priceString) {
    return { error: "Missing required fields (name, category, price)." };
  }

  if (!PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
    return { error: `Invalid category selected: ${category}` };
  }

  const priceInKobo = Math.round(parseFloat(priceString) * 100);
  const stock = parseInt(stockString) || 0;

  // 3. Handle optional image uploads
  const rawFiles = formData.getAll("images") as File[];
  const imageFiles = rawFiles.filter((f) => f && f.size > 0);

  const updatePayload: Record<string, unknown> = {
    name,
    category,
    description,
    price: priceInKobo,
    stock_quantity: stock,
    is_active,
  };

  if (imageFiles.length > 0) {
    const publicUrls: string[] = [];
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const fileName = `${Date.now()}-${i}-${baseSlug || "piece"}.${fileExt || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        return { error: `Failed to upload image ${i + 1}: ${uploadError.message}` };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      publicUrls.push(publicUrl);
    }

    updatePayload.image_url = publicUrls[0];
    updatePayload.images = publicUrls;
  }

  let { error: dbError } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId);

  if (dbError && dbError.message.includes("images")) {
    delete updatePayload.images;
    const retry = await supabase.from("products").update(updatePayload).eq("id", productId);
    dbError = retry.error;
  }

  if (dbError) return { error: "Database error: " + dbError.message };

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);

  return { success: true };
}
