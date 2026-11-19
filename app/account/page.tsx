import Link from "next/link";

export const instant = false;

export default function AccountPage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-32 pb-24 px-6 md:px-12 text-twom-body font-sans flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 md:p-10 border border-zinc-200 shadow-sm text-center">
        <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-zinc-400 block mb-2">
          Client Services
        </span>
        <h1 className="font-zodiak text-3xl text-twom-title mb-3">
          Client Account
        </h1>
        <p className="text-xs text-twom-muted mb-8 leading-relaxed">
          Order confirmations, digital receipts, and tracking links are
          dispatched directly to your email upon checkout confirmation.
        </p>

        <div className="space-y-3">
          <Link
            href="/products"
            className="block w-full bg-twom-title text-white py-3.5 text-xs uppercase tracking-[0.2em] font-nippo hover:bg-black transition-colors"
          >
            Explore Collection
          </Link>

          <Link
            href="/admin/login"
            className="block w-full border border-zinc-300 text-zinc-600 py-3 text-xs uppercase tracking-wider hover:text-black hover:border-black transition-colors"
          >
            Staff & Atelier Access →
          </Link>
        </div>
      </div>
    </div>
  );
}
