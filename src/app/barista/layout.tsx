import React from 'react'
import { BaristaProvider } from './BaristaContext'
import { BaristaBottomBarClient } from './_components/BaristaBottomBarClient'

export const metadata = {
  title: 'Display Dapur | Barista Kedai Kopi',
  description: 'Sistem pembuatan pesanan dapur khusus barista',
}

export default function BaristaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BaristaProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-16">
        {children}
        <BaristaBottomBarClient />
      </div>
    </BaristaProvider>
  )
}
