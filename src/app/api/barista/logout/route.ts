import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Hapus cookie barista_session dan barista_name secara server-side
  response.cookies.set('barista_session', '', {
    httpOnly: false,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })

  response.cookies.set('barista_name', '', {
    httpOnly: false,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })

  return response
}
