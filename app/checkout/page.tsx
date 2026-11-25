"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useUIStore } from "@/lib/ui-store";
import { formatNaira } from "@/lib/utils";
import { trackBeginCheckout } from "@/lib/analytics";

const emptySubscribe = () => () => {};

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { items, discount, removeItem, clearCart, applyDiscount, removeDiscount } = useCartStore();
  const openCart = useUIStore((state) => state.openCart);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invalidIssues, setInvalidIssues] = useState<Record<string, string>>({});

  // Promo code entry on checkout
  const [checkoutPromoInput, setCheckoutPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  });

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const discountAmount = discount
    ? discount.discountType === "fixed" && discount.discountValue
      ? Math.min(subtotal, discount.discountValue)
      : Math.round(subtotal * (discount.percent / 100))
    : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    if (mounted && items.length > 0) {
      trackBeginCheckout(items, finalTotal);
    }
  }, [mounted]);

  const handleApplyCheckoutPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = checkoutPromoInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const res = await fetch(
        `/api/promos/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }

      applyDiscount(data.code, data.percent, {
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
      });

      setCheckoutPromoInput("");
    } catch {
      setPromoError("Could not validate promo code. Please check your network.");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const hasInvalidItems = Object.keys(invalidIssues).length > 0;

  const handleRemoveItem = (id: string, size?: string) => {
    removeItem(id, size);
    setInvalidIssues((prev) => {
      const next = { ...prev };
      delete next[id];
      if (Object.keys(next).length === 0) {
        setErrorMessage(null);
      }
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-twom-bg flex items-center justify-center">
        <p className="text-twom-muted text-sm tracking-wider uppercase">
          Loading checkout...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-twom-bg pt-36 pb-24 px-5 flex flex-col items-center justify-center text-center">
        <h1 className="font-zodiak text-3xl text-twom-title mb-4">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-twom-muted text-sm mb-8 max-w-md">
          Explore our seasonal pieces and add your desired items before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="text-xs uppercase tracking-[0.2em] bg-twom-title text-white px-8 py-4 font-nippo hover:bg-black transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: formData,
          cart: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          discountCode: discount?.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Collect specific issues into a lookup map: id -> reason
        if (data.cartIssues && Array.isArray(data.cartIssues)) {
          const issueMap: Record<string, string> = {};
          for (const issue of data.cartIssues as Array<{
            id: string;
            name: string;
            reason: string;
          }>) {
            issueMap[issue.id] =
              issue.reason === "out_of_stock"
                ? "Out of stock"
                : issue.reason.startsWith("only_")
                ? "Insufficient stock"
                : "No longer available";
          }
          setInvalidIssues(issueMap);
        }
        throw new Error(
          data.error || "Unable to proceed with checkout. Please review your order."
        );
      }

      // If Paystack checkout URL is returned, redirect customer to Paystack
      // Note: We intentionally do NOT clear the cart here so that if the user
      // cancels payment on Paystack, their cart remains intact.
      // The cart is cleared upon confirmed acquisition in /checkout/success via <ClearCartOnMount />.
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }

      // Fallback for mock mode or direct redirects
      if (data.redirectUrl) {
        clearCart();
        router.push(data.redirectUrl);
        return;
      }

      throw new Error("Invalid response received from checkout service.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4">
      <div className="w-full">
        <div className="mb-8 pb-5 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => openCart()}
            className="text-xs uppercase tracking-wider text-twom-muted hover:text-twom-title transition-colors cursor-pointer"
          >
            ← Back to Bag
          </button>
          <h1 className="font-zodiak text-3xl text-twom-title mt-2">
            Secure Checkout
          </h1>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col gap-3">
            <div>
              <p className="font-medium">Order Update Required</p>
              <p className="text-xs mt-1 text-rose-600">{errorMessage}</p>
            </div>
            {hasInvalidItems && (
              <span className="text-[11px] uppercase tracking-wider font-mono text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xs shrink-0 self-start">
                Action required in Order Summary →
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* Customer Form */}
          <div className="w-full">
            <h2 className="font-mono text-xs uppercase tracking-widest text-twom-muted mb-6">
              1. Delivery & Contact Details
            </h2>

            <form onSubmit={handleCheckout} className="flex flex-col gap-5">
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-xs uppercase tracking-wider text-twom-muted mb-2"
                >
                  Full Name *
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  placeholder="e.g. Kelly Akpeme"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-3.5 border border-zinc-300 bg-white text-twom-title focus:outline-none focus:border-twom-title transition-colors text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-email"
                  className="block text-xs uppercase tracking-wider text-twom-muted mb-2"
                >
                  Email Address *
                </label>
                <input
                  id="customer-email"
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3.5 border border-zinc-300 bg-white text-twom-title focus:outline-none focus:border-twom-title transition-colors text-sm"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Order receipts and tracking information will be sent here.
                </span>
              </div>

              <div>
                <label
                  htmlFor="customer-address"
                  className="block text-xs uppercase tracking-wider text-twom-muted mb-2"
                >
                  Shipping Address *
                </label>
                <textarea
                  id="customer-address"
                  required
                  rows={4}
                  placeholder="Apartment, suite, street address, city, state"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full p-3.5 border border-zinc-300 bg-white text-twom-title focus:outline-none focus:border-twom-title transition-colors text-sm"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isProcessing || hasInvalidItems}
                  className="w-full bg-twom-title text-white py-4 text-xs uppercase tracking-[0.2em] font-nippo hover:bg-black transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? "Connecting to Payment Gateway..."
                    : hasInvalidItems
                    ? "Remove unavailable piece(s) to continue"
                    : `Pay ${formatNaira(finalTotal)} with Paystack`}
                </button>
                <p className="text-[11px] text-zinc-400 text-center mt-3">
                  Secured by 256-bit SSL encryption via Paystack.
                </p>
              </div>
            </form>
          </div>

          {/* Order Summary with In-Place Resolution */}
          <div className="w-full">
            <div className="bg-white border border-zinc-200 p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-twom-muted">
                  2. Order Summary ({items.length} {items.length === 1 ? "Piece" : "Pieces"})
                </h2>
                {hasInvalidItems && (
                  <span className="text-[10px] uppercase font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 border border-rose-200">
                    Needs Attention
                  </span>
                )}
              </div>

              <div
                data-lenis-prevent
                className="flex flex-col gap-3 max-h-96 overflow-y-auto overscroll-contain pr-1 border-b border-zinc-100 pb-6 mb-6"
              >
                {items.map((item) => {
                  const issueReason = invalidIssues[item.id];

                  return (
                    <div
                      key={`${item.id}-${item.size || "default"}-${item.color || "default"}`}
                      className={`shrink-0 flex gap-4 items-center transition-all p-3 rounded-3xl shadow-xs border ${
                        issueReason
                          ? "bg-rose-50/70 border-rose-300"
                          : "bg-white border-zinc-200/80"
                      }`}
                    >
                      <div className="relative w-16 h-20 bg-zinc-100 shrink-0 border border-zinc-200 overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className={`object-cover ${issueReason ? "opacity-40" : ""}`}
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">
                            TWOM
                          </div>
                        )}
                        {issueReason && (
                          <div className="absolute inset-0 bg-rose-900/10 flex items-center justify-center">
                            <span className="text-[8px] uppercase tracking-wider font-bold text-rose-700 bg-white/90 px-1 py-0.5">
                              Out
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grow min-w-0">
                        <p
                          className={`font-medium text-xs truncate ${
                            issueReason
                              ? "text-rose-700 line-through decoration-rose-400"
                              : "text-twom-title"
                          }`}
                        >
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-twom-muted">
                            Qty: {item.quantity}
                          </p>
                          {item.size && (
                            <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-xs">
                              {item.size}
                            </span>
                          )}
                        </div>
                        {issueReason && (
                          <span className="text-[11px] text-rose-600 font-medium block mt-0.5">
                            {issueReason}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <p
                          className={`text-xs font-medium ${
                            issueReason
                              ? "text-rose-400 line-through"
                              : "text-twom-title"
                          }`}
                        >
                          {formatNaira(item.price * item.quantity)}
                        </p>

                        {issueReason && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id, item.size)}
                            className="text-[10px] uppercase tracking-wider text-rose-700 hover:text-white hover:bg-rose-700 border border-rose-300 px-2 py-0.5 transition-colors cursor-pointer font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Box */}
              <div className="border-b border-zinc-100 pb-5 mb-5">
                {discount ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-800 block">
                        Promo Applied
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-950">
                        {discount.code} ({discount.percent}% off)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDiscount()}
                      className="text-xs text-rose-600 hover:text-rose-800 font-mono font-bold cursor-pointer"
                    >
                      Remove ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleApplyCheckoutPromo} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (e.g. TWOM30)"
                        value={checkoutPromoInput}
                        onChange={(e) => {
                          setCheckoutPromoInput(e.target.value.toUpperCase());
                          setPromoError(null);
                        }}
                        className="flex-1 p-2.5 text-xs font-mono uppercase border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingPromo || !checkoutPromoInput.trim()}
                        className="bg-black text-white px-4 py-2.5 rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isValidatingPromo ? "..." : "Apply"}
                      </button>
                    </form>
                    {promoError && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1.5">
                        {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between text-twom-muted">
                  <span>Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discount.percent}%)</span>
                    <span>-{formatNaira(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-twom-muted">
                  <span>Standard Shipping</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Complimentary
                  </span>
                </div>
                <div className="border-t border-zinc-200 pt-4 mt-2 flex justify-between items-center text-sm font-medium text-twom-title">
                  <span>Total Amount</span>
                  <span className="font-zodiak text-2xl">
                    {formatNaira(finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
