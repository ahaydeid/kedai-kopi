'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { FiClock } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { Button } from '@/components/ui/Button'
import { getMyOrders, subscribeToOrders, updateOrderStatus, FetchedOrderWithItems } from '@/services/supabase/orderService'
import { getCurrentUser } from '@/services/supabase/authService'
import { formatOrderIdDisplay } from '@/utils/orderId'

type OrderStatus = 'menunggu' | 'diproses'

interface OrderItem {
  name: string
  qty: number
  price: number
  points: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  orderedAt: string
  status: OrderStatus
  items: OrderItem[]
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  menunggu: {
    label: 'Menunggu',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  diproses: {
    label: 'Diproses',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

function formatTimeOnly(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${mins}`
}

function mapToCustomerActiveOrder(item: FetchedOrderWithItems): Order | null {
  if (item.status === 'Selesai' || item.status === 'Dibatalkan') return null

  const mappedStatus: OrderStatus = item.status === 'Diproses' ? 'diproses' : 'menunggu'
  return {
    id: item.id,
    orderNumber: item.order_number,
    customerName: item.customer_name,
    orderedAt: formatTimeOnly(item.created_at),
    status: mappedStatus,
    items: item.order_items.map((i) => ({
      name: i.menu_name,
      qty: i.quantity,
      price: Number(i.price) * i.quantity,
      points: Number(i.points || 0) * i.quantity,
    })),
  }
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActiveOrders = useCallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    setLoading(true)
    const myOrders = await getMyOrders(user.id, ['Menunggu', 'Diproses'])
    const activeOnly = myOrders
      .map(mapToCustomerActiveOrder)
      .filter((o): o is Order => o !== null)
    setOrders(activeOnly)
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchActiveOrders()

    const unsubscribe = subscribeToOrders(() => {
      fetchActiveOrders()
    })

    return () => {
      unsubscribe()
    }
  }, [fetchActiveOrders])

  const hasOrders = orders.length > 0

  const handleCancelOrder = (orderId: string, displayId: string) => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Batalkan Pesanan?',
      text: `Apakah kamu yakin ingin membatalkan pesanan ${displayId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup',
        cancelButton: '!text-slate-600',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        await updateOrderStatus(orderId, 'Dibatalkan')
        playSwalSound('success')
        Swal.fire({
          title: 'Pesanan Dibatalkan',
          text: `Pesanan ${displayId} berhasil dibatalkan.`,
          icon: 'success',
          confirmButtonColor: '#3D2514',
          confirmButtonText: 'Oke',
          customClass: { popup: 'swal2-popup' },
        })
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-[#3D2514] selection:text-white">
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Pesanan Aktif
          </h1>
          {hasOrders && (
            <span className="text-xs font-semibold text-slate-400">
              {orders.length} pesanan
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-1.5 pt-1.5 pb-28">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Memuat pesanan aktif...</div>
        ) : hasOrders ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status]
              const total = order.items.reduce((sum, i) => sum + i.price, 0)
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

                  {/* Poin Didapat */}
                  <div className="px-3.5 pb-2.5 flex justify-end">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      +{order.items.reduce((sum, i) => sum + i.points, 0).toLocaleString('id-ID')} poin
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs text-slate-400 font-medium">Total</span>
                    <span className="text-xs font-extrabold text-[#3D2514] dark:text-amber-200">
                      {formatRupiah(total)}
                    </span>
                  </div>

                  {/* Action Bar (Tombol Batalkan) - Hanya jika status Menunggu */}
                  {order.status === 'menunggu' && (
                    <div className="flex justify-end px-3.5 pb-3 pt-1">
                      <Button
                        variant="danger"
                        size="xs"
                        className="!font-normal text-xs! py-1.5!"
                        onClick={() => handleCancelOrder(order.id, displayId)}
                      >
                        Batalkan Pesanan
                      </Button>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
            <div className="flex flex-col items-center justify-center space-y-3 w-full">
              <div className="h-16 w-16 rounded-full bg-amber-50 dark:bg-slate-800 text-[#3D2514] dark:text-amber-200 flex items-center justify-center shrink-0">
                <HiOutlineClipboardDocumentList className="h-8 w-8" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Belum Ada Pesanan Aktif
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
