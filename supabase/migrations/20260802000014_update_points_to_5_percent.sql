-- Migration: 20260802000014_update_points_to_5_percent.sql
-- Description: Update seluruh poin menu pada tabel public.menu menjadi 5% dari harga produk (price * 0.05)

UPDATE public.menu
SET points = ROUND(price * 0.05);
