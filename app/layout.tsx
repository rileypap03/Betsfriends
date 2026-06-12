import './globals.css';
import type { Metadata, Viewport } from 'next';
import SplashGate from '@/components/SplashGate';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'DUXTOMER · World Cup 26',
  description: 'DUXTOMER team HQ for World Cup 26.',
  applicationName: 'DUXTOMER',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'DUXTOMER' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#020F2A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-startup-image" href="/splash/iphone-pro-max-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-se-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
      </head>
      <body>
        <SplashGate>
          <div className="pb-20 md:pb-0">{children}</div>
          <MobileNav />
        </SplashGate>
      </body>
    </html>
  );
}
