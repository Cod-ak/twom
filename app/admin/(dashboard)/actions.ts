"use server";

import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type OrderStatus, PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/types";
import { sendDispatchNotification, sendCancellationNotification } from "@/lib/email";

export async function adminSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export interface BreakdownManifestItem {
  kind: "existing" | "new";
  tab_type: "apparel" | "accessories";
  sort_order: number;
  product_id?: string;
  client_key?: string;
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
  description?: string;
}

function buildProductSlug(name: string, extraSalt = ""): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const timeSalt = Date.now().toString().slice(-4);
  return `${baseSlug || "piece"}-${timeSalt}${extraSalt}`;
}

async function uploadProductImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imageFiles: File[],
  slugPrefix: string,
): Promise<{ publicUrls?: string[]; error?: string }> {
  const publicUrls: string[] = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const fileExt = (file.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const fileName = `${Date.now()}-${i}-${slugPrefix}.${fileExt || "jpg"}`;

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

  return { publicUrls };
}

async function insertProductRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
): Promise<{ id?: string; error?: string }> {
  const attemptPayload = { ...payload };
  let { data, error: dbError } = await supabase
    .from("products")
    .insert(attemptPayload)
    .select("id")
    .single();

  if (dbError && dbError.message.includes("images")) {
    delete attemptPayload.images;
    const retry = await supabase
      .from("products")
      .insert(attemptPayload)
      .select("id")
      .single();
    data = retry.data;
    dbError = retry.error;
  }

  if (dbError) return { error: "Database error: " + dbError.message };
  return { id: data?.id };
}

async function syncBannerBreakdownItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bannerProductId: string,
  formData: FormData,
  replaceExisting: boolean,
): Promise<{ error?: string }> {
  const manifestRaw = formData.get("breakdown_manifest") as string | null;
  if (manifestRaw === null) return {};

  let manifest: BreakdownManifestItem[] = [];
  try {
    manifest = JSON.parse(manifestRaw);
  } catch {
    return { error: "Invalid breakdown payload format." };
  }

  // Validate all inline new items before writing any child products
  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    if (entry.kind === "new") {
      const itemName = (entry.name || "").trim();
      const itemCategory = (entry.category || "").trim();
      const itemPrice = parseFloat(entry.price || "");
      const files = (
        formData.getAll(`item_images_${entry.client_key}`) as File[]
      ).filter((f) => f && f.size > 0);

      if (!itemName || !itemCategory || Number.isNaN(itemPrice) || itemPrice < 0) {
        return {
          error: `Breakdown item "${itemName || `#${i + 1}`}" is missing a valid name, category, or price.`,
        };
      }
      if (!PRODUCT_CATEGORIES.includes(itemCategory as ProductCategory)) {
        return { error: `Invalid category "${itemCategory}" on breakdown item "${itemName}".` };
      }
      if (files.length === 0) {
        return {
          error: `Please upload at least one image for breakdown item "${itemName}".`,
        };
      }
    }
  }

  const rowsToInsert: {
    banner_product_id: string;
    item_product_id: string;
    tab_type: "apparel" | "accessories";
    sort_order: number;
  }[] = [];
  const seenKeys = new Set<string>();

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    let resolvedItemId = entry.product_id || "";

    if (entry.kind === "new") {
      const itemName = (entry.name || "").trim();
      const itemCategory = (entry.category || "").trim();
      const itemDescription = (entry.description || "").trim();
      const priceInKobo = Math.round(parseFloat(entry.price || "0") * 100);
      const stock = parseInt(entry.stock || "0", 10) || 0;
      const slug = buildProductSlug(itemName, `-${i}`);
      const files = (
        formData.getAll(`item_images_${entry.client_key}`) as File[]
      ).filter((f) => f && f.size > 0);

      const uploadRes = await uploadProductImages(supabase, files, slug);
      if (uploadRes.error || !uploadRes.publicUrls?.length) {
        return { error: uploadRes.error || `Failed to upload photos for "${itemName}".` };
      }

      const insertRes = await insertProductRecord(supabase, {
        name: itemName,
        slug,
        category: itemCategory,
        description: itemDescription || null,
        price: priceInKobo,
        image_url: uploadRes.publicUrls[0],
        images: uploadRes.publicUrls,
        stock_quantity: stock,
        is_active: true,
        is_campaign_banner: false,
        is_featured: false,
        sku: `TWOM-${Date.now().toString().slice(-6)}-${i}`,
      });

      if (insertRes.error || !insertRes.id) {
        return { error: insertRes.error || `Failed to create "${itemName}".` };
      }
      resolvedItemId = insertRes.id;
    }

    if (resolvedItemId && resolvedItemId !== bannerProductId) {
      const dedupeKey = `${entry.tab_type}:${resolvedItemId}`;
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        rowsToInsert.push({
          banner_product_id: bannerProductId,
          item_product_id: resolvedItemId,
          tab_type: entry.tab_type,
          sort_order: entry.sort_order ?? i,
        });
      }
    }
  }

  if (replaceExisting) {
    const { error: deleteErr } = await supabase
      .from("campaign_banner_items")
      .delete()
      .eq("banner_product_id", bannerProductId);
    if (deleteErr) {
      return { error: `Failed to refresh banner breakdown items: ${deleteErr.message}` };
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: itemsErr } = await supabase
      .from("campaign_banner_items")
      .insert(rowsToInsert);
    if (itemsErr) {
      return { error: `Failed to link banner breakdown items: ${itemsErr.message}` };
    }
  }

  return {};
}

export async function addProduct(formData: FormData) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  // 2. Extract Form Data
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "";
  const priceString = formData.get("price") as string;
  const stockString = formData.get("stock") as string;
  const mode = (formData.get("mode") as string) === "banner" ? "banner" : "single";
  const isCampaignBanner = mode === "banner";
  const bannerTitle = isCampaignBanner
    ? ((formData.get("banner_title") as string)?.trim() || null)
    : null;
  const bannerOrder = isCampaignBanner
    ? parseInt((formData.get("banner_order") as string) || "0", 10) || 0
    : 0;
  // Single Pieces only may be pinned to the Top Featured Row
  const isFeatured =
    !isCampaignBanner && formData.get("is_featured") === "true";

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

  if (!PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
    return { error: `Invalid category selected: ${category}` };
  }

  // Validate breakdown items BEFORE uploading the main product so failed validation doesn't leave partial uploads
  if (isCampaignBanner) {
    const manifestRaw = formData.get("breakdown_manifest") as string | null;
    if (manifestRaw) {
      try {
        const manifest: BreakdownManifestItem[] = JSON.parse(manifestRaw);
        for (let i = 0; i < manifest.length; i++) {
          const entry = manifest[i];
          if (entry.kind === "new") {
            const itemName = (entry.name || "").trim();
            const itemCategory = (entry.category || "").trim();
            const itemPrice = parseFloat(entry.price || "");
            const files = (
              formData.getAll(`item_images_${entry.client_key}`) as File[]
            ).filter((f) => f && f.size > 0);
            if (!itemName || !itemCategory || Number.isNaN(itemPrice) || itemPrice < 0 || files.length === 0) {
              return {
                error: `Complete all required fields and upload at least 1 photo for "${itemName || `Breakdown item #${i + 1}`}".`,
              };
            }
          }
        }
      } catch {
        return { error: "Invalid breakdown payload format." };
      }
    }
  }

  const priceInKobo = Math.round(parseFloat(priceString) * 100);
  const stock = parseInt(stockString, 10) || 0;
  const slug = buildProductSlug(name);

  // 5. Upload all Images to Supabase Storage
  const uploadRes = await uploadProductImages(supabase, imageFiles, slug);
  if (uploadRes.error || !uploadRes.publicUrls?.length) {
    return { error: uploadRes.error || "Image upload failed." };
  }

  const publicUrls = uploadRes.publicUrls;
  const primaryCover = publicUrls[0];

  // 6. Insert Product into Database
  const insertRes = await insertProductRecord(supabase, {
    name,
    slug,
    category,
    description: description || null,
    price: priceInKobo,
    image_url: primaryCover,
    images: publicUrls,
    stock_quantity: stock,
    is_active: true,
    is_campaign_banner: isCampaignBanner,
    banner_title: bannerTitle,
    banner_order: bannerOrder,
    is_featured: isFeatured,
    sku: `TWOM-${Date.now().toString().slice(-6)}`,
  });

  if (insertRes.error || !insertRes.id) {
    return { error: insertRes.error || "Failed to save product." };
  }

  // 7. Create & link Campaign Banner breakdown pieces (Apparel & Accessories)
  if (isCampaignBanner) {
    const syncRes = await syncBannerBreakdownItems(
      supabase,
      insertRes.id,
      formData,
      false,
    );
    if (syncRes.error) {
      return { error: syncRes.error };
    }
  }

  // 8. Refresh storefront & admin caches
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/products");

  return { success: true, productId: insertRes.id, slug };
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

// ── 5. Status Updater (Direct State Change) ───────────────────────────────
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  const { error: dbError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function toggleProductActive(productId: string, currentStatus: boolean) {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentStatus })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductFeatured(productId: string, currentFeatured: boolean) {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError) return { error: authError };

  const { data: existing } = await supabase
    .from("products")
    .select("is_campaign_banner")
    .eq("id", productId)
    .single();

  if (existing?.is_campaign_banner) {
    return { error: "Only Single Pieces can be pinned to the Top Featured Row." };
  }

  const { error } = await supabase
    .from("products")
    .update({ is_featured: !currentFeatured })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError) return { error: authError };

  // 1. Fetch product to confirm it is archived and collect storage URLs
  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id, is_active, image_url, images")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Product not found." };
  }

  if (existing.is_active) {
    return { error: "Archive this piece first before permanently deleting it." };
  }

  // 2. Guard past order history (order_items references products without ON DELETE CASCADE)
  const { data: orderItems } = await supabaseAdmin
    .from("order_items")
    .select("id")
    .eq("product_id", productId)
    .limit(1);

  if (orderItems && orderItems.length > 0) {
    return {
      error:
        "This piece has existing customer orders and cannot be permanently deleted. Keep it Archived so order history stays intact.",
    };
  }

  // 3. Delete row (campaign_banner_items cascades automatically)
  const { error: dbError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (dbError) {
    if (dbError.code === "23503") {
      return {
        error:
          "This piece is referenced by existing customer orders and must stay Archived.",
      };
    }
    return { error: `Failed to delete product: ${dbError.message}` };
  }

  // 4. Best-effort cleanup of uploaded product-images storage objects
  const BUCKET_MARKER = "/storage/v1/object/public/product-images/";
  const allUrls = new Set<string>([
    ...(Array.isArray(existing.images) ? existing.images : []),
    ...(existing.image_url ? [existing.image_url] : []),
  ]);
  const storagePaths: string[] = [];
  for (const url of allUrls) {
    const idx = url.indexOf(BUCKET_MARKER);
    if (idx !== -1) {
      const path = decodeURIComponent(url.slice(idx + BUCKET_MARKER.length));
      if (path) storagePaths.push(path);
    }
  }
  if (storagePaths.length > 0) {
    await supabaseAdmin.storage.from("product-images").remove(storagePaths);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError) return { error: authError };

  // 2. Extract fields
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "";
  const priceString = formData.get("price") as string;
  const stockString = formData.get("stock") as string;
  const isActiveString = formData.get("is_active") as string;
  const is_active = isActiveString === "true" || isActiveString === "on";
  const mode = (formData.get("mode") as string) === "banner" ? "banner" : "single";
  const is_campaign_banner = mode === "banner";
  const banner_title = is_campaign_banner
    ? ((formData.get("banner_title") as string)?.trim() || null)
    : null;
  const banner_order = is_campaign_banner
    ? parseInt((formData.get("banner_order") as string) || "0", 10) || 0
    : 0;
  // Single Pieces only may be pinned to the Top Featured Row
  const is_featured = !is_campaign_banner && formData.get("is_featured") === "true";

  if (!name || !category || !priceString) {
    return { error: "Missing required fields (name, category, price)." };
  }

  if (!PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
    return { error: `Invalid category selected: ${category}` };
  }

  // Validate breakdown items before touching DB or storage
  if (is_campaign_banner) {
    const manifestRaw = formData.get("breakdown_manifest") as string | null;
    if (manifestRaw) {
      try {
        const manifest: BreakdownManifestItem[] = JSON.parse(manifestRaw);
        for (let i = 0; i < manifest.length; i++) {
          const entry = manifest[i];
          if (entry.kind === "new") {
            const itemName = (entry.name || "").trim();
            const itemCategory = (entry.category || "").trim();
            const itemPrice = parseFloat(entry.price || "");
            const files = (
              formData.getAll(`item_images_${entry.client_key}`) as File[]
            ).filter((f) => f && f.size > 0);
            if (!itemName || !itemCategory || Number.isNaN(itemPrice) || itemPrice < 0 || files.length === 0) {
              return {
                error: `Complete all required fields and upload at least 1 photo for "${itemName || `Breakdown item #${i + 1}`}".`,
              };
            }
          }
        }
      } catch {
        return { error: "Invalid breakdown payload format." };
      }
    }
  }

  const priceInKobo = Math.round(parseFloat(priceString) * 100);
  const stock = parseInt(stockString, 10) || 0;

  // 3. Handle optional replacement image uploads
  const rawFiles = formData.getAll("images") as File[];
  const imageFiles = rawFiles.filter((f) => f && f.size > 0);

  const updatePayload: Record<string, unknown> = {
    name,
    category,
    description: description || null,
    price: priceInKobo,
    stock_quantity: stock,
    is_active,
    is_campaign_banner,
    banner_title,
    banner_order,
    is_featured,
  };

  if (imageFiles.length > 0) {
    const uploadRes = await uploadProductImages(
      supabase,
      imageFiles,
      buildProductSlug(name),
    );
    if (uploadRes.error || !uploadRes.publicUrls?.length) {
      return { error: uploadRes.error || "Image upload failed." };
    }

    updatePayload.image_url = uploadRes.publicUrls[0];
    updatePayload.images = uploadRes.publicUrls;
  }

  const attemptPayload = { ...updatePayload };
  let { error: dbError } = await supabase
    .from("products")
    .update(attemptPayload)
    .eq("id", productId);

  if (dbError && dbError.message.includes("images")) {
    delete attemptPayload.images;
    const retry = await supabase.from("products").update(attemptPayload).eq("id", productId);
    dbError = retry.error;
  }

  if (dbError) return { error: "Database error: " + dbError.message };

  if (is_campaign_banner) {
    const syncRes = await syncBannerBreakdownItems(
      supabase,
      productId,
      formData,
      true,
    );
    if (syncRes.error) return { error: syncRes.error };
  } else {
    // Switched back to Single Piece: clear any prior banner item associations cleanly
    await supabase
      .from("campaign_banner_items")
      .delete()
      .eq("banner_product_id", productId);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);

  return { success: true };
}

// ── 5. Hero Section CMS Manager ──────────────────────────────────────────
export async function updateHeroSection(formData: FormData) {
  const { supabase, error } = await verifyAdmin();
  if (error) return { error };

  const headline = (formData.get("headline") as string)?.trim();
  const subheadline = (formData.get("subheadline") as string)?.trim() || null;
  const button_text = (formData.get("button_text") as string)?.trim() || "Explore styles";
  // Locked permanently to /products per admin design requirements
  const button_link = "/products";
  let video_url = (formData.get("video_url") as string)?.trim() || "";
  let poster_url = (formData.get("poster_url") as string)?.trim() || "";

  if (!headline) {
    return { error: "Hero headline is required." };
  }

  // Handle optional video upload
  const videoFile = formData.get("video_file") as File | null;
  if (videoFile && videoFile.size > 0) {
    const fileExt = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
    const fileName = `hero-video-${Date.now()}.${fileExt}`;
    
    // Try hero-videos bucket, fallback to product-images
    let uploadBucket = "hero-videos";
    let { error: uploadError } = await supabase.storage
      .from(uploadBucket)
      .upload(fileName, videoFile, {
        contentType: videoFile.type || "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      uploadBucket = "product-images";
      const retry = await supabase.storage
        .from(uploadBucket)
        .upload(fileName, videoFile, {
          contentType: videoFile.type || "video/mp4",
          upsert: true,
        });
      uploadError = retry.error;
    }

    if (uploadError) {
      return { error: `Failed to upload video: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(uploadBucket).getPublicUrl(fileName);
    video_url = publicUrl;
  }

  // Handle optional poster image upload
  const posterFile = formData.get("poster_file") as File | null;
  if (posterFile && posterFile.size > 0) {
    const fileExt = (posterFile.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `hero-poster-${Date.now()}.${fileExt}`;

    let uploadBucket = "hero-posters";
    let { error: uploadError } = await supabase.storage
      .from(uploadBucket)
      .upload(fileName, posterFile, {
        contentType: posterFile.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      uploadBucket = "product-images";
      const retry = await supabase.storage
        .from(uploadBucket)
        .upload(fileName, posterFile, {
          contentType: posterFile.type || "image/jpeg",
          upsert: true,
        });
      uploadError = retry.error;
    }

    if (uploadError) {
      return { error: `Failed to upload poster image: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(uploadBucket).getPublicUrl(fileName);
    poster_url = publicUrl;
  }

  if (!video_url) {
    return { error: "A video URL or uploaded video file is required." };
  }

  // Check if an active hero section exists
  const { data: existingHero } = await supabase
    .from("hero_sections")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  if (existingHero) {
    const { error: dbError } = await supabase
      .from("hero_sections")
      .update({
        headline,
        subheadline,
        button_text,
        button_link,
        video_url,
        poster_url: poster_url || video_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingHero.id);

    if (dbError) return { error: dbError.message };
  } else {
    const { error: dbError } = await supabase
      .from("hero_sections")
      .insert({
        headline,
        subheadline,
        button_text,
        button_link,
        video_url,
        poster_url: poster_url || video_url,
        is_active: true,
      });

    if (dbError) return { error: dbError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { success: true };
}

// ── Promo Code Management ─────────────────────────────────────────────────

export async function createPromoCode(formData: FormData) {
  const { error } = await verifyAdmin();
  if (error) return { error };

  const rawCode = formData.get("code") as string;
  const code = rawCode?.trim().toUpperCase();
  const discountType = (formData.get("discount_type") as string) || "percentage";
  const rawValue = Number(formData.get("discount_value")) || 0;
  const rawMinOrder = Number(formData.get("min_order_amount")) || 0;
  const rawMaxUses = formData.get("max_uses") ? Number(formData.get("max_uses")) : null;
  const rawExpiresAt = (formData.get("expires_at") as string) || null;
  const scope = (formData.get("scope") as string) || "all";

  if (!code || code.length < 2) {
    return { error: "Promo code must be at least 2 characters." };
  }

  if (discountType === "percentage" && (rawValue <= 0 || rawValue > 100)) {
    return { error: "Percentage discount must be between 1% and 100%." };
  }

  if (discountType === "fixed" && rawValue <= 0) {
    return { error: "Fixed discount amount must be greater than ₦0." };
  }

  // If fixed, convert Naira input to Kobo (* 100); if percentage, store raw percentage
  const discountValue = discountType === "fixed" ? Math.round(rawValue * 100) : rawValue;
  // Convert minimum order amount in Naira to Kobo (* 100)
  const minOrderAmount = Math.max(0, Math.round(rawMinOrder * 100));

  const insertPayload = {
    code,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: minOrderAmount,
    max_uses: rawMaxUses && rawMaxUses > 0 ? rawMaxUses : null,
    used_count: 0,
    scope: scope as "all" | "category" | "product",
    expires_at: rawExpiresAt ? new Date(rawExpiresAt).toISOString() : null,
    is_active: true,
  };

  const { error: dbError } = await supabaseAdmin
    .from("promo_codes")
    .insert(insertPayload);

  if (dbError) {
    if (dbError.code === "23505" || dbError.message.includes("unique")) {
      return { error: `Promo code "${code}" already exists.` };
    }
    return { error: "Failed to create promo code: " + dbError.message };
  }

  revalidatePath("/admin/promos");
  return { success: true };
}

export async function togglePromoActive(promoId: string, currentStatus: boolean) {
  const { error } = await verifyAdmin();
  if (error) return { error };

  const { error: dbError } = await supabaseAdmin
    .from("promo_codes")
    .update({ is_active: !currentStatus })
    .eq("id", promoId);

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/promos");
  return { success: true };
}

export async function deletePromoCode(promoId: string) {
  const { error } = await verifyAdmin();
  if (error) return { error };

  const { error: dbError } = await supabaseAdmin
    .from("promo_codes")
    .delete()
    .eq("id", promoId);

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/promos");
  return { success: true };
}
