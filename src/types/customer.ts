export interface MenuItem {
  id: string
  name: string
  category: string
  mainCategory?: string
  price: number
  points?: number
  originalPrice?: number
  image: string
  images?: string[]
  description: string
  tag?: 'Best Seller' | 'Promo' | 'Baru'
  isAvailable: boolean
}

export interface CartItem {
  product: MenuItem
  quantity: number
  notes?: string
}

export type OrderType = 'dine-in' | 'takeaway'
