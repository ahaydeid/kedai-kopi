'use client'

import { FiInbox } from 'react-icons/fi'
import { useBaristaContext } from '../BaristaContext'
import { BaristaOrderCard, BaristaOrder } from '../_components/BaristaOrderCard'

export default function ProsesPage() {
  const { orders, handleUpdateStatus, handlePrintStruk } = useBaristaContext()
  const filtered = orders.filter((o: BaristaOrder) => o.status === 'Diproses')

  if (filtered.length === 0) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
        <FiInbox className="h-12 w-12 stroke-[1.5]" />
        <div className="text-center space-y-0.5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada pesanan &quot;Diproses&quot;
          </p>
        </div>
      </div>
    )
  }

  return (
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
  )
}
