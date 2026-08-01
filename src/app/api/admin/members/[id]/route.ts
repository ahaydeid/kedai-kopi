import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/services/supabase/adminClient'
import { clearMembersCache } from '../route'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { points } = await request.json()

    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json({ error: 'Nilai poin tidak valid' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('member_points')
      .upsert(
        { user_id: id, points, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[Members PATCH] Error updating points:', error)
      return NextResponse.json({ error: 'Gagal mengupdate poin' }, { status: 500 })
    }

    clearMembersCache()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Members PATCH]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
