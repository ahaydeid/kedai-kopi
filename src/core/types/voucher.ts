export interface VoucherRecord {
  id: string
  code: string
  campaignName: string
  type: 'percent' | 'nominal'
  value: number
  minPurchase: number
  maxDiscount?: number
  quota: number
  usedCount: number
  expiryDate: string // YYYY-MM-DD
  isActive: boolean
  createdAt?: string
}

export interface VoucherValidationResult {
  valid: boolean
  message?: string
  voucher?: VoucherRecord
  discountAmount?: number
}
