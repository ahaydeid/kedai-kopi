-- Migration: 20260802000016_create_tables_schema.sql
-- Description: Create master data tables table and link orders to tables

-- 1. Create tables master table
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 2,
  status VARCHAR(20) NOT NULL DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Penuh', 'Dipesan', 'Tidak tersedia')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add table_id reference to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Allow public read tables" ON public.tables
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert tables" ON public.tables
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update tables" ON public.tables
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete tables" ON public.tables
  FOR DELETE USING (true);

-- 5. Enable Realtime on tables table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- 6. Seed initial tables (Meja 01 - 15)
INSERT INTO public.tables (number, capacity, status)
VALUES
  ('01', 6, 'Tersedia'),
  ('02', 2, 'Tersedia'),
  ('03', 4, 'Tersedia'),
  ('04', 6, 'Tersedia'),
  ('05', 4, 'Tersedia'),
  ('06', 2, 'Tersedia'),
  ('07', 6, 'Tersedia'),
  ('08', 2, 'Tersedia'),
  ('09', 4, 'Tersedia'),
  ('10', 6, 'Tersedia'),
  ('11', 4, 'Tersedia'),
  ('12', 2, 'Tersedia'),
  ('13', 4, 'Tersedia'),
  ('14', 6, 'Tersedia'),
  ('15', 2, 'Tersedia')
ON CONFLICT (number) DO NOTHING;
