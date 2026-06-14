'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/bets', label: 'Bet Lab' },
];

export default function Header({ back }: { back?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  if (back) {
    return (
      <header className="card mb-6 relative overflow-hidden">
        <div className="flag-stripe absolute top-0 left-0 right-0" />
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 p-4 pt-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary !px-3 !py-1.5 flex items-center gap-1.5 text-sm"
            aria-label="Back"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">Back</span>
          </button>

          <Link href="/" className="flex items-center justify-center gap-2 group">
            <div className="font-display text-2xl leading-none">
              <span className="text-gold-bright italic">2</span>
              <span className="text-gold italic">6</span>
            </div>
            <div className="display-title text-base italic">BetsFriends</div>
          </Link>

          <div className="w-[68px] sm:w-[78px]" aria-hidden="true" />
        </div>
      </header>
    );
  }

  return (
    <header className="card mb-6 relative overflow-hidden">
      <div className="flag-stripe absolute top-0 left-0 right-0" />
      <div className="flex items-center justify-between p-5 pt-7">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="font-display text-4xl leading-none">
            <div className="text-gold-bright italic">2</div>
            <div className="text-gold italic -mt-1.5">6</div>
          </div>
          <div>
            <div className="eyebrow text-gold">World Cup 26 · BetsFriends</div>
            <div className="display-title text-xl italic">BetsFriends</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname === n.href ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <button onClick={logout} className="ml-3 btn-secondary">Logout</button>
        </nav>
      </div>
    </header>
  );
}
