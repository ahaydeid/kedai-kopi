import { createClient } from './client'

let customerUserCache: { user: any; timestamp: number } | null = null
const USER_CACHE_TTL_MS = 60 * 1000 // 60 detik Memory Cache TTL

export function getCachedUserSync() {
  if (customerUserCache && Date.now() - customerUserCache.timestamp < USER_CACHE_TTL_MS) {
    return customerUserCache.user
  }
  return null
}

export function clearUserCache() {
  customerUserCache = null
}

/**
 * Admin Login via Server-Side API Route (tidak menyentuh localStorage browser)
 */
export async function signInAdminWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.error || 'Email atau password salah' }
    }

    return { success: true }
  } catch (err) {
    console.error('Error admin login:', err)
    return { success: false, error: 'Tidak dapat terhubung ke server' }
  }
}

/**
 * Customer Login via Google OAuth
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient()
  const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) {
    console.error('Error signing in with Google OAuth:', error)
    return false
  }

  return true
}

/**
 * Fetch Active Barista PIN from Supabase
 */
export async function getBaristaPin(): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('pin_code')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error || !data) {
    return '123456'
  }

  return data.pin_code
}

/**
 * Update Barista PIN in Supabase
 */
export async function updateBaristaPin(newPinCode: string): Promise<boolean> {
  const supabase = createClient()
  const cleanPin = newPinCode.trim()

  const { data: existing } = await supabase
    .from('staff')
    .select('id')
    .eq('is_active', true)
    .limit(1)

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('staff')
      .update({ pin_code: cleanPin })
      .eq('id', existing[0].id)

    if (error) {
      console.error('Error updating barista PIN:', error)
      return false
    }
  } else {
    const { error } = await supabase
      .from('staff')
      .insert([{ pin_code: cleanPin, name: 'Barista Utama', is_active: true }])

    if (error) {
      console.error('Error inserting barista PIN:', error)
      return false
    }
  }

  return true
}

/**
 * Barista Login via 6-Digit PIN Supabase Verification
 */
export async function verifyBaristaPin(pinCode: string): Promise<{ success: boolean; baristaName?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('name')
    .eq('pin_code', pinCode.trim())
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { success: false }
  }

  if (typeof document !== 'undefined') {
    document.cookie = `barista_session=true; path=/; max-age=${24 * 3600}; SameSite=Lax`
    document.cookie = `barista_name=${encodeURIComponent(data.name)}; path=/; max-age=${24 * 3600}; SameSite=Lax`
  }

  return { success: true, baristaName: data.name }
}

/**
 * Sign Out Admin Session
 */
export async function signOutAdmin() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' })
  } catch (err) {
    console.error('Error logging out admin:', err)
  }

  if (typeof document !== 'undefined') {
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'admin_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

/**
 * Sign Out Barista Session
 */
export async function signOutBarista() {
  try {
    await fetch('/api/barista/logout', { method: 'POST' })
  } catch (err) {
    console.error('Error logging out barista:', err)
  }

  if (typeof document !== 'undefined') {
    document.cookie = 'barista_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'barista_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

/**
 * Sign Out Customer Session
 */
export async function signOut() {
  clearUserCache()
  const supabase = createClient()
  await supabase.auth.signOut()
}

/**
 * Get Current Logged In Customer User (Filter Strict hanya untuk Akun Pelanggan)
 */
export async function getCurrentUser(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && customerUserCache && now - customerUserCache.timestamp < USER_CACHE_TTL_MS) {
    return customerUserCache.user
  }

  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user || null

  // ISOLASI PERAN: Jika user terautentikasi adalah Admin, jangan kembalikan sebagai akun Pelanggan!
  if (user && user.email && user.email.toLowerCase().includes('admin')) {
    customerUserCache = { user: null, timestamp: now }
    return null
  }

  customerUserCache = { user, timestamp: now }
  return user
}
