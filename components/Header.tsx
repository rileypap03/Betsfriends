'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="card mb-6 relative overflow-hidden">
      <div className="flag-stripe absolute top-0 left-0 right-0" />
      <div className="flex items-center justify-between p-5 pt-7">
        <Link href="/" className="flex items-center gap-4">
          <div className="font-display text-4xl leading-none">
            <div className="text-gold-bright italic">2</div>
            <div className="text-gold italic -mt-1.5">6</div>
          </div>
          <div>
            <div className="eyebrow text-gold">World Cup 26 · We Are 26</div>
            <div className="display-title text-xl italic">DUXTOMER</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className={`px-3 py-1.5 rounded text-s  font-medium transition-colors ${pathname === '/' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}>Dashboard</Link>
            <Link href="/fixtures" className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${pathname.startsWith('/fixtures') ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}>Fixtures</Link>
            <Link href="/bets" className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${pathname.startsWith('/bets') ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}>Bet Lab</Link>
          </div>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </nav>
      </div>
    </header>
  );
}
