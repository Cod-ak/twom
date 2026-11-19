import Link from "next/link";

export const instant = false;

export default function StoryPage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-32 pb-24 px-6 md:px-12 text-twom-body font-sans">
      <div className="max-w-4xl mx-auto">
        <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
          The Manifesto
        </span>
        <h1 className="font-zodiak text-4xl sm:text-6xl text-twom-title leading-tight mb-8">
          The World of TWOM
        </h1>

        <div className="prose prose-zinc max-w-none text-base md:text-lg leading-relaxed space-y-6">
          <p className="font-medium text-twom-title text-xl md:text-2xl leading-snug">
            Designed for working professionals. The art of restraint.
          </p>

          <p>
            TWOM was conceived around a single principle: that modern luxury
            lies not in excess ornament, but in deliberate intention, precise
            proportions, and uncompromised materiality.
          </p>

          <p>
            Every piece is developed in limited atelier runs, combining
            heavyweight Japanese combed cotton, worsted Italian wools, and
            architectural tailoring engineered to transition effortlessly between
            work, studio, and city life.
          </p>

          <div className="my-12 p-8 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <h2 className="font-zodiak text-2xl text-twom-title mb-2">
              Atelier Principles
            </h2>
            <ul className="space-y-3 text-sm text-twom-muted mt-4">
              <li>
                <strong className="text-zinc-900">1. Material Supremacy:</strong>{" "}
                Custom 480GSM loopback fleece, double-twisted poplin, and
                responsibly sourced fibers.
              </li>
              <li>
                <strong className="text-zinc-900">2. Architectural Silhouette:</strong>{" "}
                Clean drop-shoulders, measured drape, and sculptural lines.
              </li>
              <li>
                <strong className="text-zinc-900">3. Zero-Excess Restraint:</strong>{" "}
                No disposable graphics. Only permanent wardrobe signatures.
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              href="/products"
              className="inline-block bg-black text-white px-8 py-4 text-xs uppercase tracking-[0.2em] font-nippo hover:bg-zinc-800 transition-colors"
            >
              Explore Collection →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
