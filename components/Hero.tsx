import { supabase } from "@/lib/supabase";
import HeroClient from "@/components/HeroClient";

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
    subheadline: null,
    button_text: "Explore styles",
    video_url:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-videos/hero/main/video.mp4",
    poster_url:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-posters/hero/main/poster.jpeg",
  };

  return (
    <HeroClient
      headline={hero.headline}
      subheadline={hero.subheadline}
      buttonText={hero.button_text}
      videoUrl={hero.video_url}
      posterUrl={hero.poster_url}
    />
  );
}
