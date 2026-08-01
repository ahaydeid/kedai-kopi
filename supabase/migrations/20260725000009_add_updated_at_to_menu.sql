-- Migration: 20260725000009_add_updated_at_to_menu.sql
-- Description: Tambahkan kolom updated_at pada tabel menu dan trigger update otomatis

ALTER TABLE public.menu
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set updated_at sama dengan created_at untuk data yang sudah ada
UPDATE public.menu
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Trigger untuk update updated_at otomatis saat ada perubahan data
CREATE OR REPLACE FUNCTION update_menu_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_updated_at ON public.menu;

CREATE TRIGGER update_menu_updated_at
    BEFORE UPDATE ON public.menu
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_updated_at_column();
