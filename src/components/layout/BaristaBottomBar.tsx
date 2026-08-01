'use client'

import React from 'react'
import { FiClock, FiLogOut } from 'react-icons/fi'
import { LuChefHat, LuHistory } from 'react-icons/lu'

export type BaristaTab = 'Menunggu' | 'Proses' | 'Riwayat' | 'Keluar'

interface BaristaBottomBarProps {
  activeTab: BaristaTab
  onTabChange: (tab: BaristaTab) => void
  counts: {
    menunggu: number
    proses: number
    selesai: number
  }
}

export function BaristaBottomBar({
  activeTab,
  onTabChange,
  counts,
}: BaristaBottomBarProps) {
  const tabs: { id: BaristaTab; label: string; icon: React.ReactNode; count: number; activeColor: string; badgeBg: string }[] = [
    {
      id: 'Menunggu',
      label: 'Menunggu',
      icon: <FiClock className="h-5 w-5" />,
      count: counts.menunggu,
      activeColor: 'text-amber-800 dark:text-amber-200 font-medium',
      badgeBg: 'bg-emerald-500 text-white',
    },
    {
      id: 'Proses',
      label: 'Proses',
      icon: <LuChefHat className="h-5 w-5" />,
      count: counts.proses,
      activeColor: 'text-amber-800 dark:text-amber-200 font-medium',
      badgeBg: 'bg-emerald-500 text-white',
    },
    {
      id: 'Riwayat',
      label: 'Riwayat',
      icon: <LuHistory className="h-5 w-5" />,
      count: counts.selesai,
      activeColor: 'text-amber-800 dark:text-amber-200 font-medium',
      badgeBg: 'bg-emerald-500 text-white',
    },
    {
      id: 'Keluar',
      label: 'Keluar',
      icon: <FiLogOut className="h-5 w-5" />,
      count: 0,
      activeColor: 'text-rose-600 dark:text-rose-400 font-medium',
      badgeBg: '',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 h-16 flex items-center justify-around px-2 sm:px-6 shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-all cursor-pointer ${
              isActive
                ? tab.activeColor
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-normal'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.count > 0 && tab.id !== 'Riwayat' && (
                <span
                  className={`absolute -top-1.5 -right-3 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-xs ${tab.badgeBg}`}
                >
                  {tab.count}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>

            {/* Indicator Indicator Bar */}
            {isActive && (
              <span className="absolute bottom-0 h-0.5 w-12 rounded-full bg-current" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
