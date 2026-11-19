"use client";

import { useState, useRef, useSyncExternalStore } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export default function ProductImageGallery({
  images,
  name,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // SSR hydration safety
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Ensure there is always at least one image to display
  const galleryList = images && images.length > 0 ? images : ["/TWOM.png"];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      if (index !== activeIndex && index >= 0 && index < galleryList.length) {
        setActiveIndex(index);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <div className="relative w-full aspect-4/5 sm:aspect-4/4.8 rounded-[32px] sm:rounded-[36px] overflow-hidden bg-[#f0ede8] shadow-md border border-zinc-200/50 group select-none isolate">
      {/* Horizontal Scroll / Touch-Swipe Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
      >
        {galleryList.map((imgUrl, index) => {
          const isLogoPlaceholder =
            !imgUrl ||
            imgUrl.includes("TWOM.png") ||
            imgUrl.includes("Twom.png");

          return (
            <div
              key={`${imgUrl}-${index}`}
              className="relative w-full h-full shrink-0 snap-center flex items-center justify-center overflow-hidden"
            >
              <Image
                src={imgUrl}
                alt={`${name} - View ${index + 1}`}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`transition-transform duration-700 ease-out ${
                  isLogoPlaceholder
                    ? "object-contain p-12"
                    : "object-cover object-center"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Desktop Chevron Controls (Hover) */}
      {mounted && galleryList.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              aria-label="Previous image"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-black items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 pointer-events-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}

          {activeIndex < galleryList.length - 1 && (
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              aria-label="Next image"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-black items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 pointer-events-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Minimal Floating Pagination Dots (Bottom Center) */}
      {galleryList.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md shadow-xs pointer-events-auto">
          {galleryList.map((_, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
