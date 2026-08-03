-- Migration: 20260803000019_add_slug_to_menus.sql
-- Description: Add slug column to public.menus and populate initial slugs from name

-- 1. Add slug column if it does not exist
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Populate initial slugs for existing menu items using LOWER and REGEXP_REPLACE
UPDATE public.menus
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'),
    '^-+|-+$', '', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- 3. Ensure uniqueness by appending id suffix if there are duplicates
UPDATE public.menus m1
SET slug = m1.slug || '-' || SUBSTRING(m1.id::text FROM 1 FOR 6)
WHERE EXISTS (
  SELECT 1 FROM public.menus m2
  WHERE m2.slug = m1.slug AND m2.id <> m1.id
);

-- 4. Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_menus_slug ON public.menus (slug);
