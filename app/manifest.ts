import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Холодильник',
    short_name: 'Холодильник',
    description: 'Виртуальный холодильник для контроля сроков годности продуктов',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F5F2',
    theme_color: '#F5F5F2',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}