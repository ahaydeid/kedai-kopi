import { offlineDB, type OfflineOrder } from './db';
import { createOrder, updateOrderStatus } from '@/services/supabase/orderService';

let isSyncing = false;
const listeners = new Set<(status: { isOnline: boolean; pendingCount: number; isSyncing: boolean }) => void>();

export function getNetworkStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function subscribeNetworkStatus(
  callback: (status: { isOnline: boolean; pendingCount: number; isSyncing: boolean }) => void
) {
  listeners.add(callback);

  const notify = async () => {
    const pendingOrdersCount = await offlineDB.pending_orders.where('sync_status').equals('pending').count();
    const pendingUpdatesCount = await offlineDB.pending_status_updates.count();
    callback({
      isOnline: getNetworkStatus(),
      pendingCount: pendingOrdersCount + pendingUpdatesCount,
      isSyncing,
    });
  };

  notify();

  const handleOnline = () => {
    notify();
    syncPendingOrders();
  };

  const handleOffline = () => {
    notify();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

export async function syncPendingOrders() {
  if (!getNetworkStatus() || isSyncing) return;

  isSyncing = true;
  try {
    // 1. Sync pending orders
    const pendingOrders = await offlineDB.pending_orders.where('sync_status').equals('pending').toArray();

    for (const order of pendingOrders) {
      await offlineDB.pending_orders.update(order.id, { sync_status: 'syncing' });

      try {
        const result = await createOrder({
          customerName: order.customer_name || 'Pelanggan Offline',
          orderType: order.order_type,
          tableNumber: order.table_number,
          totalAmount: order.total_amount,
          items: order.items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        });

        if (result) {
          await offlineDB.pending_orders.update(order.id, { sync_status: 'synced' });
          await offlineDB.pending_orders.delete(order.id);
        } else {
          await offlineDB.pending_orders.update(order.id, {
            sync_status: 'failed',
            error_message: 'Server error during sync',
          });
        }
      } catch (err: any) {
        console.error(`[Offline Sync] Failed to sync order ${order.id}:`, err);
        await offlineDB.pending_orders.update(order.id, {
          sync_status: 'pending',
          error_message: err?.message || 'Network sync error',
        });
      }
    }

    // 2. Sync pending status updates
    const pendingUpdates = await offlineDB.pending_status_updates.toArray();
    for (const updateItem of pendingUpdates) {
      try {
        await updateOrderStatus(updateItem.order_id, updateItem.status);
        await offlineDB.pending_status_updates.delete(updateItem.id);
      } catch (err) {
        console.error(`[Offline Sync] Failed to sync order status update for ${updateItem.order_id}:`, err);
      }
    }
  } finally {
    isSyncing = false;
    const pendingOrdersCount = await offlineDB.pending_orders.where('sync_status').equals('pending').count();
    const pendingUpdatesCount = await offlineDB.pending_status_updates.count();
    listeners.forEach((fn) =>
      fn({
        isOnline: getNetworkStatus(),
        pendingCount: pendingOrdersCount + pendingUpdatesCount,
        isSyncing: false,
      })
    );
  }
}
