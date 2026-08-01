import React from 'react'
import { CustomerBottomBar } from '@/components/layout/CustomerBottomBar'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <div className="flex-1">{children}</div>
      <CustomerBottomBar />
    </div>
  )
}
