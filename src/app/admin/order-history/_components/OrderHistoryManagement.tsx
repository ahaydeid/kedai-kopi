'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { OrderHistoryTable, OrderHistoryItem } from './OrderHistoryTable'
import { OrderHistoryFilter } from './OrderHistoryFilter'
import { OrderHistoryDetailModal } from './OrderHistoryDetailModal'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'
import { getOrders, getPaginatedOrders, getCachedOrdersSync, subscribeToOrders, FetchedOrderWithItems, hasOrdersCache } from '@/services/supabase/orderService'
import { TableSkeleton } from '@/components/ui/TableSkeleton'

// Client-side in-memory cache untuk instant 0ms render saat navigasi ulang
let orderHistoryClientCache: {
  orders: OrderHistoryItem[]
  totalCount: number
  key: string
} | null = null

function formatOrderDateTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${hours}:${mins} WIB`
}

function mapFetchedToOrderHistoryItem(item: FetchedOrderWithItems): OrderHistoryItem {
  const itemsList = item.order_items.map((i) => ({
    name: `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.menu_name}`,
    price: Number(i.price) * i.quantity,
  }))
  const itemsSummary = itemsList.map((i) => i.name).join(', ')

  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    customerAvatarUrl: item.customer_avatar_url,
    dateTime: formatOrderDateTime(item.created_at),
    itemsSummary: itemsSummary || 'Pesanan',
    items: itemsList,
    totalAmount: Number(item.total_amount),
    discountAmount: Number(item.claimed_points || 0),
    claimedPoints: Number(item.claimed_points || 0),
    status: item.status === 'Selesai' ? 'selesai' : 'dibatalkan',
    createdVia: 'Pelanggan',
  }
}

export function OrderHistoryManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [timeFilter, setTimeFilter] = useState('semua')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const cacheKey = `${currentPage}-${pageSize}-${searchTerm}-${timeFilter}`

  const [orders, setOrders] = useState<OrderHistoryItem[]>(() => {
    if (orderHistoryClientCache && orderHistoryClientCache.key === cacheKey) {
      return orderHistoryClientCache.orders
    }
    const syncCache = getCachedOrdersSync()
    if (syncCache.length > 0) {
      const historyOnly = syncCache.filter((o) => o.status === 'Selesai' || o.status === 'Dibatalkan')
      return historyOnly.slice(0, pageSize).map(mapFetchedToOrderHistoryItem)
    }
    return []
  })
  const [totalCount, setTotalCount] = useState<number>(() => {
    if (orderHistoryClientCache && orderHistoryClientCache.key === cacheKey) {
      return orderHistoryClientCache.totalCount
    }
    const syncCache = getCachedOrdersSync()
    return syncCache.filter((o) => o.status === 'Selesai' || o.status === 'Dibatalkan').length
  })
  const [loading, setLoading] = useState<boolean>(() => !orderHistoryClientCache && getCachedOrdersSync().length === 0)
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, timeFilter, pageSize])

  // State Modal Detail
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null)

  const fetchOrders = useCallback(async (isSilent = false) => {
    const key = `${currentPage}-${pageSize}-${searchTerm}-${timeFilter}`
    const hasData = orderHistoryClientCache !== null || orders.length > 0

    if (!isSilent && !hasData) {
      setLoading(true)
    } else {
      setIsFetching(true)
    }

    const { data: dbData, totalCount: count } = await getPaginatedOrders({
      page: currentPage,
      pageSize,
      searchTerm,
      timeFilter,
    })

    const mapped = dbData.map(mapFetchedToOrderHistoryItem)
    setOrders(mapped)
    setTotalCount(count)
    orderHistoryClientCache = { orders: mapped, totalCount: count, key }
    setLoading(false)
    setIsFetching(false)
  }, [currentPage, pageSize, searchTerm, timeFilter, orders.length])

  useEffect(() => {
    fetchOrders(orderHistoryClientCache !== null)

    const unsubscribe = subscribeToOrders(() => {
      fetchOrders(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchOrders])

  const handleOpenDetailModal = (order: OrderHistoryItem) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const handlePrintOrder = () => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Fitur Mendatang',
      text: 'Fitur cetak struk akan segera hadir pada pembaruan berikutnya!',
      icon: 'info',
      confirmButtonText: 'Mengerti',
      confirmButtonColor: '#3b82f6',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Riwayat Pesanan
          </h1>
        </div>
      </div>

      {/* Filter & Search */}
      <OrderHistoryFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Tabel Riwayat */}
      {loading ? (
        <TableSkeleton rows={8} cols={8} hasAvatar />
      ) : (
        <div className={isFetching ? 'pointer-events-none' : ''}>
          <OrderHistoryTable
            items={orders}
            totalCount={totalCount}
            onDetail={handleOpenDetailModal}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modal Detail Riwayat Pesanan */}
      <OrderHistoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
        onPrint={handlePrintOrder}
      />
    </div>
  )
}
