-- Migration: 20260725000003_staff_roles.sql
-- Description: Extend barista_pins menjadi tabel staff generik (barista + admin), lalu rename ke staff

-- Tambah kolom role (barista/admin)
ALTER TABLE public.barista_pins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'barista'
    CHECK (role IN ('barista', 'admin')),
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Buat pin_code nullable (admin tidak pakai pin)
ALTER TABLE public.barista_pins
  ALTER COLUMN pin_code DROP NOT NULL;

-- Hapus unique constraint lama pin_code (akan conflict jika NULL multiple)
ALTER TABLE public.barista_pins
  DROP CONSTRAINT IF EXISTS barista_pins_pin_code_key;

-- Buat unique constraint hanya untuk non-null pin_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_barista_pins_pin_code_unique
  ON public.barista_pins (pin_code)
  WHERE pin_code IS NOT NULL;

-- Unique index untuk email admin
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_email_unique
  ON public.barista_pins (email)
  WHERE email IS NOT NULL;

-- Rename tabel: barista_pins → staff
ALTER TABLE public.barista_pins RENAME TO staff;
