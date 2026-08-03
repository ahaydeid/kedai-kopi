import { createClient } from '@/services/supabase/client'

/**
 * Web System Notification Utility for Staff (Barista & Admin)
 */

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }
}

export async function showOrderNotification(payloadNew: {
  id?: string
  order_number?: string
  customer_name?: string
  table_number?: string
  total_amount?: number
  order_type?: string
  items_summary?: string
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const soundMode = localStorage.getItem('setting_sound_mode') !== 'hening'
  if (!soundMode) return

  const orderNum = payloadNew.order_number || 'Baru'
  const customer = payloadNew.customer_name || 'Pelanggan'
  const mejaStr = payloadNew.table_number
    ? `Meja #${payloadNew.table_number}`
    : payloadNew.order_type === 'takeaway'
    ? 'Takeaway'
    : 'Dine In'

  let itemsText = payloadNew.items_summary || ''
  if (!itemsText && payloadNew.id) {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('order_items')
        .select('quantity, menu_name')
        .eq('order_id', payloadNew.id)

      if (data && data.length > 0) {
        itemsText = data.map((i) => `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.menu_name}`).join(', ')
      }
    } catch {}
  }

  const rawTotal = Number(payloadNew.total_amount || 0)
  const formattedTotal = rawTotal > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(rawTotal)
    : ''

  const title = `☕ Pesanan Baru #${orderNum}`
  const detailParts = [customer, mejaStr]
  if (itemsText) detailParts.push(`(${itemsText})`)
  if (formattedTotal) detailParts.push(formattedTotal)

  const body = detailParts.join(' • ')

  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: `order-${orderNum}-${Date.now()}`,
    })

    notif.onclick = () => {
      window.focus()
      notif.close()
    }
  } catch (err) {
    console.warn('System Notification Error:', err)
  }
}

export async function showCustomerOrderCompletedNotification(payloadNew: {
  id?: string
  order_number?: string
  customer_name?: string
  total_amount?: number
  table_number?: string
  order_type?: string
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const soundMode = localStorage.getItem('setting_sound_mode') !== 'hening'
  if (!soundMode) return

  const orderNum = payloadNew.order_number || ''
  const customer = payloadNew.customer_name || 'Pelanggan'
  const displayId = orderNum ? `#${orderNum}` : ''

  const title = `🎉 Pesanan ${displayId} Siap Diambil!`
  const body = `Halo ${customer}, pesanan Anda sudah Selesai dibuat. Silakan ambil pesanan Anda di konter barista. Selamat menikmati! ☕`

  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: `customer-order-completed-${orderNum}-${Date.now()}`,
    })

    notif.onclick = () => {
      window.focus()
      notif.close()
    }
  } catch (err) {
    console.warn('Customer Notification Error:', err)
  }
}
