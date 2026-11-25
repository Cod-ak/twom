import type { Metadata } from "next";
import Link from "next/link";

export const instant = false;

export const metadata: Metadata = {
  title: "Fabric & Garment Care — TWOM Atelier",
  description:
    "Preserve the structure, density, and drape of TWOM Japanese loopback fleece, tailored wools, and combed cotton signatures.",
  openGraph: {
    title: "Fabric & Garment Care — TWOM Atelier",
    description:
      "Expert care instructions for heavyweight combed cotton, tailored wools, and luxury knitwear.",
  },
};

export default function CarePage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4 text-twom-body font-sans">
      <div className="w-full space-y-10">
        {/* Header */}
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Client Services &bull; Longevity
          </span>
          <h1 className="font-zodiak text-4xl text-twom-title leading-tight mb-4">
            Fabric & Garment Care
          </h1>
          <p className="text-sm text-twom-muted leading-relaxed">
            TWOM garments are crafted from substantial, high-density textiles
            engineered to soften and mature with time. Following these
            principles preserves their architectural silhouette, fiber density,
            and tactile finish.
          </p>
        </div>

        {/* Fabric Care Matrix */}
        <div className="grid grid-cols-1 gap-6">
          {/* Card 1: Combed Cotton & Loopback Fleece */}
          <div className="bg-white p-6 border border-zinc-200/90 rounded-2xl shadow-xs space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              320GSM – 480GSM Textiles
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title">
              Heavyweight Cotton & Fleece
            </h2>
            <ul className="space-y-3 text-xs text-zinc-600 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-black">Cold Wash Only:</strong> Machine
                wash inside out in cold water (maximum 30°C / 85°F) on a gentle
                cycle.
              </li>
              <li>
                <strong className="text-black">No Tumble Drying:</strong> High heat
                causes fiber shrinkage. Always reshape while damp and dry flat
                away from direct sunlight.
              </li>
              <li>
                <strong className="text-black">Low Heat Steaming:</strong> Use an
                upright garment steamer on reverse. Avoid pressing directly over
                silicone or tonal branding.
              </li>
              <li>
                <strong className="text-black">Color Separation:</strong> Wash
                washed black and vintage dyed garments with similar dark tones.
              </li>
            </ul>
          </div>

          {/* Card 2: Tailoring, Worsted Wool & Outerwear */}
          <div className="bg-white p-6 border border-zinc-200/90 rounded-2xl shadow-xs space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
              Architectural Tailoring
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title">
              Woolens, Blends & Outerwear
            </h2>
            <ul className="space-y-3 text-xs text-zinc-600 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-black">Specialist Dry Clean:</strong>{" "}
                Structured trousers, blazers, and overcoats should only be
                professionally dry cleaned.
              </li>
              <li>
                <strong className="text-black">Cedar Hangers:</strong> Store on
                wide-shoulder contoured wooden or cedar hangers to retain the
                canvassed shoulder drape.
              </li>
              <li>
                <strong className="text-black">Garment Resting:</strong> Allow
                tailored pieces 24 hours of rest between wears to allow the
                natural wool fibers to breathe and release creases.
              </li>
              <li>
                <strong className="text-black">Brush Cleaning:</strong> Use a
                natural bristle clothes brush to remove lint and dust rather than
                over-washing.
              </li>
            </ul>
          </div>
        </div>

        {/* Philosophy Card */}
        <div className="p-6 bg-white border border-zinc-200/90 rounded-2xl shadow-xs space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 block">
            The Atelier Commitment
          </span>
          <h2 className="font-zodiak text-2xl text-twom-title">
            Permanence Over Trend
          </h2>
          <p className="text-xs text-twom-muted leading-relaxed">
            We believe durability is the ultimate standard of luxury. When cared
            for deliberately, TWOM garments are designed to endure across
            seasons and develop a richer, personalized patina with every year of
            wear.
          </p>
        </div>

        {/* Support CTA */}
        <div className="pt-4 flex flex-col items-stretch gap-4 border-t border-zinc-200/80">
          <div>
            <p className="text-xs text-zinc-500 font-mono">
              Have questions regarding a specific fabric or garment?
            </p>
            <p className="text-sm font-bold text-black mt-0.5">
              Contact our fabric specialists at concierge@twom.com
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
