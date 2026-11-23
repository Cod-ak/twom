export default function AccountLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-4 md:px-6 animate-pulse">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2 mb-8">
          <div className="h-3 w-28 bg-zinc-200/80 rounded-full font-mono" />
          <div className="h-10 w-48 bg-zinc-200 rounded-md" />
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="h-5 w-36 bg-zinc-200 rounded-md" />
          <div className="space-y-3">
            <div className="h-11 w-full bg-zinc-100 rounded-lg border border-zinc-200/60" />
            <div className="h-11 w-full bg-zinc-100 rounded-lg border border-zinc-200/60" />
          </div>
          <div className="h-12 w-full bg-zinc-300 rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
}
