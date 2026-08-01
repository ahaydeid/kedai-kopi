export interface DatabaseMenu {
  id: string
  name: string
  main_category: string
  sub_category: string
  price: number
  points: number
  description: string | null
  images: string[]
  is_available: boolean
  created_at: string
  updated_at?: string
}

export interface DatabaseOrder {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'
  created_at: string
  customer_avatar_url?: string | null
  user_id?: string | null
  claimed_points?: number
}

export interface DatabaseOrderItem {
  id: string
  order_id: string
  menu_name: string
  quantity: number
  price: number
  created_at: string
  points?: number
}

export interface DatabaseStaff {
  id: string
  pin_code?: string | null
  name: string
  is_active: boolean
  created_at: string
  role: 'barista' | 'admin'
  email?: string | null
  password?: string | null
}

export interface DatabaseMemberPoints {
  user_id: string
  points: number
  updated_at: string
}
