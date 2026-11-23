export default function StoryLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-16 md:pb-24 px-4 md:px-6 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-3 mb-8">
          <div className="h-3 w-28 bg-zinc-200/80 rounded-full font-mono" />
          <div className="h-10 sm:h-14 w-2/3 bg-zinc-200 rounded-md" />
        </div>

        <div className="space-y-4 max-w-none pt-2">
          <div className="h-7 w-4/5 bg-zinc-200/90 rounded-md mb-6" />
          <div className="h-4 w-full bg-zinc-200/60 rounded-md" />
          <div className="h-4 w-11/12 bg-zinc-200/60 rounded-md" />
          <div className="h-4 w-4/5 bg-zinc-200/60 rounded-md" />
        </div>

        {/* Atelier Principles Card Skeleton */}
        <div className="my-12 p-8 bg-white border border-zinc-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="h-6 w-44 bg-zinc-200 rounded-md mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-5/6 bg-zinc-200/70 rounded-md" />
            <div className="h-4 w-4/5 bg-zinc-200/70 rounded-md" />
            <div className="h-4 w-3/4 bg-zinc-200/70 rounded-md" />
          </div>
        </div>

        <div className="pt-6">
          <div className="h-12 w-56 bg-zinc-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
