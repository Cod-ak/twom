-- ============================================================
-- MIGRATION: Promo Codes Table & RLS Security
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create table if not exists (in case running from scratch)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category', 'product')),
  applicable_categories TEXT[] DEFAULT NULL,
  applicable_products TEXT[] DEFAULT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (Resolves Supabase Security Advisor Alert)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 3. Restrict all direct PostgREST client queries to Admins only
DROP POLICY IF EXISTS "Admins full access to promo codes" ON public.promo_codes;
CREATE POLICY "Admins full access to promo codes"
  ON public.promo_codes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Atomic row-locking increment function (used by Paystack webhook)
CREATE OR REPLACE FUNCTION public.increment_promo_usage(promo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE id = promo_id;
END;
$$;
