'use client'

import { useState } from 'react'
import { FiInbox, FiPlus } from 'react-icons/fi'
import { useBaristaContext } from '../BaristaContext'
import { BaristaOrderCard, BaristaOrder } from '../_components/BaristaOrderCard'
import { BaristaAddOrderModal } from '../_components/BaristaAddOrderModal'

export default function MenungguPage() {
  const { orders, handleUpdateStatus, handlePrintStruk, handleAddOrder } = useBaristaContext()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const filtered = orders.filter((o: BaristaOrder) => o.status === 'Menunggu')

  return (
    <div>
      {filtered.length === 0 ? (
        <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
          <FiInbox className="h-12 w-12 stroke-[1.5]" />
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tidak ada pesanan &quot;Menunggu&quot;
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto px-1.5 pt-1.5 flex flex-col gap-2">
          {filtered.map((order) => (
            <BaristaOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onPrintStruk={handlePrintStruk}
            />
          ))}
        </div>
      )}

      {/* Tombol Floating (+) di Kanan Bawah */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-4 sm:right-6 z-40 h-12 w-12 rounded-full bg-amber-800 hover:bg-amber-900 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Tambah Pesanan Manual Dapur"
      >
        <FiPlus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* Modal Tambah Pesanan */}
      <BaristaAddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </div>
  )
}
