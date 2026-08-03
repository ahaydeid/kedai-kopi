export interface VoucherItem {
  code: string
  campaignName: string
  type: 'percent' | 'nominal'
  value: number
  minPurchase: number
  quota: number
  expiryDate: string
  status: 'active' | 'inactive'
}

// PopupAdConfig diambil dari @/core/types/popup
export type { PopupAdConfig } from '@/core/types/popup'
