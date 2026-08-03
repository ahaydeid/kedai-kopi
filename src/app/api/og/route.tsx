import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item')

    let name = 'Kedai Kopi'
    let category = 'Coffee & Good Food'
    let priceText = ''
    let imageUrl = ''

    if (itemId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(itemId)

        let query = supabase
          .from('menus')
          .select('name, price, main_category, sub_category, images')

        if (isUuid) {
          query = query.eq('id', itemId)
        } else {
          query = query.eq('slug', itemId)
        }

        const { data } = await query.single()

        if (data) {
          name = data.name || name
          category = `${data.main_category || ''} · ${data.sub_category || ''}`
          if (data.price) {
            priceText = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(Number(data.price))
          }
          if (data.images && data.images.length > 0) {
            imageUrl = data.images[0]
          }
        }
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'between',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b, #3d2514)',
            color: '#ffffff',
            padding: '48px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Sisi Kiri: Gambar Produk */}
          <div
            style={{
              display: 'flex',
              width: '460px',
              height: '460px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              backgroundColor: '#1e293b',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt={name}
                width="460"
                height="460"
                style={{
                  width: '460px',
                  height: '460px',
                  objectFit: 'cover',
                  borderRadius: '24px',
                }}
              />
            ) : (
              <div style={{ fontSize: '80px' }}>☕</div>
            )}
          </div>

          {/* Sisi Kanan: Detail & Branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              marginLeft: '48px',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  fontSize: '20px',
                  fontWeight: '600',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                ☕ Kedai Kopi Special
              </span>
            </div>

            {/* Nama Produk */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {name}
            </h1>

            {/* Kategori */}
            <p
              style={{
                fontSize: '24px',
                color: '#94a3b8',
                marginBottom: '24px',
              }}
            >
              {category}
            </p>

            {/* Harga */}
            {priceText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  marginTop: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '44px',
                    fontWeight: '800',
                    color: '#34d399',
                  }}
                >
                  {priceText}
                </span>
              </div>
            )}

            {/* Call to action footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '36px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '18px',
              }}
            >
              <span>Klik link ini untuk langsung pesan & tambah ke keranjang 🛒</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    return new Response(`Failed to generate OG image: ${e.message}`, {
      status: 500,
    })
  }
}
