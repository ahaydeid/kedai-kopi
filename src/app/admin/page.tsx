'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'
import { getDashboardMetrics, DashboardMetrics } from '@/services/supabase/reportService'
import { subscribeToOrders } from '@/services/supabase/orderService'
import { formatOrderIdDisplay } from '@/utils/orderId'

// Client-side in-memory cache untuk instant 0ms render saat navigasi ulang
let dashboardCache: DashboardMetrics | null = null

interface TrendItem {
  label: string
  value: number
}

function LineTrendChart({ data, height = 220 }: { data: TrendItem[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const width = 640
  const paddingY = 12

  const coordinates = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2
    const y = height - ((d.value / max) * (height - paddingY * 2) + paddingY)
    return { x, y }
  })
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
  const areaPoints = [
    `0,${height}`,
    ...coordinates.map(({ x, y }) => `${x},${y}`),
    `${width},${height}`,
  ].join(' ')

  return (
    <div className="h-full w-full flex flex-col justify-between">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="sales-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((v) => (
          <line
            key={v}
            x1="0"
            y1={height - ((v / 100) * (height - paddingY * 2) + paddingY)}
            x2={width}
            y2={height - ((v / 100) * (height - paddingY * 2) + paddingY)}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            className="dark:stroke-zinc-800/80"
          />
        ))}

        <polygon points={areaPoints} fill="url(#sales-trend-fill)" />

        <polyline
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {coordinates.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r="1.75" fill="#0284c7" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((item) => (
          <span key={item.label} className="text-xs font-medium text-zinc-400">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => dashboardCache)
  const [loading, setLoading] = useState(!dashboardCache)

  const fetchMetrics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const data = await getDashboardMetrics()
    dashboardCache = data
    setMetrics(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMetrics(dashboardCache !== null)

    const unsubscribe = subscribeToOrders(() => {
      fetchMetrics(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchMetrics])

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Selamat Datang, Admin
        </h1>
      </div>

      {/* Dashboard Grid — 40:60 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Kolom Kiri: Total Pendapatan & Ringkasan Transaksi — 40% */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Card 1: Total Pendapatan */}
          <div className="bg-sky-700 dark:bg-zinc-900 p-5 rounded-lg text-white shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Total Pendapatan 30 Hari Terakhir</span>
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-2xl font-extrabold">
                {loading ? '...' : formatRupiah(metrics?.totalRevenue || 0)}
              </span>
              <p className="text-[11px] text-white/60">Data Transaksi Selesai</p>
            </div>
          </div>

          {/* Card: Statistik Transaksi */}
          <div className="space-y-2 flex-1 flex flex-col">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block ml-1">Ringkasan Pesanan</span>
            <div className="bg-white/80 dark:bg-zinc-900/40 p-5 rounded flex-1 flex flex-col">
              <div className="w-full">
                <div className="grid grid-cols-2 text-xs gap-y-3">
                  <span className="text-zinc-400">Pesanan Menunggu:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 text-right">
                    {loading ? '...' : `${metrics?.totalWaitingOrders || 0} Transaksi`}
                  </span>
                  <span className="text-zinc-400">Pesanan Diproses:</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 text-right">
                    {loading ? '...' : `${metrics?.totalInProcessOrders || 0} Transaksi`}
                  </span>
                  <span className="text-zinc-400">Pesanan Selesai:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                    {loading ? '...' : `${metrics?.totalCompletedOrders || 0} Transaksi`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: 4 Widgets Ringkas — 60% */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Aktivitas Real-time</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Status Stok Menu */}
            <div className="bg-white/80 dark:bg-zinc-900/40 p-4 rounded flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Status Kelola Menu
                </span>
              </div>

              <div className="text-right pt-1">
                <Link href="/admin/menu" className="text-[10px] text-sky-600 dark:text-sky-400 font-medium hover:underline inline-flex items-center gap-0.5">
                  Buka Kelola Menu <FiArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>

            {/* Kolom Kanan: Pesanan Terbaru */}
            <div className="bg-white/80 dark:bg-zinc-900/40 p-4 rounded flex flex-col justify-start space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Pesanan Terbaru
                </span>
                <Link href="/admin/order-history" className="text-[10px] text-sky-600 dark:text-sky-400 font-medium hover:underline inline-flex items-center gap-0.5">
                  Lihat Semua <FiArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>

              <div className="space-y-1.5">
                {loading ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Memuat pesanan...</p>
                ) : metrics?.recentOrders.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Belum ada pesanan.</p>
                ) : (
                  metrics?.recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-[11px] bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded border border-zinc-100 dark:border-zinc-800/40">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {formatOrderIdDisplay(o.order_number)} - {o.customer_name}
                        </p>
                        <p className="text-[9px] text-zinc-400">{formatRupiah(Number(o.total_amount))}</p>
                      </div>
                      <span className={`text-[10px] font-medium ${
                        o.status === 'Selesai'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : o.status === 'Diproses'
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIK Pertumbuhan Transaksi Chart */}
      <div className="pt-2">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded">
          <h3 className="mb-6 text-sm font-bold text-slate-700 dark:text-zinc-200">
            Pertumbuhan Transaksi (dalam Ribuan Rp)
          </h3>
          <div className="h-64">
            <LineTrendChart data={metrics?.salesTrend || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
