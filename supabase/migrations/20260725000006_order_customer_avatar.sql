-- Migration: 20260725000006_order_customer_avatar.sql
-- Description: Tambah kolom customer_avatar_url pada tabel orders untuk menyimpan foto profil pelanggan yang login

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_avatar_url TEXT;
