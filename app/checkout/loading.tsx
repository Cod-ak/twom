export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] pb-16 px-4 animate-pulse">
      <div className="w-full">
        <div className="mb-8 pb-5 border-b border-zinc-200">
          <div className="h-4 w-24 bg-zinc-200 mb-3" />
          <div className="h-9 w-56 bg-zinc-200" />
        </div>

        <div className="flex flex-col gap-8">
          <div className="w-full space-y-6">
            <div className="h-4 w-40 bg-zinc-200 mb-6" />
            <div className="h-12 w-full bg-zinc-200" />
            <div className="h-12 w-full bg-zinc-200" />
            <div className="h-28 w-full bg-zinc-200" />
            <div className="h-14 w-full bg-zinc-300 mt-6" />
          </div>

          <div className="w-full">
            <div className="bg-white border border-zinc-200 p-5 space-y-4">
              <div className="h-4 w-36 bg-zinc-200 mb-6" />
              <div className="h-16 w-full bg-zinc-100" />
              <div className="h-16 w-full bg-zinc-100" />
              <div className="h-8 w-full bg-zinc-200 mt-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

