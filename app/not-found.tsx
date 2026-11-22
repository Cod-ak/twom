import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full min-h-[85vh] bg-twom-bg flex items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-twom-muted block">
          404 &bull; Archive Notice
        </span>

        <h1 className="font-zodiak text-3xl sm:text-4xl text-twom-title tracking-tight leading-tight">
          This piece is no longer in the atelier archive.
        </h1>

        <p className="text-xs text-twom-muted leading-relaxed max-w-sm mx-auto">
          The requested page or garment may have been retired from the collection,
          relocated, or is momentarily unavailable.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="w-full sm:w-auto bg-black text-white px-7 py-3 text-xs uppercase tracking-[0.2em] font-mono hover:bg-zinc-800 transition-colors"
          >
            Explore Collection →
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto border border-zinc-300 text-zinc-700 px-6 py-3 text-xs uppercase tracking-wider font-mono hover:border-black hover:text-black transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
