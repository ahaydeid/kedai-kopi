import { OrdersManagement } from './_components/OrdersManagement'

export const metadata = {
  title: 'Pesanan - Admin Kedai Kopi',
  description: 'Daftar pesanan aktif kedai kopi',
}

export default function OrdersPage() {
  return <OrdersManagement />
}
