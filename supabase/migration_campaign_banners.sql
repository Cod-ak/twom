-- ============================================================
-- MIGRATION: Unified Products + Campaign Banners + Featured Row
-- Safe cleanup of earlier unused draft tables, then additive setup.
-- Does NOT touch products, orders, hero_sections, promos, or profiles.
-- ============================================================

-- 0. Remove unused draft tables from the earlier 2-table design (if present)
DROP TABLE IF EXISTS public.campaign_banner_items CASCADE;
DROP TABLE IF EXISTS public.campaign_banners CASCADE;

-- 1. Extend existing products table to support Campaign Banners & Top Featured Row
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_campaign_banner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_title TEXT,
  ADD COLUMN IF NOT EXISTS banner_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Fast partial index for active homepage Campaign Banners
CREATE INDEX IF NOT EXISTS products_campaign_banners_idx
  ON public.products (banner_order ASC, created_at DESC)
  WHERE is_campaign_banner = true AND is_active = true;

-- Fast partial index for Top Featured Single Pieces
CREATE INDEX IF NOT EXISTS products_featured_idx
  ON public.products (created_at DESC)
  WHERE is_featured = true AND is_campaign_banner = false AND is_active = true;

-- 2. Create campaign_banner_items junction table (Apparel & Accessories breakdown)
CREATE TABLE public.campaign_banner_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  item_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tab_type TEXT NOT NULL CHECK (tab_type IN ('apparel', 'accessories')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_banner_item_tab UNIQUE (banner_product_id, item_product_id, tab_type)
);

-- Lookup index for fetching banner breakdown items by tab
CREATE INDEX campaign_banner_items_lookup_idx
  ON public.campaign_banner_items (banner_product_id, tab_type, sort_order ASC);

-- Foreign key index on item_product_id
CREATE INDEX campaign_banner_items_item_product_id_idx
  ON public.campaign_banner_items (item_product_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.campaign_banner_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Public can read breakdown items of active banners
DROP POLICY IF EXISTS "Public can view active campaign banner items" ON public.campaign_banner_items;
CREATE POLICY "Public can view active campaign banner items"
  ON public.campaign_banner_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products b
      WHERE b.id = campaign_banner_items.banner_product_id
        AND (b.is_active = true OR public.is_admin())
    )
  );

-- 5. RLS Policies: Admins have full CRUD access
DROP POLICY IF EXISTS "Admins have full access to campaign banner items" ON public.campaign_banner_items;
CREATE POLICY "Admins have full access to campaign banner items"
  ON public.campaign_banner_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Grant SELECT to anon/authenticated for storefront queries
GRANT SELECT ON public.campaign_banner_items TO anon, authenticated;
