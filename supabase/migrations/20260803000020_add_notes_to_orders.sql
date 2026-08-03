-- Migration: 20260803000020_add_notes_to_orders.sql
-- Description: Add notes column to public.orders table

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS notes TEXT;
