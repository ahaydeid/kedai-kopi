import { SupabaseClient } from '@supabase/supabase-js'

type ProviderType = 'mock' | 'supabase'

/**
 * Service Providers Configuration
 * 
 * Controls which data source is used for each individual service.
 * Change 'mock' to 'supabase' for a service once its backend database/APIs are ready.
 */
export const SERVICE_PROVIDERS: Record<string, ProviderType> = {
  kedaikopi: 'supabase',
}

export type AppServices = Record<string, unknown>

/**
 * Service Factory
 * 
 * Returns active service implementations based on the SERVICE_PROVIDERS map.
 */
export function getServices(_supabaseClient?: SupabaseClient): AppServices {
  return {}
}
