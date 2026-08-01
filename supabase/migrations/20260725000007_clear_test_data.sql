-- Migration: 20260725000007_clear_test_data.sql
-- Description: Membersihkan semua data transaksi/pesanan hasil pengujian (testing)

TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
