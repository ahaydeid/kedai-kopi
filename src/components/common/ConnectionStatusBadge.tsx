'use client';

import { useEffect, useState } from 'react';
import { subscribeNetworkStatus, syncPendingOrders } from '@/services/offline/syncEngine';
import { FiWifiOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

export function ConnectionStatusBadge() {
  const [status, setStatus] = useState<{ isOnline: boolean; pendingCount: number; isSyncing: boolean }>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  // Show badge if offline or if there are pending orders
  if (status.isOnline && status.pendingCount === 0 && !status.isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-300">
      {!status.isOnline ? (
        <div className="flex items-center gap-1.5 bg-amber-500/90 text-white px-3 py-1.5 rounded-full shadow">
          <FiWifiOff className="w-4 h-4 animate-pulse" />
          <span>Offline Mode ({status.pendingCount} tersimpan)</span>
        </div>
      ) : status.isSyncing ? (
        <div className="flex items-center gap-1.5 bg-blue-600/90 text-white px-3 py-1.5 rounded-full shadow">
          <FiRefreshCw className="w-4 h-4 animate-spin" />
          <span>Menyinkronkan {status.pendingCount} pesanan...</span>
        </div>
      ) : status.pendingCount > 0 ? (
        <button
          onClick={() => syncPendingOrders()}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-full shadow cursor-pointer"
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>{status.pendingCount} Pesanan pending - Klik Sync</span>
        </button>
      ) : null}
    </div>
  );
}
