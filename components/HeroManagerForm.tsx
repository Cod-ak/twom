"use client";

import { useState, useTransition } from "react";
import { updateHeroSection } from "@/app/admin/(dashboard)/actions";
import type { HeroSection } from "@/lib/types";
import Link from "next/link";

interface HeroManagerFormProps {
  initialHero: HeroSection;
}

export default function HeroManagerForm({ initialHero }: HeroManagerFormProps) {
  const [headline, setHeadline] = useState(initialHero.headline || "Find your fit.");
  const [subheadline, setSubheadline] = useState(initialHero.subheadline || "");
  const [buttonText, setButtonText] = useState(initialHero.button_text || "Explore styles");
  const [videoUrl, setVideoUrl] = useState(initialHero.video_url || "");
  const [posterUrl, setPosterUrl] = useState(initialHero.poster_url || "");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle local video selection for instant live preview
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle local poster selection
  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      if (posterPreviewUrl) URL.revokeObjectURL(posterPreviewUrl);
      setPosterPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("headline", headline);
    if (subheadline) formData.set("subheadline", subheadline);
    formData.set("button_text", buttonText);
    formData.set("video_url", videoUrl);
    formData.set("poster_url", posterUrl);
    if (videoFile) formData.set("video_file", videoFile);
    if (posterFile) formData.set("poster_file", posterFile);

    startTransition(async () => {
      const res = await updateHeroSection(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  };

  const activeVideoSrc = videoPreviewUrl || videoUrl;
  const activePosterSrc = posterPreviewUrl || posterUrl;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form Editor (7 cols) */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-8 border border-zinc-200 shadow-xs rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-twom-muted block mb-1">
              Editorial CMS
            </span>
            <h2 className="font-zodiak text-2xl text-twom-title">
              Homepage Hero Section
            </h2>
            <p className="text-xs text-twom-muted mt-1">
              Changes made here update the full-bleed video banner on the live homepage instantly.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
              <span>✓ Hero section updated successfully and live cache purged!</span>
              <Link
                href="/"
                target="_blank"
                className="font-bold underline underline-offset-2 hover:opacity-80 ml-2"
              >
                View Live Store ↗
              </Link>
            </div>
          )}

          {/* Headline */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-zinc-600 mb-2">
              Main Headline *
            </label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Find your fit."
              className="w-full px-4 py-3 border border-zinc-300 text-sm focus:outline-none focus:border-black font-zodiak text-lg transition-colors"
            />
          </div>

          {/* Subheadline (Optional) */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-zinc-600 mb-2">
              Subheadline / Tagline (Optional)
            </label>
            <input
              type="text"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="e.g. Modern Nigerian tailoring meets effortless minimalism."
              className="w-full px-4 py-2.5 border border-zinc-300 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* CTA Button Text */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-zinc-600 mb-2">
              CTA Button Text *
            </label>
            <input
              type="text"
              required
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Explore styles"
              className="w-full px-4 py-2.5 border border-zinc-300 text-xs focus:outline-none focus:border-black transition-colors"
            />
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Button automatically routes shoppers to /products.
            </p>
          </div>

          {/* Video Configuration */}
          <div className="border-t border-zinc-100 pt-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block mb-1">
                Background Video Asset
              </span>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-700 mb-2">
                Video Direct URL (MP4 / WebM)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://.../video.mp4"
                className="w-full px-4 py-2.5 border border-zinc-300 text-xs focus:outline-none focus:border-black transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1.5">
                Or Upload New Video File (.mp4, max 50MB)
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoFileChange}
                className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:font-mono file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 cursor-pointer"
              />
            </div>
          </div>

          {/* Poster Image Configuration */}
          <div className="border-t border-zinc-100 pt-5 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block mb-1">
                Video Fallback Poster (Mobile / Preload)
              </span>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-700 mb-2">
                Poster Image URL
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://.../poster.jpg"
                className="w-full px-4 py-2.5 border border-zinc-300 text-xs focus:outline-none focus:border-black transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1.5">
                Or Upload New Poster Image (.jpg, .png, .webp)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePosterFileChange}
                className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:font-mono file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <button
              type="submit"
              disabled={isPending}
              className="bg-black hover:bg-zinc-800 text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Publishing Changes..." : "Publish to Homepage →"}
            </button>

            <Link
              href="/"
              target="_blank"
              className="text-xs text-twom-muted hover:text-black uppercase tracking-wider font-mono transition-colors"
            >
              Preview Live Site ↗
            </Link>
          </div>
        </form>
      </div>

      {/* Right Column: Live Mockup / Visual Preview (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-4 border border-zinc-200 shadow-xs rounded-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Live Mockup Preview
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Real-Time
            </span>
          </div>

          {/* Interactive Hero Preview Frame */}
          <div className="relative aspect-9/16 sm:aspect-4/5 w-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col justify-end p-6 border border-zinc-800">
            {/* Background Video */}
            {activeVideoSrc ? (
              <video
                key={activeVideoSrc}
                autoPlay
                muted
                loop
                playsInline
                poster={activePosterSrc || undefined}
                className="absolute inset-0 z-0 w-full h-full object-cover brightness-85"
              >
                <source src={activeVideoSrc} type="video/mp4" />
              </video>
            ) : (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs font-mono">
                No Video Configured
              </div>
            )}

            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 z-1 bg-black/25 pointer-events-none" />

            {/* Dynamic Foreground Content */}
            <div className="relative z-2 flex flex-col items-start gap-4">
              <h2 className="font-zodiak text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                {headline || "Find your fit."}
              </h2>

              {subheadline && (
                <p className="text-xs text-zinc-200 leading-relaxed max-w-xs">
                  {subheadline}
                </p>
              )}

              <span className="inline-block border border-white text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-mono bg-white/10 backdrop-blur-xs">
                {buttonText || "Explore styles"}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 font-mono text-center mt-3">
            Simulates the 90svh full-bleed desktop and mobile experience.
          </p>
        </div>
      </div>
    </div>
  );
}
