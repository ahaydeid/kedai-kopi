'use client'

import React, { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { formatOrderIdDisplay } from '@/utils/orderId'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { OrderItem } from './OrderCard'

interface CompletedOrderCardProps {
  order: OrderItem
  defaultExpanded?: boolean
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export function CompletedOrderCard({ order, defaultExpanded = false }: CompletedOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const totalItemsCount = order.items.reduce((acc, item) => {
    const match = item.name.match(/^(\d+)x/)
    return acc + (match ? parseInt(match[1]) : 1)
  }, 0)

  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="bg-white dark:bg-slate-900 rounded p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-colors"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {formatOrderIdDisplay(order.orderNumber)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              • {order.customerName}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {order.dateTime.split(', ')[1] || order.dateTime} • {totalItemsCount} item
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {formatRupiah(order.totalAmount)}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">
              Selesai
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(true)
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <FiChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded p-4 space-y-3 flex flex-col justify-between shadow-sm transition-colors">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Selesai
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <FiChevronUp className="w-4 h-4" />
            </button>
          </div>
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
