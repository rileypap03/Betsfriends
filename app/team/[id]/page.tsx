'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

export default function TeamPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Team';
  const crest = searchParams.get('crest') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'squad' | 'form'>('squad');

  useEffect(() => {
    fetch(`/api/team/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setData(j);
        setLoading(false);
      });
  }, [params.id]);

  return (
    <main className="max-w-3xl mx-auto p-4 pb-24 relative z-10">
      <Header back />

      {/* Team header card */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          {crest && <img src={crest} alt={name} className="w-16 h-16 object-contain" />}
          <div className="display-title text-2xl italic text-center">{name}</div>
        </div>
      </div>

      {error && <div className="card p-4 text-red-bright text-sm">{error}</div>}

      {!error && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-4 card p-1">
            {(['squad', 'form'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${tab === t ? 'text-white' : 'text-text-muted'}`}
                style={tab === t ? { background: 'rgba(255,255,255,0.1)' } : {}}>
                {t === 'squad' ? 'Squad' : 'Recent Form'}
              </button>
            ))}
          </div>

          {loading && <div className="text-text-muted text-sm">Loading…</div>}

          {!loading && tab === 'squad' && <SquadTab squad={data?.squad || []} topScorers={data?.topScorers || []} />}
          {!loading && tab === 'form' && <FormTab games={data?.form || []} teamName={name} />}
        </>
      )}
    </main>
  );
}

const POSITION_ORDER: Record<string, number> = {
  Goalkeeper: 0,
  'Goalkeeper ': 0,
  Defence: 1,
  Defender: 1,
  'Centre-Back': 1,
  'Left-Back': 1,
  'Right-Back': 1,
  Midfield: 2,
  Midfielder: 2,
  'Defensive Midfield': 2,
  'Central Midfield': 2,
  'Attacking Midfield': 2,
  'Left Midfield': 2,
  'Right Midfield': 2,
  Offence: 3,
  Forward: 3,
  'Centre-Forward': 3,
  'Left Winger': 3,
  'Right Winger': 3,
};

function positionGroup(position?: string): string {
  if (!position) return 'Squad';
  const p = position.trim();
  const order = POSITION_ORDER[p];
  if (order === 0) return 'Goalkeepers';
  if (order === 1) return 'Defenders';
  if (order === 2) return 'Midfielders';
  if (order === 3) return 'Forwards';
  return 'Squad';
}

function SquadTab({ squad, topScorers }: { squad: any[]; topScorers: any[] }) {
  if (!squad || squad.length === 0) {
    return <div className="card p-6 text-center text-text-muted text-sm">Squad list not available yet.</div>;
  }

  const scorerMap = new Map<string, { goals: number; assists?: number }>();
  topScorers.forEach((s: any) => {
    const playerName = s.player?.name;
    if (playerName) scorerMap.set(playerName, { goals: s.goals, assists: s.assists });
  });

  const groups = ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards', 'Squad'];
  const byGroup = new Map<string, any[]>();
  squad.forEach((p: any) => {
    const g = positionGroup(p.position);
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(p);
  });

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const players = byGroup.get(g);
        if (!players || players.length === 0) return null;
        return (
          <div key={g} className="card overflow-hidden">
            <div className="px-3 py-2 text-xs font-bold tracking-widest uppercase" style={{ background: 'rgba(255,255,255,0.05)', color: '#C9A84C' }}>
              {g}
            </div>
            <div className="divide-y divide-white/5">
              {players.map((p: any, i: number) => {
                const scorer = scorerMap.get(p.name);
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <div className="w-8 text-center font-display text-text-dim shrink-0">
                      {p.jerseyNumber ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      {p.position && <div className="text-xs text-text-muted">{p.position}</div>}
                    </div>
                    {scorer && (
                      <div className="text-right shrink-0">
                        <div className="font-display" style={{ color: 'var(--gold-bright)' }}>{scorer.goals} ⚽</div>
                        {scorer.assists ? <div className="text-[10px] text-text-muted">{scorer.assists} assists</div> : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FormTab({ games, teamName }: { games: any[]; teamName: string }) {
  const results = (games || []).slice(0, 5).map((g: any) => {
    const isHome = g.teams.home.name === teamName;
    const us = isHome ? g.goals.home : g.goals.away;
    const them = isHome ? g.goals.away : g.goals.home;
    if (us === null || them === null) return null;
    const result = us > them ? 'W' : us < them ? 'L' : 'D';
    return { result, opponent: isHome ? g.teams.away.name : g.teams.home.name, score: `${us}-${them}`, date: g.fixture.date, ha: isHome ? 'H' : 'A' };
  }).filter(Boolean);

  if (results.length === 0) {
    return <div className="card p-6 text-center text-text-muted text-sm">No recent form data available.</div>;
  }

  return (
    <div className="card p-4 space-y-1">
      {results.map((r: any, i: number) => (
        <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: r.result === 'W' ? 'rgba(60,172,59,0.2)' : r.result === 'L' ? 'rgba(230,29,37,0.2)' : 'rgba(154,154,154,0.2)',
              color: r.result === 'W' ? '#3CAC3B' : r.result === 'L' ? '#E61D25' : '#9A9A9A',
              border: `1px solid ${r.result === 'W' ? 'rgba(60,172,59,0.4)' : r.result === 'L' ? 'rgba(230,29,37,0.4)' : 'rgba(154,154,154,0.3)'}`,
            }}
          >
            {r.result}
          </div>
          <span className="text-text-muted text-xs w-20">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
          <span className="text-text-muted text-xs">{r.ha}</span>
          <span className="flex-1 mx-2 truncate">{r.opponent}</span>
          <span className="font-display w-12 text-right">{r.score}</span>
        </div>
      ))}
    </div>
  );
}
