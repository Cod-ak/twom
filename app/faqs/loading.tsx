export default function FAQLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4 animate-pulse">
      <div className="w-full space-y-6">
        <div className="space-y-2 mb-8">
          <div className="h-3 w-28 bg-zinc-200/80 rounded-full font-mono" />
          <div className="h-10 w-64 bg-zinc-200 rounded-md" />
        </div>

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-5 bg-white border border-zinc-200/80 rounded-xl flex justify-between items-center shadow-xs"
            >
              <div className="h-4 w-2/3 bg-zinc-200/70 rounded-md" />
              <div className="w-5 h-5 bg-zinc-200/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
