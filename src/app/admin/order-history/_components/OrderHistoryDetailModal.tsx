'use client'

import React from 'react'
import { FiPrinter } from 'react-icons/fi'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { OrderHistoryItem } from './OrderHistoryTable'
import { formatOrderIdDisplay } from '@/utils/orderId'

interface OrderHistoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: OrderHistoryItem | null
  onPrint?: (order: OrderHistoryItem) => void
}

export function OrderHistoryDetailModal({
  isOpen,
  onClose,
  order,
  onPrint,
}: OrderHistoryDetailModalProps) {
  if (!isOpen || !order) return null

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  // Splitting items summary string into array of item objects
  const itemList = order.itemsSummary.split(',').map((str) => str.trim())

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Pesanan"
      size="md"
    >
      <div className="p-4 sm:p-5 text-xs space-y-3">
        {/* Header Card (ID, Waktu, Status) */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block tracking-tight">
              {formatOrderIdDisplay(order.orderNumber)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {order.dateTime}
            </span>
          </div>
          <span
            className={`text-xs font-normal capitalize ${
              order.status === 'selesai'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Detail Pelanggan & Dibuat Oleh */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar name={order.customerName} photo={order.customerAvatarUrl} size="small" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {order.customerName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Dibuat oleh:</span>
            <Badge
              variant={order.createdVia === 'Barista' ? 'warning' : 'info'}
              className="text-[10px] px-2 py-0.5"
            >
              {order.createdVia || 'Pelanggan'}
            </Badge>
          </div>
        </div>

        {/* Rincian Item dengan harga di sebelah kanan */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-1.5">
          {(order.items && order.items.length > 0
            ? order.items
            : itemList.map((itemStr) => ({ name: itemStr, price: 0 }))
          ).map((item, index) => {
            const match = item.name.match(/^(\d+)(x)\s+(.*)$/)
            return (
              <div key={index} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-700 dark:text-slate-300">
                  {match ? (
                    <>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{match[1]}</span>
                      <span>{match[2]} {match[3]}</span>
                    </>
                  ) : (
                    item.name
                  )}
                </span>
                {item.price > 0 && (
                  <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">
                    {formatRupiah(item.price)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Total Bayar */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <span className="text-xs text-slate-400 font-normal">Total</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between gap-3">
          <Button
            variant="primary"
            size="sm"
            className='bg-sky-500!'
            onClick={() => {
              if (onPrint) {
                onPrint(order)
              }
            }}
          >
            <FiPrinter className="h-4 w-4" />
            <span>Cetak Struk</span>
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  )
}
