'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { OrderCard, OrderItem } from './OrderCard'
import { CompletedOrderCard } from './CompletedOrderCard'
import { getOrders, getCachedOrdersSync, subscribeToOrders, FetchedOrderWithItems, hasOrdersCache } from '@/services/supabase/orderService'
import { playSound } from '@/utils/sound'
import { requestNotificationPermission, showOrderNotification } from '@/utils/notification'

let ordersClientCache: OrderItem[] | null = null

function formatOrderDateTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${hours}:${mins} WIB`
}

function isToday(isoString?: string): boolean {
  if (!isoString) return false
  const date = new Date(isoString)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function mapFetchedToAdminOrderItem(item: FetchedOrderWithItems): OrderItem | null {
  if (item.status === 'Dibatalkan') return null

  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    customerAvatarUrl: item.customer_avatar_url,
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
    orderType: item.order_type,
    tableNumber: item.table_number,
    notes: item.notes,
  }
}

export function OrdersManagement() {
  const [allOrders, setAllOrders] = useState<OrderItem[]>(() => {
    if (ordersClientCache) return ordersClientCache
    const syncCache = getCachedOrdersSync()
    if (syncCache.length > 0) {
      return syncCache.map(mapFetchedToAdminOrderItem).filter((o): o is OrderItem => o !== null)
    }
    return []
  })
  const [loading, setLoading] = useState(() => !ordersClientCache && getCachedOrdersSync().length === 0)

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent && !ordersClientCache && !hasOrdersCache()) {
      setLoading(true)
    }
    const data = await getOrders()
    const mapped = data
      .map(mapFetchedToAdminOrderItem)
      .filter((o): o is OrderItem => o !== null)
    setAllOrders(mapped)
    ordersClientCache = mapped
    setLoading(false)
  }, [])

  useEffect(() => {
    requestNotificationPermission()
    fetchOrders(ordersClientCache !== null || hasOrdersCache())

    const unsubscribe = subscribeToOrders((payload) => {
      fetchOrders(true)
      if (payload?.eventType === 'INSERT') {
        playSound('notif.mp3')
        if (payload?.new) {
          showOrderNotification(payload.new)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [fetchOrders])

  const activeOrders = allOrders.filter((o) => o.status === 'Menunggu' || o.status === 'Diproses')
  const completedOrders = allOrders.filter((o) => o.status === 'Selesai' && isToday(o.createdAt))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Pesanan Hari Ini
        </h1>
      </div>

      {/* Grid Layout: 2 Columns Active + 1 Column Completed */}
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Memuat data pesanan...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Section 1: Pesanan Aktif (2 Kolom di Desktop) dengan Garis Pemisah Vertikal Full Height */}
          <div className="lg:col-span-2 space-y-4 lg:pr-6 lg:border-r border-slate-200/80 dark:border-slate-800 lg:min-h-[calc(100vh-160px)]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Berjalan</span>
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                  ({activeOrders.length})
                </span>
              </h2>
            </div>

            {activeOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900/40 rounded-lg">
                Tidak ada pesanan aktif saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Pesanan Selesai (1 Kolom di Desktop dengan Local Scroll & Sticky Position) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Selesai</span>
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                  ({completedOrders.length})
                </span>
              </h2>
            </div>

            {completedOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200/80 dark:border-slate-800">
                Belum ada pesanan.
              </div>
            ) : (
              <div className="space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1.5 scrollbar-thin">
                {completedOrders.map((order) => (
                  <CompletedOrderCard key={order.id} order={order} defaultExpanded={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
