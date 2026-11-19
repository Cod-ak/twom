"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { type OrderStatus, PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/types";

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

const ALLOWED_STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "cancelled", "failed"];

export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!ALLOWED_STATUSES.includes(newStatus as OrderStatus)) {
    return { error: `Invalid order status: ${newStatus}` };
  }

  const supabase = await createClient();

  // 1. Verify Admin (Zero-Trust)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden: Admin access required." };

  // 2. Perform the update
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  return { success: true };
}
