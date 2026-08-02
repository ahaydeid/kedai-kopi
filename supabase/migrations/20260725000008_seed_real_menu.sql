-- Migration: 20260725000008_seed_real_menu.sql
-- Description: Menghapus menu lama dan memasukkan 75 item menu resmi Kedai Kopi

-- 1. Bersihkan seluruh menu dummy lama
TRUNCATE TABLE public.menu CASCADE;

-- 2. Insert 75 Menu Resmi Kedai Kopi (Poin 5% dari harga)
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
