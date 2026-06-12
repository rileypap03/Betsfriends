'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
    venue: { name: string; city: string };
  };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'finished'>('upcoming');

  useEffect(() => {
    fetch('/api/fixtures')
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setFixtures(j.fixtures || []);
        setLoading(false);
      });
  }, []);

  const now = Date.now();
  const filtered = fixtures.filter((f) => {
    const status = f.fixture.status.short;
    const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status);
    const isFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status);
    const isUpcoming = !isLive && !isFinished;
    if (filter === 'live') return isLive;
    if (filter === 'finished') return isFinished;
    if (filter === 'upcoming') return isUpcoming;
    return true;
  }).sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
      <Header />
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="display-title text-xl flex items-center gap-3">
            <span className="w-1 h-5 bg-gold inline-block" />
            Fixtures
          </h2>
          <div className="flex gap-1">
            {(['upcoming', 'live', 'finished', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wide transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="text-text-muted text-sm">Loading fixtures…</div>}
        {error && <div className="card p-4 text-red-bright text-sm">{error}</div>}

        {!loading && !error && (
          <div className="space-y-2">
            {filtered.length === 0 && <div className="text-text-dim text-sm">No matches.</div>}
            {filtered.map((f) => (
              <Link key={f.fixture.id} href={`/match/${f.fixture.id}`} className="block card card-hover p-4 transition-colors">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted mb-1">
                      {new Date(f.fixture.date).toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {f.league.round && ` · ${f.league.round}`}
                      {f.fixture.venue?.city && ` · ${f.fixture.venue.city}`}
                    </div>
                    <div className="flex items-center gap-3 text-base font-semibold">
                      <span className="flex items-center gap-2">
                        {f.teams.home.logo && <img src={f.teams.home.logo} alt="" className="w-6 h-6" />}
                        {f.teams.home.name}
                      </span>
                      <span className="font-display text-text-muted">
                        {f.goals.home !== null ? `${f.goals.home} – ${f.goals.away}` : 'vs'}
                      </span>
                      <span className="flex items-center gap-2">
                        {f.teams.away.logo && <img src={f.teams.away.logo} alt="" className="w-6 h-6" />}
                        {f.teams.away.name}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={f.fixture.status.short} long={f.fixture.status.long} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status, long }: { status: string; long: string }) {
  const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status);
  const isFinished = ['FT', 'AET', 'PEN'].includes(status);
  return (
    <span
      className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded"
      style={{
        background: isLive ? 'rgba(228,0,43,0.15)' : isFinished ? 'rgba(255,255,255,0.05)' : 'rgba(201,165,87,0.12)',
        color: isLive ? '#FF4D6D' : isFinished ? '#8A9BBF' : '#C9A557',
      }}
    >
      {isLive ? '● LIVE' : isFinished ? 'FT' : ''}
    </span>
  );
}
