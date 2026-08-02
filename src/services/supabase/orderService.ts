import { createClient } from './client'
import { generateOrderId } from '@/utils/orderId'
import { offlineDB } from '@/services/offline/db'

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

const LOCAL_STORAGE_ORDERS_KEY = 'admin_orders_cache_v1'

export function getCachedOrdersSync(): FetchedOrderWithItems[] {
  if (ordersCache && ordersCache.data.length > 0) return ordersCache.data
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        ordersCache = { data: parsed, timestamp: Date.now() }
        return parsed
      }
    } catch {}
  }
  return []
}

export function clearOrdersCache() {
  ordersCache = null
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_ORDERS_KEY)
    } catch {}
  }
}

export function hasOrdersCache(): boolean {
  if (ordersCache && ordersCache.data.length > 0) return true
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY)
      if (saved && JSON.parse(saved).length > 0) return true
    } catch {}
  }
  return false
}

export async function createOrder(input: CreateOrderInput): Promise<FetchedOrderWithItems | null> {
  const supabase = createClient()
  const orderNumber = generateOrderId()

  // 1. Try insert into Supabase orders table
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
    console.warn('Network or Supabase error creating order (Offline mode active). Saving to Dexie IndexedDB queue:', orderError)
    const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}`

    // Save to Dexie IndexedDB for background sync
    try {
      await offlineDB.pending_orders.put({
        id: clientUuid,
        customer_name: input.customerName,
        order_type: input.orderType ?? 'dine_in',
        table_number: input.tableNumber ?? undefined,
        total_amount: input.totalAmount,
        payment_status: 'pending',
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        items: input.items.map((item) => ({
          menu_item_id: '',
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
        })),
      })
    } catch (e) {
      console.error('Error writing pending order to IndexedDB:', e)
    }

    // Build synthetic order for optimistic UI display
    const syntheticOrder: FetchedOrderWithItems = {
      id: clientUuid,
      order_number: orderNumber,
      customer_name: input.customerName,
      customer_avatar_url: input.customerAvatarUrl ?? null,
      user_id: input.userId ?? null,
      total_amount: input.totalAmount,
      claimed_points: input.claimedPoints ?? 0,
      order_type: input.orderType ?? 'dine_in',
      table_number: input.tableNumber ?? null,
      status: 'Menunggu',
      created_at: new Date().toISOString(),
      order_items: input.items.map((item, idx) => ({
        id: `${clientUuid}-${idx}`,
        menu_name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        points: item.points ?? Math.floor(item.price / 1000),
      })),
    }

    if (typeof window !== 'undefined') {
      try {
        const cached = getCachedOrdersSync()
        const updated = [syntheticOrder, ...cached]
        ordersCache = { data: updated, timestamp: Date.now() }
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated))
      } catch {}
    }

    return syntheticOrder
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

  const createdFullOrder: FetchedOrderWithItems = {
    ...orderData,
    order_items: itemsData || [],
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = getCachedOrdersSync()
      const updated = [createdFullOrder, ...cached.filter((o) => o.id !== createdFullOrder.id)]
      ordersCache = { data: updated, timestamp: Date.now() }
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated))
    } catch {}
  }

  return createdFullOrder
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
    console.warn('Network error fetching orders. Using local cache fallback:', error)
    return getCachedOrdersSync()
  }

  const result = data as FetchedOrderWithItems[]
  ordersCache = { data: result, timestamp: now }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(result))
    } catch {}
  }
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
    console.warn('Error fetching orders by user_id. Falling back to local cache:', error)
    const local = getCachedOrdersSync().filter((o) => o.user_id === userId)
    if (statusFilter && statusFilter.length > 0) {
      return local.filter((o) => statusFilter.includes(o.status))
    }
    return local
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
    console.warn('Supabase fetch error for paginated orders (Offline mode active). Using offline local cache fallback:', error)
    let localData = getCachedOrdersSync().filter((o) => o.status === 'Selesai' || o.status === 'Dibatalkan')

    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase()
      localData = localData.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(term) ||
          o.order_number?.toLowerCase().includes(term)
      )
    }

    if (timeFilter && timeFilter !== 'semua') {
      const now = new Date()
      if (timeFilter === 'hari-ini') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        localData = localData.filter((o) => new Date(o.created_at).getTime() >= startOfDay)
      } else if (timeFilter === 'minggu-ini') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime()
        localData = localData.filter((o) => new Date(o.created_at).getTime() >= startOfWeek)
      } else if (timeFilter === 'bulan-ini') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
        localData = localData.filter((o) => new Date(o.created_at).getTime() >= startOfMonth)
      }
    }

    const totalCount = localData.length
    const offset = (page - 1) * pageSize
    const paginatedData = localData.slice(offset, offset + pageSize)

    return {
      data: paginatedData,
      totalCount,
    }
  }

  const resultData = (data as FetchedOrderWithItems[]) || []

  // Update local cache asynchronously with latest fetched items
  if (typeof window !== 'undefined' && resultData.length > 0) {
    try {
      const existingCache = getCachedOrdersSync()
      const existingMap = new Map(existingCache.map((item) => [item.id, item]))
      resultData.forEach((item) => existingMap.set(item.id, item))
      const updatedCache = Array.from(existingMap.values())
      ordersCache = { data: updatedCache, timestamp: Date.now() }
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedCache))
    } catch {}
  }

  return {
    data: resultData,
    totalCount: count ?? 0,
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'
): Promise<boolean> {
  // 1. Optimistic Local Cache Update
  if (typeof window !== 'undefined') {
    try {
      const cached = getCachedOrdersSync()
      const updated = cached.map((o) => (o.id === orderId ? { ...o, status } : o))
      ordersCache = { data: updated, timestamp: Date.now() }
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated))
    } catch {}
  }

  const supabase = createClient()

  // 2. Update status order via Supabase
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.warn('Network error updating order status. Queueing status update in IndexedDB:', error)
    try {
      await offlineDB.pending_status_updates.put({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        order_id: orderId,
        status,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error('Failed to queue offline status update:', e)
    }
    // Return true for offline optimistic update
    return true
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
