'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { OrderHistoryTable, OrderHistoryItem } from './OrderHistoryTable'
import { OrderHistoryFilter } from './OrderHistoryFilter'
import { OrderHistoryDetailModal } from './OrderHistoryDetailModal'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'
import { getOrders, getPaginatedOrders, subscribeToOrders, FetchedOrderWithItems, hasOrdersCache } from '@/services/supabase/orderService'

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

  const [orders, setOrders] = useState<OrderHistoryItem[]>(() => 
    orderHistoryClientCache && orderHistoryClientCache.key === cacheKey ? orderHistoryClientCache.orders : (orderHistoryClientCache?.orders || [])
  )
  const [totalCount, setTotalCount] = useState<number>(() => 
    orderHistoryClientCache && orderHistoryClientCache.key === cacheKey ? orderHistoryClientCache.totalCount : (orderHistoryClientCache?.totalCount || 0)
  )
  const [loading, setLoading] = useState(!orderHistoryClientCache)
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
        <div className="p-8 text-center text-sm text-slate-500">Memuat riwayat pesanan...</div>
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
