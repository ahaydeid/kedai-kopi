-- Migration: Add claimed_points column to orders table for point redemption tracking & refund logic
ALTER TABLE orders ADD COLUMN IF NOT EXISTS claimed_points INT DEFAULT 0;
