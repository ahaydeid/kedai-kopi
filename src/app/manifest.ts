import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kedai Kopi',
    short_name: 'Kedai Kopi',
    description: 'Kedai Kopi - Coffee, Drinks, Snack & Good Food',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#3d2514',
    icons: [
      {
        src: '/img/logo-kedaikopi.webp',
        sizes: 'any',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
