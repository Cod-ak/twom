"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import GlassSurface from "@/components/GlassSurface";

interface HeroClientProps {
  headline: string;
  subheadline?: string | null;
  buttonText: string;
  videoUrl: string;
  posterUrl: string;
}

export default function HeroClient({
  headline,
  subheadline,
  buttonText,
  videoUrl,
  posterUrl,
}: HeroClientProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Enable CORS so GlassSurface's WebGL2 refraction shader can sample video frames on iOS/mobile;
  // automatically fall back without crossOrigin if an external video host lacks CORS headers.
  const [useCors, setUseCors] = useState(true);

  return (
    <section className="relative h-[90svh] max-h-[820px] w-full overflow-hidden flex flex-col justify-end px-5 pb-12">
      {/* Video Background */}
      <video
        ref={videoRef}
        key={useCors ? "cors" : "nocors"}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={posterUrl}
        crossOrigin={useCors ? "anonymous" : undefined}
        onError={() => {
          if (useCors) setUseCors(false);
        }}
        className="absolute inset-0 z-0 w-full h-full object-cover brightness-90"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-black/20" />

      {/* Content (Locked to Mobile Proportions) */}
      <div className="relative z-1 flex flex-col items-start gap-5">
        <h1 className="font-zodiak text-4xl text-white tracking-tight leading-tight">
          {headline}
        </h1>

        {subheadline && (
          <p className="text-sm text-zinc-200 leading-relaxed">
            {subheadline}
          </p>
        )}

        <Link href="/products" className="inline-block group cursor-pointer">
          <GlassSurface
            backdrop={useCors ? videoRef : undefined}
            backdropTint="rgba(0, 0, 0, 0.25)"
            borderRadius={9999}
            borderWidth={0.07}
            brightness={50}
            opacity={0.93}
            blur={0}
            displace={0.5}
            backgroundOpacity={0}
            saturation={1}
            distortionScale={-180}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            refraction
            renderer="auto"
            className="shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]"
            contentClassName="relative z-1 inline-flex items-center px-8 py-4 text-xs uppercase tracking-[0.2em] font-nippo text-white font-black"
          >
            {buttonText}
          </GlassSurface>
        </Link>
      </div>
    </section>
  );
}
