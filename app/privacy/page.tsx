import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "Privacy Policy — TWOM Atelier",
  description:
    "How TWOM protects, processes, and safeguards client personal information and transaction records.",
  openGraph: {
    title: "Privacy Policy — TWOM Atelier",
    description: "Our commitment to client privacy, discreet transactions, and data protection.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4 text-twom-body font-sans">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Legal &bull; Data Governance
          </span>
          <h1 className="font-zodiak text-4xl text-twom-title leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-xs text-twom-muted font-mono">
            Last Updated: November 2026 &bull; TWOM Studios Limited
          </p>
        </div>

        {/* Content Sections */}
        <div className="bg-white p-6 border border-zinc-200/90 rounded-2xl shadow-xs space-y-6 text-xs leading-relaxed text-zinc-700">
          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              1. Our Commitment to Client Discretion
            </h2>
            <p>
              TWOM Atelier (&quot;TWOM&quot;, &quot;we&quot;, &quot;us&quot;) operates with strict respect for client privacy. We collect only the information essential to fulfill your bespoke orders, coordinate secure courier transit, and provide private concierge consultations. We do not sell, rent, or trade your personal information to third-party data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600">
              <li>
                <strong>Fulfillment Details:</strong> Full name, shipping destination, phone number, and email address provided during checkout.
              </li>
              <li>
                <strong>Payment Information:</strong> All card processing and bank payments are handled directly by Paystack via encrypted 256-bit SSL tunnels. TWOM never stores or has access to your full credit/debit card numbers or CVV.
              </li>
              <li>
                <strong>Atelier Communications:</strong> Records of correspondence submitted via our Private Concierge or bespoke appointment requests.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              3. Purpose of Processing
            </h2>
            <p>
              Your data is processed strictly for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>Fabrication, order packing, and courier delivery coordination.</li>
              <li>Automated dispatch of digital invoices, waybill tracking links, and delivery status alerts.</li>
              <li>Client service inquiries, garment alterations, and private studio fittings.</li>
              <li>Fraud prevention and regulatory compliance with Nigerian financial laws.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              4. Third-Party Disclosures
            </h2>
            <p>
              We disclose necessary delivery details solely to trusted logistical partners (including DHL Express and regional courier couriers) exclusively to complete doorstep delivery. Payment data is processed in accordance with PCI-DSS Tier 1 requirements by Paystack.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-zodiak text-xl text-twom-title">
              5. Your Rights & Atelier Contact
            </h2>
            <p>
              Clients may request access, corrections, or deletion of their contact profile at any time by contacting our private desk at{" "}
              <a href="mailto:concierge@twomatelier.com" className="text-black underline underline-offset-4 font-medium">
                concierge@twomatelier.com
              </a>{" "}
              or via our{" "}
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
