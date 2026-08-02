'use client'

import { useState, useEffect } from 'react'
import { subscribeNetworkStatus, getNetworkStatus } from '@/services/offline/syncEngine'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => getNetworkStatus())

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus(({ isOnline }) => {
      setIsOnline(isOnline)
    })
    return () => unsubscribe()
  }, [])

  return isOnline
}
