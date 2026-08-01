import { OrderHistoryManagement } from './_components/OrderHistoryManagement'

export const metadata = {
  title: 'Riwayat Pesanan - Admin Kedai Kopi',
  description: 'Daftar riwayat transaksi dan pesanan kedai kopi',
}

export default function OrderHistoryPage() {
  return <OrderHistoryManagement />
}
