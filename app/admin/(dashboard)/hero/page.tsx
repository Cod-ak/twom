import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import HeroManagerForm from "@/components/HeroManagerForm";
import type { HeroSection } from "@/lib/types";

export const instant = false;

export default async function AdminHeroPage() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch current active hero section
  const { data: heroData } = await supabase
    .from("hero_sections")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  const hero: HeroSection = heroData || {
    headline: "Find your fit.",
    subheadline: "",
    button_text: "Explore styles",
    button_link: "/products",
    video_url:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-videos/hero/main/video.mp4",
    poster_url:
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-posters/hero/main/poster.jpeg",
  };

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <AdminHeaderNav currentTab="hero" userEmail={user?.email} />

        <HeroManagerForm initialHero={hero} />
      </div>
    </div>
  );
}
