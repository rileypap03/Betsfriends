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
        {/* iOS launch screens removed pending rebrand — old images used
            outdated "Duxtomer" branding. Falls back to plain background. */}
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
