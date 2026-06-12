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

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
        <Header />
        <div className="text-text-muted text-sm">Loading match…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
        <Header />
        <div className="card p-4 text-red-bright">{error}</div>
      </main>
    );
  }

  const { fixture, h2h, homeForm, awayForm, lineups, playerStats } = data;
  const home = fixture.teams.home;
  const away = fixture.teams.away;
  const status = fixture.fixture.status;
  const isStartedOrFinished = !['NS','TBD','PST','CANC','SUSP'].includes(status.short);

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
      <Header />

      {/* Match header */}
      <div className="card p-6 mb-6">
        <div className="text-xs text-text-muted mb-3 text-center">
          {new Date(fixture.fixture.date).toLocaleString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {fixture.league?.round && ` · ${fixture.league.round}`}
          {fixture.fixture.venue?.name && ` · ${fixture.fixture.venue.name}`}
        </div>
        <div className="flex items-center justify-around gap-4 flex-wrap">
          <div className="flex-1 text-center min-w-[120px]">
            {home.logo && <img src={home.logo} alt={home.name} className="w-16 h-16 mx-auto mb-2" />}
            <div className="font-semibold">{home.name}</div>
          </div>
          <div className="text-center">
            <div className="font-display text-4xl">
              {fixture.goals.home !== null ? `${fixture.goals.home} – ${fixture.goals.away}` : 'vs'}
            </div>
            <div className="eyebrow mt-1" style={{ color: status.short === '1H' || status.short === '2H' || status.short === 'HT' ? '#FF4D6D' : '#8A9BBF' }}>
              {status.long}
            </div>
          </div>
          <div className="flex-1 text-center min-w-[120px]">
            {away.logo && <img src={away.logo} alt={away.name} className="w-16 h-16 mx-auto mb-2" />}
            <div className="font-semibold">{away.name}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <Link href="/bets" className="btn-primary">+ Log a bet on this match</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['form', 'h2h', 'players'] as const).map((t) => {
          const disabled = t === 'players' && !isStartedOrFinished;
          return (
            <button
              key={t}
              disabled={disabled}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors ${
                tab === t ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t === 'form' ? 'Recent Form' : t === 'h2h' ? 'Head-to-Head' : 'Player Stats'}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'form' && <FormTab home={home} away={away} homeForm={homeForm} awayForm={awayForm} />}
      {tab === 'h2h' && <H2HTab h2h={h2h} />}
      {tab === 'players' && <PlayersTab playerStats={playerStats} lineups={lineups} home={home} away={away} />}
    </main>
  );
}

function FormTab({ home, away, homeForm, awayForm }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <TeamFormCard team={home} games={homeForm} />
      <TeamFormCard team={away} games={awayForm} />
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
    return {
      result,
      opponent: isHome ? g.teams.away.name : g.teams.home.name,
      score: `${us}-${them}`,
      date: g.fixture.date,
      ha: isHome ? 'H' : 'A',
    };
  }).filter(Boolean);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        {team.logo && <img src={team.logo} alt="" className="w-8 h-8" />}
        <div className="font-semibold">{team.name}</div>
      </div>
      <div className="flex gap-1 mb-4">
        {results.map((r: any, i: number) => (
          <div
            key={i}
            className="w-8 h-8 rounded font-display text-sm flex items-center justify-center"
            style={{
              background: r.result === 'W' ? 'rgba(0,199,117,0.2)' : r.result === 'L' ? 'rgba(255,77,109,0.2)' : 'rgba(138,155,191,0.2)',
              color: r.result === 'W' ? '#00C775' : r.result === 'L' ? '#FF4D6D' : '#8A9BBF',
              border: `1px solid ${r.result === 'W' ? 'rgba(0,199,117,0.4)' : r.result === 'L' ? 'rgba(255,77,109,0.4)' : 'rgba(138,155,191,0.4)'}`,
            }}
            title={`${r.result} vs ${r.opponent} (${r.score})`}
          >
            {r.result}
          </div>
        ))}
        {results.length === 0 && <div className="text-text-dim text-sm">No recent matches</div>}
      </div>
      <div className="space-y-1">
        {results.map((r: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-b-0">
            <span className="text-text-muted">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            <span>{r.ha} vs {r.opponent}</span>
            <span className="font-display">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function H2HTab({ h2h }: any) {
  if (!h2h || h2h.length === 0) {
    return <div className="card p-6 text-center text-text-muted text-sm">No head-to-head data available.</div>;
  }
  return (
    <div className="card p-4">
      <div className="space-y-2">
        {h2h.slice(0, 10).map((m: any) => {
          const home = m.teams.home;
          const away = m.teams.away;
          const hg = m.goals.home;
          const ag = m.goals.away;
          return (
            <div key={m.fixture.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-b-0 text-sm">
              <div className="text-xs text-text-muted w-24">{new Date(m.fixture.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
              <div className="flex-1 flex items-center justify-end gap-2"><span>{home.name}</span>{home.logo && <img src={home.logo} alt="" className="w-5 h-5" />}</div>
              <div className="font-display w-14 text-center">{hg}–{ag}</div>
              <div className="flex-1 flex items-center gap-2">{away.logo && <img src={away.logo} alt="" className="w-5 h-5" />}<span>{away.name}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayersTab({ playerStats, lineups, home, away }: any) {
  if (!playerStats || playerStats.length === 0) {
    return <div className="card p-6 text-center text-text-muted text-sm">Player stats available once the match starts.</div>;
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {playerStats.map((teamData: any) => (
        <div key={teamData.team.id} className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            {teamData.team.logo && <img src={teamData.team.logo} alt="" className="w-7 h-7" />}
            <div className="font-semibold">{teamData.team.name}</div>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {(teamData.players || []).slice(0, 14).map((p: any) => {
              const stats = p.statistics?.[0];
              if (!stats) return null;
              return (
                <div key={p.player.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {p.player.photo && <img src={p.player.photo} alt="" className="w-7 h-7 rounded-full" />}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.player.name}</div>
                      <div className="text-[11px] text-text-muted">{stats.games?.position || ''} · {stats.games?.minutes || 0}'</div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {stats.goals?.total > 0 && <Stat label="G" val={stats.goals.total} color="#00C775" />}
                    {stats.goals?.assists > 0 && <Stat label="A" val={stats.goals.assists} color="#E5C56E" />}
                    {stats.shots?.total > 0 && <Stat label="Sh" val={`${stats.shots.on ?? 0}/${stats.shots.total}`} />}
                    {stats.tackles?.total > 0 && <Stat label="Tkl" val={stats.tackles.total} />}
                    {stats.passes?.accuracy && <Stat label="Pass%" val={stats.passes.accuracy} />}
                    {stats.games?.rating && <Stat label="Rtg" val={Number(stats.games.rating).toFixed(1)} color="#C9A557" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, val, color }: { label: string; val: any; color?: string }) {
  return (
    <div className="text-right">
      <div className="text-[9px] text-text-muted uppercase tracking-wide">{label}</div>
      <div className="font-display text-sm" style={{ color: color || 'white' }}>{val}</div>
    </div>
  );
}
