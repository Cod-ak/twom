import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "Shipping, Logistics & Returns — TWOM Atelier",
  description:
    "Fulfillment timelines, delivery networks across Lagos and Nigeria, 7-day return terms, and live waybill tracking.",
  openGraph: {
    title: "Shipping & Returns — TWOM Atelier",
    description:
      "Complimentary domestic dispatch, live waybill tracking via DHL and GIG Logistics, and 7-day exchange terms.",
  },
};

export default function ShippingPage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-17 pb-16 px-4 text-twom-body font-sans">
      <div className="w-full space-y-10">
        {/* Header */}
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Client Services &bull; Logistics
          </span>
          <h1 className="font-zodiak text-4xl text-twom-title leading-tight mb-4">
            Shipping & Returns
          </h1>
          <p className="text-sm text-twom-muted leading-relaxed">
            Every TWOM piece is hand-inspected in our atelier, enclosed in
            signature protective packaging, and dispatched through verified
            secure logistics networks.
          </p>
        </div>

        {/* Fulfillment Timelines Grid */}
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-white p-6 border border-zinc-200/90 rounded-2xl shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              Metropolis Express
            </span>
            <h3 className="font-zodiak text-2xl text-twom-title">Lagos</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              <strong>1 – 2 Business Days.</strong> Same-day or next-day private
              courier dispatch with direct call notification prior to arrival.
            </p>
            <span className="inline-block text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">
              Standard: ₦3,500
            </span>
          </div>

          <div className="bg-white p-6 border border-zinc-200/90 rounded-2xl shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              Interstate Nigeria
            </span>
            <h3 className="font-zodiak text-2xl text-twom-title">Nationwide</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              <strong>2 – 4 Business Days.</strong> Dispatched via DHL Nigeria
              or GIG Logistics with live door-to-door tracking sent to your
              email.
            </p>
            <span className="inline-block text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">
              Standard: ₦6,500
            </span>
          </div>

          <div className="bg-white p-6 border border-zinc-200/90 rounded-2xl shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              International
            </span>
            <h3 className="font-zodiak text-2xl text-twom-title">
              Global Express
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              <strong>3 – 7 Business Days.</strong> Handled worldwide through
              DHL Express International with priority customs facilitation.
            </p>
            <span className="inline-block text-[11px] font-mono text-zinc-700 font-bold bg-zinc-100 px-2 py-0.5 rounded-sm">
              Calculated at checkout
            </span>
          </div>
        </div>

        {/* Live Tracking & Courier Transparency */}
        <div className="p-6 bg-white border border-zinc-200/90 rounded-2xl shadow-xs space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 block">
            Digital Waybills & Tracking
          </span>
          <h2 className="font-zodiak text-2xl text-twom-title">
            Complete Visibility from Atelier to Doorstep
          </h2>
          <p className="text-xs text-twom-muted leading-relaxed">
            The moment your piece is prepared, an official digital waybill is
            assigned. You will receive an automated dispatch notification
            containing your tracking number and a one-click tracking URL linking
            directly to the courier&apos;s real-time portal.
          </p>
        </div>

        {/* Returns & Exchange Terms */}
        <div className="p-6 bg-white border border-zinc-200/90 rounded-2xl shadow-xs space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 block mb-1">
              Client Guarantee
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title">
              7-Day Returns & Exchanges
            </h2>
          </div>

          <div className="space-y-4 text-xs text-zinc-600 leading-relaxed divide-y divide-zinc-100">
            <div className="pt-3">
              <strong className="text-black font-semibold block mb-1">
                1. Eligibility Window
              </strong>
              Items may be returned or exchanged within 7 days of verified
              delivery. Pieces must be unworn, unwashed, unaltered, and
              accompanied by original security tags and dust sleeves.
            </div>

            <div className="pt-3">
              <strong className="text-black font-semibold block mb-1">
                2. Size & Fit Exchanges
              </strong>
              If your chosen size does not drape exactly as desired, we offer
              complimentary size exchanges subject to atelier stock
              availability.
            </div>

            <div className="pt-3">
              <strong className="text-black font-semibold block mb-1">
                3. Refund Processing
              </strong>
              Upon receipt and quality inspection at our atelier, approved
              refunds are processed back to your original payment channel via
              Paystack within 3–5 business days.
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="pt-4 flex flex-col items-stretch gap-4 border-t border-zinc-200/80">
          <div>
            <p className="text-xs text-zinc-500 font-mono">
              Need assistance with an existing dispatch?
            </p>
            <p className="text-sm font-bold text-black mt-0.5">
              Contact our concierge at client@twom.com
            </p>
          </div>

          <Link
            href="/products"
            className="w-full liquid-glass-pill rounded-full text-black font-bold px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-nippo hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Explore Collection →
          </Link>
        </div>
      </div>
    </div>
  );
}
