"use client";

import { useState, useTransition } from "react";
import { PromoCode } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  createPromoCode,
  togglePromoActive,
  deletePromoCode,
} from "@/app/admin/(dashboard)/actions";

interface AdminPromosViewProps {
  initialPromos: PromoCode[];
}

export default function AdminPromosView({ initialPromos }: AdminPromosViewProps) {
  const [promos, setPromos] = useState<PromoCode[]>(initialPromos);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const activeCount = promos.filter((p) => p.is_active).length;
  const totalRedemptions = promos.reduce((sum, p) => sum + (p.used_count || 0), 0);

  const handleCopy = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode);
    setCopiedCode(promoCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggle = (promo: PromoCode) => {
    startTransition(async () => {
      const result = await togglePromoActive(promo.id, promo.is_active);
      if (!result?.error) {
        setPromos((prev) =>
          prev.map((p) =>
            p.id === promo.id ? { ...p, is_active: !p.is_active } : p
          )
        );
      }
    });
  };

  const handleDelete = (promo: PromoCode) => {
    if (!confirm(`Are you sure you want to delete promo code "${promo.code}"?`)) return;

    startTransition(async () => {
      const result = await deletePromoCode(promo.id);
      if (!result?.error) {
        setPromos((prev) => prev.filter((p) => p.id !== promo.id));
      }
    });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData();
    formData.set("code", code.trim().toUpperCase());
    formData.set("discount_type", discountType);
    formData.set("discount_value", discountValue);
    if (minOrder) formData.set("min_order_amount", minOrder);
    if (maxUses) formData.set("max_uses", maxUses);
    if (expiresAt) formData.set("expires_at", expiresAt);
    formData.set("scope", "all");

    startTransition(async () => {
      const result = await createPromoCode(formData);
      if (result?.error) {
        setFormError(result.error);
      } else {
        setShowCreateModal(false);
        // Refresh local preview
        const newPromo: PromoCode = {
          id: `temp-${Date.now()}`,
          code: code.trim().toUpperCase(),
          discount_type: discountType,
          discount_value:
            discountType === "fixed"
              ? Number(discountValue) * 100
              : Number(discountValue),
          min_order_amount: minOrder ? Number(minOrder) * 100 : 0,
          max_uses: maxUses ? Number(maxUses) : null,
          used_count: 0,
          scope: "all",
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setPromos([newPromo, ...promos]);
        // Reset form
        setCode("");
        setDiscountValue("10");
        setMinOrder("");
        setMaxUses("");
        setExpiresAt("");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
            Active Campaigns
          </span>
          <p className="text-2xl sm:text-3xl font-black font-nippo text-black">
            {activeCount}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Currently redeemable codes
          </span>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
            Total Redemptions
          </span>
          <p className="text-2xl sm:text-3xl font-black font-nippo text-emerald-700">
            {totalRedemptions}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Orders completed with promos
          </span>
        </div>

        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
            Quick Action
          </span>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-black text-white hover:bg-zinc-800 py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer"
          >
            + Create New Promo Code
          </button>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="font-zodiak text-xl text-twom-title">
              Atelier Promo Codes
            </h3>
            <p className="text-xs text-twom-muted mt-0.5">
              Manage discount campaigns, minimum thresholds, and redemption caps.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {promos.length} {promos.length === 1 ? "Code" : "Codes"}
          </span>
        </div>

        {promos.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs uppercase tracking-widest">
            No promo codes created yet. Click &quot;+ Create New Promo Code&quot; to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono uppercase tracking-wider text-[10px] text-zinc-500">
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Order</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {promos.map((promo) => {
                  const isExpired =
                    promo.expires_at &&
                    new Date(promo.expires_at).getTime() < Date.now();
                  const isMaxedOut =
                    typeof promo.max_uses === "number" &&
                    promo.max_uses > 0 &&
                    promo.used_count >= promo.max_uses;

                  const discountDisplay =
                    promo.discount_type === "percentage"
                      ? `${promo.discount_value}% OFF`
                      : `${formatNaira(promo.discount_value)} OFF`;

                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-black tracking-wider bg-zinc-100 px-2.5 py-1 rounded-sm border border-zinc-200">
                            {promo.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(promo.code)}
                            title="Copy Code"
                            className="text-[11px] text-zinc-400 hover:text-black transition-colors cursor-pointer"
                          >
                            {copiedCode === promo.code ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-black font-mono">
                        {discountDisplay}
                      </td>

                      <td className="py-4 px-4 font-mono text-zinc-600">
                        {promo.min_order_amount && promo.min_order_amount > 0
                          ? formatNaira(promo.min_order_amount)
                          : "None"}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-black">
                            {promo.used_count}
                          </span>
                          <span className="text-zinc-400">
                            / {promo.max_uses ? promo.max_uses : "∞"}
                          </span>
                        </div>
                        {isMaxedOut && (
                          <span className="text-[9px] uppercase font-mono text-rose-600 font-bold block mt-0.5">
                            Limit Reached
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px]">
                        {promo.expires_at ? (
                          <span className={isExpired ? "text-rose-600 font-bold" : "text-zinc-600"}>
                            {new Date(promo.expires_at).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-zinc-400">No Expiry</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(promo)}
                          disabled={isPending}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                            promo.is_active && !isExpired && !isMaxedOut
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200"
                          }`}
                        >
                          {promo.is_active && !isExpired && !isMaxedOut
                            ? "Active"
                            : "Disabled"}
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          disabled={isPending}
                          className="text-[11px] font-mono text-rose-600 hover:text-rose-900 transition-colors cursor-pointer"
                        >
                          Delete
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

      {/* Create Promo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-zodiak text-2xl text-twom-title">
                  Create Promo Campaign
                </h3>
                <p className="text-xs text-twom-muted mt-0.5">
                  Set up a discount code with custom limits and thresholds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-zinc-600 mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TWOM30, VIPGUEST"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-3 font-mono font-bold tracking-wider text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-black uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-zinc-600 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "percentage" | "fixed")
                    }
                    className="w-full p-3 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black cursor-pointer bg-white"
                  >
                    <option value="percentage">Percentage (% off)</option>
                    <option value="fixed">Fixed Naira (₦ off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-zinc-600 mb-1">
                    {discountType === "percentage" ? "Percentage (%) *" : "Amount (₦) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountType === "percentage" ? 100 : undefined}
                    placeholder={discountType === "percentage" ? "30" : "15000"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-zinc-600 mb-1">
                    Min. Cart Amount (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 (No minimum)"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-zinc-600 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-zinc-600 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs uppercase tracking-wider text-zinc-600 hover:text-black cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-black text-white hover:bg-zinc-800 px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
