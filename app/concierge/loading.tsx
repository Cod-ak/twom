export default function ConciergeLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4 animate-pulse">
      <div className="w-full space-y-6">
        <div className="space-y-2 mb-8">
          <div className="h-3 w-32 bg-zinc-200/80 rounded-full font-mono" />
          <div className="h-10 w-64 bg-zinc-200 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-6 bg-white border border-zinc-200/80 rounded-2xl space-y-3 shadow-xs"
            >
              <div className="h-5 w-36 bg-zinc-200 rounded-md" />
              <div className="h-3 w-full bg-zinc-200/60 rounded-md" />
              <div className="h-3 w-4/5 bg-zinc-200/60 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
