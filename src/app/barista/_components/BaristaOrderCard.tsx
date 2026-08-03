'use client'

import React from 'react'
import { FiCheck, FiPrinter, FiArrowRight, FiUser } from 'react-icons/fi'
import { formatOrderIdDisplay } from '@/utils/orderId'
import { playSound, playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'

export interface BaristaOrderItem {
  name: string
  price: number
}

export interface BaristaOrder {
  id: string
  orderNumber: string
  customerName: string
  tableNumber?: string | null
  orderType?: 'dine_in' | 'takeaway' | string
  dateTime: string
  createdAt?: string
  items: BaristaOrderItem[]
  totalAmount: number
  discountAmount?: number
  claimedPoints?: number
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan'
}

interface BaristaOrderCardProps {
  order: BaristaOrder
  onUpdateStatus: (id: string, newStatus: 'Menunggu' | 'Diproses' | 'Selesai') => void
  onPrintStruk: (order: BaristaOrder) => void
}

export function BaristaOrderCard({
  order,
  onUpdateStatus,
  onPrintStruk,
}: BaristaOrderCardProps) {
  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleStartProcess = () => {
    playSound('present.mp3')
    onUpdateStatus(order.id, 'Diproses')
  }

  const handleCompleteOrder = () => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Tandai Selesai?',
      text: `Apakah pesanan ${formatOrderIdDisplay(order.orderNumber)} atas nama ${order.customerName} sudah selesai dibuat?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Ya, Selesai!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        cancelButton: '!text-slate-700 !font-semibold',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        playSwalSound('success')
        Swal.fire({
          icon: 'success',
          title: 'Pesanan Selesai!',
          text: `Pesanan ${formatOrderIdDisplay(order.orderNumber)} telah dipindahkan ke tab Riwayat.`,
          timer: 1500,
          showConfirmButton: false,
        })
        onUpdateStatus(order.id, 'Selesai')
      }
    })
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-none border-none shadow-none p-3.5 sm:p-4 space-y-3 flex flex-col justify-between">
      <div className="space-y-2.5">
        {/* Order Header (ID & Nama Pelanggan di Kiri, Waktu Rata Kanan) */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2.5 gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
              {formatOrderIdDisplay(order.orderNumber)}
            </span>
            <span className="text-[12px] font-medium text-slate-400 dark:text-slate-300 flex items-center gap-1 truncate">
              <FiUser className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{order.customerName}</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 text-right shrink-0">
            {order.dateTime}
          </span>
        </div>

        {/* Item List Sederhana */}
        <div className="space-y-1.5 py-0.5">
          {order.items.map((item, idx) => {
            const match = item.name.match(/^(\d+)(x)\s+(.*)$/)
            return (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {match ? `${match[1]}×` : ''}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                    {match ? match[3] : item.name}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                  {formatRupiah(item.price)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Total Tagihan */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-xs text-slate-400 font-medium">Total Tagihan</span>
          <span className="text-xs font-extrabold text-[#3D2514] dark:text-amber-200">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Tombol Aksi Barista */}
      <div className="pt-3.5 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-3">
        <button
          type="button"
          onClick={() => onPrintStruk(order)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-auto"
          title="Cetak Struk Thermal"
        >
          <FiPrinter className="h-4 w-4" />
        </button>

        {order.status === 'Menunggu' && (
          <button
            type="button"
            onClick={handleStartProcess}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-700 text-white text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Mulai Proses</span>
            <FiArrowRight className="h-4 w-4" />
          </button>
        )}

        {order.status === 'Diproses' && (
          <button
            type="button"
            onClick={handleCompleteOrder}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FiCheck className="h-4 w-4 stroke-[2.5]" />
            <span>Tandai Selesai</span>
          </button>
        )}
      </div>
    </section>
  )
}
