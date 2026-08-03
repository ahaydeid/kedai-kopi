export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  imageUrl: string
  images?: string[]
  category: string
  rating: number
  soldCount: number
  stock: number
  soldProgress?: number
  isCampaign: boolean
  variants?: string[]
  weight: number
}
