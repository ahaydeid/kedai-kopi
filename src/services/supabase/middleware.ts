import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes user Supabase session automatically and enforces Route Protection & Role Isolation:
 * 1. Barista (/barista) -> Redirects to /loginkedai if no barista session cookie
 * 2. Admin (/admin) -> Redirects to /loginkedai if no admin session cookie or admin user
 * 3. Customer (/orders, /history, /profile) -> Redirects to /login if no valid customer user
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Proteksi Route Barista (/barista) via cookie barista_session
  if (pathname.startsWith('/barista')) {
    const baristaSession = request.cookies.get('barista_session')?.value
    if (!baristaSession) {
      const loginUrl = new URL('/loginkedai', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 2. Proteksi Route Admin (/admin) via cookie admin_session
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      const loginUrl = new URL('/loginkedai', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isUrlValid = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
  const isKeyValid = supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key'

  // Proteksi rute pelanggan yang membutuhkan autentikasi
  const isCustomerProtected = ['/orders', '/history', '/profile'].some((r) => pathname.startsWith(r))

  if (!isUrlValid || !isKeyValid) {
    if (isCustomerProtected) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const isUserAdmin = Boolean(user && user.email && user.email.toLowerCase().includes('admin'))

    // 3. Proteksi Route Pelanggan (/orders, /history, /profile) -> Redirect ke /login jika tidak login atau jika akun adalah admin
    if (isCustomerProtected && (!user || isUserAdmin)) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (err) {
    console.warn('[Supabase Middleware] Connection timeout or offline during session refresh:', err)
  }

  return supabaseResponse
}
