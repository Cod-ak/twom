import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "Terms of Service — TWOM Atelier",
  description:
    "Terms governing client purchases, order cancellations, delivery protocols, and intellectual property.",
  openGraph: {
    title: "Terms of Service — TWOM Atelier",
    description: "Purchase terms, client care protocols, and intellectual property guidelines.",
  },
};

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-16 md:pb-24 px-4 md:px-6 text-twom-body font-sans">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Legal &bull; Atelier Governance
          </span>
          <h1 className="font-zodiak text-4xl sm:text-5xl text-twom-title leading-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-xs text-twom-muted font-mono">
            Effective Date: November 2026 &bull; TWOM Studios Limited
          </p>
        </div>

        {/* Content Sections */}
        <div className="bg-white p-8 md:p-12 border border-zinc-200/90 rounded-2xl shadow-xs space-y-8 text-xs leading-relaxed text-zinc-700">
          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              1. Scope & Atelier Operations
            </h2>
            <p>
              By accessing the TWOM platform or placing an order through our digital storefront, you agree to comply with and be bound by these Terms of Service. TWOM reserves the right to modify these terms at any time with immediate effect upon posting.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              2. Orders, Allocation & Pricing
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600">
              <li>
                <strong>Pricing:</strong> All amounts are denominated in Nigerian Naira (₦) inclusive of relevant atelier production duties.
              </li>
              <li>
                <strong>Limited Runs:</strong> Given the limited nature of our textiles and tailored garments, items placed in digital bags are not reserved until full Paystack payment authorization is confirmed.
              </li>
              <li>
                <strong>Acceptance:</strong> An order confirmation email signifies acknowledgment of your purchase. The atelier reserves the right to decline or cancel orders resulting from inadvertent technical pricing discrepancies.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              3. Payment & Settlement
            </h2>
            <p>
              Transactions are settled through Paystack’s secure checkout. Accepted methods include domestic and international debit/credit cards, direct bank transfer, and USSD. Your bank account is debited immediately upon authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              4. Shipping, Transit & Returns
            </h2>
            <p>
              Fulfillment timelines and exchange parameters are detailed on our{" "}
              <Link href="/shipping" className="text-black underline underline-offset-4 font-medium">
                Shipping & Returns Policy
              </Link>. In summary:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>Lagos deliveries arrive within 1–2 business days. Interstate dispatches take 2–4 business days.</li>
              <li>Unworn pieces with signature security tags intact are eligible for exchange or store credit within 7 calendar days of receipt.</li>
              <li>Bespoke or made-to-measure commissions cannot be returned once fabric cutting has commenced.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              5. Intellectual Property
            </h2>
            <p>
              All visual assets, garment cuts, lookbook photography, patterns, brand trademarks, and digital typography displayed on this site remain the exclusive intellectual property of TWOM Studios Limited. Unauthorized reproduction or commercial exploitation is prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              6. Dispute Resolution
            </h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising in connection with an atelier purchase shall first be submitted to mutual amicable resolution through our{" "}
              <Link href="/concierge" className="text-black underline underline-offset-4 font-medium">
                Private Concierge
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
