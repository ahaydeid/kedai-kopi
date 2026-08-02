import { createClient } from './client'
import { generateOrderId } from '@/utils/orderId'

export interface OrderItemInput {
  name: string
  price: number
  quantity?: number
  points?: number
}

export interface CreateOrderInput {
  customerName: string
  customerAvatarUrl?: string | null
  userId?: string | null
  items: OrderItemInput[]
  totalAmount: number
  claimedPoints?: number
  orderType?: 'dine_in' | 'takeaway'
  tableNumber?: string | null
}

export interface FetchedOrderWithItems {
  id: string
  order_number: string
  customer_name: string
  customer_avatar_url: string | null
  user_id: string | null
  total_amount: number
  claimed_points?: number
  order_type?: 'dine_in' | 'takeaway'
  table_number?: string | null
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'
  created_at: string
  order_items: {
    id: string
    menu_name: string
    quantity: number
    price: number
    points: number
  }[]
}

let ordersCache: { data: FetchedOrderWithItems[]; timestamp: number } | null = null
const CACHE_TTL_MS = 30 * 1000 // 30 Detik Memory Cache TTL

export function clearOrdersCache() {
  ordersCache = null
}

export function hasOrdersCache(): boolean {
  return Boolean(ordersCache && Date.now() - ordersCache.timestamp < CACHE_TTL_MS)
}

export async function createOrder(input: CreateOrderInput): Promise<FetchedOrderWithItems | null> {
  const supabase = createClient()
  const orderNumber = generateOrderId()

  // 1. Insert into orders table
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        order_number: orderNumber,
        customer_name: input.customerName,
        customer_avatar_url: input.customerAvatarUrl ?? null,
        user_id: input.userId ?? null,
        total_amount: input.totalAmount,
        claimed_points: input.claimedPoints ?? 0,
        order_type: input.orderType ?? 'dine_in',
        table_number: input.tableNumber ?? null,
        status: 'Menunggu',
      },
    ])
    .select()
    .single()

  if (orderError || !orderData) {
    console.error('Error creating order in Supabase:', orderError)
    return null
  }

  // 2. Insert into order_items table
  const itemsToInsert = input.items.map((item) => ({
    order_id: orderData.id,
    menu_name: item.name,
    quantity: item.quantity || 1,
    price: item.price,
    points: item.points ?? Math.floor(item.price / 1000),
  }))

  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)
    .select()

  if (itemsError) {
    console.error('Error inserting order items:', itemsError)
  }

  clearOrdersCache()

  return {
    ...orderData,
    order_items: itemsData || [],
  }
}

export async function getOrders(forceRefresh = false): Promise<FetchedOrderWithItems[]> {
  const now = Date.now()
  if (!forceRefresh && ordersCache && now - ordersCache.timestamp < CACHE_TTL_MS) {
    return ordersCache.data
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return ordersCache ? ordersCache.data : []
  }

  const result = data as FetchedOrderWithItems[]
  ordersCache = { data: result, timestamp: now }
  return result
}

/**
 * Ambil order milik user yang sedang login berdasarkan user_id.
 * Digunakan di halaman /history dan /orders (customer).
 */
export async function getMyOrders(
  userId: string,
  statusFilter?: ('Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan')[]
): Promise<FetchedOrderWithItems[]> {
  if (!userId) return []

  const supabase = createClient()
  let query = supabase
    .from('orders')
    .select(`*, order_items (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders by user_id:', error)
    return []
  }

  return (data as FetchedOrderWithItems[]) || []
}

export interface PaginatedOrdersResult {
  data: FetchedOrderWithItems[]
  totalCount: number
}

export async function getPaginatedOrders(params: {
  page: number
  pageSize: number
  searchTerm?: string
  timeFilter?: string
}): Promise<PaginatedOrdersResult> {
  const { page, pageSize, searchTerm, timeFilter } = params
  const supabase = createClient()

  let query = supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .in('status', ['Selesai', 'Dibatalkan'])

  if (searchTerm && searchTerm.trim() !== '') {
    const term = searchTerm.trim()
    query = query.or(`customer_name.ilike.%${term}%,order_number.ilike.%${term}%`)
  }

  if (timeFilter && timeFilter !== 'semua') {
    const now = new Date()
    if (timeFilter === 'hari-ini') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      query = query.gte('created_at', startOfDay)
    } else if (timeFilter === 'minggu-ini') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()
      query = query.gte('created_at', startOfWeek)
    } else if (timeFilter === 'bulan-ini') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      query = query.gte('created_at', startOfMonth)
    }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching paginated orders:', error)
    return { data: [], totalCount: 0 }
  }

  return {
    data: (data as FetchedOrderWithItems[]) || [],
    totalCount: count ?? 0,
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'
): Promise<boolean> {
  const supabase = createClient()

  // 1. Ambil data order awal sebelum status diperbarui
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  const oldStatus = existingOrder?.status

  // Pesanan yang sudah Selesai tidak dapat diubah statusnya lagi
  if (oldStatus === 'Selesai') {
    console.warn('Pesanan yang sudah Selesai tidak dapat diubah statusnya lagi.')
    return false
  }

  // Pembatalan HANYA bisa dilakukan jika status pesanan masih 'Menunggu'
  if (status === 'Dibatalkan' && oldStatus !== 'Menunggu') {
    console.warn('Pembatalan pesanan hanya dapat dilakukan saat status masih Menunggu.')
    return false
  }

  // 2. Update status order
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    return false
  }

  // 3. Logika Penambahan / Pengembalian Poin (Refund) jika user_id ada
  if (existingOrder && existingOrder.user_id && oldStatus !== status) {
    const userId = existingOrder.user_id
    const claimedPoints = Number(existingOrder.claimed_points || 0)

    // Ambil saldo poin user saat ini dari database
    const { data: ptData } = await supabase
      .from('member_points')
      .select('points')
      .eq('user_id', userId)
      .single()

    const currentPoints = ptData?.points ?? 0

    // a. Jika status berubah ke 'Selesai' (dan sebelumnya belum 'Selesai')
    if (status === 'Selesai' && oldStatus !== 'Selesai') {
      const earnedPoints = (existingOrder.order_items || []).reduce(
        (sum: number, item: any) => sum + Number(item.points || 0),
        0
      )
      const newPoints = currentPoints + earnedPoints
      await supabase
        .from('member_points')
        .upsert({ user_id: userId, points: newPoints }, { onConflict: 'user_id' })
    }

    // b. Jika status berubah ke 'Dibatalkan' -> REFUND POIN KLAIM
    if (status === 'Dibatalkan' && oldStatus !== 'Dibatalkan' && oldStatus !== 'Selesai') {
      if (claimedPoints > 0) {
        const refundPoints = currentPoints + claimedPoints
        await supabase
          .from('member_points')
          .upsert({ user_id: userId, points: refundPoints }, { onConflict: 'user_id' })
      }
    }
  }

  clearOrdersCache()
  return true
}

/**
 * Global Realtime Event Listener Hub (Pub/Sub Pattern).
 * Manages a single shared Supabase Realtime WebSocket connection across all components
 * (CustomerBottomBar, OrdersPage, AdminDashboard, BaristaContext) to prevent duplicate connections,
 * socket leaks, and channel collision errors.
 */
let activeRealtimeChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
const orderListeners = new Set<(payload: any) => void>()

export function subscribeToOrders(onOrderChange: (payload: any) => void) {
  orderListeners.add(onOrderChange)

  if (!activeRealtimeChannel) {
    const supabase = createClient()
    activeRealtimeChannel = supabase
      .channel('global-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          clearOrdersCache()
          orderListeners.forEach((listener) => {
            try {
              listener(payload)
            } catch (err) {
              console.error('Error executing order realtime listener callback:', err)
            }
          })
        }
      )
      .subscribe()
  }

  return () => {
    orderListeners.delete(onOrderChange)
    if (orderListeners.size === 0 && activeRealtimeChannel) {
      const supabase = createClient()
      supabase.removeChannel(activeRealtimeChannel)
      activeRealtimeChannel = null
    }
  }
}
