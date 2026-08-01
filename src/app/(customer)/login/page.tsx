'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { signInWithGoogle, getCurrentUser } from '@/services/supabase/authService'

export default function CustomerLoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkExistingUser() {
      const user = await getCurrentUser()
      if (user) {
        router.push('/menu')
      }
    }
    checkExistingUser()
  }, [router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    const callbackUrl = `${window.location.origin}/auth/callback?next=/menu`
    await signInWithGoogle(callbackUrl)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-[#3D2514] selection:text-white">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        
        {/* Header Logo Kedai Kopi */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative w-24 h-24 mb-3 rounded-full overflow-hidden shadow-md border-2 border-amber-500/20">
            <Image
              src="/img/logo-kedaikopi.webp"
              alt="Logo Kedai Kopi"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Kedai Kopi
          </h1>
        </div>

        {/* Google OAuth Login Button */}
        <div className="space-y-4 pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-[0.98] text-slate-700 dark:text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <FcGoogle className="h-5 w-5" />
            <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
