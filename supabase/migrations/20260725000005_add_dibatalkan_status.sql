-- Migration: 20260725000005_add_dibatalkan_status.sql
-- Description: Tambah status 'Dibatalkan' pada tabel orders

-- Hapus CHECK constraint lama lalu buat yang baru dengan 'Dibatalkan'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'));
