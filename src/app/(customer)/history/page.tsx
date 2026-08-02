'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiClock } from 'react-icons/fi'
import { getMyOrders, subscribeToOrders, FetchedOrderWithItems } from '@/services/supabase/orderService'
import { getCurrentUser } from '@/services/supabase/authService'
import { formatOrderIdDisplay } from '@/utils/orderId'

type HistoryStatus = 'selesai' | 'dibatalkan'

interface OrderItem {
  name: string
  qty: number
  price: number
  points: number
}

interface HistoryOrder {
  id: string
  orderNumber: string
  customerName: string
  orderedAt: string
  status: HistoryStatus
  items: OrderItem[]
}

const HISTORY_CACHE_KEY = 'customer_history_cache_v1'
let historyClientMemoryCache: HistoryOrder[] | null = null

const STATUS_CONFIG: Record<HistoryStatus, { label: string; className: string }> = {
  selesai: {
    label: 'Selesai',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

function formatOrderDateTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthNames[date.getMonth()]}, ${hours}:${mins}`
}

function mapToHistoryOrder(item: FetchedOrderWithItems): HistoryOrder | null {
  if (item.status !== 'Selesai' && item.status !== 'Dibatalkan') return null

  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    orderedAt: formatOrderDateTime(item.created_at),
    status: item.status === 'Selesai' ? 'selesai' : 'dibatalkan',
    items: item.order_items.map((i) => ({
      name: i.menu_name,
      qty: i.quantity,
      price: Number(i.price) * i.quantity,
      points: Number(i.points || 0) * i.quantity,
    })),
  }
}

export default function CustomerHistoryPage() {
  const router = useRouter()

  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>(() => {
    if (historyClientMemoryCache) return historyClientMemoryCache
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(HISTORY_CACHE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          historyClientMemoryCache = parsed
          return parsed
        }
      } catch {}
    }
    return []
  })

  const [loading, setLoading] = useState<boolean>(() => {
    if (historyClientMemoryCache && historyClientMemoryCache.length > 0) return false
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(HISTORY_CACHE_KEY)
        if (saved && JSON.parse(saved).length > 0) return false
      } catch {}
    }
    return true
  })

  const [displayLimit, setDisplayLimit] = useState<number>(5)
  const observerTargetRef = useRef<HTMLDivElement | null>(null)

  const fetchHistoryOrders = useCallback(async (isSilent = false) => {
    const user = await getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const hasData = historyClientMemoryCache !== null || historyOrders.length > 0
    if (!isSilent && !hasData) {
      setLoading(true)
    }

    const orders = await getMyOrders(user.id, ['Selesai', 'Dibatalkan'])
    const historyOnly = orders
      .map(mapToHistoryOrder)
      .filter((o): o is HistoryOrder => o !== null)

    setHistoryOrders(historyOnly)
    historyClientMemoryCache = historyOnly
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(historyOnly))
      } catch {}
    }
    setLoading(false)
  }, [router, historyOrders.length])

  useEffect(() => {
    const hasData = historyClientMemoryCache !== null || historyOrders.length > 0
    fetchHistoryOrders(hasData)

    const unsubscribe = subscribeToOrders(() => {
      fetchHistoryOrders(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchHistoryOrders, historyOrders.length])

  // Lazy Load Trigger saat scroll mendekati bawah list
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < historyOrders.length) {
          setDisplayLimit((prev) => prev + 5)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTargetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [displayLimit, historyOrders.length])

  const hasHistory = historyOrders.length > 0
  const visibleOrders = historyOrders.slice(0, displayLimit)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-[#3D2514] selection:text-white">
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Riwayat Transaksi
          </h1>
          {hasHistory && (
            <span className="text-xs font-normal text-slate-400">
              {historyOrders.length} transaksi
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-1.5 pt-1.5 pb-28">
        {loading ? (
          /* Skeleton Loader (Hanya saat kunjungan pertama tanpa cache) */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded p-3.5 space-y-2 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-14" />
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-36" />
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-44" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : hasHistory ? (
          <>
            <div className="space-y-3">
              {visibleOrders.map((order) => {
                const status = STATUS_CONFIG[order.status]
                const total = order.items.reduce((sum, i) => sum + i.price, 0)
                const pointsEarned = order.items.reduce((sum, i) => sum + i.points, 0)
                const displayId = formatOrderIdDisplay(order.orderNumber)

                return (
                  <section
                    key={order.id}
                    className="bg-white dark:bg-slate-900 rounded overflow-hidden border-none"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {displayId}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <FiClock className="h-3 w-3" />
                          {order.orderedAt}
                        </span>
                      </div>
                      <span className={`text-[11px] font-normal px-2 py-0.5 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Customer Name */}
                    <div className="px-3.5 pt-2 text-[11px] text-slate-500">
                      Atas nama: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.customerName}</span>
                    </div>

                    {/* Item List */}
                    <div className="px-3.5 py-2 space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                              {item.qty}×
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                            {formatRupiah(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Poin Didapat jika selesai */}
                    {order.status === 'selesai' && pointsEarned > 0 && (
                      <div className="px-3.5 pb-2.5 flex justify-end">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          +{pointsEarned.toLocaleString('id-ID')} poin
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-xs text-slate-400 font-medium">Total</span>
                      <span className="text-xs font-extrabold text-[#3D2514] dark:text-amber-200">
                        {formatRupiah(total)}
                      </span>
                    </div>
                  </section>
                )
              })}
            </div>

            {/* Element Sentinel untuk Trigger Lazy Load (+5) */}
            {displayLimit < historyOrders.length && (
              <div
                ref={observerTargetRef}
                className="py-6 text-center text-xs text-slate-400 font-medium animate-pulse"
              >
                Memuat riwayat transaksi lainnya...
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
            <div className="flex flex-col items-center justify-center space-y-3 w-full">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                <FiClock className="h-8 w-8" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Belum Ada Riwayat Transaksi
              </h2>
              <div className="pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center font-semibold text-xs bg-[#3D2514] text-amber-50 dark:bg-amber-100 dark:text-[#3D2514] px-4 py-2.5 rounded-lg hover:bg-[#2B190E] transition-colors cursor-pointer"
                >
                  Lihat Menu Kedai
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
