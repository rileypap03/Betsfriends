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
      <div className="flex gap-1 mb-4 card p-1 overflow-x-auto">
        {['upcoming','live','finished','groups','bracket','all'].map((f) => (
          <button key={f} onClick={() => { setFilter(f); if (f !== 'groups') setJumpGroup(null); }}
            className="flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
            style={filter === f ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}>
            {f}
          </button>
        ))}
      </div>
      {loading && <div className="text-text-muted text-sm">Loading...</div>}
      {filter === 'groups' ? (
        <GroupTables standings={standings} jumpTo={jumpGroup} />
      ) : filter === 'bracket' ? (
        <BracketView fixtures={fixtures} />
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
  const elapsed = f.fixture.status.elapsed;
  return (
    <div className="block card p-3 hover:bg-bg-hover transition-colors">
      <div className="flex items-center justify-between mb-2">
        {isGroupRound ? (
          <button
            onClick={(e) => { e.preventDefault(); onGroupClick(round); }}
            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
          >
            {round}
          </button>
        ) : round ? (
          <span
            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9A9A9A' }}
          >
            {round}
          </span>
        ) : <span />}
        <span className="text-xs text-text-muted">
          {new Date(f.fixture.date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/team/${f.teams.home.id}?name=${encodeURIComponent(f.teams.home.name)}&crest=${encodeURIComponent(f.teams.home.logo || '')}`}
          className="flex items-center gap-2 flex-1 min-w-0 justify-end hover:opacity-75 transition-opacity"
        >
          <span className="text-sm font-semibold truncate text-right">{f.teams.home.name}</span>
          {f.teams.home.logo && <img src={f.teams.home.logo} alt="" className="w-6 h-6 shrink-0" />}
        </Link>
        <Link href={"/match/" + f.fixture.id} className="shrink-0 flex flex-col items-center gap-0.5 px-1" style={{ minWidth: 48 }}>
          {hasScore ? (
            <span className="font-display text-base">{f.goals.home} - {f.goals.away}</span>
          ) : (
            <span className="text-xs font-semibold text-text-muted">
              {new Date(f.fixture.date).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          {isLive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none" style={{background:'rgba(230,29,37,0.15)',color:'#E61D25'}}>
              {elapsed ? `${elapsed}'` : 'LIVE'}
            </span>
          )}
          {isFinished && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none" style={{background:'rgba(255,255,255,0.06)',color:'#9A9A9A'}}>FT</span>
          )}
        </Link>
        <Link
          href={`/team/${f.teams.away.id}?name=${encodeURIComponent(f.teams.away.name)}&crest=${encodeURIComponent(f.teams.away.logo || '')}`}
          className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-75 transition-opacity"
        >
          {f.teams.away.logo && <img src={f.teams.away.logo} alt="" className="w-6 h-6 shrink-0" />}
          <span className="text-sm font-semibold truncate">{f.teams.away.name}</span>
        </Link>
      </div>
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
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-xs" style={{color:'#5A5A5A'}}>
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
                    <Link
                      href={`/team/${row.team?.id}?name=${encodeURIComponent(row.team?.name || '')}&crest=${encodeURIComponent(row.team?.crest || row.team?.logo || '')}`}
                      className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                    >
                      {(row.team?.crest || row.team?.logo) && <img src={row.team.crest || row.team.logo} alt="" className="w-5 h-5 shrink-0" />}
                      <span className="truncate font-medium" style={{maxWidth:'96px'}}>{row.team?.name}</span>
                    </Link>
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

// World Cup 2026 knockout stages in order, with display labels.
const KNOCKOUT_STAGES: { key: string; label: string; short: string }[] = [
  { key: 'Last 32', label: 'Round of 32', short: 'R32' },
  { key: 'Last 16', label: 'Round of 16', short: 'R16' },
  { key: 'Quarter Finals', label: 'Quarter-Finals', short: 'QF' },
  { key: 'Semi Finals', label: 'Semi-Finals', short: 'SF' },
  { key: 'Third Place', label: '3rd Place Play-off', short: '3RD' },
  { key: 'Final', label: 'Final', short: 'F' },
];

function BracketView({ fixtures }: { fixtures: any[] }) {
  const byStage = new Map<string, any[]>();
  for (const f of fixtures) {
    const round = f.league?.round || '';
    const stage = KNOCKOUT_STAGES.find((s) => round.toLowerCase() === s.key.toLowerCase());
    if (!stage) continue;
    if (!byStage.has(stage.key)) byStage.set(stage.key, []);
    byStage.get(stage.key)!.push(f);
  }

  const activeStages = KNOCKOUT_STAGES.filter((s) => byStage.has(s.key) && s.key !== 'Third Place');
  const thirdPlace = byStage.get('Third Place') || [];

  if (activeStages.length === 0) {
    return (
      <div className="card p-6 text-center text-text-dim text-sm space-y-2">
        <div className="font-display text-lg text-text-muted">Road to the Final</div>
        <p>
          The knockout bracket isn't in the schedule yet. The Round of 32 kicks off once the group stage
          finishes — 12 group winners, 12 runners-up, and the best 8 third-placed teams go through.
        </p>
        <p className="text-xs">Check back after the final group games to see the path to MetLife Stadium, NJ on 19 July.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-3 text-center">
        <div className="eyebrow">World Cup 26 Final</div>
        <div className="font-display text-lg" style={{ color: 'var(--gold-bright)' }}>19 July · MetLife Stadium, New Jersey</div>
      </div>

      {/* Horizontally scrollable wall chart */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 min-w-max pb-2">
          {activeStages.map((stage) => {
            const games = (byStage.get(stage.key) || []).sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
            return (
              <div key={stage.key} className="flex flex-col gap-2" style={{ width: 220 }}>
                <div className="eyebrow text-center mb-1" style={{ color: '#C9A84C' }}>{stage.label}</div>
                <div className="flex flex-col gap-2 justify-around flex-1">
                  {games.map((f) => <BracketMatch key={f.fixture.id} fixture={f} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {thirdPlace.length > 0 && (
        <div>
          <div className="eyebrow text-center mb-2" style={{ color: '#C9A84C' }}>3rd Place Play-off</div>
          <div className="max-w-[220px] mx-auto">
            {thirdPlace.map((f) => <BracketMatch key={f.fixture.id} fixture={f} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function BracketMatch({ fixture: f }: { fixture: any }) {
  const s = f.fixture.status.short;
  const isFinished = ['FT','AET','PEN'].includes(s);
  const isLive = ['1H','2H','HT','ET','P'].includes(s);
  const hasScore = f.goals.home !== null;
  const homeName = f.teams.home.name || 'TBD';
  const awayName = f.teams.away.name || 'TBD';
  const homeWon = f.teams.home.winner === true;
  const awayWon = f.teams.away.winner === true;

  const TeamRow = ({ name, logo, id, won, score }: { name: string; logo?: string; id?: number; won: boolean; score: number | null }) => {
    const content = (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {logo && <img src={logo} alt="" className="w-4 h-4 shrink-0" />}
        <span className={`text-sm truncate ${won ? 'font-bold' : ''}`} style={{ color: won ? 'white' : name === 'TBD' ? '#5A5A5A' : '#9A9A9A' }}>
          {name}
        </span>
      </div>
    );
    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        {id ? (
          <Link href={`/team/${id}?name=${encodeURIComponent(name)}&crest=${encodeURIComponent(logo || '')}`} className="flex-1 min-w-0 hover:opacity-75 transition-opacity">
            {content}
          </Link>
        ) : content}
        {hasScore && <span className="font-display text-sm shrink-0" style={{ color: won ? 'var(--gold-bright)' : '#9A9A9A' }}>{score}</span>}
      </div>
    );
  };

  return (
    <Link href={`/match/${f.fixture.id}`} className="card overflow-hidden block hover:bg-bg-hover transition-colors">
      <div className="text-xs text-text-dim px-2 pt-1.5 flex items-center justify-between">
        <span>{new Date(f.fixture.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
        {isLive && <span className="font-bold px-1 py-0.5 rounded" style={{background:'rgba(230,29,37,0.15)',color:'#E61D25'}}>LIVE</span>}
        {isFinished && <span className="font-bold px-1 py-0.5 rounded" style={{background:'rgba(255,255,255,0.06)',color:'#9A9A9A'}}>FT</span>}
      </div>
      <div className="divide-y divide-white/5">
        <TeamRow name={homeName} logo={f.teams.home.logo} id={f.teams.home.id} won={isFinished && homeWon} score={f.goals.home} />
        <TeamRow name={awayName} logo={f.teams.away.logo} id={f.teams.away.id} won={isFinished && awayWon} score={f.goals.away} />
      </div>
    </Link>
  );
}
