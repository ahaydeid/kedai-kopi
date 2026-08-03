import { createClient } from './client'

export interface AppUrlSettings {
  customerUrl: string
  staffUrl: string
}

let settingsMemoryCache: AppUrlSettings | null = null

export function getCachedSettingsSync(): AppUrlSettings | null {
  return settingsMemoryCache
}

export async function getAppUrlSettings(): Promise<AppUrlSettings> {
  const defaultDomain = typeof window !== 'undefined' ? window.location.origin : 'https://kedaikopi.ahadi.my.id'
  const localCustomer = typeof window !== 'undefined' ? localStorage.getItem('url_masuk_pelanggan') : null
  const localStaff = typeof window !== 'undefined' ? localStorage.getItem('url_masuk_staff') : null

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['url_masuk_pelanggan', 'url_masuk_staff'])

    if (!error && data && data.length > 0) {
      const customerRow = data.find((r) => r.setting_key === 'url_masuk_pelanggan')
      const staffRow = data.find((r) => r.setting_key === 'url_masuk_staff')

      const customerUrl = customerRow?.setting_value || localCustomer || defaultDomain
      const staffUrl = staffRow?.setting_value || localStaff || defaultDomain

      const result = { customerUrl, staffUrl }
      settingsMemoryCache = result

      if (typeof window !== 'undefined') {
        localStorage.setItem('url_masuk_pelanggan', customerUrl)
        localStorage.setItem('url_masuk_staff', staffUrl)
      }

      return result
    }
  } catch (err) {
    console.error('Error fetching settings from Supabase:', err)
  }

  const fallback = {
    customerUrl: localCustomer || defaultDomain,
    staffUrl: localStaff || defaultDomain,
  }
  settingsMemoryCache = fallback
  return fallback
}

export async function updateAppUrlSettings(settings: AppUrlSettings): Promise<boolean> {
  const cleanCustomer = settings.customerUrl.trim().replace(/\/+$/, '')
  const cleanStaff = settings.staffUrl.trim().replace(/\/+$/, '')

  const updatedSettings = { customerUrl: cleanCustomer, staffUrl: cleanStaff }
  settingsMemoryCache = updatedSettings

  if (typeof window !== 'undefined') {
    localStorage.setItem('url_masuk_pelanggan', cleanCustomer)
    localStorage.setItem('url_masuk_staff', cleanStaff)
  }

  try {
    const supabase = createClient()
    const upsertData = [
      { setting_key: 'url_masuk_pelanggan', setting_value: cleanCustomer, updated_at: new Date().toISOString() },
      { setting_key: 'url_masuk_staff', setting_value: cleanStaff, updated_at: new Date().toISOString() },
    ]

    const { error } = await supabase
      .from('app_settings')
      .upsert(upsertData, { onConflict: 'setting_key' })

    if (error) {
      console.warn('Upsert app_settings failed, saved to localStorage:', error)
    }
    return true
  } catch (err) {
    console.warn('Supabase app_settings error:', err)
    return true
  }
}
