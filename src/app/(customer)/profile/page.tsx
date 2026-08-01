'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import {
  FiShoppingBag,
  FiTag,
  FiInfo,
  FiChevronRight,
  FiLogOut,
} from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { getCurrentUser, getCachedUserSync, signOut } from '@/services/supabase/authService'
import { createClient } from '@/services/supabase/client'

export default function CustomerProfilePage() {
  const cachedUser = getCachedUserSync()
  const [user, setUser] = useState<any>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)
  const router = useRouter()

  const [userPoints, setUserPoints] = useState<number>(0)

  useEffect(() => {
    async function loadUser() {
      if (!cachedUser) {
        setLoading(true)
      }
      const u = await getCurrentUser()
      if (!u) {
        router.push('/login')
        return
      }
      setUser(u)

      // Ambil poin dari tabel member_points
      const supabase = createClient()
      const { data: pointsData } = await supabase
        .from('member_points')
        .select('points')
        .eq('user_id', u.id)
        .single()

      setUserPoints(pointsData?.points ?? 0)
      setLoading(false)
    }
    loadUser()
  }, [router, cachedUser])

  const handleSignOut = () => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Keluar dari Akun?',
      text: 'Kamu harus login ulang kalau mau masuk lagi',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup',
        cancelButton: '!text-slate-700 !font-semibold',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await signOut()
        router.push('/login')
      }
    })
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-xs text-slate-400 font-medium">Memuat profil...</div>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pelanggan Kedai'
  const userPhoto = user?.user_metadata?.avatar_url || null
  const userEmail = user?.email || 'Pelanggan'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-[#3D2514] selection:text-white">
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto pb-28 space-y-4">
        {/* Header User Info & Poin Saya */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded border-none space-y-3.5">
          <div className="flex items-center gap-3.5">
            <Avatar name={userName} photo={userPhoto} size="medium" />
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                {userName}
              </h1>
              <p className="text-xs text-slate-400 font-medium truncate">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Ringkasan Poin Saya (Style Card Sky) */}
          <div className="relative overflow-hidden bg-sky-600 p-4 rounded-xl text-white">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative z-10 flex flex-col">
              <span className="text-[11px] font-semibold text-sky-100 tracking-wider uppercase text-left">
                Poin Saya
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-white">
                  {userPoints}
                </span>
                <span className="text-xs font-normal text-sky-100">
                  Poin
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* List Menu Utama Datar & Bersih (Rounded Reguler) */}
        <section className="bg-white dark:bg-slate-900 rounded overflow-hidden border-none divide-y divide-slate-100/60 dark:divide-slate-800/60">
          <Link
            href="/orders"
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiShoppingBag className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Riwayat Pesanan
              </span>
            </div>
            <FiChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <div
            onClick={() => alert('Voucher Saya')}
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FiTag className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Voucher Saya
              </span>
            </div>
            <FiChevronRight className="h-4 w-4 text-slate-400" />
          </div>

          <Link
            href="/info"
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiInfo className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Info
              </span>
            </div>
            <FiChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </section>
      </main>

      {/* Tombol Keluar Akun - Fixed di atas BottomBar */}
      <div className="fixed bottom-14 left-0 right-0 z-30 flex justify-center pb-3 pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center justify-center gap-1.5 p-2 text-rose-600 dark:text-rose-400 font-normal text-xs hover:underline cursor-pointer transition-colors"
        >
          <FiLogOut className="h-4 w-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  )
}
