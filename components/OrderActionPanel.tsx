"use client";

import { useState, useTransition } from "react";
import { acknowledgeOrder, dispatchOrder, cancelAndRefundOrder } from "@/app/admin/(dashboard)/actions";
import type { OrderStatus } from "@/lib/types";

const COURIERS = [
  "GIG Logistics",
  "DHL Nigeria",
  "Red Star Express",
  "Kwik",
  "Other",
];

interface OrderActionPanelProps {
  orderId: string;
  currentStatus: OrderStatus;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export default function OrderActionPanel({
  orderId,
  currentStatus,
  courierName,
  trackingNumber,
  trackingUrl,
}: OrderActionPanelProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(COURIERS[0]);
  const [waybill, setWaybill] = useState("");

  // Cancel confirm state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState("");

  const setFeedback = (err: string | null, msg: string | null) => {
    setError(err);
    setSuccess(msg);
  };

  // ── Action: Acknowledge (PAID → PROCESSING) ──────────────────────────────
  const handleAcknowledge = () => {
    setFeedback(null, null);
    startTransition(async () => {
      const result = await acknowledgeOrder(orderId);
      if (result?.error) {
        setFeedback(result.error, null);
      } else {
        setStatus("processing");
        setFeedback(null, "Order acknowledged. Begin packaging.");
      }
    });
  };

  // ── Action: Dispatch (PROCESSING → SHIPPED) ──────────────────────────────
  const handleDispatch = () => {
    if (!waybill.trim()) {
      setFeedback("Please enter the waybill / tracking number.", null);
      return;
    }
    setFeedback(null, null);
    const fd = new FormData();
    fd.set("courier_name", selectedCourier);
    fd.set("tracking_number", waybill.trim());

    startTransition(async () => {
      const result = await dispatchOrder(orderId, fd);
      if (result?.error) {
        setFeedback(result.error, null);
      } else {
        setStatus("shipped");
        setShowDispatchModal(false);
        setFeedback(null, "Order marked as dispatched. Customer notified by email.");
      }
    });
  };

  // ── Action: Cancel + Refund ───────────────────────────────────────────────
  const handleCancel = () => {
    if (cancelConfirmText.trim().toLowerCase() !== "confirm") {
      setFeedback("Type CONFIRM to proceed with cancellation.", null);
      return;
    }
    setFeedback(null, null);
    startTransition(async () => {
      const result = await cancelAndRefundOrder(orderId);
      if (result?.error) {
        setFeedback(result.error, null);
      } else {
        setStatus("cancelled");
        setShowCancelConfirm(false);
        setFeedback(null, "Order cancelled. Paystack refund initiated. Customer notified.");
      }
    });
  };

  // ── Render: Closed states (no actions) ───────────────────────────────────
  if (["pending", "cancelled", "failed", "delivered", "refunded"].includes(status)) {
    return (
      <div className="mt-4 w-full md:w-auto">
        <p className="text-[10px] uppercase tracking-widest text-twom-muted font-mono mb-2">
          Order Status
        </p>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] uppercase tracking-wider font-semibold ${getBadgeStyle(status)}`}>
          {getStatusLabel(status)}
        </div>
        {status === "pending" && (
          <p className="text-[11px] text-zinc-400 mt-2 max-w-[200px]">
            Awaiting Paystack payment confirmation.
          </p>
        )}
      </div>
    );
  }

  // ── Render: SHIPPED — show tracking info, no admin action needed ──────────
  if (status === "shipped") {
    const resolvedTracking = trackingNumber ?? undefined;
    const resolvedUrl = trackingUrl ?? undefined;
    return (
      <div className="mt-4 w-full md:w-auto">
        <p className="text-[10px] uppercase tracking-widest text-twom-muted font-mono mb-2">
          Order Status
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-800 border-blue-200 mb-3">
          In Transit
        </div>
        {courierName && (
          <div className="text-xs text-zinc-600 space-y-1">
            <p><span className="text-zinc-400 uppercase tracking-wider text-[10px] font-mono">Courier:</span> {courierName}</p>
            {resolvedTracking && (
              <p><span className="text-zinc-400 uppercase tracking-wider text-[10px] font-mono">Waybill:</span> {resolvedTracking}</p>
            )}
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-[11px] uppercase tracking-wider text-blue-700 underline underline-offset-2 hover:text-blue-900 transition-colors"
              >
                Track on {courierName} →
              </a>
            )}
          </div>
        )}
        <p className="text-[11px] text-zinc-400 mt-3 max-w-[200px] leading-relaxed">
          Awaiting customer delivery confirmation.
        </p>
        {success && <p className="text-[11px] text-emerald-700 mt-2">{success}</p>}
      </div>
    );
  }

  // ── Render: PAID — Acknowledge button ─────────────────────────────────────
  if (status === "paid") {
    return (
      <div className="mt-4 w-full md:w-auto space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-twom-muted font-mono">
          Order Status
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
          Payment Confirmed ✓
        </div>

        <button
          onClick={handleAcknowledge}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-twom-title text-white px-4 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "📋 Acknowledge Order"}
        </button>

        <button
          onClick={() => { setShowCancelConfirm(true); setFeedback(null, null); }}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 border border-rose-300 text-rose-700 px-4 py-2 text-xs uppercase tracking-wider hover:bg-rose-50 transition-colors disabled:opacity-50"
        >
          ↩ Cancel & Refund
        </button>

        {error && <p className="text-[11px] text-rose-600">{error}</p>}
        {success && <p className="text-[11px] text-emerald-700">{success}</p>}

        {/* Cancel Confirm Modal */}
        {showCancelConfirm && (
          <CancelModal
            isPending={isPending}
            confirmText={cancelConfirmText}
            onChange={setCancelConfirmText}
            onConfirm={handleCancel}
            onDismiss={() => { setShowCancelConfirm(false); setCancelConfirmText(""); setFeedback(null, null); }}
            error={error}
          />
        )}
      </div>
    );
  }

  // ── Render: PROCESSING — Dispatch button ──────────────────────────────────
  if (status === "processing") {
    return (
      <div className="mt-4 w-full md:w-auto space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-twom-muted font-mono">
          Order Status
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] uppercase tracking-wider font-semibold bg-violet-50 text-violet-800 border-violet-200">
          Packaging in Atelier
        </div>

        <button
          onClick={() => { setShowDispatchModal(true); setFeedback(null, null); }}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-twom-title text-white px-4 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📦 Mark as Dispatched
        </button>

        <button
          onClick={() => { setShowCancelConfirm(true); setFeedback(null, null); }}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 border border-rose-300 text-rose-700 px-4 py-2 text-xs uppercase tracking-wider hover:bg-rose-50 transition-colors disabled:opacity-50"
        >
          ↩ Cancel & Refund
        </button>

        {error && <p className="text-[11px] text-rose-600">{error}</p>}
        {success && <p className="text-[11px] text-emerald-700">{success}</p>}

        {/* Dispatch Modal */}
        {showDispatchModal && (
          <DispatchModal
            isPending={isPending}
            selectedCourier={selectedCourier}
            waybill={waybill}
            onCourierChange={setSelectedCourier}
            onWaybillChange={setWaybill}
            onConfirm={handleDispatch}
            onDismiss={() => { setShowDispatchModal(false); setWaybill(""); setFeedback(null, null); }}
            error={error}
          />
        )}

        {/* Cancel Confirm Modal */}
        {showCancelConfirm && (
          <CancelModal
            isPending={isPending}
            confirmText={cancelConfirmText}
            onChange={setCancelConfirmText}
            onConfirm={handleCancel}
            onDismiss={() => { setShowCancelConfirm(false); setCancelConfirmText(""); setFeedback(null, null); }}
            error={error}
          />
        )}
      </div>
    );
  }

  return null;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DispatchModal({
  isPending,
  selectedCourier,
  waybill,
  onCourierChange,
  onWaybillChange,
  onConfirm,
  onDismiss,
  error,
}: {
  isPending: boolean;
  selectedCourier: string;
  waybill: string;
  onCourierChange: (v: string) => void;
  onWaybillChange: (v: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-zinc-200 shadow-xl p-6 w-full max-w-sm">
        <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-zinc-400 block mb-1">
          Dispatch Details
        </span>
        <h3 className="font-zodiak text-xl text-twom-title mb-5">Mark as Dispatched</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-mono text-zinc-500 mb-1.5">
              Courier *
            </label>
            <select
              value={selectedCourier}
              onChange={(e) => onCourierChange(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-zinc-300 bg-white text-twom-title focus:outline-none focus:border-twom-title transition-colors"
            >
              {COURIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-mono text-zinc-500 mb-1.5">
              Waybill / Tracking Number *
            </label>
            <input
              type="text"
              value={waybill}
              onChange={(e) => onWaybillChange(e.target.value)}
              placeholder="e.g. GIG-2024-001234"
              className="w-full px-3 py-2.5 text-xs border border-zinc-300 bg-white text-twom-title placeholder:text-zinc-400 focus:outline-none focus:border-twom-title transition-colors font-mono"
            />
          </div>

          {error && <p className="text-[11px] text-rose-600">{error}</p>}

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            A dispatch confirmation email with the tracking number will be sent automatically to the customer.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onDismiss}
              disabled={isPending}
              className="flex-1 border border-zinc-300 text-zinc-600 py-2.5 text-xs uppercase tracking-wider hover:border-black hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending || !waybill.trim()}
              className="flex-1 bg-twom-title text-white py-2.5 text-xs uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Confirm Dispatch →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  isPending,
  confirmText,
  onChange,
  onConfirm,
  onDismiss,
  error,
}: {
  isPending: boolean;
  confirmText: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-rose-200 shadow-xl p-6 w-full max-w-sm">
        <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-rose-400 block mb-1">
          Irreversible Action
        </span>
        <h3 className="font-zodiak text-xl text-twom-title mb-2">Cancel & Refund Order</h3>
        <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
          This will cancel the order, restore inventory stock, and initiate a full Paystack refund to the customer. This action cannot be undone.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-mono text-zinc-500 mb-1.5">
              Type <span className="text-rose-600 font-bold">CONFIRM</span> to proceed
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => onChange(e.target.value)}
              placeholder="CONFIRM"
              className="w-full px-3 py-2.5 text-xs border border-rose-200 bg-white text-twom-title placeholder:text-zinc-400 focus:outline-none focus:border-rose-500 transition-colors font-mono uppercase"
            />
          </div>

          {error && <p className="text-[11px] text-rose-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onDismiss}
              disabled={isPending}
              className="flex-1 border border-zinc-300 text-zinc-600 py-2.5 text-xs uppercase tracking-wider hover:border-black hover:text-black transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending || confirmText.trim().toLowerCase() !== "confirm"}
              className="flex-1 bg-rose-600 text-white py-2.5 text-xs uppercase tracking-wider hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Processing..." : "Cancel & Refund"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBadgeStyle(status: OrderStatus): string {
  switch (status) {
    case "paid":        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "processing":  return "bg-violet-50 text-violet-800 border-violet-200";
    case "shipped":     return "bg-blue-50 text-blue-800 border-blue-200";
    case "delivered":   return "bg-teal-50 text-teal-800 border-teal-200";
    case "cancelled":
    case "refunded":    return "bg-rose-50 text-rose-800 border-rose-200";
    case "failed":      return "bg-red-50 text-red-800 border-red-200";
    case "pending":
    default:            return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":     return "Awaiting Payment";
    case "paid":        return "Payment Confirmed ✓";
    case "processing":  return "Packaging in Atelier";
    case "shipped":     return "In Transit";
    case "delivered":   return "Delivered ✓";
    case "cancelled":   return "Cancelled";
    case "refunded":    return "Refunded";
    case "failed":      return "Payment Failed";
    default:            return status;
  }
}
