import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DUXTOMER · World Cup 26',
    short_name: 'DUXTOMER',
    description: "The team's World Cup 26 sweepstakes HQ — leaderboard, bet log, and live match intel.",
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020F2A',
    theme_color: '#020F2A',
    categories: ['sports', 'lifestyle'],
    icons: [
      { src: '/icons/icon-72.png',  sizes: '72x72',  type: 'image/png' },
      { src: '/icons/icon-96.png',  sizes: '96x96',  type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
