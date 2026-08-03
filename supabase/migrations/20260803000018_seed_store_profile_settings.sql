-- Migration: 20260803000018_seed_store_profile_settings.sql
-- Description: Seed initial default values for store profile (nama, alamat, gmaps, wa, sosmed) into app_settings

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
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = NOW();
