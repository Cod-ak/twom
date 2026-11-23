export default function RootLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-16 md:pb-24 px-4 md:px-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Placeholder */}
        <div className="space-y-3 max-w-xl">
          <div className="h-3 w-28 bg-zinc-200/80 rounded-full" />
          <div className="h-10 sm:h-12 w-3/4 bg-zinc-200/90 rounded-md" />
          <div className="h-4 w-1/2 bg-zinc-200/60 rounded-md" />
        </div>

        {/* Content Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[1/1.28] w-full bg-zinc-100 rounded-2xl border border-zinc-200/60" />
              <div className="h-4 w-3/4 bg-zinc-200/80 rounded-md" />
              <div className="h-4 w-1/3 bg-zinc-200/60 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
