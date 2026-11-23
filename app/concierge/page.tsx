import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "Private Concierge — TWOM Atelier",
  description:
    "Direct liaison with TWOM specialists for sizing guidance, order dispatch assistance, and private appointments.",
  openGraph: {
    title: "Private Concierge — TWOM Atelier",
    description: "Personalized styling advice, order tracking, and atelier appointments.",
  },
};

export default function ConciergePage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-16 md:pb-24 px-4 md:px-6 text-twom-body font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Client Services &bull; Advisory
          </span>
          <h1 className="font-zodiak text-4xl sm:text-6xl text-twom-title leading-tight mb-4">
            Private Concierge
          </h1>
          <p className="text-sm md:text-base text-twom-muted max-w-2xl leading-relaxed">
            Our atelier specialists are available to provide individualized
            sizing recommendations, styling guidance, and priority assistance
            with order fulfillment.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-7 sm:p-8 border border-zinc-200/90 rounded-2xl shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              Digital Correspondence
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title">
              Email Advisory
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              For general inquiries, order status confirmations, and styling
              consultations. We respond within 12 hours.
            </p>
            <div className="pt-2">
              <a
                href="mailto:concierge@twom.com"
                className="font-mono text-xs font-bold text-black underline underline-offset-4 hover:text-zinc-600 transition-colors"
              >
                concierge@twom.com →
              </a>
            </div>
          </div>

          <div className="bg-white p-7 sm:p-8 border border-zinc-200/90 rounded-2xl shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              Immediate Assistance
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title">
              WhatsApp Concierge
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Direct text liaison with our Lagos studio team for immediate dispatch
              updates, address adjustments, and quick fit checks.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs font-bold text-black underline underline-offset-4 hover:text-zinc-600 transition-colors"
              >
                Connect on WhatsApp →
              </a>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="p-8 bg-white border border-zinc-200/90 rounded-2xl shadow-xs space-y-3">
          <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 block">
            Studio Hours
          </span>
          <h2 className="font-zodiak text-2xl text-twom-title">
            Hours of Operation
          </h2>
          <p className="text-xs sm:text-sm text-twom-muted leading-relaxed">
            Monday through Saturday: 9:00 AM – 7:00 PM WAT.<br />
            Sundays & Public Holidays: Priority dispatch assistance only.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-200/80">
          <Link
            href="/shipping"
            className="text-xs uppercase tracking-wider font-mono text-zinc-600 hover:text-black transition-colors"
          >
            ← View Shipping Policy
          </Link>

          <Link
            href="/products"
            className="liquid-glass-pill rounded-full text-black font-bold px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-nippo hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Explore Collection →
          </Link>
        </div>
      </div>
    </div>
  );
}
