'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FiInbox } from 'react-icons/fi'
import { useBaristaContext } from '../BaristaContext'
import { BaristaOrderCard, BaristaOrder } from '../_components/BaristaOrderCard'
import { getPaginatedOrders, FetchedOrderWithItems, subscribeToOrders } from '@/services/supabase/orderService'

type FilterPeriod = 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini'

function mapFetchedOrderToBaristaOrder(item: FetchedOrderWithItems): BaristaOrder {
  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    tableNumber: item.table_number ? String(item.table_number) : null,
    orderType: item.order_type || (item.table_number ? 'dine_in' : 'takeaway'),
    dateTime: formatOrderDateTime(item.created_at),
    createdAt: item.created_at,
    items: item.order_items.map((i) => ({
      name: `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.menu_name}`,
      price: Number(i.price) * i.quantity,
    })),
    totalAmount: Number(item.total_amount),
    discountAmount: Number(item.claimed_points || 0),
    claimedPoints: Number(item.claimed_points || 0),
    status: item.status as 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan',
  }
}

function formatOrderDateTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${hours}:${mins}`
}

export default function RiwayatPage() {
  const { handleUpdateStatus, handlePrintStruk } = useBaristaContext()
  const [filter, setFilter] = useState<FilterPeriod>('Hari Ini')
  const [historyOrders, setHistoryOrders] = useState<BaristaOrder[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const observerTargetRef = useRef<HTMLDivElement | null>(null)

  const mapFilterToQuery = (f: FilterPeriod) => {
    if (f === 'Hari Ini') return 'hari-ini'
    if (f === 'Minggu Ini') return 'minggu-ini'
    if (f === 'Bulan Ini') return 'bulan-ini'
    return 'semua'
  }

  const loadHistoryPage = useCallback(async (targetPage: number, currentFilter: FilterPeriod, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    const pageSize = 10
    const res = await getPaginatedOrders({
      page: targetPage,
      pageSize,
      timeFilter: mapFilterToQuery(currentFilter),
    })

    const mapped = res.data
      .filter((o) => o.status === 'Selesai')
      .map(mapFetchedOrderToBaristaOrder)

    if (isInitial) {
      setHistoryOrders(mapped)
    } else {
      setHistoryOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id))
        const newItems = mapped.filter((o) => !existingIds.has(o.id))
        return [...prev, ...newItems]
      })
    }

    setHasMore(targetPage * pageSize < res.totalCount)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Refetch saat filter periode berubah
  useEffect(() => {
    setPage(1)
    setHistoryOrders([])
    loadHistoryPage(1, filter, true)
  }, [filter, loadHistoryPage])

  // Realtime listener Supabase jika ada transaksi baru selesai
  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      loadHistoryPage(1, filter, false)
    })
    return () => unsubscribe()
  }, [filter, loadHistoryPage])

  // Infinite Scroll Trigger
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          loadHistoryPage(nextPage, filter, false)
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
  }, [page, hasMore, loadingMore, loading, filter, loadHistoryPage])

  return (
    <div>
      {/* Topbar Filter */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2">
        {(['Hari Ini', 'Minggu Ini', 'Bulan Ini'] as FilterPeriod[]).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setFilter(period)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === period
                ? 'bg-amber-800 text-white dark:bg-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Loading Skeleton awal */}
      {loading ? (
        <div className="max-w-md mx-auto px-4 py-8 space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : historyOrders.length === 0 ? (
        <div className="max-w-md mx-auto h-64 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
          <FiInbox className="h-12 w-12 stroke-[1.5]" />
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada riwayat pesanan
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto px-1.5 pt-1.5 pb-28 flex flex-col gap-2">
          {historyOrders.map((order) => (
            <BaristaOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onPrintStruk={handlePrintStruk}
            />
          ))}

          {/* Sentinel untuk Trigger Infinite Scroll Server-Side */}
          {hasMore && (
            <div
              ref={observerTargetRef}
              className="py-6 text-center text-xs text-slate-400 font-medium animate-pulse"
            >
              {loadingMore ? 'Memuat riwayat transaksi lainnya...' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
