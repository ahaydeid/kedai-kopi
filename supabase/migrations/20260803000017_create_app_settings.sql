-- Migration: 20260803000017_create_app_settings.sql
-- Description: Tabel key-value untuk menyimpan konfigurasi URL & pengaturan aplikasi

CREATE TABLE IF NOT EXISTS public.app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read app_settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert app_settings" ON public.app_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update app_settings" ON public.app_settings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete app_settings" ON public.app_settings
  FOR DELETE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;

-- Nilai awal bawaan
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES
  ('url_masuk_pelanggan', 'https://kedaikopi.ahadi.my.id'),
  ('url_masuk_staff', 'https://kedaikopi.ahadi.my.id')
ON CONFLICT (setting_key) DO NOTHING;
