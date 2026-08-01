import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client menggunakan Service Role Key
 * HANYA dipakai di API Routes / Server Actions — tidak pernah di browser
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    throw new Error('[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
