import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const instant = false;

export const metadata: Metadata = {
  title: "Atelier Archive — TWOM",
  description:
    "An exhibition of historical editions, experimental textile iterations, and past atelier silhouettes.",
  openGraph: {
    title: "Atelier Archive — TWOM",
    description: "Historical editions and permanent silhouettes of TWOM Atelier.",
  },
};

const ARCHIVE_EDITIONS = [
  {
    edition: "Edition 01 — Genesis",
    year: "2024",
    title: "The Art of Restraint",
    description:
      "A preliminary study in weight, dropped shoulders, and heavyweight unbrushed fleece. Monochromatic palettes celebrating understated confidence.",
    image:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-posters/hero/main/poster.jpeg",
    category: "Outerwear & Fleece",
  },
  {
    edition: "Edition 02 — Tropical Wool",
    year: "2025",
    title: "Metropolitan Sartorial",
    description:
      "Constructed for tropical heat and corporate power. Breathable, fluid Italian wool tailored into razor-sharp relaxed blazers and pleated trousers.",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80",
    category: "Tailoring",
  },
  {
    edition: "Edition 03 — Current Collection",
    year: "2026",
    title: "Architectural Precision",
    description:
      "Our latest silhouettes. Double-faced cashmere outerwear, raw silk button-downs, and elevated wardrobe essentials available in limited runs.",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80",
    category: "Current Release",
  },
];

export default function ArchivePage() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-16 md:pb-24 px-4 md:px-6 text-twom-body font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-zinc-200 pb-8">
          <span className="text-xs uppercase tracking-[0.25em] text-twom-muted font-mono block mb-3">
            Permanent Exhibition &bull; Retrospective
          </span>
          <h1 className="font-zodiak text-4xl sm:text-6xl text-twom-title leading-tight mb-4">
            The Atelier Archive
          </h1>
          <p className="text-sm md:text-base text-twom-muted max-w-2xl leading-relaxed">
            A permanent visual catalogue of historical garment cuts, obsolete textile developments, and milestone collections released by TWOM since inception.
          </p>
        </div>

        {/* Editions Grid */}
        <div className="space-y-12">
          {ARCHIVE_EDITIONS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-2"
            >
              <div className="relative aspect-[4/3] md:aspect-auto min-h-[300px] bg-zinc-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-8 sm:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="uppercase tracking-widest">{item.edition}</span>
                    <span>{item.year}</span>
                  </div>

                  <h2 className="font-zodiak text-3xl text-twom-title">
                    {item.title}
                  </h2>

                  <p className="text-xs text-zinc-600 leading-relaxed pt-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 bg-zinc-100 px-2 py-1 rounded-sm">
                    {item.category}
                  </span>

                  <Link
                    href="/products"
                    className="text-xs uppercase tracking-wider font-bold text-black hover:underline underline-offset-4"
                  >
                    View Current Pieces →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
