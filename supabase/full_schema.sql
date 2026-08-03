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
-- Migration: 20260725000002_barista_pins.sql
-- Description: Tabel PIN 6-digit Barista Kedai Kopi

CREATE TABLE IF NOT EXISTS public.barista_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_code VARCHAR(6) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert PIN default
INSERT INTO public.barista_pins (pin_code, name)
VALUES ('123456', 'Barista Utama')
ON CONFLICT (pin_code) DO NOTHING;
-- Migration: 20260725000003_staff_roles.sql
-- Description: Extend barista_pins menjadi tabel staff generik (barista + admin), lalu rename ke staff

-- Tambah kolom role (barista/admin)
ALTER TABLE public.barista_pins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'barista'
    CHECK (role IN ('barista', 'admin')),
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Buat pin_code nullable (admin tidak pakai pin)
ALTER TABLE public.barista_pins
  ALTER COLUMN pin_code DROP NOT NULL;

-- Hapus unique constraint lama pin_code (akan conflict jika NULL multiple)
ALTER TABLE public.barista_pins
  DROP CONSTRAINT IF EXISTS barista_pins_pin_code_key;

-- Buat unique constraint hanya untuk non-null pin_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_barista_pins_pin_code_unique
  ON public.barista_pins (pin_code)
  WHERE pin_code IS NOT NULL;

-- Unique index untuk email admin
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_email_unique
  ON public.barista_pins (email)
  WHERE email IS NOT NULL;

-- Rename tabel: barista_pins → staff
ALTER TABLE public.barista_pins RENAME TO staff;
-- Migration: 20260725000004_insert_admin.sql
-- Description: Insert akun admin ke tabel barista_pins (role=admin)
-- Password di bawah adalah SHA-256 dari password yang ditetapkan admin
-- Untuk generate ulang hash: node scripts/hash-admin-password.mjs

INSERT INTO public.staff (role, email, password, name, pin_code, is_active)
VALUES (
  'admin',
  'admin@kedaikopi.ahadi.my.id',
  'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
  'Admin Kedai Kopi',
  NULL,
  TRUE
)
ON CONFLICT DO NOTHING;
-- Migration: 20260725000005_add_dibatalkan_status.sql
-- Description: Tambah status 'Dibatalkan' pada tabel orders

-- Hapus CHECK constraint lama lalu buat yang baru dengan 'Dibatalkan'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'));
-- Migration: 20260725000006_order_customer_avatar.sql
-- Description: Tambah kolom customer_avatar_url pada tabel orders untuk menyimpan foto profil pelanggan yang login

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_avatar_url TEXT;
-- Migration: 20260725000007_clear_test_data.sql
-- Description: Membersihkan semua data transaksi/pesanan hasil pengujian (testing)

TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
-- Migration: 20260725000008_seed_real_menu.sql
-- Description: Menghapus menu lama dan memasukkan 75 item menu resmi Kedai Kopi

-- 1. Bersihkan seluruh menu dummy lama
TRUNCATE TABLE public.menu CASCADE;

-- 2. Insert 75 Menu Resmi Kedai Kopi
INSERT INTO public.menu (name, main_category, sub_category, price, points, description, images, is_available) VALUES
-- MAKANAN: Aneka Cireng
('Cireng Ayam', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng gurih isian ayam suwir bumbu pedas khas kedai', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Keju', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng renyah dengan isian keju leleh di dalamnya', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Jando', 'Makanan', 'Aneka Cireng', 5000, 250, 'Cireng gurih isian jando sapi pedas gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Chili Oil', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng crisp disiram chili oil rempah pedas', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Rujak', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng goreng hangat disajikan dengan bumbu rujak pedas manis', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Kuah Kaldu', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng hangat dalam kuah kaldu segar gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Kuah Creamy', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng hangat disiram kuah creamy gurih nikmat', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cireng Gochujang', 'Makanan', 'Aneka Cireng', 10000, 500, 'Cireng goreng dilapisi saus gochujang khas Korea', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MAKANAN: Toast
('Smoke Beef Toast', 'Makanan', 'Toast', 8000, 400, 'Roti panggang lembut dengan smoked beef gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Smoke Beef Cheese', 'Makanan', 'Toast', 11000, 550, 'Roti panggang dengan isi smoked beef dan keju melimpah', ARRAY['/img/kedai-kopi.jpeg'], true),
('Beef Toast', 'Makanan', 'Toast', 13000, 650, 'Toast hangat isian olahan daging sapi lezat', ARRAY['/img/kedai-kopi.jpeg'], true),
('Beef and Cheese', 'Makanan', 'Toast', 16000, 800, 'Toast isian daging sapi olahan bertabur keju keju leleh', ARRAY['/img/kedai-kopi.jpeg'], true),
('Choco Melt', 'Makanan', 'Toast', 10000, 500, 'Toast hangat dengan cokelat lumer manis gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Choco Cheese', 'Makanan', 'Toast', 12000, 600, 'Kombinasi klasik cokelat lumer dan keju parut gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Tiramisu Cheese', 'Makanan', 'Toast', 12000, 600, 'Toast dengan selai tiramisu lezat dilapisi keju', ARRAY['/img/kedai-kopi.jpeg'], true),
('Matcha Cheese', 'Makanan', 'Toast', 12000, 600, 'Toast khas dengan selai matcha Jepang dan keju', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MAKANAN: Rice Bowl
('Rice Bowl Nuget Mayo', 'Makanan', 'Rice Bowl', 15000, 750, 'Nasi hangat dengan nuget renyah dan topping mayonnaise creamy', ARRAY['/img/kedai-kopi.jpeg'], true),
('Rice Bowl Nuget Hot Lava', 'Makanan', 'Rice Bowl', 15000, 750, 'Nasi hangat dengan nuget dan siraman saus pedas hot lava', ARRAY['/img/kedai-kopi.jpeg'], true),
('Rice Bowl Karage Mayo', 'Makanan', 'Rice Bowl', 15000, 750, 'Nasi dengan chicken karage juicy disiram mayonnaise', ARRAY['/img/kedai-kopi.jpeg'], true),
('Rice Bowl Karage Hot Lava', 'Makanan', 'Rice Bowl', 15000, 750, 'Nasi dengan chicken karage crunchy dan saus hot lava pedas', ARRAY['/img/kedai-kopi.jpeg'], true),
('Rice Bowl Cumi Mercon', 'Makanan', 'Rice Bowl', 18000, 900, 'Nasi hangat dengan olahan cumi sambal mercon super pedas', ARRAY['/img/kedai-kopi.jpeg'], true),
('Nasi Ayam Sawang', 'Makanan', 'Rice Bowl', 20000, 1000, 'Nasi porsi kenyang dengan potongan ayam bumbu khas Sawang', ARRAY['/img/kedai-kopi.jpeg'], true),
('Nasi Ayam Cajo', 'Makanan', 'Rice Bowl', 20000, 1000, 'Nasi porsi kenyang dengan sajian ayam bumbu khas Cajo', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MAKANAN: Pangsit & Baso Aci
('Pangsit Ayam', 'Makanan', 'Pangsit & Baso Aci', 10000, 500, 'Pangsit olahan isi daging ayam gurih renyah', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pangsit Keju Lumer', 'Makanan', 'Pangsit & Baso Aci', 15000, 750, 'Pangsit goreng dengan isian keju yang meleleh saat digigit', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pangsit Kuah', 'Makanan', 'Pangsit & Baso Aci', 15000, 750, 'Pangsit lembut dalam sajian kuah kaldu pedas segar', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pangsit Kuah Keju', 'Makanan', 'Pangsit & Baso Aci', 15000, 750, 'Pangsit kuah gurih berpadu rasa keju creamy nikmat', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pangsit Chili Oil', 'Makanan', 'Pangsit & Baso Aci', 15000, 750, 'Pangsit dengan bumbu chili oil khas pedas menggugah selera', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pangsit Goreng', 'Makanan', 'Pangsit & Baso Aci', 16000, 800, 'Pangsit goreng bumbu spesial renyah gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Baso Aci', 'Makanan', 'Pangsit & Baso Aci', 13000, 650, 'Baso aci kenyal lengkap dengan sukro cikur dan kuah pedas', ARRAY['/img/kedai-kopi.jpeg'], true),
('Baso Aci Kuah Creamy', 'Makanan', 'Pangsit & Baso Aci', 15000, 750, 'Baso aci dalam perpaduan kuah creamy dan rempah pilihan', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MAKANAN: Spaghetti & Ramen
('Spaghetti Bolognese', 'Makanan', 'Spaghetti & Ramen', 10000, 500, 'Spaghetti al dente disiram saus bolognese daging gurih manis', ARRAY['/img/kedai-kopi.jpeg'], true),
('Spaghetti Aglio Olio', 'Makanan', 'Spaghetti & Ramen', 10000, 500, 'Spaghetti klasik tumis minyak zaitun, bawang putih dan cabai', ARRAY['/img/kedai-kopi.jpeg'], true),
('Spaghetti Carbonara', 'Makanan', 'Spaghetti & Ramen', 10000, 500, 'Spaghetti lembut disiram saus krim keju creamy', ARRAY['/img/kedai-kopi.jpeg'], true),
('Ramen Hakata', 'Makanan', 'Spaghetti & Ramen', 12000, 600, 'Ramen khas Jepang dengan kuah kaldu kaya rasa', ARRAY['/img/kedai-kopi.jpeg'], true),
('Ramen Yakitori', 'Makanan', 'Spaghetti & Ramen', 12000, 600, 'Ramen dengan topping potongan ayam yakitori lezat', ARRAY['/img/kedai-kopi.jpeg'], true),
('Ramen Spicy', 'Makanan', 'Spaghetti & Ramen', 12000, 600, 'Ramen kuah merah pedas cocok untuk pecinta pedas', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MAKANAN: Aneka Snack
('French Fries', 'Makanan', 'Aneka Snack', 10000, 500, 'Kentang goreng renyah bumbu gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Cheese Fries', 'Makanan', 'Aneka Snack', 15000, 750, 'Kentang goreng renyah disiram saus keju gurih melimpah', ARRAY['/img/kedai-kopi.jpeg'], true),
('Chicken Bites', 'Makanan', 'Aneka Snack', 15000, 750, 'Potongan daging ayam bites renyah saus lezat', ARRAY['/img/kedai-kopi.jpeg'], true),
('Mix Platter', 'Makanan', 'Aneka Snack', 15000, 750, 'Kombinasi camilan kentang, nuget dan sosis pilihan', ARRAY['/img/kedai-kopi.jpeg'], true),
('Basreng', 'Makanan', 'Aneka Snack', 10000, 500, 'Bakso goreng pedas gurih bumbu daun jeruk khas', ARRAY['/img/kedai-kopi.jpeg'], true),
('Banana Nuget', 'Makanan', 'Aneka Snack', 12000, 600, 'Nugget pisang renyah manis topping pilihan', ARRAY['/img/kedai-kopi.jpeg'], true),
('Ceker Mercon', 'Makanan', 'Aneka Snack', 10000, 500, 'Ceker ayam empuk dengan bumbu mercon super pedas', ARRAY['/img/kedai-kopi.jpeg'], true),
('Ice Cream Cemil', 'Makanan', 'Aneka Snack', 10000, 500, 'Es krim segar dan manis pendamping camilan', ARRAY['/img/kedai-kopi.jpeg'], true),
('Kul-Kul', 'Makanan', 'Aneka Snack', 5000, 250, 'Sate buah beku berselimut cokelat manis segar', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MINUMAN: Kopi Special
('Americano', 'Minuman', 'Kopi Special', 8000, 400, 'Espresso murni dingin segar tanpa gula', ARRAY['/img/kedai-kopi.jpeg'], true),
('Creamy Aren', 'Minuman', 'Kopi Special', 13000, 650, 'Kopi susu gula aren khas Kedai Kopi manis creamy', ARRAY['/img/kedai-kopi.jpeg'], true),
('Butterscotch', 'Minuman', 'Kopi Special', 13000, 650, 'Espresso dengan paduan sirup butterscotch manis manis gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Salted Caramel', 'Minuman', 'Kopi Special', 13000, 650, 'Kopi espresso berpadu manis asin salted caramel', ARRAY['/img/kedai-kopi.jpeg'], true),
('Heazelnut Latte', 'Minuman', 'Kopi Special', 13000, 650, 'Latte dingin dengan rasa khas kacang hazelnut yang harum', ARRAY['/img/kedai-kopi.jpeg'], true),
('Vanilla Latte', 'Minuman', 'Kopi Special', 13000, 650, 'Kopi susu espresso halus beraroma vanila manis', ARRAY['/img/kedai-kopi.jpeg'], true),
('Creamy Latte', 'Minuman', 'Kopi Special', 13000, 650, 'Kopi susu espresso ekstra creamy dan lembut di lidah', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pandan Latte', 'Minuman', 'Kopi Special', 13000, 650, 'Kopi susu beraroma pandan harum manis alami', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MINUMAN: Milk Series
('Ocean Blue Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar rasa ocean blue unik dan menyegarkan', ARRAY['/img/kedai-kopi.jpeg'], true),
('Raspberry Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar berpadu manis asam rasberry segar', ARRAY['/img/kedai-kopi.jpeg'], true),
('Manggo Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar dengan rasa buah mangga manis tropis', ARRAY['/img/kedai-kopi.jpeg'], true),
('Orange Milk', 'Minuman', 'Milk Series', 10000, 500, 'Paduan susu segar dan rasa jeruk manis segar', ARRAY['/img/kedai-kopi.jpeg'], true),
('Melon Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar rasa buah melon harum manis', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pandan Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar manis beraroma wangi pandan alami', ARRAY['/img/kedai-kopi.jpeg'], true),
('Brown Sugar Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar dingin berpadu sirup brown sugar gurih', ARRAY['/img/kedai-kopi.jpeg'], true),
('Heazelnut Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu segar dingin kaya aroma hazelnut nikmat', ARRAY['/img/kedai-kopi.jpeg'], true),
('Chocolate Milk', 'Minuman', 'Milk Series', 10000, 500, 'Susu cokelat pekat klasik favorit manis gurih', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MINUMAN: Yakult Series
('Raspbery Yakult', 'Minuman', 'Yakult Series', 12000, 600, 'Kesegaran Yakult berpadu sirup raspberry manis asam', ARRAY['/img/kedai-kopi.jpeg'], true),
('Manggo Yakult', 'Minuman', 'Yakult Series', 12000, 600, 'Minuman Yakult rasa buah mangga tropis segar', ARRAY['/img/kedai-kopi.jpeg'], true),
('Orange Yakult', 'Minuman', 'Yakult Series', 12000, 600, 'Perpaduan Yakult dan rasa jeruk segar melepas dahaga', ARRAY['/img/kedai-kopi.jpeg'], true),
('Melon Yakult', 'Minuman', 'Yakult Series', 12000, 600, 'Minuman Yakult berpadu sari melon manis segar', ARRAY['/img/kedai-kopi.jpeg'], true),
('Pandan Yakult', 'Minuman', 'Yakult Series', 12000, 600, 'Yakult segar beraroma harum manis pandan', ARRAY['/img/kedai-kopi.jpeg'], true),
('Blue Yakult', 'Minuman', 'Yakult Series', 12000, 600, 'Perpaduan Yakult dan ocean blue menyegarkan', ARRAY['/img/kedai-kopi.jpeg'], true),

-- MINUMAN: Non-Coffee & Tea
('Thai Tea', 'Minuman', 'Non-Coffee & Tea', 10000, 500, 'Teh Thailand dengan racikan susu manis legit', ARRAY['/img/kedai-kopi.jpeg'], true),
('Green Tea', 'Minuman', 'Non-Coffee & Tea', 10000, 500, 'Teh hijau susu rasa khas harum menyegarkan', ARRAY['/img/kedai-kopi.jpeg'], true),
('Teh Tarik', 'Minuman', 'Non-Coffee & Tea', 10000, 500, 'Kombinasi teh dan susu khas ditarik nikmat hangat/dingin', ARRAY['/img/kedai-kopi.jpeg'], true),
('Lemon Tea', 'Minuman', 'Non-Coffee & Tea', 6000, 300, 'Teh lemon dingin rasa manis asam segar', ARRAY['/img/kedai-kopi.jpeg'], true),
('Ice Tea', 'Minuman', 'Non-Coffee & Tea', 5000, 250, 'Es teh manis segar pelepas dahaga klasik', ARRAY['/img/kedai-kopi.jpeg'], true),
('Mineral', 'Minuman', 'Non-Coffee & Tea', 3000, 150, 'Air mineral kemasan dingin/biasa', ARRAY['/img/kedai-kopi.jpeg'], true);
-- Migration: 20260725000009_add_updated_at_to_menu.sql
-- Description: Tambahkan kolom updated_at pada tabel menu dan trigger update otomatis

ALTER TABLE public.menu
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set updated_at sama dengan created_at untuk data yang sudah ada
UPDATE public.menu
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Trigger untuk update updated_at otomatis saat ada perubahan data
CREATE OR REPLACE FUNCTION update_menu_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_updated_at ON public.menu;

CREATE TRIGGER update_menu_updated_at
    BEFORE UPDATE ON public.menu
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_updated_at_column();
-- Migration: Add claimed_points column to orders table for point redemption tracking & refund logic
ALTER TABLE orders ADD COLUMN IF NOT EXISTS claimed_points INT DEFAULT 0;
-- Migration: Add composite index on orders table for fast status & created_at filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON public.orders (status, created_at DESC);
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

-- Seed initial values for store profile (nama, alamat, gmaps, wa, sosmed) in app_settings
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES
  ('store_name', 'Kedai Moods'),
  ('store_address', 'Ruko Al Husna, Saga, Balaraja, Tangerang'),
  ('store_gmaps_url', 'https://maps.app.goo.gl/2hRMrayrZaikFNJE9'),
  ('store_gmaps_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6277641360034!2d106.44956541040813!3d-6.1805515937810735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e42010044931867%3A0x2f67710304f9cfde!2skedai%20moods!5e0!3m2!1sid!2sid!4v1785730808937!5m2!1sid!2sid'),
  ('store_whatsapp', '6285718820152'),
  ('store_instagram', 'https://www.instagram.com/kedai.moods_/'),
  ('store_tiktok', 'https://tiktok.com/@kedaikopi.official'),
  ('store_shopeefood', 'https://shopee.co.id/universal-link/now-food/shop/kedaikopi'),
  ('store_gofood', 'https://gofood.link/a/kedaikopi')
ON CONFLICT (setting_key) DO NOTHING;
