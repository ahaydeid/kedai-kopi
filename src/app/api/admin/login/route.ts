import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/services/supabase/adminClient'

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Query admin record dari tabel staff berdasarkan email dan role=admin
    const { data, error } = await supabase
      .from('staff')
      .select('email, password, name')
      .eq('role', 'admin')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (error || !data || !data.password) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Verifikasi password dengan SHA-256 (constant-time compare)
    const submittedHash = Buffer.from(sha256(password))
    const storedHash = Buffer.from(data.password)

    if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Set cookie admin_session dan admin_email
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', 'true', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 3600,
      path: '/',
    })
    response.cookies.set('admin_email', encodeURIComponent(email.trim().toLowerCase()), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 3600,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[Admin Login API]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
