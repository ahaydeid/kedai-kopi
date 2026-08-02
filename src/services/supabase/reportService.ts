import { createClient } from './client'
import { FetchedOrderWithItems, getCachedOrdersSync } from './orderService'

export interface DashboardMetrics {
  totalRevenue: number
  totalCompletedOrders: number
  totalInProcessOrders: number
  totalWaitingOrders: number
  recentOrders: FetchedOrderWithItems[]
  salesTrend: { label: string; value: number }[]
}

let dashboardCache: DashboardMetrics | null = null
const LOCAL_STORAGE_METRICS_KEY = 'admin_dashboard_metrics_cache_v1'

export function getDashboardMetricsSync(): DashboardMetrics | null {
  if (dashboardCache) return dashboardCache
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_METRICS_KEY)
      if (saved) {
        dashboardCache = JSON.parse(saved)
        return dashboardCache
      }
    } catch {}
  }

  const localOrders = getCachedOrdersSync()
  if (localOrders.length === 0) return null

  const now = new Date()
  const activeOrders = localOrders.filter((o) => o.status === 'Menunggu' || o.status === 'Diproses')
  const waitingOrdersCount = activeOrders.filter((o) => o.status === 'Menunggu').length
  const inProcessOrdersCount = activeOrders.filter((o) => o.status === 'Diproses').length

  const thirtyDaysAgoTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()
  const completed30Days = localOrders.filter(
    (o) => o.status === 'Selesai' && new Date(o.created_at).getTime() >= thirtyDaysAgoTime
  )
  const totalRevenue = completed30Days.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  const recentOrders = localOrders.slice(0, 5)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthMap: Record<string, number> = {}
  localOrders
    .filter((o) => o.status === 'Selesai')
    .forEach((o) => {
      if (o.created_at) {
        const d = new Date(o.created_at)
        const label = monthNames[d.getMonth()]
        monthMap[label] = (monthMap[label] || 0) + Math.round(Number(o.total_amount || 0) / 1000)
      }
    })

  let salesTrend = Object.entries(monthMap).map(([label, value]) => ({ label, value }))
  if (salesTrend.length === 0) {
    salesTrend = [
      { label: 'Okt', value: 0 },
      { label: 'Nov', value: 0 },
      { label: 'Des', value: 0 },
      { label: 'Jan', value: 0 },
      { label: 'Feb', value: 0 },
      { label: 'Mar', value: 0 },
    ]
  }

  return {
    totalRevenue,
    totalCompletedOrders: completed30Days.length,
    totalInProcessOrders: inProcessOrdersCount,
    totalWaitingOrders: waitingOrdersCount,
    recentOrders,
    salesTrend,
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createClient()
  const now = new Date()
  const thirtyDaysAgoISO = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixMonthsAgoISO = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  // 1. Eksekusi 4 query ringan paralel langsung di database Supabase (SQL Indexing level)
  const [activeRes, completed30DaysRes, recentRes, trendRes] = await Promise.all([
    // Query 1: Hanya pesanan aktif (Menunggu & Diproses)
    supabase.from('orders').select('status').in('status', ['Menunggu', 'Diproses']),

    // Query 2: Pendapatan 30 hari terakhir (hanya Selesai & created_at >= 30 hari)
    supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('status', 'Selesai')
      .gte('created_at', thirtyDaysAgoISO),

    // Query 3: Hanya 5 pesanan terbaru (Limit 5)
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(5),

    // Query 4: Data trend omzet 6 bulan terakhir
    supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('status', 'Selesai')
      .gte('created_at', sixMonthsAgoISO),
  ])

  if (activeRes.error || completed30DaysRes.error || recentRes.error || trendRes.error) {
    console.warn('Network error fetching dashboard metrics. Calculating from local orders cache.')
    const fallback = getDashboardMetricsSync()
    if (fallback) return fallback

    return {
      totalRevenue: 0,
      totalCompletedOrders: 0,
      totalInProcessOrders: 0,
      totalWaitingOrders: 0,
      recentOrders: [],
      salesTrend: [
        { label: 'Okt', value: 0 },
        { label: 'Nov', value: 0 },
        { label: 'Des', value: 0 },
        { label: 'Jan', value: 0 },
        { label: 'Feb', value: 0 },
        { label: 'Mar', value: 0 },
      ],
    }
  }

  const activeOrders = activeRes.data || []
  const waitingOrdersCount = activeOrders.filter((o) => o.status === 'Menunggu').length
  const inProcessOrdersCount = activeOrders.filter((o) => o.status === 'Diproses').length

  const completed30Days = completed30DaysRes.data || []
  const totalRevenue = completed30Days.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  // Hitung grafik trend bulanan
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthMap: Record<string, number> = {}

  ;(trendRes.data || []).forEach((o) => {
    if (o.created_at) {
      const d = new Date(o.created_at)
      const label = monthNames[d.getMonth()]
      monthMap[label] = (monthMap[label] || 0) + Math.round(Number(o.total_amount || 0) / 1000)
    }
  })

  let salesTrend = Object.entries(monthMap).map(([label, value]) => ({ label, value }))
  if (salesTrend.length === 0) {
    salesTrend = [
      { label: 'Okt', value: 0 },
      { label: 'Nov', value: 0 },
      { label: 'Des', value: 0 },
      { label: 'Jan', value: 0 },
      { label: 'Feb', value: 0 },
      { label: 'Mar', value: 0 },
    ]
  }

  const result: DashboardMetrics = {
    totalRevenue,
    totalCompletedOrders: completed30Days.length,
    totalInProcessOrders: inProcessOrdersCount,
    totalWaitingOrders: waitingOrdersCount,
    recentOrders: (recentRes.data as FetchedOrderWithItems[]) || [],
    salesTrend,
  }

  dashboardCache = result
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_METRICS_KEY, JSON.stringify(result))
    } catch {}
  }

  return result
}
