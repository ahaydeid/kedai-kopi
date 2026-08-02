import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/services/supabase/adminClient'

export interface MemberData {
  id: string
  name: string
  phone: string | null
  email: string
  avatarUrl: string | null
  joinedAt: string
  totalOrders: number
  totalSpend: number
  totalPoints: number
}

// Memory Cache TTL 30 Detik
let membersCache: { data: MemberData[]; timestamp: number } | null = null
const CACHE_TTL_MS = 30 * 1000

export function clearMembersCache() {
  membersCache = null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10))
    const search = searchParams.get('search')?.trim() || ''
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    const now = Date.now()
    let allMembers: MemberData[] = []

    if (!forceRefresh && membersCache && now - membersCache.timestamp < CACHE_TTL_MS) {
      allMembers = membersCache.data
    } else {
      const supabase = createAdminClient()

      // Ambil semua user dari auth.users via admin API
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      })

      if (usersError) {
        console.error('[Members API] Error fetching users:', usersError)
        return NextResponse.json({ error: 'Gagal memuat data member' }, { status: 500 })
      }

      // Filter hanya customer (bukan admin)
      const customerUsers = (usersData?.users || []).filter(
        (u) => !u.email?.toLowerCase().includes('admin')
      )

      if (customerUsers.length === 0) {
        return NextResponse.json({ members: [], totalCount: 0, page, pageSize })
      }

      const userIds = customerUsers.map((u) => u.id)

      // Ambil poin dari tabel member_points
      const { data: pointsData } = await supabase
        .from('member_points')
        .select('user_id, points')
        .in('user_id', userIds)

      const pointsMap: Record<string, number> = {}
      for (const p of pointsData || []) {
        pointsMap[p.user_id] = p.points
      }

      // Ambil total order & total spend per user
      const { data: ordersData } = await supabase
        .from('orders')
        .select('user_id, total_amount, status')
        .in('user_id', userIds)

      const orderCountByUser: Record<string, number> = {}
      const totalSpendByUser: Record<string, number> = {}
      for (const o of ordersData || []) {
        if (o.user_id) {
          orderCountByUser[o.user_id] = (orderCountByUser[o.user_id] || 0) + 1
          if (o.status !== 'Dibatalkan') {
            totalSpendByUser[o.user_id] = (totalSpendByUser[o.user_id] || 0) + Number(o.total_amount || 0)
          }
        }
      }

      allMembers = customerUsers.map((u) => ({
        id: u.id,
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Pelanggan',
        phone: u.user_metadata?.phone || u.user_metadata?.phone_number || u.phone || null,
        email: u.email || '',
        avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        joinedAt: u.created_at,
        totalOrders: orderCountByUser[u.id] || 0,
        totalSpend: totalSpendByUser[u.id] || 0,
        totalPoints: pointsMap[u.id] ?? 0,
      }))

      // Urutkan: terbanyak order di atas
      allMembers.sort((a, b) => b.totalOrders - a.totalOrders)

      membersCache = { data: allMembers, timestamp: now }
    }

    // Filter berdasarkan kata kunci pencarian
    let filtered = allMembers
    if (search) {
      const q = search.toLowerCase()
      filtered = allMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.phone && m.phone.toLowerCase().includes(q))
      )
    }

    const totalCount = filtered.length
    const startIndex = (page - 1) * pageSize
    const paginated = filtered.slice(startIndex, startIndex + pageSize)

    return NextResponse.json({
      members: paginated,
      totalCount,
      page,
      pageSize,
    })
  } catch (err) {
    console.error('[Members API]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
