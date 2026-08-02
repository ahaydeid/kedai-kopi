-- Migration: add order_type and table_number to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'dine_in',
ADD COLUMN IF NOT EXISTS table_number VARCHAR(10) DEFAULT NULL;
