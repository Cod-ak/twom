import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formatNaira } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codeParam = searchParams.get("code")?.trim().toUpperCase();
    const subtotalParam = Number(searchParams.get("subtotal")) || 0;

    if (!codeParam) {
      return NextResponse.json(
        { valid: false, error: "Please enter a promo code." },
        { status: 400 }
      );
    }

    // 1. Fetch promo from Supabase using admin client (bypasses RLS safely)
    const { data: promo, error } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .ilike("code", codeParam)
      .maybeSingle();

    if (error || !promo) {
      return NextResponse.json(
        { valid: false, error: `Promo code "${codeParam}" is invalid.` },
        { status: 404 }
      );
    }

    // 2. Validate active status
    if (!promo.is_active) {
      return NextResponse.json(
        { valid: false, error: "This promo code is currently disabled." },
        { status: 400 }
      );
    }

    // 3. Validate expiration
    if (promo.expires_at) {
      const expiry = new Date(promo.expires_at).getTime();
      if (!Number.isNaN(expiry) && expiry < Date.now()) {
        return NextResponse.json(
          { valid: false, error: "This promo code has expired." },
          { status: 400 }
        );
      }
    }

    // 4. Validate usage limits
    if (
      typeof promo.max_uses === "number" &&
      promo.max_uses > 0 &&
      promo.used_count >= promo.max_uses
    ) {
      return NextResponse.json(
        {
          valid: false,
          error: "This promo code has reached its redemption limit.",
        },
        { status: 400 }
      );
    }

    // 5. Validate minimum cart amount
    const minOrder = promo.min_order_amount || 0;
    if (minOrder > 0 && subtotalParam < minOrder) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order amount of ${formatNaira(minOrder)} is required for this code.`,
        },
        { status: 400 }
      );
    }

    // 6. Calculate verified discount amount in Kobo
    let discountAmount = 0;
    let percentEquivalent = 0;

    if (promo.discount_type === "percentage") {
      percentEquivalent = promo.discount_value;
      discountAmount = Math.round(subtotalParam * (promo.discount_value / 100));
    } else {
      discountAmount = Math.min(subtotalParam, promo.discount_value);
      percentEquivalent =
        subtotalParam > 0
          ? Math.round((discountAmount / subtotalParam) * 100)
          : 0;
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      percent: percentEquivalent,
      discountAmount,
      minOrderAmount: minOrder,
      scope: promo.scope || "all",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Validation error occurred";
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
