"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";
import type { CustomerSummary, OrderStatus } from "@/lib/types";

interface AdminCustomersTableProps {
  initialCustomers: CustomerSummary[];
}

type FilterTier = "all" | "vip" | "repeat" | "leads";
type SortOption = "spend-desc" | "orders-desc" | "newest";

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "processing":
      return "bg-violet-50 text-violet-800 border-violet-200";
    case "shipped":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "delivered":
      return "bg-zinc-100 text-zinc-800 border-zinc-200";
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "cancelled":
    case "refunded":
    case "failed":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "No orders yet";
  try {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminCustomersTable({
  initialCustomers,
}: AdminCustomersTableProps) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<FilterTier>("all");
  const [sortBy, setSortBy] = useState<SortOption>("spend-desc");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // VIP threshold: ₦50,000 (5,000,000 kobo)
  const VIP_THRESHOLD_KOBO = 5000000;

  // Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    let result = [...initialCustomers];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    // Tier filter
    if (tierFilter === "vip") {
      result = result.filter((c) => c.lifetime_spend >= VIP_THRESHOLD_KOBO);
    } else if (tierFilter === "repeat") {
      result = result.filter((c) => c.orders_count >= 2);
    } else if (tierFilter === "leads") {
      result = result.filter((c) => c.orders_count === 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "spend-desc") {
        return b.lifetime_spend - a.lifetime_spend;
      }
      if (sortBy === "orders-desc") {
        return b.orders_count - a.orders_count;
      }
      if (sortBy === "newest") {
        return new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime();
      }
      return 0;
    });

    return result;
  }, [initialCustomers, search, tierFilter, sortBy]);

  // Aggregate stats
  const totalDirectory = initialCustomers.length;
  const payingCustomers = initialCustomers.filter((c) => c.orders_count > 0).length;
  const totalVolume = initialCustomers.reduce((acc, c) => acc + c.lifetime_spend, 0);
  const totalOrders = initialCustomers.reduce((acc, c) => acc + c.orders_count, 0);
  const aov = totalOrders > 0 ? Math.round(totalVolume / totalOrders) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Client Metrics Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
            Total Client Accounts
          </span>
          <p className="font-zodiak text-2xl sm:text-3xl font-bold text-twom-title mt-1.5">
            {totalDirectory}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            Registered accounts & guest buyers
          </p>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
            Paying Clients
          </span>
          <p className="font-zodiak text-2xl sm:text-3xl font-bold text-twom-title mt-1.5">
            {payingCustomers}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5 font-mono">
            {totalDirectory > 0
              ? `${Math.round((payingCustomers / totalDirectory) * 100)}% conversion rate`
              : "0%"}
          </p>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
            Lifetime Sales Volume
          </span>
          <p className="font-zodiak text-2xl sm:text-3xl font-bold text-twom-title mt-1.5">
            {formatNaira(totalVolume)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            Across {totalOrders} total orders
          </p>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
            Average Order Value (AOV)
          </span>
          <p className="font-zodiak text-2xl sm:text-3xl font-bold text-twom-title mt-1.5">
            {formatNaira(aov)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            Per fulfilled transaction
          </p>
        </div>
      </div>

      {/* 2. Search, Filter Pills & Sort Controls */}
      <div className="bg-white p-4 sm:p-5 border border-zinc-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name or email..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-300 rounded-lg placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-mono text-twom-muted">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs border border-zinc-300 px-3 py-2 rounded-lg bg-white text-zinc-700 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="spend-desc">Highest Spend (LTV)</option>
              <option value="orders-desc">Most Orders</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={() => setTierFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              tierFilter === "all"
                ? "bg-black text-white font-bold"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All Clients ({initialCustomers.length})
          </button>

          <button
            type="button"
            onClick={() => setTierFilter("vip")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              tierFilter === "vip"
                ? "bg-amber-600 text-white font-bold"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            ⭐ VIP (₦50k+ spend)
          </button>

          <button
            type="button"
            onClick={() => setTierFilter("repeat")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              tierFilter === "repeat"
                ? "bg-emerald-700 text-white font-bold"
                : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            🔄 Repeat Buyers (2+)
          </button>

          <button
            type="button"
            onClick={() => setTierFilter("leads")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              tierFilter === "leads"
                ? "bg-zinc-800 text-white font-bold"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Registered / No Orders
          </button>
        </div>
      </div>

      {/* 3. Customer Directory Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-twom-muted text-sm">No clients match your filter.</p>
            <button
              onClick={() => {
                setSearch("");
                setTierFilter("all");
              }}
              className="mt-2 text-xs font-mono uppercase tracking-wider text-black underline underline-offset-4 hover:opacity-75"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] uppercase tracking-widest text-twom-muted font-mono">
                  <th className="py-3.5 px-4 font-normal">Client</th>
                  <th className="py-3.5 px-4 font-normal">Status</th>
                  <th className="py-3.5 px-4 font-normal">Account</th>
                  <th className="py-3.5 px-4 font-normal">Orders</th>
                  <th className="py-3.5 px-4 font-normal">Lifetime Spend</th>
                  <th className="py-3.5 px-4 font-normal">Last Active</th>
                  <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredCustomers.map((customer) => {
                  const isVip = customer.lifetime_spend >= VIP_THRESHOLD_KOBO;
                  const isRepeat = customer.orders_count >= 2;
                  const initials = customer.name
                    ? customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : customer.email.slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-zinc-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-[11px] font-bold text-zinc-700 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-twom-title">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isVip ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            ⭐ VIP Client
                          </span>
                        ) : isRepeat ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Repeat Buyer
                          </span>
                        ) : customer.orders_count === 1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            1st Purchase
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                            Lead
                          </span>
                        )}
                      </td>

                      {/* Account Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                        {customer.is_registered ? (
                          <span className="text-zinc-800 font-medium">
                            ✓ Member
                          </span>
                        ) : (
                          <span className="text-zinc-400">Guest</span>
                        )}
                      </td>

                      {/* Order Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-twom-title">
                        {customer.orders_count}{" "}
                        {customer.orders_count === 1 ? "order" : "orders"}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-zodiak text-sm font-bold text-twom-title">
                        {formatNaira(customer.lifetime_spend)}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-500 text-[11px]">
                        {formatDate(customer.last_order_date || customer.first_seen)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                          }}
                          className="text-xs text-twom-title font-medium border border-zinc-200 hover:border-black px-3 py-1.5 rounded transition-colors"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Customer Profile & Order History Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fadeIn">
          <div className="bg-white border border-zinc-200 shadow-2xl p-6 sm:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400 block">
                  Client Profile & Purchase Log
                </span>
                <h3 className="font-zodiak text-2xl text-twom-title mt-0.5">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  {selectedCustomer.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-zinc-400 hover:text-black p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block">
                  Total Lifetime Spend
                </span>
                <p className="font-zodiak text-xl font-bold text-twom-title mt-0.5">
                  {formatNaira(selectedCustomer.lifetime_spend)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block">
                  Orders Completed
                </span>
                <p className="font-zodiak text-xl font-bold text-twom-title mt-0.5">
                  {selectedCustomer.orders_count}
                </p>
              </div>
            </div>

            {/* Address */}
            {selectedCustomer.latest_shipping_address && (
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block mb-1">
                  Primary Delivery Address
                </span>
                <p className="text-xs text-zinc-700 bg-zinc-50 p-3 rounded border border-zinc-100 leading-relaxed">
                  {selectedCustomer.latest_shipping_address}
                </p>
              </div>
            )}

            {/* Purchase History */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block mb-3">
                Order History ({selectedCustomer.orders.length})
              </span>

              {selectedCustomer.orders.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">
                  This client has not placed any orders yet.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
                  {selectedCustomer.orders.map((o) => (
                    <div
                      key={o.id}
                      className="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-twom-title">
                            #{o.id.slice(0, 8)}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-xs border ${getStatusBadge(
                              o.status
                            )}`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {formatDate(o.created_at)} &bull; {o.items_count}{" "}
                          {o.items_count === 1 ? "piece" : "pieces"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium text-twom-title">
                          {formatNaira(o.total_amount)}
                        </p>
                        <Link
                          href="/admin/orders"
                          className="text-[11px] text-blue-700 underline underline-offset-2 hover:text-blue-900 mt-0.5 inline-block"
                        >
                          Manage Order →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Dismiss */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 text-xs uppercase tracking-wider font-mono border border-zinc-300 hover:border-black rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
