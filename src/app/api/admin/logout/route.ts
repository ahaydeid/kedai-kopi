import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Hapus cookie HTTP-Only admin_session dan admin_email secara server-side
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })
  
  response.cookies.set('admin_email', '', {
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })

  return response
}
