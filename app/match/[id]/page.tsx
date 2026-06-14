'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'form' | 'h2h' | 'players'>('form');

  useEffect(() => {
    fetch(`/api/match/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setData(j);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return (
    <main className="max-w-3xl mx-auto p-4 relative z-10">
      <Header back />
      <div className="text-text-muted text-sm">Loading match…</div>
    </main>
  );

  if (error) return (
    <main className="max-w-3xl mx-auto p-4 relative z-10">
      <Header back />
      <div className="card p-4 text-red-bright">{error}</div>
    </main>
  );

  const { fixture, h2h, homeForm, awayForm, playerStats } = data;
  const home = fixture.teams.home;
  const away = fixture.teams.away;
  const status = fixture.fixture.status;
  const goals = fixture.goals;
  const isLive = ['1H','2H','HT','ET','P'].includes(status.short);
  const isFinished = ['FT','AET','PEN'].includes(status.short);
  const hasScore = goals.home !== null;

  return (
    <main className="max-w-3xl mx-auto p-4 pb-24 relative z-10">
      <Header back />

      {/* FIFA-style match card */}
      <div className="card mb-4 overflow-hidden">
        {/* Top bar */}
        <div className="px-4 py-2 flex items-center justify-between text-xs" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-text-muted">
            {new Date(fixture.fixture.date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-text-muted">{fixture.league?.round || ''}</span>
        </div>

        {/* Match body */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between gap-2">

            {/* Home team */}
            <Link
              href={`/team/${home.id}?name=${encodeURIComponent(home.name)}&crest=${encodeURIComponent(home.logo || '')}`}
              className="flex-1 flex flex-col items-center gap-2 text-center hover:opacity-75 transition-opacity"
            >
              {home.logo && <img src={home.logo} alt={home.name} className="w-14 h-14 object-contain" />}
              <span className="font-semibold text-sm leading-tight">{home.name}</span>
              {isFinished && home.winner && <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--gold)' }}>WINNER</span>}
            </Link>

            {/* Score / VS */}
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              {hasScore ? (
                <>
                  <div className="font-display text-5xl leading-none flex items-center gap-3">
                    <span>{goals.home}</span>
                    <span className="text-text-dim text-3xl">-</span>
                    <span>{goals.away}</span>
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${isLive ? 'text-red-bright' : 'text-text-muted'}`}
                    style={isLive ? { background: 'rgba(230,29,37,0.15)' } : {}}>
                    {isLive ? `● ${status.elapsed || ''}′` : status.long.toUpperCase()}
                  </span>
                  {fixture.score?.halftime?.home !== null && !isLive && (
                    <span className="text-[10px] text-text-dim">HT {fixture.score.halftime.home}-{fixture.score.halftime.away}</span>
                  )}
                </>
              ) : (
                <>
                  <div className="font-display text-3xl text-text-muted">VS</div>
                  <div className="text-[11px] text-text-muted font-semibold">
                    {new Date(fixture.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </>
              )}
            </div>

            {/* Away team */}
            <Link
              href={`/team/${away.id}?name=${encodeURIComponent(away.name)}&crest=${encodeURIComponent(away.logo || '')}`}
              className="flex-1 flex flex-col items-center gap-2 text-center hover:opacity-75 transition-opacity"
            >
              {away.logo && <img src={away.logo} alt={away.name} className="w-14 h-14 object-contain" />}
              <span className="font-semibold text-sm leading-tight">{away.name}</span>
              {isFinished && away.winner && <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--gold)' }}>WINNER</span>}
            </Link>
          </div>

          {/* Venue */}
          {fixture.fixture.venue?.name && (
            <div className="text-center text-[11px] text-text-dim mt-4">
              {fixture.fixture.venue.name}{fixture.fixture.venue.city ? ` · ${fixture.fixture.venue.city}` : ''}
            </div>
          )}
        </div>

        {/* Log bet button */}
        <div className="px-4 pb-4">
          <Link href="/bets" className="btn-primary w-full block text-center">+ Log a bet on this match</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 card p-1">
        {(['form', 'h2h', 'players'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${tab === t ? 'text-white' : 'text-text-muted'}`}
            style={tab === t ? { background: 'rgba(255,255,255,0.1)' } : {}}>
            {t === 'form' ? 'Recent Form' : t === 'h2h' ? 'Head-to-Head' : 'Stats'}
          </button>
        ))}
      </div>

      {tab === 'form' && <FormTab home={home} away={away} homeForm={awayForm} awayForm={awayForm} homeFormData={data.homeForm} awayFormData={data.awayForm} />}
      {tab === 'h2h' && <H2HTab h2h={h2h} />}
      {tab === 'players' && (
        <div className="card p-6 text-center text-text-muted text-sm">
          Detailed per-match player stats not available on the current data tier.
        </div>
      )}
    </main>
  );
}

function FormTab({ home, away, homeFormData, awayFormData }: any) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <TeamFormCard team={home} games={homeFormData} />
      <TeamFormCard team={away} games={awayFormData} />
    </div>
  );
}

function TeamFormCard({ team, games }: any) {
  const results = (games || []).slice(0, 5).map((g: any) => {
    const isHome = g.teams.home.id === team.id;
    const us = isHome ? g.goals.home : g.goals.away;
    const them = isHome ? g.goals.away : g.goals.home;
    if (us === null || them === null) return null;
    const result = us > them ? 'W' : us < them ? 'L' : 'D';
    return { result, opponent: isHome ? g.teams.away.name : g.teams.home.name, score: `${us}-${them}`, date: g.fixture.date, ha: isHome ? 'H' : 'A' };
  }).filter(Boolean);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-4">
        {team.logo && <img src={team.logo} alt="" className="w-8 h-8" />}
        <span className="font-semibold">{team.name}</span>
        <div className="flex gap-1 ml-auto">
          {results.map((r: any, i: number) => (
            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: r.result === 'W' ? 'rgba(60,172,59,0.2)' : r.result === 'L' ? 'rgba(230,29,37,0.2)' : 'rgba(154,154,154,0.2)',
                color: r.result === 'W' ? '#3CAC3B' : r.result === 'L' ? '#E61D25' : '#9A9A9A',
                border: `1px solid ${r.result === 'W' ? 'rgba(60,172,59,0.4)' : r.result === 'L' ? 'rgba(230,29,37,0.4)' : 'rgba(154,154,154,0.3)'}`,
              }}
              title={`${r.result} vs ${r.opponent}`}>{r.result}</div>
          ))}
          {results.length === 0 && <span className="text-text-dim text-xs">No data</span>}
        </div>
      </div>
      <div className="space-y-1">
        {results.map((r: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
            <span className="text-text-muted w-20">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            <span className="text-text-muted">{r.ha}</span>
            <span className="flex-1 mx-2 truncate">{r.opponent}</span>
            <span className="font-display w-10 text-right">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function H2HTab({ h2h }: any) {
  if (!h2h || h2h.length === 0) return (
    <div className="card p-6 text-center text-text-muted text-sm">No head-to-head data available.</div>
  );
  return (
    <div className="card p-4 space-y-1">
      {h2h.slice(0, 10).map((m: any) => {
        const home = m.teams.home;
        const away = m.teams.away;
        return (
          <div key={m.fixture.id} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0 text-sm">
            <span className="text-text-muted text-xs w-16 shrink-0">{new Date(m.fixture.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })}</span>
            <div className="flex-1 flex items-center justify-end gap-1">
              {home.logo && <img src={home.logo} alt="" className="w-5 h-5" />}
              <span className="text-xs truncate max-w-[70px]">{home.name}</span>
            </div>
            <span className="font-display text-sm w-12 text-center">{m.goals.home}–{m.goals.away}</span>
            <div className="flex-1 flex items-center gap-1">
              {away.logo && <img src={away.logo} alt="" className="w-5 h-5" />}
              <span className="text-xs truncate max-w-[70px]">{away.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
