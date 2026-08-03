import { SupabaseCampaignService } from './supabase/campaign.service'
import { SupabaseProductService } from './supabase/product.service'

export function getServices() {
  return {
    campaigns: new SupabaseCampaignService(),
    products: new SupabaseProductService(),
  }
}
