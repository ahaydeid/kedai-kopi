'use client'

import React from 'react'
import Avatar from '@/components/ui/Avatar'
import { formatOrderIdDisplay } from '@/utils/orderId'

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
  items: OrderCartItem[]
  totalAmount: number
  status: 'Menunggu' | 'Diproses'
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
            className={`text-xs font-light ${
              order.status === 'Menunggu'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-sky-600 dark:text-sky-400'
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Detail Pelanggan */}
        <div className="text-xs text-slate-700 dark:text-slate-300 pt-1">
          <div className="flex items-center gap-2">
            <Avatar name={order.customerName} photo={order.customerAvatarUrl} size="small" />
            <span className="font-medium text-slate-900 dark:text-slate-100">{order.customerName}</span>
          </div>
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
        </div>
      </div>

      {/* Footer Card */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Total</span>
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 text-right">
          {formatRupiah(order.totalAmount)}
        </span>
      </div>
    </div>
  )
}
