'use client'

import { useEffect } from 'react'

export function ItemRedirectClient({ id }: { id: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(`/menu?item=${id}`)
    }
  }, [id])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 font-sans p-4">
      <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-semibold">Mengarahkan ke menu kedai...</p>
    </div>
  )
}
