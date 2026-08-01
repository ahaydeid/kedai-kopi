-- Migration: Add composite index on orders table for fast status & created_at filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON public.orders (status, created_at DESC);
