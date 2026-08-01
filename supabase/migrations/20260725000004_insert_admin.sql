-- Migration: 20260725000004_insert_admin.sql
-- Description: Insert akun admin ke tabel barista_pins (role=admin)
-- Password di bawah adalah SHA-256 dari password yang ditetapkan admin
-- Untuk generate ulang hash: node scripts/hash-admin-password.mjs

INSERT INTO public.staff (role, email, password, name, pin_code, is_active)
VALUES (
  'admin',
  'admin@kedaikopi.ahadi.my.id',
  'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
  'Admin Kedai Kopi',
  NULL,
  TRUE
)
ON CONFLICT DO NOTHING;
