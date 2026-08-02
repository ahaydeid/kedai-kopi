'use client'

import React from 'react'
import Avatar from '@/components/ui/Avatar'
import { formatOrderIdDisplay } from '@/utils/orderId'
import { FiPrinter } from 'react-icons/fi'
import { printThermalReceipt } from '@/utils/printReceipt'
import { playSwalSound } from '@/utils/sound'

export interface OrderCartItem {
  name: string
  price: number
}

export interface OrderItem {
  id: string
  orderNumber: string
  customerName: string
  customerAvatarUrl?: string | null
  dateTime: string
  createdAt?: string
  items: OrderCartItem[]
  totalAmount: number
  discountAmount?: number
  claimedPoints?: number
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'
  orderType?: 'dine_in' | 'takeaway'
  tableNumber?: string | null
}

interface OrderCardProps {
  order: OrderItem
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-4 space-y-3 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out">
      <div className="space-y-2">
        {/* Header Card */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
              {formatOrderIdDisplay(order.orderNumber)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {order.dateTime}
            </span>
          </div>
          <span
            className={`text-xs font-medium ${
              order.status === 'Menunggu'
                ? 'text-amber-600 dark:text-amber-400'
                : order.status === 'Diproses'
                ? 'text-sky-600 dark:text-sky-400'
                : order.status === 'Selesai'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Detail Pelanggan & Nomor Meja */}
        <div className="text-xs text-slate-700 dark:text-slate-300 pt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={order.customerName} photo={order.customerAvatarUrl} size="small" />
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{order.customerName}</span>
          </div>
          <span className="text-xs font-medium text-slate-400 shrink-0">
            {order.orderType === 'takeaway' || !order.tableNumber
              ? 'Takeaway'
              : `Meja #${order.tableNumber}`}
          </span>
        </div>

        {/* Rincian Item dengan harga di sebelah kanan */}
        <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
          {order.items.map((item, index) => {
            const match = item.name.match(/^(\d+)(x)\s+(.*)$/)
            return (
              <div key={index} className="flex items-center justify-between gap-2">
                <span>
                  {match ? (
                    <>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{match[1]}</span>
                      <span>{match[2]} {match[3]}</span>
                    </>
                  ) : (
                    item.name
                  )}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">
                  {formatRupiah(item.price)}
                </span>
              </div>
            )
          })}

          {(order.discountAmount || order.claimedPoints || 0) > 0 && (
            <div className="flex items-center justify-between text-xs text-rose-500 font-medium pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span>Potongan Harga</span>
              <span>-{formatRupiah(order.discountAmount || order.claimedPoints || 0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Card */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            playSwalSound('confirm')
            printThermalReceipt({
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              tableNumber: order.orderType === 'takeaway' || !order.tableNumber ? 'Takeaway' : `Meja #${order.tableNumber}`,
              orderType: order.orderType,
              dateTime: order.dateTime,
              items: order.items.map((item) => {
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
          }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Cetak Struk Thermal"
        >
          <FiPrinter className="w-3.5 h-3.5" />
          <span>Cetak Struk</span>
        </button>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Total</span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}
