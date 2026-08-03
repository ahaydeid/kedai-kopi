import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

interface ItemPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const id = resolvedParams.id

  let title = 'Menu Kedai Kopi'
  let description = 'Pesan menu favoritmu di Kedai Kopi - Coffee, Drinks & Good Food!'
  let priceText = ''
  let ogImageUrl = `/api/og?item=${id}`

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
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ItemRedirectPage({ params }: ItemPageProps) {
  const resolvedParams = await params
  const id = resolvedParams.id

  // Server-side redirect ke /menu?item=<id>
  redirect(`/menu?item=${id}`)
}
