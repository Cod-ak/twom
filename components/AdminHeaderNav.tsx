"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { adminSignOut } from "@/app/admin/(dashboard)/actions";

interface AdminHeaderNavProps {
  currentTab?: "overview" | "products" | "orders" | "hero" | "customers" | "promos";
  userEmail?: string;
}

const ADMIN_NAV_ITEMS = [
  {
    id: "overview",
    href: "/admin",
    label: "Overview",
    description: "Revenue, daily sales & atelier performance",
    badge: "Dashboard",
  },
  {
    id: "products",
    href: "/admin/products",
    label: "All Products",
    description: "Piece catalogue, pricing & stock quantities",
    badge: "Inventory",
  },
  {
    id: "orders",
    href: "/admin/orders",
    label: "Orders",
    description: "Fulfillment, courier waybills & delivery updates",
    badge: "Fulfillment",
  },
  {
    id: "promos",
    href: "/admin/promos",
    label: "Promo Codes",
    description: "Discount campaigns, limits & thresholds",
    badge: "Promotions",
  },
  {
    id: "customers",
    href: "/admin/customers",
    label: "Customers",
    description: "Client profiles & lifetime purchase history",
    badge: "CRM",
  },
  {
    id: "hero",
    href: "/admin/hero",
    label: "Hero CMS",
    description: "Homepage campaign video & showcase banners",
    badge: "CMS",
  },
] as const;

export default function AdminHeaderNav({
  currentTab = "overview",
  userEmail,
}: AdminHeaderNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeItem =
    ADMIN_NAV_ITEMS.find((item) => item.id === currentTab) || ADMIN_NAV_ITEMS[0];

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <header className="mb-6 pb-5 border-b border-zinc-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Brand Title & Workspace Dropdown Switcher */}
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-twom-muted font-mono block">
            Atelier Management
          </span>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-0.5">
            <h1 className="font-zodiak text-2xl sm:text-3xl text-twom-title leading-tight">
              Admin Portal
            </h1>

            <span className="text-zinc-300 text-lg font-light">/</span>

            {/* Minimalist Dropdown Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-black px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs uppercase tracking-wider font-bold text-black transition-all shadow-xs cursor-pointer"
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                <span>{activeItem.label}</span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-widest font-normal bg-zinc-100 px-1.5 py-0.5 rounded-sm">
                  {activeItem.badge}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-zinc-500 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown Floating Menu */}
              {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 border-b border-zinc-100 mb-1">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">
                      Switch Workspace Section
                    </span>
                  </div>
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = item.id === currentTab;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-start justify-between gap-3 px-3.5 py-2.5 hover:bg-zinc-50 transition-colors ${
                          isActive ? "bg-zinc-50/90" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs uppercase tracking-wider ${
                                isActive
                                  ? "font-black text-black"
                                  : "font-medium text-zinc-700"
                              }`}
                            >
                              {item.label}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-black" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-normal">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-sm shrink-0 self-center">
                          {item.badge}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {userEmail && (
            <p className="text-[11px] text-twom-muted font-mono mt-1.5">
              Signed in as {userEmail}
            </p>
          )}
        </div>

        {/* Right Side: Quick Action Links & Logout */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/products"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs uppercase tracking-wider text-twom-muted hover:text-black border border-zinc-200 hover:border-black transition-colors"
          >
            Live Store ↗
          </Link>

          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noreferrer"
            title="Open Vercel Web Analytics"
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs uppercase tracking-wider text-twom-muted hover:text-black border border-zinc-200 hover:border-black transition-colors"
          >
            Analytics ↗
          </a>

          <form action={adminSignOut}>
            <button
              type="submit"
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs uppercase tracking-wider text-zinc-600 border border-zinc-300 hover:text-black hover:border-black transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
