'use client'

import React, { useState } from 'react'
import { HiOutlineMegaphone, HiOutlinePlus, HiOutlineTag, HiOutlineSparkles, HiOutlineCalendar } from 'react-icons/hi2'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface CampaignItem {
  id: string
  title: string
  code: string
  discount: string
  period: string
  status: 'Aktif' | 'Mendatang' | 'Berakhir'
}

export function CampaignManagement() {
  const [campaigns] = useState<CampaignItem[]>([
    {
      id: '1',
      title: 'Diskon Awal Bulan',
      code: 'AWALBULAN10',
      discount: 'Diskon 10%',
      period: '1 Aug - 7 Aug 2026',
      status: 'Aktif',
    },
    {
      id: '2',
      title: 'Promo Kemerdekaan',
      code: 'MERDEKA17',
      discount: 'Diskon 17%',
      period: '15 Aug - 20 Aug 2026',
      status: 'Mendatang',
    },
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HiOutlineMegaphone className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            <span>Campaign</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola promo, diskon voucer, dan campaign pemasaran Kedai Kopi
          </p>
        </div>

        <Button type="button" variant="primary" size="sm" className="inline-flex items-center gap-1.5 cursor-pointer">
          <HiOutlinePlus className="h-4 w-4" />
          <span>Buat Campaign</span>
        </Button>
      </div>

      {/* List Campaign */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <HiOutlineSparkles className="h-4 w-4 text-amber-500" />
                  {c.title}
                </h3>
                <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-semibold block mt-0.5">
                  {c.code}
                </span>
              </div>
              <Badge
                variant={c.status === 'Aktif' ? 'success' : c.status === 'Mendatang' ? 'warning' : 'secondary'}
              >
                {c.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <HiOutlineTag className="h-3.5 w-3.5 text-slate-400" />
                {c.discount}
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineCalendar className="h-3.5 w-3.5 text-slate-400" />
                {c.period}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
