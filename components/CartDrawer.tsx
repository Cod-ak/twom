"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useUIStore } from "@/lib/ui-store";
import { useCartStore } from "@/lib/store";
import { formatNaira } from "@/lib/utils";
import { useScrollLock } from "@/lib/scroll-lock";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const { isCartOpen, closeCart, openCart } = useUIStore();
  const {
    items,
    updateQuantity,
    removeItem,
    discount: appliedDiscount,
    applyDiscount,
    removeDiscount,
  } = useCartStore();

  // Discount code UI state
  const [isDiscountExpanded, setIsDiscountExpanded] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountFeedback, setDiscountFeedback] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // 1. Hydration fix for React 19 / Next.js 16 SSR
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 2. Keep component mounted during exit animation
  const [shouldRender, setShouldRender] = useState(isCartOpen);

  if (isCartOpen && !shouldRender) {
    setShouldRender(true);
  }

  // 3. Scroll lock when drawer is open
  useScrollLock("cart", isCartOpen);

  // 4. Auto-open cart if URL contains ?openCart=true or ?cart=open
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("openCart") === "true" || params.get("cart") === "open") {
        openCart();
        const url = new URL(window.location.href);
        url.searchParams.delete("openCart");
        url.searchParams.delete("cart");
        window.history.replaceState(
          {},
          "",
          url.pathname + (url.search ? url.search : ""),
        );
      }
    }
  }, [openCart]);

  // 5. Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // 6. GSAP animation refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 7. GSAP Animation Logic
  useGSAP(
    () => {
      if (!shouldRender) return;

      if (isCartOpen) {
        // Animate In — enable overlay pointer-events so tap-to-close works
        gsap.set(overlayRef.current, { pointerEvents: "auto" });
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.fromTo(
          panelRef.current,
          { xPercent: 100 },
          {
            xPercent: 0,
            duration: 0.35,
            ease: "power3.out",
          },
        );
      } else {
        // Animate Out — disable overlay immediately so it stops blocking touches
        gsap.set(overlayRef.current, { pointerEvents: "none" });
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
        });
        gsap.to(panelRef.current, {
          xPercent: 100,
          duration: 0.3,
          ease: "power3.in",
          onComplete: () => setShouldRender(false),
        });
      }
    },
    { dependencies: [isCartOpen, shouldRender] },
  );

  if (!mounted || !shouldRender) return null;

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const totalItemsCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const discountAmount = appliedDiscount
    ? appliedDiscount.discountType === "fixed" && appliedDiscount.discountValue
      ? Math.min(subtotal, appliedDiscount.discountValue)
      : Math.round(subtotal * (appliedDiscount.percent / 100))
    : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = discountInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingPromo(true);
    setDiscountError(null);
    setDiscountFeedback(null);

    try {
      const res = await fetch(
        `/api/promos/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setDiscountError(data.error || "Invalid promo code.");
        return;
      }

      applyDiscount(data.code, data.percent, {
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
      });

      const label =
        data.discountType === "percentage"
          ? `${data.discountValue}% discount applied!`
          : `${formatNaira(data.discountValue)} discount applied!`;
      setDiscountFeedback(label);
    } catch {
      setDiscountError("Could not validate promo code. Please check your network.");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountInput("");
    setDiscountFeedback(null);
    setDiscountError(null);
  };

  return (
    <div className="fixed inset-0 z-120">
      {/* Dark Blur Overlay */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        onTouchEnd={(e) => {
          e.preventDefault();
          closeCart();
        }}
        className="absolute inset-0 bg-black/50 opacity-0 backdrop-blur-xs transition-colors cursor-pointer pointer-events-none"
        aria-hidden="true"
      />

      {/* Sliding Drawer Panel */}
      <aside
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-full sm:w-110 md:w-115 bg-twom-bg shadow-2xl flex flex-col z-10 font-sans"
        aria-label="Shopping Cart Drawer"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-twom-border/50 bg-twom-bg">
          <div className="flex items-center gap-2">
            <h2 className="font-zodiak text-2xl font-bold text-twom-title">
              Your Bag
            </h2>
            {totalItemsCount > 0 && (
              <span className="text-xs uppercase tracking-widest text-twom-muted font-mono">
                ({totalItemsCount})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-200/60 transition-colors cursor-pointer touch-manipulation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-5 h-5 pointer-events-none"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-400 mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <p className="font-zodiak text-2xl text-twom-title mb-1.5 font-bold">
                Your bag is empty
              </p>
              <p className="text-xs text-twom-muted mb-6 max-w-xs leading-relaxed">
                Explore our curated essentials and add your favorite pieces.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="inline-block bg-black text-white px-7 py-3.5 rounded-2xl text-xs uppercase tracking-widest font-nippo hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Shop Collection →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-zinc-200/60 flex flex-col divide-y divide-zinc-100">
              {items.map((item) => {
                const isLogoPlaceholder =
                  !item.image_url ||
                  item.image_url.includes("TWOM.png") ||
                  item.image_url.includes("Twom.png");

                return (
                  <div
                    key={`${item.id}-${item.size || "default"}-${item.color || "default"}`}
                    className="flex items-center gap-4 py-3.5 first:pt-1 last:pb-1"
                  >
                    {/* Left: Squircle Image Container with soft tinted backdrop */}
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      onClick={closeCart}
                      className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#f0ede8] p-2 shrink-0 flex items-center justify-center overflow-hidden group shadow-2xs"
                    >
                      <Image
                        src={item.image_url || "/TWOM.png"}
                        alt={item.name}
                        fill
                        sizes="90px"
                        className={`transition-transform duration-500 group-hover:scale-105 ${
                          isLogoPlaceholder
                            ? "object-contain p-2"
                            : "object-cover object-center"
                        }`}
                      />
                    </Link>

                    {/* Right: Product Details & Horizontal Stepper */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <Link
                          href={`/products/${item.slug || item.id}`}
                          onClick={closeCart}
                          className="font-bold text-sm sm:text-base text-zinc-900 leading-snug line-clamp-1 hover:opacity-75 transition-opacity block"
                        >
                          {item.name}
                        </Link>

                        {/* Category / Brand Subtitle with size and color */}
                        <p className="text-xs font-medium text-[#4f7d82] mt-0.5">
                          {item.category || "TWOM Studio"}
                          {item.size ? ` • Size: ${item.size}` : ""}
                          {item.color ? ` • Color: ${item.color}` : ""}
                        </p>

                        {/* Price */}
                        <p className="text-sm sm:text-base font-bold text-zinc-900 mt-1">
                          {formatNaira(item.price)}
                        </p>
                      </div>

                      {/* Horizontal Capsule Stepper Pill */}
                      <div className="mt-2.5 inline-flex items-center bg-zinc-100/90 border border-zinc-200/70 rounded-full px-2.5 py-1 gap-3.5 w-fit shadow-2xs">
                        {/* Decrement / Minus Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(
                                item.id,
                                item.quantity - 1,
                                item.size,
                                item.color,
                              );
                            } else {
                              removeItem(item.id, item.size, item.color);
                            }
                          }}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-black transition-colors cursor-pointer text-base font-bold select-none active:scale-90"
                        >
                          −
                        </button>

                        {/* Quantity Number */}
                        <span className="text-xs font-bold text-zinc-900 min-w-3 text-center font-mono select-none">
                          {item.quantity}
                        </span>

                        {/* Increment / Plus Button (Circular Accent Button) */}
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1,
                              item.size,
                              item.color,
                            )
                          }
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-5 h-5 rounded-full bg-[#ffce27] text-black flex items-center justify-center font-black text-xs shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Controls */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-twom-border/50 bg-twom-bg flex flex-col gap-4">
            {/* Promo / Discount Code Pill */}
            <div className="rounded-2xl bg-white border border-zinc-200/80 p-3 shadow-2xs transition">
              <button
                type="button"
                onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
                className="w-full flex items-center justify-between text-left cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.386l5.228-3.072a2.25 2.25 0 00.912-1.39l.643-5.263a2.25 2.25 0 00-.659-1.591L12.75 3.659A2.25 2.25 0 0011.159 3H9.568z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 6h.008v.008H6V6z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-700">
                    {appliedDiscount
                      ? `Code applied: ${appliedDiscount.code} (-${appliedDiscount.percent}%)`
                      : "Do you have any discount code?"}
                  </span>
                </div>

                <span className="text-zinc-400 text-xs">
                  {isDiscountExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Expandable Discount Form */}
              {isDiscountExpanded && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-600 font-medium">
                        ✓ {discountFeedback || `Active: ${appliedDiscount.code}`}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form
                        onSubmit={handleApplyDiscount}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={discountInput}
                          onChange={(e) => {
                            setDiscountInput(e.target.value);
                            setDiscountError(null);
                          }}
                          placeholder="Enter promo code (e.g. TWOM30)"
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-black"
                        />
                        <button
                          type="submit"
                          disabled={isValidatingPromo || !discountInput.trim()}
                          className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                        >
                          {isValidatingPromo ? "..." : "Apply"}
                        </button>
                      </form>
                      {discountError && (
                        <p className="text-[11px] text-rose-600 mt-2 font-medium">
                          {discountError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price Calculations Matching Reference Card */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-600 font-medium">Sub total</span>
                <span className="text-zinc-900 font-bold">
                  {formatNaira(subtotal)}
                </span>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between items-center text-sm text-emerald-600">
                  <span className="font-medium">
                    Discount ({appliedDiscount.percent}%)
                  </span>
                  <span className="font-semibold">
                    -{formatNaira(discountAmount)}
                  </span>
                </div>
              )}

              {/* Dotted Line Divider Matching Reference */}
              <div className="border-b border-dotted border-zinc-300 my-2.5 w-full" />

              <div className="flex justify-between items-center">
                <span className="text-base font-extrabold text-zinc-900">
                  Total
                </span>
                <span className="text-xl font-extrabold text-zinc-900">
                  {formatNaira(finalTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full py-4 rounded-2xl bg-black text-white font-bold text-sm tracking-wide hover:bg-zinc-800 active:scale-[0.99] transition shadow-md flex items-center justify-center text-center mt-1"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
