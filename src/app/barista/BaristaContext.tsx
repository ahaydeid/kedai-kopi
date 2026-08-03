'use client'

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react'
import { BaristaOrder, BaristaOrderItem } from './_components/BaristaOrderCard'
import { playSound, playSwalSound } from '@/utils/sound'
import { printThermalReceipt } from '@/utils/printReceipt'
import Swal from 'sweetalert2'
import {
  getOrders,
  getCachedOrdersSync,
  createOrder,
  updateOrderStatus,
  subscribeToOrders,
  FetchedOrderWithItems,
} from '@/services/supabase/orderService'

interface BaristaContextValue {
  orders: BaristaOrder[]
  loading: boolean
  counts: { menunggu: number; proses: number; selesai: number }
  handleUpdateStatus: (id: string, newStatus: 'Menunggu' | 'Diproses' | 'Selesai') => void
  handlePrintStruk: (order: BaristaOrder) => void
  handleAddOrder: (order: { customerName: string; items: BaristaOrderItem[]; totalAmount: number }) => void
}

const BaristaContext = createContext<BaristaContextValue | null>(null)

export function useBaristaContext() {
  const ctx = useContext(BaristaContext)
  if (!ctx) throw new Error('useBaristaContext must be used within BaristaProvider')
  return ctx
}

function formatOrderDateTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${hours}:${mins} WIB`
}

function mapFetchedOrderToBaristaOrder(item: FetchedOrderWithItems): BaristaOrder {
  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    tableNumber: item.table_number ? String(item.table_number) : null,
    orderType: item.order_type || (item.table_number ? 'dine_in' : 'takeaway'),
    dateTime: formatOrderDateTime(item.created_at),
    items: item.order_items.map((i) => ({
      name: `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.menu_name}`,
      price: Number(i.price) * i.quantity,
    })),
    totalAmount: Number(item.total_amount),
    discountAmount: Number(item.claimed_points || 0),
    claimedPoints: Number(item.claimed_points || 0),
    status: item.status,
  }
}

export function BaristaProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<BaristaOrder[]>(() => {
    const syncCache = getCachedOrdersSync()
    if (syncCache.length > 0) {
      return syncCache.map(mapFetchedOrderToBaristaOrder)
    }
    return []
  })
  const [loading, setLoading] = useState<boolean>(() => getCachedOrdersSync().length === 0)

  const fetchOrdersFromSupabase = useCallback(async () => {
    setLoading(true)
    const fetched = await getOrders()
    setOrders(fetched.map(mapFetchedOrderToBaristaOrder))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrdersFromSupabase()

    // Real-time listener Supabase
    const unsubscribe = subscribeToOrders((payload) => {
      fetchOrdersFromSupabase()
      if (payload.eventType === 'INSERT') {
        playSound('present.mp3')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [fetchOrdersFromSupabase])

  const counts = useMemo(() => ({
    menunggu: orders.filter((o) => o.status === 'Menunggu').length,
    proses: orders.filter((o) => o.status === 'Diproses').length,
    selesai: orders.filter((o) => o.status === 'Selesai').length,
  }), [orders])

  const handleUpdateStatus = async (id: string, newStatus: 'Menunggu' | 'Diproses' | 'Selesai') => {
    // Optimistic UI update
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))

    const success = await updateOrderStatus(id, newStatus)
    if (!success) {
      // Revert if error
      fetchOrdersFromSupabase()
    }
  }

  const handlePrintStruk = (order: BaristaOrder) => {
    playSwalSound('confirm')
    printThermalReceipt({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      tableNumber: order.orderType === 'takeaway' || !order.tableNumber ? 'Takeaway' : `Meja #${order.tableNumber}`,
      orderType: order.orderType || (order.tableNumber ? 'dine_in' : 'takeaway'),
      dateTime: order.dateTime,
      items: order.items.map((item) => {
        // Extract quantity from name string like "2x Kopi Susu" if present
        const match = item.name.match(/^(\d+)x\s+(.+)$/)
        if (match) {
          const qty = parseInt(match[1], 10)
          return {
            name: match[2],
            quantity: qty,
            price: Math.floor(item.price / qty),
          }
        }
        return {
          name: item.name,
          quantity: 1,
          price: item.price,
        }
      }),
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount || order.claimedPoints || 0,
    })
  }

  const handleAddOrder = async (orderData: { customerName: string; items: BaristaOrderItem[]; totalAmount: number }) => {
    const created = await createOrder({
      customerName: orderData.customerName,
      items: orderData.items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: 1,
      })),
      totalAmount: orderData.totalAmount,
    })

    if (created) {
      playSound('present.mp3')
      fetchOrdersFromSupabase()
    }
  }

  return (
    <BaristaContext.Provider value={{ orders, loading, counts, handleUpdateStatus, handlePrintStruk, handleAddOrder }}>
      {children}
    </BaristaContext.Provider>
  )
}
