export default function ProductDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4 animate-pulse">
      <div className="w-full flex flex-col gap-5">
        {/* Top: Product Image Gallery */}
        <div className="w-full flex flex-col gap-4">
          <div className="aspect-[1/1.28] w-full bg-zinc-100 rounded-2xl border border-zinc-200/80 shadow-xs" />
          <div className="flex gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-300" />
            <div className="w-2 h-2 rounded-full bg-zinc-200" />
            <div className="w-2 h-2 rounded-full bg-zinc-200" />
          </div>
        </div>

        {/* Bottom: Atelier Details & Purchase Actions */}
        <div className="w-full flex flex-col gap-6 pt-2">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-zinc-200/80 rounded-full" />
            <div className="h-8 w-4/5 bg-zinc-200 rounded-md" />
            <div className="h-7 w-32 bg-zinc-200 rounded-md mt-2" />
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-200/80">
            <div className="h-3 w-20 bg-zinc-200/80 rounded-full" />
            <div className="flex gap-2">
              {["S", "M", "L", "XL"].map((s) => (
                <div
                  key={s}
                  className="w-12 h-10 rounded-lg bg-zinc-100 border border-zinc-200"
                />
              ))}
            </div>
          </div>

          <div className="h-14 w-full bg-zinc-300/80 rounded-full mt-2" />

          <div className="space-y-3 pt-6 border-t border-zinc-200/80">
            <div className="h-4 w-full bg-zinc-200/60 rounded-md" />
            <div className="h-4 w-5/6 bg-zinc-200/60 rounded-md" />
            <div className="h-4 w-2/3 bg-zinc-200/60 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
