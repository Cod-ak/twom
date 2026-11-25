export default function ProductsLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4">
      <div className="w-full">
        {/* 1. Header Section */}
        <div className="flex flex-row justify-between items-end mb-4 gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-twom-muted font-mono block">
              The Collection
            </span>
            <div className="flex items-baseline gap-2.5 mt-0.5">
              <h1 className="font-zodiak text-2xl text-twom-title font-bold tracking-tight leading-none">
                Shop All
              </h1>
              <span className="text-[11px] uppercase tracking-wider text-twom-muted font-mono animate-pulse">
                (7 Pieces)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Top Filter & Sort Bar */}
        <div className="flex items-center justify-between border-y border-zinc-200/80 py-3 mb-4 gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            >
              <line x1="21" x2="14" y1="4" y2="4" />
              <line x1="10" x2="3" y1="4" y2="4" />
              <line x1="21" x2="12" y1="12" y2="12" />
              <line x1="8" x2="3" y1="12" y2="12" />
              <line x1="21" x2="16" y1="20" y2="20" />
              <line x1="12" x2="3" y1="20" y2="20" />
              <line x1="14" x2="14" y1="2" y2="6" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
            <span>Filter</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black py-1 px-2.5 rounded-lg border border-zinc-200/80 bg-white/70">
            <span>Sort:</span>
            <span className="text-zinc-600 font-medium">Featured</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* 3. Horizontal Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4">
          <div className="shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-bold bg-black text-white shadow-xs">
            All
          </div>
          {["Tees & Tanks", "Pants", "Hoodies", "Accessories"].map((cat) => (
            <div
              key={cat}
              className="shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium bg-white/80 text-zinc-700 border border-zinc-200/80"
            >
              {cat}
            </div>
          ))}
        </div>

        {/* 4. Products Grid: Locked 2 columns mobile grid */}
        <div className="grid grid-cols-2 gap-3 items-stretch mt-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="group relative flex flex-col justify-between w-full h-full bg-white rounded-2xl border border-zinc-200/80 p-2.5 shadow-xs"
            >
              {/* Image Container: 1:1.28 ratio */}
              <div className="relative aspect-[1/1.28] w-full overflow-hidden rounded-xl bg-zinc-100 animate-pulse isolate">
                {/* Vertical Ribbon Badge in Top-Right Position */}
                <span className="pointer-events-none absolute top-0 right-1.5 z-10 inline-flex items-center justify-center bg-[#ffce27] border border-black/20 text-black text-[10px] font-black tracking-[0.2em] px-1.5 pt-1.5 pb-2 rounded-b-full rounded-t-none [writing-mode:vertical-rl] select-none uppercase shadow-xs">
                  NEW
                </span>
              </div>

              {/* Product Title Skeleton */}
              <div className="mt-2.5 mb-1 space-y-1">
                <div className="h-3.5 w-4/5 bg-zinc-200 rounded-sm animate-pulse" />
              </div>

              {/* Bottom Action Row: Price Skeleton + Signature Yellow Cart Button */}
              <div className="flex items-center justify-between gap-1.5 mt-auto pt-1.5">
                <div className="h-5 w-20 bg-zinc-200 rounded-sm animate-pulse" />

                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#ffce27] text-black shadow-[0_4px_14px_rgba(255,206,39,0.5)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
