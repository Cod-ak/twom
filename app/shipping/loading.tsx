export default function ShippingLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-4 md:px-6 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2 mb-8">
          <div className="h-3 w-32 bg-zinc-200/80 rounded-full font-mono" />
          <div className="h-10 sm:h-12 w-64 bg-zinc-200 rounded-md" />
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 bg-white border border-zinc-200/80 rounded-2xl space-y-3 shadow-xs"
            >
              <div className="h-5 w-48 bg-zinc-200 rounded-md" />
              <div className="h-3 w-full bg-zinc-200/60 rounded-md" />
              <div className="h-3 w-5/6 bg-zinc-200/60 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
