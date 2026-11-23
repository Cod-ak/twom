import Link from "next/link";
import { supabase } from "@/lib/supabase";
import GlassSurface from "@/components/GlassSurface";

export default async function Hero() {
  // 1. Fetch data safely with fallback
  let heroData = null;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data } = await supabase
        .from("hero_sections")
        .select("*")
        .eq("is_active", true)
        .single();
      heroData = data;
    }
  } catch {
    // Fallback below handles missing data or connection error
  }

  // 2. Fallback logic (protects against empty DB or network failure)
  const hero = heroData || {
    headline: "Find your fit.",
    button_text: "Explore styles",
    button_link: "/products",
    video_url:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-videos/hero/main/video.mp4",
    poster_url:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-posters/hero/main/poster.jpeg",
  };

  return (
    <section className="relative h-[90svh] w-full overflow-hidden flex flex-col justify-end px-6 pb-12 md:px-12 md:pb-16">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={hero.poster_url}
        className="absolute inset-0 z-0 w-full h-full object-cover brightness-90"
      >
        <source src={hero.video_url} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-1 flex flex-col items-start gap-6">
        <h1 className="font-zodiak text-4xl md:text-6xl text-white tracking-tight leading-tight ">
          {hero.headline}
        </h1>

        {hero.subheadline && (
          <p className="text-sm md:text-base text-zinc-200 max-w-lg leading-relaxed">
            {hero.subheadline}
          </p>
        )}

        <Link
          href={hero.button_link}
          className="inline-block group cursor-pointer"
        >
          <GlassSurface
            borderRadius={9999}
            borderWidth={0.07}
            brightness={50}
            opacity={0.93}
            blur={-100}
            displace={0.5}
            backgroundOpacity={-100}
            saturation={1}
            distortionScale={-180}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            refraction
            renderer="auto"
            className="shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]"
            contentClassName="relative z-1 inline-flex items-center px-9 py-4 text-xs uppercase tracking-[0.2em] font-nippo text-white font-black"
          >
            {hero.button_text}
          </GlassSurface>
        </Link>
      </div>
    </section>
  );
}
