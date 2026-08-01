-- Migration: 20260725000001_initial_schema.sql
-- Description: Initial schema setup for Kedai Kopi (Menu, Orders, Order Items, Indexes, and Realtime)

-- 1. Table Menu
CREATE TABLE IF NOT EXISTS public.menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    main_category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Menunggu', 'Diproses', 'Selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes (Free Tier Performance Optimization)
CREATE INDEX IF NOT EXISTS idx_menu_is_available ON public.menu(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_main_category ON public.menu(main_category);
CREATE INDEX IF NOT EXISTS idx_menu_sub_category ON public.menu(sub_category);
CREATE INDEX IF NOT EXISTS idx_menu_created_at ON public.menu(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 5. Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
