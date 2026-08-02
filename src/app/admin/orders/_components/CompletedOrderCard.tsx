'use client'

import React, { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { formatOrderIdDisplay } from '@/utils/orderId'
import { FiChevronDown, FiChevronUp, FiPrinter } from 'react-icons/fi'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'
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

  const handlePrintClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playSwalSound('success')

    const now = new Date()
    const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const namaPelanggan = (order.customerName || 'Pelanggan').slice(0, 24)
    const itemsHtml = order.items
      .map((item) => {
        const rupiah = formatRupiah(item.price)
        const label = item.name.length > 18 ? item.name.slice(0, 18) + '…' : item.name
        return `<div class="flex justify-between"><span>${label}</span><span>${rupiah}</span></div>`
      })
      .join('')

    Swal.fire({
      title: '🖨️ Preview Struk',
      html: `
        <div class="text-left text-xs font-mono bg-white p-4 rounded-md border border-slate-200 space-y-1 text-slate-800 mx-auto" style="max-width:280px">
          <p class="text-center font-bold uppercase text-sm">KEDAI KOPI</p>
          <p class="text-center text-[10px] text-zinc-500">Ruko Al Husna. Saga, Balaraja</p>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <p>Tgl&nbsp;: ${tanggal} ${waktu} WIB</p>
          <p>No&nbsp;&nbsp;: ${order.orderNumber}</p>
          <p>Nama: ${namaPelanggan}</p>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          ${itemsHtml}
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <div class="flex justify-between font-bold"><span>TOTAL</span><span>${formatRupiah(order.totalAmount)}</span></div>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <p class="text-center text-[10px] text-zinc-500 mt-2">Terima kasih atas kunjungan Anda! ☕</p>
        </div>
      `,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#0284c7',
    })
  }

  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="bg-white dark:bg-slate-900 rounded p-3 flex flex-col gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        {/* Row 1: ID Pesanan & Waktu di Kiri, Tombol Print & Chevron di Kanan */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {formatOrderIdDisplay(order.orderNumber)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              • {order.dateTime.split(', ')[1] || order.dateTime}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrintClick}
              className="px-2 py-0.5 text-[11px] font-medium bg-sky-500 hover:bg-sky-600 text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Cetak Struk"
            >
              <FiPrinter className="w-3 h-3" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Nama Pelanggan & Jumlah Item */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {order.customerName} • {totalItemsCount} item
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-3 flex flex-col justify-between transition-colors">
      <div className="space-y-2">
        {/* Header Card Expanded Mode (Tanpa Tombol Print di Atas) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {formatOrderIdDisplay(order.orderNumber)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              • {order.dateTime}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <FiChevronUp className="w-4 h-4" />
          </button>
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

      {/* Footer Card: Total Rp & Tombol Print di Bawah Angka Total */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Total</span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 text-right">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrintClick}
          className="w-full py-1.5 text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <FiPrinter className="w-3.5 h-3.5" />
          <span>Cetak Struk</span>
        </button>
      </div>
    </div>
  )
}
