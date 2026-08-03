import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { ItemRedirectClient } from './ItemRedirectClient'
import { slugify } from '@/utils/slugify'

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

  let resolvedSlug = id
  if (supabaseUrl && supabaseAnonKey && id) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)

    let query = supabase
      .from('menu')
      .select('id, name, slug, price, main_category, sub_category, description, images')

    if (isUuid) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }

    const { data } = await query.single()

    if (data) {
      resolvedSlug = data.slug || (data.name ? slugify(data.name) : id)
      if (data.price) {
        priceText = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(Number(data.price))
      }
      title = priceText ? `${data.name} (${priceText}) - Kedai Kopi` : `${data.name} - Kedai Kopi`
      description = priceText
        ? `Harga ${priceText} · ${data.main_category || 'Menu'} ${data.sub_category ? `(${data.sub_category})` : ''} - ${data.description || 'Pesan sekarang di Kedai Kopi!'}`
        : `${data.description || 'Pesan sekarang di Kedai Kopi!'}`
      if (data.images && data.images.length > 0) {
        itemImageUrl = data.images[0]
      }
    }
  }

  const ogApiUrl = baseUrl ? `${baseUrl}/api/og?item=${resolvedSlug}` : `/api/og?item=${resolvedSlug}`

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
      url: baseUrl ? `${baseUrl}/item/${resolvedSlug}` : undefined,
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

  return <ItemRedirectClient id={id} />
}
