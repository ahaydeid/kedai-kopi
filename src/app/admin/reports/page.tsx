'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getOrders, FetchedOrderWithItems } from '@/services/supabase/orderService'

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<FetchedOrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'semua' | 'hari-ini' | 'bulan-ini'>('semua')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const data = await getOrders()
    setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredOrders = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return orders.filter((o) => {
      if (!o.created_at) return true
      const date = new Date(o.created_at)

      if (timeFilter === 'hari-ini') {
        return date.toISOString().slice(0, 10) === todayStr
      }
      if (timeFilter === 'bulan-ini') {
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }
      return true
    })
  }, [orders, timeFilter])

  const completedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'Selesai'),
    [filteredOrders]
  )

  const totalOmset = useMemo(
    () => completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    [completedOrders]
  )

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Laporan Penjualan
          </h1>
          <p className="text-xs text-slate-500 mt-1">Ringkasan hasil transaksi dan omset kedai</p>
        </div>

        {/* Filter Rentang Waktu */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className="py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="semua">Semua Waktu</option>
          <option value="hari-ini">Hari Ini</option>
          <option value="bulan-ini">Bulan Ini</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Omset Penjualan</span>
          <p className="text-2xl font-extrabold text-[#3D2514] dark:text-amber-200">
            {loading ? '...' : formatRupiah(totalOmset)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 font-medium">Transaksi Selesai</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : `${completedOrders.length} Transaksi`}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 font-medium">Rata-rata Nilai Transaksi</span>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
            {loading ? '...' : formatRupiah(completedOrders.length > 0 ? totalOmset / completedOrders.length : 0)}
          </p>
        </div>
      </div>

      {/* Rincian Tabel Laporan */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Detail Rincian Transaksi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">No</th>
                <th className="px-4 py-3 font-semibold">No. Pesanan</th>
                <th className="px-4 py-3 font-semibold">Nama Pelanggan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Memuat laporan...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tidak ada transaksi ditemukan.</td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                    <td className="px-4 py-3 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">#{o.order_number}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        o.status === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : o.status === 'Diproses'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-right text-slate-900 dark:text-slate-100">
                      {formatRupiah(Number(o.total_amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
