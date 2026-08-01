'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useBaristaContext } from '../BaristaContext'
import { BaristaBottomBar } from '@/components/layout/BaristaBottomBar'
import type { BaristaTab } from '@/components/layout/BaristaBottomBar'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'
import { signOutBarista } from '@/services/supabase/authService'

const TAB_ROUTES: Record<BaristaTab, string> = {
  Menunggu: '/barista/menunggu',
  Proses: '/barista/proses',
  Riwayat: '/barista/riwayat',
  Keluar: '/loginkedai',
}

const ROUTE_TABS: Record<string, BaristaTab> = {
  '/barista/menunggu': 'Menunggu',
  '/barista/proses': 'Proses',
  '/barista/riwayat': 'Riwayat',
}

export function BaristaBottomBarClient() {
  const pathname = usePathname()
  const router = useRouter()
  const { counts } = useBaristaContext()

  const activeTab: BaristaTab = ROUTE_TABS[pathname] ?? 'Menunggu'

  const handleTabChange = (tab: BaristaTab) => {
    if (tab === 'Keluar') {
      playSwalSound('confirm')
      Swal.fire({
        title: 'Keluar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#f1f5f9',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
          cancelButton: '!text-slate-700 !font-semibold',
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          await signOutBarista()
          window.location.href = '/loginkedai'
        }
      })
      return
    }
    router.push(TAB_ROUTES[tab])
  }

  return (
    <BaristaBottomBar
      activeTab={activeTab}
      onTabChange={handleTabChange}
      counts={counts}
    />
  )
}
