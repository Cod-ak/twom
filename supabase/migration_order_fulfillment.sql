-- ============================================================
-- MIGRATION: Order Fulfillment State Machine
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the old restrictive CHECK constraint on status
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add the new CHECK with all lifecycle states
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'processing',   -- Atelier has acknowledged & is packaging
    'shipped',      -- Handed to courier, waybill assigned
    'delivered',    -- Customer confirmed receipt
    'cancelled',    -- Cancelled before dispatch (Paystack refund issued)
    'refunded',     -- Post-payment refund processed
    'failed'        -- Payment failed
  ));

-- 3. Add fulfillment tracking columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_name     text,
  ADD COLUMN IF NOT EXISTS tracking_number  text,
  ADD COLUMN IF NOT EXISTS tracking_url     text,
  ADD COLUMN IF NOT EXISTS processing_at    timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at       timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at     timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at      timestamptz,
  ADD COLUMN IF NOT EXISTS refund_reference text;

-- 4. Restock function: adds back quantities when an order is cancelled
CREATE OR REPLACE FUNCTION public.restock_order_items(order_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.products p
  SET stock_quantity = p.stock_quantity + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = order_id_param
    AND oi.product_id = p.id;
END;
$$;

-- 5. Allow authenticated customers to mark their OWN shipped order as delivered
CREATE POLICY "Customers can mark their own order as delivered"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (customer_email = (SELECT auth.jwt() ->> 'email'))
  WITH CHECK (
    customer_email = (SELECT auth.jwt() ->> 'email')
    AND status = 'delivered'
  );

