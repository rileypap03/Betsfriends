import './globals.css';
import type { Metadata, Viewport } from 'next';
import SplashGate from '@/components/SplashGate';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'BetsFriends · World Cup 26',
  description: "BetsFriends team HQ — sweepstakes leaderboard, bet log, and live match intel for World Cup 26.",
  applicationName: 'BetsFriends',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BetsFriends',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
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
        {/* iPhone Pro Max */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-pro-max-1290x2796.png"
              media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iPhone Pro */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-pro-1179x2556.png"
              media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iPhone Plus */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-plus-1284x2778.png"
              media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iPhone standard */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-1170x2532.png"
              media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iPhone mini */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-mini-1080x2340.png"
              media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iPhone SE */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-se-750x1334.png"
              media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iPad Pro */}
        <link rel="apple-touch-startup-image" href="/splash/ipad-pro-2048x2732.png"
              media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iPad */}
        <link rel="apple-touch-startup-image" href="/splash/ipad-1640x2360.png"
              media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
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
