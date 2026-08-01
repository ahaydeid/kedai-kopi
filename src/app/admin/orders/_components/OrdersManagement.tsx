'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { OrderCard, OrderItem } from './OrderCard'
import { getOrders, subscribeToOrders, FetchedOrderWithItems, hasOrdersCache } from '@/services/supabase/orderService'

let ordersClientCache: OrderItem[] | null = null

function formatOrderDateTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${hours}:${mins} WIB`
}

function mapFetchedToAdminOrderItem(item: FetchedOrderWithItems): OrderItem | null {
  if (item.status === 'Selesai' || item.status === 'Dibatalkan') return null

  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    customerAvatarUrl: item.customer_avatar_url,
    dateTime: formatOrderDateTime(item.created_at),
    items: item.order_items.map((i) => ({
      name: `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.menu_name}`,
      price: Number(i.price) * i.quantity,
    })),
    totalAmount: Number(item.total_amount),
    status: item.status as 'Menunggu' | 'Diproses',
  }
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<OrderItem[]>(() => ordersClientCache || [])
  const [loading, setLoading] = useState(!ordersClientCache && !hasOrdersCache())

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent && !ordersClientCache && !hasOrdersCache()) {
      setLoading(true)
    }
    const data = await getOrders()
    const activeOnly = data
      .map(mapFetchedToAdminOrderItem)
      .filter((o): o is OrderItem => o !== null)
    setOrders(activeOnly)
    ordersClientCache = activeOnly
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders(ordersClientCache !== null || hasOrdersCache())

    const unsubscribe = subscribeToOrders(() => {
      fetchOrders(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchOrders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Pesanan Aktif
        </h1>
      </div>

      {/* Grid Card */}
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Memuat pesanan aktif...</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200/80 dark:border-slate-800">
          Tidak ada pesanan aktif saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
