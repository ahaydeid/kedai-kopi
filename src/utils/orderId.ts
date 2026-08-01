/**
 * Generator & Formatter ID Order 10 Digit (YYMMDDHHXX)
 * Database/Nilai Murni: 2607241983 (10 digit angka)
 * Tampilan UI: #ORD-2607241983
 */

export function generateOrderId(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const randomXx = String(Math.floor(Math.random() * 100)).padStart(2, '0')

  return `${yy}${mm}${dd}${hh}${randomXx}`
}

export function formatOrderIdDisplay(orderId: string): string {
  if (!orderId) return ''
  const cleanId = orderId.replace(/^#?(ORD-)?/, '')
  return `#ORD-${cleanId}`
}
