'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { groupForTeam } from '@/lib/wc2026-groups';

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [jumpGroup, setJumpGroup] = useState<string | null>(null);

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

  function goToGroup(round: string) {
    // round looks like "Group A" or "Group B" etc.
    const match = round.match(/Group ([A-Z])/i);
    if (match) {
      setJumpGroup(match[1].toUpperCase());
      setFilter('groups');
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 pb-24 relative z-10">
      <Header />
      <div className="flex gap-1 mb-4 card p-1">
        {['upcoming','live','finished','groups','all'].map((f) => (
          <button key={f} onClick={() => { setFilter(f); if (f !== 'groups') setJumpGroup(null); }}
            className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
            style={filter === f ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}>
            {f}
          </button>
        ))}
      </div>
      {loading && <div className="text-text-muted text-sm">Loading...</div>}
      {filter === 'groups' ? (
        <GroupTables standings={standings} jumpTo={jumpGroup} />
      ) : (
        <div className="space-y-2">
          {!loading && filtered.length === 0 && <div className="text-center py-8 text-text-dim text-sm">No matches.</div>}
          {filtered.map((f) => <FixtureCard key={f.fixture.id} fixture={f} onGroupClick={goToGroup} />)}
        </div>
      )}
    </main>
  );
}

function FixtureCard({ fixture: f, onGroupClick }: { fixture: any; onGroupClick: (round: string) => void }) {
  const s = f.fixture.status.short;
  const isLive = ['1H','2H','HT','ET','P'].includes(s);
  const isFinished = ['FT','AET','PEN'].includes(s);
  const hasScore = f.goals.home !== null;
  const round = f.league?.round || '';
  const isGroupRound = /^Group [A-Z]$/i.test(round);
  return (
    <div className="block card p-3 hover:bg-bg-hover transition-colors">
      <div className="text-[10px] text-text-muted mb-2 flex items-center justify-between">
        <span>
          {new Date(f.fixture.date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        </span>
        {round && (
          isGroupRound ? (
            <button
              onClick={(e) => { e.preventDefault(); onGroupClick(round); }}
              className="font-bold uppercase tracking-wider hover:text-gold transition-colors"
              style={{ color: '#C9A84C' }}
            >
              {round} →
            </button>
          ) : (
            <span>{round}</span>
          )
        )}
      </div>
      <Link href={"/match/" + f.fixture.id} className="flex items-center gap-2">
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
      </Link>
    </div>
  );
}

// Normalize a raw standings response into one entry per group: [{ groupLabel, table }]
function splitIntoGroups(standings: any[]): { groupLabel: string; table: any[] }[] {
  if (!standings || standings.length === 0) return [];

  // football-data.org returns one entry per group already, each with
  // type: 'TOTAL' and group: 'GROUP_A' etc, when that data is available.
  const totals = standings.filter((s) => s.type === 'TOTAL');
  const withGroupField = totals.filter((s) => s.group);

  if (withGroupField.length > 1) {
    return withGroupField
      .map((g) => ({
        groupLabel: g.group.replace('GROUP_', 'Group '),
        table: sortGroupRows(g.table || []),
      }))
      .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
  }

  // Fallback: football-data.org's free tier returns one combined 48-team
  // table with group: null on every row. Bucket each row into its real
  // World Cup group using the official draw (lib/wc2026-groups.ts).
  const source = totals.length > 0 ? totals : standings;
  const allRows: any[] = source.flatMap((s) => s.table || []);
  if (allRows.length === 0) return [];

  const byGroup = new Map<string, any[]>();
  for (const row of allRows) {
    const letter = groupForTeam(row.team || {});
    if (!letter) continue; // unknown team, skip rather than misplace it
    if (!byGroup.has(letter)) byGroup.set(letter, []);
    byGroup.get(letter)!.push(row);
  }

  return Array.from(byGroup.entries())
    .map(([letter, table]) => ({ groupLabel: `Group ${letter}`, table: sortGroupRows(table) }))
    .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
}

// Standard World Cup tiebreaker order: points, then goal difference, then goals scored.
function sortGroupRows(table: any[]): any[] {
  return [...table]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
    })
    .map((row, i) => ({ ...row, position: i + 1 }));
}

function GroupTables({ standings, jumpTo }: { standings: any[]; jumpTo?: string | null }) {
  const groups = splitIntoGroups(standings);
  if (groups.length === 0) return <div className="text-center text-text-dim text-sm py-10">Group tables not available yet.</div>;

  return (
    <div className="space-y-4">
      {groups.map((group, idx) => (
        <div
          key={idx}
          id={`group-${group.groupLabel.replace('Group ', '')}`}
          className="card overflow-hidden"
          style={jumpTo && group.groupLabel === `Group ${jumpTo}` ? { borderColor: 'var(--gold)' } : {}}
        >
          <div className="px-3 py-2 text-xs font-bold tracking-widest uppercase" style={{background:'rgba(255,255,255,0.05)',color:'#C9A84C'}}>
            {group.groupLabel}
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
              {group.table.map((row: any, i: number) => (
                <tr key={row.team?.id ?? i} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2" style={{color:'#9A9A9A'}}>{row.position ?? i + 1}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      {row.team?.logo && <img src={row.team.logo} alt="" className="w-4 h-4 shrink-0" />}
                      <span className="truncate font-medium" style={{maxWidth:'80px'}}>{row.team?.name}</span>
                    </div>
                  </td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.playedGames ?? 0}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.won ?? 0}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.draw ?? 0}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{row.lost ?? 0}</td>
                  <td className="text-center px-1 py-2" style={{color:'#9A9A9A'}}>{(row.goalDifference ?? 0) > 0 ? "+" + row.goalDifference : (row.goalDifference ?? 0)}</td>
                  <td className="text-center px-1 py-2 font-bold" style={{color:'#C9A84C'}}>{row.points ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
