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
import { usePathname } from "next/navigation";

const TICKET_HOLES = Array.from({ length: 16 });
const TOP_SCALLOP_BG =
  "radial-gradient(circle at 10px 0px, transparent 6px, #ffce27 6.5px)";
const BOTTOM_SCALLOP_BG =
  "radial-gradient(circle at 10px 12px, transparent 6px, #ffce27 6.5px)";

export default function CartDrawer() {
  const pathname = usePathname();
  const isLockedMobile = !pathname?.startsWith("/admin");
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
    <div
      className={
        isLockedMobile
          ? "fixed inset-y-0 inset-x-0 mx-auto max-w-[430px] z-120 overflow-hidden"
          : "fixed inset-0 z-120"
      }
    >
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
        data-lenis-prevent
        className={
          isLockedMobile
            ? "absolute top-0 right-0 h-full w-full bg-twom-bg p-2.5 shadow-2xl flex flex-col z-10 font-sans"
            : "absolute top-0 right-0 h-full w-full sm:w-110 md:w-115 bg-twom-bg p-2.5 sm:p-3 shadow-2xl flex flex-col z-10 font-sans"
        }
        aria-label="Shopping Cart Drawer"
      >
        {/* Perforated Yellow Ticket Shell */}
        <div className="flex-1 min-h-0 flex flex-col drop-shadow-[0_10px_24px_rgba(16,24,40,0.12)]">
          {/* Top Scalloped Ripples */}
          <div
            aria-hidden="true"
            className="shrink-0 h-3 w-full -mb-px"
            style={{
              backgroundImage: TOP_SCALLOP_BG,
              backgroundSize: "20px 12px",
              backgroundRepeat: "repeat-x",
            }}
          />

          {/* Upper Ticket Body (Header + Scrollable Item Pills) */}
          <div
            className={`flex-1 min-h-0 bg-[#ffce27] flex flex-col px-2 pt-0.5 ${
              items.length === 0 ? "pb-0.5" : ""
            }`}
          >
            <div
              className={`flex-1 min-h-0 flex flex-col border-x-2 border-t-2 border-dashed border-[#111111]/25 ${
                items.length === 0
                  ? "border-b-2 rounded-xl"
                  : "rounded-t-xl"
              }`}
            >
              {/* Drawer Header */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-[#111111]/12">
                <div className="flex items-center gap-2">
                  <h2 className="font-zodiak text-2xl font-bold text-[#111111]">
                    Your Bag
                  </h2>
                  {totalItemsCount > 0 && (
                    <span className="text-xs uppercase tracking-widest text-[#111111]/75 font-mono">
                      ({totalItemsCount})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Close cart drawer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#111111]/80 hover:text-black hover:bg-black/10 transition-colors cursor-pointer touch-manipulation"
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
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3.5 flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="min-h-full flex flex-col items-center justify-center text-center py-20 px-4">
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-xs border border-black/8 flex items-center justify-center text-[#111111]/60 mb-5">
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
                    <p className="font-zodiak text-2xl text-[#111111] mb-1.5 font-bold">
                      Your bag is empty
                    </p>
                    <p className="text-xs text-[#111111]/75 mb-6 max-w-xs leading-relaxed">
                      Explore our curated essentials and add your favorite pieces.
                    </p>
                    <Link
                      href="/products"
                      onClick={closeCart}
                      className="inline-block bg-[#111111] text-white px-7 py-3.5 rounded-2xl text-xs uppercase tracking-widest font-nippo hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      Shop Collection →
                    </Link>
                  </div>
                ) : (
                  items.map((item) => {
                    const isLogoPlaceholder =
                      !item.image_url ||
                      item.image_url.includes("TWOM.png") ||
                      item.image_url.includes("Twom.png");

                    return (
                      <div
                        key={`${item.id}-${item.size || "default"}-${item.color || "default"}`}
                        className="shrink-0 bg-white rounded-3xl p-3.5 shadow-xs border border-black/8 flex items-center gap-4"
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
                  })
                )}
              </div>
            </div>
          </div>

          {/* Middle Tear Cutout Seam (Notches + Punched Holes between items & coupon) */}
          {items.length > 0 && (
            <div
              aria-hidden="true"
              className="relative shrink-0 h-7 w-full bg-[#ffce27] flex items-center px-6"
            >
              <span className="absolute -left-px top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-r-full bg-twom-bg" />
              <div className="w-full flex items-center justify-between gap-1.5">
                {TICKET_HOLES.map((_, idx) => (
                  <span
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full bg-twom-bg shadow-[inset_0_1px_1px_rgba(0,0,0,0.14)] shrink-0"
                  />
                ))}
              </div>
              <span className="absolute -right-px top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-l-full bg-twom-bg" />
            </div>
          )}

          {/* Bottom Ticket Stub (Promo Code, Totals & Checkout) */}
          {items.length > 0 && (
            <div className="shrink-0 max-h-[52dvh] overflow-y-auto overscroll-contain bg-[#ffce27] px-2 pb-0.5">
              <div className="px-3.5 py-3.5 flex flex-col gap-3.5 border-x-2 border-b-2 border-dashed border-[#111111]/25 rounded-b-xl">
                {/* Promo / Discount Code Pill */}
                <div className="rounded-2xl bg-white border border-black/10 p-3 shadow-2xs transition">
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
                          <span className="text-xs text-emerald-700 font-medium">
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

                {/* Price Calculations Printed on Ticket Stub */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#111111]/80 font-medium">Sub total</span>
                    <span className="text-[#111111] font-bold">
                      {formatNaira(subtotal)}
                    </span>
                  </div>

                  {appliedDiscount && (
                    <div className="flex justify-between items-center text-sm text-emerald-950 font-semibold">
                      <span>Discount ({appliedDiscount.percent}%)</span>
                      <span>-{formatNaira(discountAmount)}</span>
                    </div>
                  )}

                  {/* Dotted Line Divider Matching Ticket Stub */}
                  <div className="border-b border-dotted border-[#111111]/30 my-2 w-full" />

                  <div className="flex justify-between items-center">
                    <span className="text-base font-extrabold text-[#111111]">
                      Total
                    </span>
                    <span className="text-xl font-extrabold text-[#111111]">
                      {formatNaira(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3.5 rounded-2xl bg-[#111111] text-white font-bold text-sm tracking-wide hover:bg-zinc-800 active:scale-[0.99] transition shadow-md flex items-center justify-center text-center mt-0.5"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}

          {/* Bottom Scalloped Ripples */}
          <div
            aria-hidden="true"
            className="shrink-0 h-3 w-full -mt-px"
            style={{
              backgroundImage: BOTTOM_SCALLOP_BG,
              backgroundSize: "20px 12px",
              backgroundRepeat: "repeat-x",
            }}
          />
        </div>
      </aside>
    </div>
  );
}
