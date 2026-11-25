"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface StorefrontShellProps {
  children: ReactNode;
}

export default function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="min-h-dvh w-full bg-twom-bg text-twom-body flex flex-col">
        {children}
      </div>
    );
  }

  // Lock the entire customer storefront to a 430px mobile frame over Studio Dark (#0f0f11)
  return (
    <div className="min-h-dvh w-full bg-[#0f0f11] flex justify-center">
      <div className="w-full max-w-[430px] min-h-dvh bg-twom-bg text-twom-body relative shadow-[0_0_90px_rgba(0,0,0,0.75)] sm:border-x sm:border-white/10 overflow-x-clip flex flex-col">
        {children}
      </div>
    </div>
  );
}
