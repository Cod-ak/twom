"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import GlassSurface from "@/components/GlassSurface";
import {
  ShowcaseItem,
  matchesCategoryTab,
  getFallbackItemsForCategory,
} from "@/lib/showcase-catalog";

interface CategoryShowcaseProps {
  dbProducts?: Product[];
  apparelProducts?: Product[];
  accessoriesProducts?: Product[];
  isCuratedBanner?: boolean;
  tabs?: [string, string];
}

export default function CategoryShowcase({
  dbProducts = [],
  apparelProducts,
  accessoriesProducts,
  isCuratedBanner = false,
  tabs = ["APPAREL", "ACCESSORIES"],
}: CategoryShowcaseProps) {
  const resolveTabItems = (tabIndex: 0 | 1): ShowcaseItem[] => {
    if (isCuratedBanner) {
      const list = tabIndex === 0 ? apparelProducts : accessoriesProducts;
      return (list || []) as ShowcaseItem[];
    }

    const tabLabel = tabs[tabIndex];
    const dbMatches = dbProducts.filter(
      (p) => !p.is_campaign_banner && matchesCategoryTab(p.category, tabLabel),
    );
    if (dbMatches.length > 0) return dbMatches as ShowcaseItem[];

    return getFallbackItemsForCategory(tabLabel);
  };

  const apparelItems = resolveTabItems(0);
  const accessoriesItems = resolveTabItems(1);

  const [selectedTab, setSelectedTab] = useState<string>(() =>
    apparelItems.length > 0 ? tabs[0] : tabs[1],
  );

  // If neither tab has items on a newly created banner, preserve exact 24px spacing before next banner
  if (apparelItems.length === 0 && accessoriesItems.length === 0) {
    return <div className="h-6" aria-hidden="true" />;
  }

  // Ensure active tab never points to an empty/muted tab
  let effectiveActiveTab = selectedTab;
  if (effectiveActiveTab === tabs[0] && apparelItems.length === 0) {
    effectiveActiveTab = tabs[1];
  } else if (effectiveActiveTab === tabs[1] && accessoriesItems.length === 0) {
    effectiveActiveTab = tabs[0];
  }

  const displayedItems =
    effectiveActiveTab === tabs[0] ? apparelItems : accessoriesItems;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-4">
      {/* Liquid Glass Category Switcher Dock */}
      <div className="flex items-center mb-6">
        <GlassSurface
          borderRadius={9999}
          borderWidth={0.07}
          brightness={50}
          opacity={0.93}
          blur={1}
          displace={0.5}
          backgroundOpacity={0}
          saturation={1}
          distortionScale={-180}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          refraction
          renderer="auto"
          className="shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
          contentClassName="relative z-1 inline-flex items-center p-1.5 rounded-full gap-1 sm:gap-2"
        >
          {tabs.map((tab, idx) => {
            const hasItems =
              (idx === 0 ? apparelItems.length : accessoriesItems.length) > 0;
            const isActive = effectiveActiveTab === tab && hasItems;

            return (
              <button
                key={tab}
                type="button"
                disabled={!hasItems}
                aria-disabled={!hasItems}
                onClick={() => {
                  if (hasItems) setSelectedTab(tab);
                }}
                className={`relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-nippo italic uppercase text-xs sm:text-sm md:text-base tracking-wider transition-all duration-300 ${
                  !hasItems
                    ? "text-zinc-400 opacity-35 cursor-not-allowed pointer-events-none font-bold"
                    : isActive
                    ? "bg-[#ffce27] text-black font-black shadow-[0_4px_14px_rgba(255,206,39,0.5)] cursor-pointer"
                    : "text-zinc-600 hover:text-twom-title font-bold hover:bg-white/40 cursor-pointer"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </GlassSurface>
      </div>

      {/* Horizontal Scrollable Product Carousel */}
      <div className="flex items-stretch gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 md:scroll-px-0 -mx-4 px-4 md:mx-0 md:px-0 pb-2">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className="w-[76vw] min-w-[76vw] sm:w-[46vw] sm:min-w-[46vw] md:w-[calc(25%-18px)] md:min-w-[calc(25%-18px)] shrink-0 snap-start flex flex-col h-full"
          >
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
