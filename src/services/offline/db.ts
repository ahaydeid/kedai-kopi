import Dexie, { type Table } from 'dexie';

export interface OfflineMenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name?: string;
  image_url?: string;
  available: boolean;
  updated_at?: string;
}

export interface OfflineCategory {
  id: string;
  name: string;
  display_order?: number;
}

export interface OfflineOrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface OfflineOrder {
  id: string; // Client-side UUID
  order_type: 'dine_in' | 'takeaway';
  table_number?: string;
  customer_name?: string;
  items: OfflineOrderItem[];
  total_amount: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid';
  sync_status: 'pending' | 'syncing' | 'failed' | 'synced';
  error_message?: string;
  created_at: string;
}

export interface OfflineStatusUpdate {
  id: string;
  order_id: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan';
  created_at: string;
}

export class KedaiKopiOfflineDB extends Dexie {
  cached_menu_items!: Table<OfflineMenuItem, string>;
  cached_categories!: Table<OfflineCategory, string>;
  pending_orders!: Table<OfflineOrder, string>;
  pending_status_updates!: Table<OfflineStatusUpdate, string>;

  constructor() {
    super('KedaiKopiOfflineDB');
    this.version(2).stores({
      cached_menu_items: 'id, category_id, name, available',
      cached_categories: 'id, display_order',
      pending_orders: 'id, sync_status, created_at',
      pending_status_updates: 'id, order_id, created_at',
    });
  }
}

export const offlineDB = new KedaiKopiOfflineDB();
