/**
 * Represents a discount campaign linked to a product.
 */
export interface CampaignItem {
  id: string
  campaignName: string
  productId: string
  productName: string
  productImageUrl: string
  originalPrice: number
  priceAfterDiscount: number
  discountPercent: number
  isActive: boolean
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  createdAt?: string
}
