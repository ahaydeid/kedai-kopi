'use client'

import { useState, useEffect, useRef } from 'react'
import { FiInbox } from 'react-icons/fi'
import { useBaristaContext } from '../BaristaContext'
import { BaristaOrderCard, BaristaOrder } from '../_components/BaristaOrderCard'

type FilterPeriod = 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini'

export default function RiwayatPage() {
  const { orders, handleUpdateStatus, handlePrintStruk } = useBaristaContext()
  const [filter, setFilter] = useState<FilterPeriod>('Hari Ini')
  const [displayLimit, setDisplayLimit] = useState<number>(5)
  const observerTargetRef = useRef<HTMLDivElement | null>(null)

  const filtered = orders.filter((o: BaristaOrder) => o.status === 'Selesai')

  // Reset displayLimit jika filter periode berubah
  useEffect(() => {
    setDisplayLimit(5)
  }, [filter])

  // Trigger Lazy Loading saat scroll mendekati bawah
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < filtered.length) {
          setDisplayLimit((prev) => prev + 5)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTargetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [displayLimit, filtered.length])

  const visibleOrders = filtered.slice(0, displayLimit)

  return (
    <div>
      {/* Topbar Filter */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2">
        {(['Hari Ini', 'Minggu Ini', 'Bulan Ini'] as FilterPeriod[]).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setFilter(period)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === period
                ? 'bg-amber-800 text-white dark:bg-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Daftar Pesanan */}
      {filtered.length === 0 ? (
        <div className="max-w-md mx-auto h-64 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
          <FiInbox className="h-12 w-12 stroke-[1.5]" />
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada riwayat pesanan
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto px-1.5 pt-1.5 pb-28 flex flex-col gap-2">
          {visibleOrders.map((order) => (
            <BaristaOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onPrintStruk={handlePrintStruk}
            />
          ))}

          {/* Sentinel untuk Trigger Lazy Load (+5) */}
          {displayLimit < filtered.length && (
            <div
              ref={observerTargetRef}
              className="py-6 text-center text-xs text-slate-400 font-medium animate-pulse"
            >
              Memuat riwayat transaksi lainnya...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
