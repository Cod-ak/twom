"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Atelier System Error]:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[85vh] bg-twom-bg flex items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-rose-700 block">
          500 &bull; Studio Service Interrupted
        </span>

        <h1 className="font-zodiak text-3xl sm:text-4xl text-twom-title tracking-tight leading-tight">
          An unexpected pause in atelier services.
        </h1>

        <p className="text-xs text-twom-muted leading-relaxed max-w-sm mx-auto">
          Our studio connection was momentarily interrupted while processing this page.
          Your cart and session remain secure.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto bg-black text-white px-7 py-3 text-xs uppercase tracking-[0.2em] font-mono hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Retry Loading
          </button>

          <Link
            href="/products"
            className="w-full sm:w-auto border border-zinc-300 text-zinc-700 px-6 py-3 text-xs uppercase tracking-wider font-mono hover:border-black hover:text-black transition-colors"
          >
            Return to Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
