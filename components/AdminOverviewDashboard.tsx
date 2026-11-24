"use client";

import Link from "next/link";
import Image from "next/image";
import { formatNaira } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  price: number;
  stock_quantity: number;
  image_url: string;
}

interface RecentOrderSummary {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  order_items: {
    quantity: number;
    products: { name: string } | null;
  }[];
}

interface OverviewMetrics {
  totalRevenue: number;
  todayRevenue: number;
  todayOrdersCount: number;
  totalOrdersCount: number;
  pendingFulfillmentCount: number;
  activeProductsCount: number;
  lowStockCount: number;
}

interface AdminOverviewDashboardProps {
  metrics: OverviewMetrics;
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrderSummary[];
}

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

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminOverviewDashboard({
  metrics,
  lowStockProducts,
  recentOrders,
}: AdminOverviewDashboardProps) {
  return (
    <div className="space-y-8">
      {/* 1. Executive Metrics Grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Total Gross Revenue */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs rounded-xl">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Total Gross Revenue
            </span>
            <p className="font-zodiak text-2xl sm:text-3xl text-twom-title mt-2 font-bold tracking-tight">
              {formatNaira(metrics.totalRevenue)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              From confirmed & fulfilled sales
            </p>
          </div>

          {/* Metric 2: Sales Today */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs rounded-xl">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Sales Today
            </span>
            <p className="font-zodiak text-2xl sm:text-3xl text-twom-title mt-2 font-bold tracking-tight">
              {formatNaira(metrics.todayRevenue)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              <span className="font-semibold text-emerald-700">{metrics.todayOrdersCount}</span> order(s) placed today
            </p>
          </div>

          {/* Metric 3: Orders Awaiting Fulfillment */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs rounded-xl">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              To Pack & Dispatch
            </span>
            <p className="font-zodiak text-2xl sm:text-3xl text-twom-title mt-2 font-bold tracking-tight">
              {metrics.pendingFulfillmentCount}
            </p>
            <Link
              href="/admin/orders"
              className="inline-block text-[11px] text-twom-title font-medium underline underline-offset-2 hover:opacity-75 transition-opacity mt-1"
            >
              Fulfill Orders →
            </Link>
          </div>

          {/* Metric 4: Inventory Health */}
          <div className="bg-white p-5 border border-zinc-200 shadow-xs rounded-xl">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Catalog Inventory
            </span>
            <p className="font-zodiak text-2xl sm:text-3xl text-twom-title mt-2 font-bold tracking-tight">
              {metrics.activeProductsCount} Pieces
            </p>
            {metrics.lowStockCount > 0 ? (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                ⚠️ {metrics.lowStockCount} running low (&lt; 5 stock)
              </p>
            ) : (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                ✓ All inventory well-stocked
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Low Stock Alerts (Only shown if any piece is low) */}
      {lowStockProducts.length > 0 && (
        <section className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-amber-800 font-bold block">
                Atelier Inventory Alert
              </span>
              <h3 className="font-zodiak text-xl text-twom-title mt-0.5">
                Low Stock Pieces ({lowStockProducts.length})
              </h3>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-mono uppercase tracking-wider text-amber-900 underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Manage all products →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-amber-200 p-3.5 rounded-lg flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-14 bg-zinc-100 shrink-0 rounded overflow-hidden">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-twom-title truncate">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {p.sku || p.category}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs mt-1 ${
                        p.stock_quantity === 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {p.stock_quantity === 0
                        ? "Out of Stock"
                        : `Only ${p.stock_quantity} left`}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/admin/products/${p.id}`}
                  className="shrink-0 text-xs text-twom-title font-medium border border-zinc-200 hover:border-black px-2.5 py-1.5 rounded transition-colors"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Quick Actions: Unified Publishing Hub */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Storefront Publishing
            </span>
            <h3 className="font-zodiak text-xl text-twom-title mt-0.5">
              Publish New Piece or Campaign Drop
            </h3>
            <p className="text-xs text-twom-muted mt-0.5">
              Create standalone garments or full-fit Campaign Banners with inline Apparel &amp; Accessories breakdown.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/products/new"
              className="px-4 py-2.5 text-xs uppercase tracking-wider font-medium rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
            >
              + Add Single Piece
            </Link>
            <Link
              href="/admin/products/new?mode=banner"
              className="px-4 py-2.5 text-xs uppercase tracking-wider font-medium rounded-lg border border-black text-black hover:bg-zinc-100 transition-colors"
            >
              + Create Campaign Banner
            </Link>
            <Link
              href="/admin/products"
              className="px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-600 hover:text-black underline underline-offset-4 transition-colors"
            >
              Curate ★ Featured →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Recent Customer Orders Snapshot */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-100">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-twom-muted block">
              Recent Transactions
            </span>
            <h3 className="font-zodiak text-xl text-twom-title mt-0.5">
              Latest Orders
            </h3>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-mono uppercase tracking-wider text-twom-title font-bold underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            View All Orders ({metrics.totalOrdersCount}) →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-twom-muted">No orders recorded yet.</p>
            <p className="text-xs text-zinc-400 mt-1">
              Customer checkouts will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-widest text-twom-muted font-mono">
                  <th className="py-3 px-2 font-normal">Order ID</th>
                  <th className="py-3 px-2 font-normal">Customer</th>
                  <th className="py-3 px-2 font-normal">Items</th>
                  <th className="py-3 px-2 font-normal">Date</th>
                  <th className="py-3 px-2 font-normal">Status</th>
                  <th className="py-3 px-2 font-normal text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {recentOrders.map((order) => {
                  const itemsCount = order.order_items?.reduce(
                    (acc, item) => acc + item.quantity,
                    0
                  ) || 0;
                  const firstItemName = order.order_items?.[0]?.products?.name || "Piece";
                  const itemsDescription =
                    itemsCount > 1
                      ? `${firstItemName} +${itemsCount - 1} more`
                      : firstItemName;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/80 transition-colors"
                    >
                      <td className="py-3 px-2 font-mono text-zinc-500">
                        {order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-twom-title">
                          {order.customer_name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate max-w-[160px]">
                          {order.customer_email}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-zinc-600 truncate max-w-[200px]">
                        {itemsDescription}
                      </td>
                      <td className="py-3 px-2 font-mono text-zinc-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-xs border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-twom-title whitespace-nowrap">
                        {formatNaira(order.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
