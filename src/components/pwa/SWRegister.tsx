'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
              console.log('Kedai Kopi PWA Service Worker registered:', reg.scope)
            })
            .catch((err) => {
              console.warn('Service Worker registration skipped/failed:', err)
            })
        })
      } else {
        // Pada mode development, unregister Service Worker agar HMR & live reload selalu mendapatkan versi terbaru
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        })
      }
    }
  }, [])

  return null
}
