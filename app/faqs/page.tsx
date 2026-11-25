import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "Frequently Asked Questions — TWOM Atelier",
  description:
    "Common inquiries regarding ordering, sizing, payment methods, Paystack security, delivery timelines, and atelier drops.",
  openGraph: {
    title: "FAQs — TWOM Atelier",
    description: "Answers to sizing, payment, delivery, and order inquiries.",
  },
};

const FAQS = [
  {
    question: "How do TWOM pieces fit?",
    answer:
      "Most TWOM silhouettes are engineered with a boxy, dropped-shoulder editorial cut. If you prefer a tailored, standard fit, we recommend selecting one size smaller than your standard size. Refer to the size guide on each product page for exact garment dimensions.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major Nigerian and international debit and credit cards (Mastercard, Visa, Verve), as well as direct bank transfers, Apple Pay, and USSD via our secure payment gateway partner, Paystack.",
  },
  {
    question: "When will my order ship?",
    answer:
      "Orders placed before 1:00 PM West Africa Time are typically prepared and dispatched on the same business day. Lagos deliveries arrive within 1–2 business days; interstate shipments arrive within 2–4 business days.",
  },
  {
    question: "How do I track my delivery?",
    answer:
      "As soon as your order is packaged and collected by our logistics partner (DHL or GIG Logistics), an automated notification is sent to your email containing your tracking waybill and a direct link to track transit in real time.",
  },
  {
    question: "Are your collection drops limited?",
    answer:
      "Yes. To maintain uncompromised textile quality and reduce overproduction, all TWOM garments are manufactured in limited seasonal atelier runs. Once an edition is marked 'SOLD OUT', it is seldom restocked.",
  },
  {
    question: "What is your exchange and return policy?",
    answer:
      "We accept returns and size exchanges within 7 days of delivery for all unworn, unaltered items with tags and packaging intact. Contact our concierge to initiate an exchange.",
  },
];

export default function FAQPage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-17 pb-16 px-4 text-twom-body font-sans">
      <div className="w-full space-y-10">
        {/* Header */}
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Client Services &bull; Inquiries
          </span>
          <h1 className="font-zodiak text-4xl text-twom-title leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-twom-muted leading-relaxed">
            Everything you need to know about purchasing, sizing, order
            fulfillment, and atelier collections.
          </p>
        </div>

        {/* FAQs List */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs divide-y divide-zinc-100 overflow-hidden">
          {FAQS.map((faq, index) => (
            <div key={faq.question} className="p-6 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
                0{index + 1}
              </span>
              <h2 className="font-zodiak text-xl text-twom-title">
                {faq.question}
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Support */}
        <div className="pt-4 flex flex-col items-stretch gap-4 border-t border-zinc-200/80">
          <div>
            <p className="text-xs text-zinc-500 font-mono">
              Have a question not addressed here?
            </p>
            <p className="text-sm font-bold text-black mt-0.5">
              Email our support desk at concierge@twom.com
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
