-- Migration: 20260725000002_barista_pins.sql
-- Description: Tabel PIN 6-digit Barista Kedai Kopi

CREATE TABLE IF NOT EXISTS public.barista_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_code VARCHAR(6) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert PIN default
INSERT INTO public.barista_pins (pin_code, name)
VALUES ('123456', 'Barista Utama')
ON CONFLICT (pin_code) DO NOTHING;
