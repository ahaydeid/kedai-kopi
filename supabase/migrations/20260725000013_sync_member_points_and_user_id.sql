-- Migration: 20260725000013_sync_member_points_and_user_id.sql
-- Description: Sync user_id pada orders, points pada order_items, dan buat tabel member_points

-- 1. Tambahkan user_id pada tabel orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Tambahkan points pada tabel order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 3. Buat tabel member_points
CREATE TABLE IF NOT EXISTS public.member_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
