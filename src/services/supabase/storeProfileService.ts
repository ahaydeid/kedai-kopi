import { createClient } from './client'

export interface StoreProfile {
  storeName: string
  address: string
  gmapsUrl: string
  gmapsEmbedUrl: string
  whatsapp: string
  instagramUrl: string
  tiktokUrl: string
  shopeefoodUrl: string
  gofoodUrl: string
}

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: 'Kedai Moods',
  address: 'Ruko Al Husna, Saga, Balaraja, Tangerang',
  gmapsUrl: 'https://maps.app.goo.gl/2hRMrayrZaikFNJE9',
  gmapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6277641360034!2d106.44956541040813!3d-6.1805515937810735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e42010044931867%3A0x2f67710304f9cfde!2skedai%20moods!5e0!3m2!1sid!2sid!4v1785730808937!5m2!1sid!2sid',
  whatsapp: '6285718820152',
  instagramUrl: 'https://www.instagram.com/kedai.moods_/',
  tiktokUrl: 'https://tiktok.com/@kedaikopi.official',
  shopeefoodUrl: 'https://shopee.co.id/universal-link/now-food/shop/kedaikopi',
  gofoodUrl: 'https://gofood.link/a/kedaikopi',
}

const LOCAL_KEY = 'store_profile_cache_v1'
let profileMemoryCache: StoreProfile | null = null

export function getCachedStoreProfileSync(): StoreProfile {
  if (profileMemoryCache) return profileMemoryCache
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        profileMemoryCache = { ...DEFAULT_STORE_PROFILE, ...parsed }
        return profileMemoryCache!
      }
    } catch {}
  }
  return DEFAULT_STORE_PROFILE
}

export async function getStoreProfile(): Promise<StoreProfile> {
  const localFallback = getCachedStoreProfileSync()

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'store_name',
        'store_address',
        'store_gmaps_url',
        'store_gmaps_embed',
        'store_whatsapp',
        'store_instagram',
        'store_tiktok',
        'store_shopeefood',
        'store_gofood',
      ])

    if (!error && data && data.length > 0) {
      const getVal = (key: string, fallback: string) => {
        const row = data.find((r) => r.setting_key === key)
        return row?.setting_value || fallback
      }

      const result: StoreProfile = {
        storeName: getVal('store_name', localFallback.storeName),
        address: getVal('store_address', localFallback.address),
        gmapsUrl: getVal('store_gmaps_url', localFallback.gmapsUrl),
        gmapsEmbedUrl: getVal('store_gmaps_embed', localFallback.gmapsEmbedUrl),
        whatsapp: getVal('store_whatsapp', localFallback.whatsapp),
        instagramUrl: getVal('store_instagram', localFallback.instagramUrl),
        tiktokUrl: getVal('store_tiktok', localFallback.tiktokUrl),
        shopeefoodUrl: getVal('store_shopeefood', localFallback.shopeefoodUrl),
        gofoodUrl: getVal('store_gofood', localFallback.gofoodUrl),
      }

      profileMemoryCache = result
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(result))
      }
      return result
    }
  } catch (err) {
    console.warn('Error fetching store profile from Supabase:', err)
  }

  profileMemoryCache = localFallback
  return localFallback
}

export async function updateStoreProfile(profile: StoreProfile): Promise<boolean> {
  profileMemoryCache = profile
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile))
  }

  try {
    const supabase = createClient()
    const upsertData = [
      { setting_key: 'store_name', setting_value: profile.storeName, updated_at: new Date().toISOString() },
      { setting_key: 'store_address', setting_value: profile.address, updated_at: new Date().toISOString() },
      { setting_key: 'store_gmaps_url', setting_value: profile.gmapsUrl, updated_at: new Date().toISOString() },
      { setting_key: 'store_gmaps_embed', setting_value: profile.gmapsEmbedUrl, updated_at: new Date().toISOString() },
      { setting_key: 'store_whatsapp', setting_value: profile.whatsapp, updated_at: new Date().toISOString() },
      { setting_key: 'store_instagram', setting_value: profile.instagramUrl, updated_at: new Date().toISOString() },
      { setting_key: 'store_tiktok', setting_value: profile.tiktokUrl, updated_at: new Date().toISOString() },
      { setting_key: 'store_shopeefood', setting_value: profile.shopeefoodUrl, updated_at: new Date().toISOString() },
      { setting_key: 'store_gofood', setting_value: profile.gofoodUrl, updated_at: new Date().toISOString() },
    ]

    const { error } = await supabase
      .from('app_settings')
      .upsert(upsertData, { onConflict: 'setting_key' })

    if (error) {
      console.warn('Upsert store profile app_settings failed, saved locally:', error)
    }
    return true
  } catch (err) {
    console.warn('Supabase store profile error:', err)
    return true
  }
}
