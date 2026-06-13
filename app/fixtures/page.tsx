'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    Promise.all([
      fetch('/api/fixtures').then(r => r.json()),
      fetch('/api/standings').then(r => r.json()),
    ]).then(([fx, st]) => {
      setFixtures(fx.fixtures || []);
      setStandings(st.standings || []);
      setLoading(false);
    });
  }, []);

  const filtered = fixtures.filter((f) => {
    const s = f.fixture.status.short;
    const isLive = ['1H','2H','HT','ET','BT','P'].includes(s);
    const isFinished = ['FT','AET','PEN','AWD','WO'].includes(s);
    if (filter === 'live') return isLive;
    if (filter === 'finished') return isFinished;
    if (filter === 'upcoming') return !isLive && !isFinished;
    return true;
  }).sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

  return (
    <main className="max-w-3xl mx-auto p-4 pb-24 relative z-10">
      <Header />
      <div className="flex gap-1 mb-4 card p-1">
        {['upcoming','live','finished','groups','all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
            style={filter === f ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}>
            {f}
          </button>
        ))}
      </div>
      {loading && <div className="text-text-muted text-sm">Loading...</div>}
      {filter === 'groups' ? (
        <GroupTables standings={standings} />
      ) : (
        <div className="space-y-2">
          {!loading && filtered.length === 0 && <div className="text-center py-8 text-text-dim text-sm">No matches.</div>}
          {filtered.map((f) => <FixtureCard key={f.fixture.id} fixture={f} />)}
        </div>
      )}
    </main>
  );
}

function FixtureCard({ fixture: f }) {
  const s = f.fixture.status.short;
  const isLive = ['1H','2H','HT','ET','P'].includes(s);
  const isFinished = ['FT','AET','PEN'].includes(s);
  const hasScore = f.goals.home !== null;
  return (
    <Link href={"/match/" + f.fixture.id} className="block card p-3 hover:bg-bg-hover transition-colors">
      <div className="text-[10px] text-text-muted mb-2">
        {new Date(f.fixture.date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        {f.league && f.league.round ? ' · ' + f.league.round : ''}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {f.teams.home.logo && <img src={f.teams.home.logo} alt="" className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-semibold truncate">{f.teams.home.name}</span>
        </div>
        <div className="shrink-0 flex items-center gap-1 px-1">
          {hasScore ? (
            <span className="font-display text-sm">{f.goals.home} - {f.goals.away}</span>
          ) : (
            <span className="text-[10px] font-semibold text-text-muted">
              {new Date(f.fixture.date).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-semibold truncate text-right">{f.teams.away.name}</span>
          {f.teams.away.logo && <img src={f.teams.away.logo} alt="" className="w-5 h-5 shrink-0" />}
        </div>
        <div className="w-8 text-right shrink-0">
          {isLive && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{background:'rgba(230,29,37,0.15)',color:'#E61D25'}}>LIVE</span>}
          {isFinished && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{background:'rgba(255,255,255,0.06)',color:'#9A9A9A'}}>FT</span>}
        </div>
      </div>
    </Link>
  );
}

function GroupTables({ standings }) {
  if (!standings || standings.length === 0) return <div className="text-center text-text-dim text-sm py-10">Group tables not available yet.</div>;
  const groups = standings.filter(s => s.type === 'TOTAL');
  if (groups.length === 0) return <div className="text-center text-text-dim text-sm py-10">Group stage not started yet.</div>;
  return (
    <div className="space-y-4">
      {groups.map((group, idx) => (
        <div key={idx} className="card overflow-hidden">
          <div className="px-3 py-2 text-xs font-bold tracking-widest uppercase" style={{background:'rgba(255,255,255,0.05)',color:'#C9A84C'}}>
            {group.group ? group.group.replace('GROUP_','Group ') : 'Group ' + (idx+1)}
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5" style={{color:'#5A5A5A'}}>
              <th className="text-left px-3 py-1.5">#</th>
              <th className="text-left px-2 py-1.5">Team</th>
              <th className="text-center px-1 py-1.5">P</th>
              <th className="text-center px-1 py-1.5">W</th>
              <th className="text-center px-1 py-1.5">D</th>
              <th className="text-center px-1 py-1.5">L</th>
              <th className="text-center px-1 py-1.5">GD</th>
              <th className="text-center px-1 py-1.5 font-bold" style={{color:'#C9A84C'}}>Pts</th>
            </tr></thead>
            <tbody>
              {group.table.map((row) => (
                <tr key={row.team.id} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2" style={{color:'#9A9A9A'}}>{row.position}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      {row.team.logo && <img src={row.team.logo} alt="" className="w-4 h-4 shrink-0" />}
                      <span className="truncate font-medium" style={{maxWidth:'80px'}}>{row.team.name}</span>
                    </div>
                  </td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.playedGames}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.won}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.draw}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.lost}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.goalDifference > 0 ? "+" + row.goalDifference : row.goalDifference}</td>
                  <td className="text-center px-1 py-2 font-bold" style={{color:'#C9A84C'}}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
