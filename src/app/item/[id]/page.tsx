import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

interface ItemPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const id = resolvedParams.id

  const headersList = await headers()
  const host = headersList.get('host') || ''
  const proto = headersList.get('x-forwarded-proto') || (host && host.includes('localhost') ? 'http' : 'https')
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || '')

  let title = 'Menu Kedai Kopi'
  let description = 'Pesan menu favoritmu di Kedai Kopi - Coffee, Drinks & Good Food!'
  let priceText = ''
  let itemImageUrl = ''

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (supabaseUrl && supabaseAnonKey && id) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase
      .from('menus')
      .select('name, price, main_category, sub_category, description, images')
      .eq('id', id)
      .single()

    if (data) {
      title = `${data.name} - Kedai Kopi`
      if (data.price) {
        priceText = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(Number(data.price))
      }
      description = `${data.main_category || 'Menu'} ${priceText ? `(${priceText})` : ''} · ${data.description || 'Pesan sekarang di Kedai Kopi!'}`
      if (data.images && data.images.length > 0) {
        itemImageUrl = data.images[0]
      }
    }
  }

  const ogApiUrl = baseUrl ? `${baseUrl}/api/og?item=${id}` : `/api/og?item=${id}`

  const ogImages = [
    ...(itemImageUrl ? [{ url: itemImageUrl, width: 800, height: 800, alt: title }] : []),
    {
      url: ogApiUrl,
      width: 1200,
      height: 630,
      alt: title,
    },
  ]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: baseUrl ? `${baseUrl}/item/${id}` : undefined,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [itemImageUrl || ogApiUrl],
    },
  }
}

export default async function ItemRedirectPage({ params }: ItemPageProps) {
  const resolvedParams = await params
  const id = resolvedParams.id

  // Server-side redirect ke /menu?item=<id>
  redirect(`/menu?item=${id}`)
}
