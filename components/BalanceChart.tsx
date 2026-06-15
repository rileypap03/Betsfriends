'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TEAM, STARTING_STAKE, PlayerId } from '@/lib/types';
import { Bet } from '@/components/BetCard';
import { Trophy } from 'lucide-react';

type ViewMode = 'team' | PlayerId;
type RangeMode = '1D' | '1W' | '2W' | '3W' | '4W' | 'ALL';

const RANGE_MS: Record<RangeMode, number | null> = {
  '1D': 1 * 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '2W': 14 * 24 * 60 * 60 * 1000,
  '3W': 21 * 24 * 60 * 60 * 1000,
  '4W': 28 * 24 * 60 * 60 * 1000,
  'ALL': null,
};

export default function BalanceChart() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('team');
  const [range, setRange] = useState<RangeMode>('1W');

  useEffect(() => {
    fetch('/api/bets')
      .then((r) => r.json())
      .then((j) => {
        setBets(j.bets || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-text-muted text-sm">Loading…</div>;

  const series = buildSeries(bets);

  if (series.length < 2) {
    return (
      <div className="card p-6 text-center text-text-dim text-sm">
        Not enough bet history yet to chart progress. Once a few bets are settled, balances over time will appear here.
      </div>
    );
  }

  const filteredSeries = filterSeriesByRange(series, range);

  // Reference line: starting baseline (team = 4x stake, individual = stake)
  const baseline = view === 'team' ? TEAM.length * STARTING_STAKE : STARTING_STAKE;

  // Current value + P&L for the callout
  const latest = series[series.length - 1];
  const currentValue = view === 'team' ? latest.team : latest[view];
  const pnl = currentValue - baseline;
  const pnlPct = (pnl / baseline) * 100;
  const dir = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat';

  // Line color always reflects profit/loss (green/red), never a player's
  // national-team accent colour — England red would misleadingly read as "loss".
  const lineColor = dir === 'up' ? '#00C775' : dir === 'down' ? '#FF4D6D' : '#8A9BBF';

  const lineDefs =
    view === 'team'
      ? [{ key: 'team', name: 'Team Total', color: lineColor }]
      : [{ key: view, name: TEAM.find((t) => t.id === view)?.name || view, color: lineColor }];

  return (
    <div className="space-y-3">
      {/* View selector */}
      <div className="flex gap-1 card p-1 overflow-x-auto">
        <button
          onClick={() => setView('team')}
          className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex flex-col items-center gap-1"
          style={view === 'team' ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Trophy
              size={22}
              strokeWidth={2}
              style={{ color: view === 'team' ? 'var(--gold-bright)' : '#5A5A5A' }}
              fill={view === 'team' ? 'rgba(232,200,106,0.25)' : 'none'}
            />
          </div>
          Team
        </button>
        {TEAM.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex flex-col items-center gap-1"
            style={view === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}
          >
            <div
              className="w-9 h-9 rounded-full bg-cover bg-center shrink-0"
              style={{
                backgroundImage: `url(${t.avatar})`,
                backgroundColor: t.color,
                outline: view === t.id ? '2px solid var(--gold-bright)' : '2px solid transparent',
                outlineOffset: '1px',
              }}
            />
            {t.name}
          </button>
        ))}
      </div>

      {/* P&L callout */}
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">{view === 'team' ? 'Team' : TEAM.find((t) => t.id === view)?.name} P&amp;L</div>
          <div className="font-display text-3xl" style={{ color: dir === 'up' ? 'var(--green-bright)' : dir === 'down' ? 'var(--red-bright)' : 'var(--text-muted)' }}>
            {pnl >= 0 ? '+' : '−'}£{Math.abs(pnl).toFixed(2)}
          </div>
        </div>
        <div
          className="text-sm font-semibold px-3 py-1.5 rounded"
          style={{
            background: dir === 'up' ? 'rgba(0,199,117,0.12)' : dir === 'down' ? 'rgba(255,77,109,0.12)' : 'rgba(138,155,191,0.12)',
            color: dir === 'up' ? '#00C775' : dir === 'down' ? '#FF4D6D' : '#8A9BBF',
          }}
        >
          {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—'} {pnlPct >= 0 ? '+' : '−'}{Math.abs(pnlPct).toFixed(1)}%
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-1 card p-1 overflow-x-auto">
        {(['1D', '1W', '2W', '3W', '4W', 'ALL'] as RangeMode[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
            style={range === r ? { background: 'rgba(201,168,76,0.18)', color: '#E8C86A' } : { color: '#9A9A9A' }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-3" style={{ height: 260 }}>
        {filteredSeries.length < 2 ? (
          <div className="h-full flex items-center justify-center text-text-dim text-sm text-center px-4">
            No balance changes in this period.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9A9A9A', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9A9A9A', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `£${v}`}
              width={48}
            />
            <Tooltip
              content={<ChartTooltip view={view} />}
            />
            <ReferenceLine y={baseline} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            {lineDefs.map((l) => (
              <Line
                key={l.key}
                type="stepAfter"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={2}
                dot={{ r: 2, fill: l.color }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, view }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const point: SeriesPoint = payload[0]?.payload;
  if (!point) return null;

  const seriesName = payload[0].name;
  const seriesValue = payload[0].value;
  const seriesColor = payload[0].color;

  const kindMeta: Record<BetEventInfo['kind'], { label: string; color: string }> = {
    placed: { label: 'placed', color: '#8A9BBF' },
    won: { label: 'won', color: '#00C775' },
    lost: { label: 'lost', color: '#FF4D6D' },
    void: { label: 'voided', color: '#9A9A9A' },
  };

  // On a player view, only show that player's bet events; on team view, show everyone's
  const events = (point.betEvents || []).filter((be) => view === 'team' || be.player_id === view);

  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, padding: '8px 10px', maxWidth: 220 }}>
      <div style={{ color: '#9A9A9A', marginBottom: 4 }}>{label}</div>
      <div style={{ color: seriesColor, fontWeight: 600, marginBottom: events.length ? 6 : 0 }}>
        {seriesName}: £{Number(seriesValue).toFixed(2)}
      </div>
      {events.map((be, i) => {
        const player = TEAM.find((t) => t.id === be.player_id);
        const meta = kindMeta[be.kind];
        return (
          <div key={i} style={{ paddingTop: i > 0 ? 4 : 0, borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined, marginTop: i > 0 ? 4 : 0 }}>
            <span style={{ color: 'white', fontWeight: 600 }}>{player?.name}</span>{' '}
            <span style={{ color: meta.color }}>{meta.label}</span>{' '}
            <span style={{ color: '#9A9A9A' }}>a bet on</span>{' '}
            <span style={{ color: 'white' }}>{be.event}</span>
          </div>
        );
      })}
    </div>
  );
}


interface BetEventInfo {
  player_id: PlayerId;
  event: string;
  kind: 'placed' | 'won' | 'lost' | 'void';
  delta: number;
}

interface SeriesPoint {
  label: string;
  ts: number;
  team: number;
  fitz: number;
  miller: number;
  roberto: number;
  riley: number;
  betEvents?: BetEventInfo[];
}

// World Cup 2026 kicked off on 11 June 2026 — the P&L chart always starts
// from this date, regardless of when the first bet was actually placed.
const COMPETITION_START = new Date('2026-06-11T00:00:00Z').getTime();

function buildSeries(bets: Bet[]): SeriesPoint[] {
  // Build a list of balance-changing events: { ts, player_id, delta, ... }
  type Ev = { ts: number; player_id: PlayerId; delta: number; event: string; kind: BetEventInfo['kind'] };
  const events: Ev[] = [];

  for (const b of bets) {
    const stake = Number(b.stake);
    const odds = Number(b.odds);
    const placedAt = new Date(b.created_at).getTime();
    // Stake is deducted the moment the bet is placed
    events.push({ ts: placedAt, player_id: b.player_id, delta: -stake, event: b.event, kind: 'placed' });

    if (b.status !== 'open' && b.settled_at) {
      const settledAt = new Date(b.settled_at).getTime();
      if (b.status === 'won') {
        events.push({ ts: settledAt, player_id: b.player_id, delta: stake * odds, event: b.event, kind: 'won' }); // returns stake + profit
      } else if (b.status === 'lost') {
        events.push({ ts: settledAt, player_id: b.player_id, delta: 0, event: b.event, kind: 'lost' }); // stake stays deducted, no balance change but worth noting
      } else if (b.status === 'void') {
        events.push({ ts: settledAt, player_id: b.player_id, delta: stake, event: b.event, kind: 'void' }); // refund
      }
    }
  }

  events.sort((a, b) => a.ts - b.ts);

  // Running balances, starting at STARTING_STAKE each
  const running: Record<PlayerId, number> = {} as any;
  for (const t of TEAM) running[t.id] = STARTING_STAKE;

  // Always start the series at the competition's kickoff date, even if
  // there's no bet activity yet — gives the chart a fixed, meaningful start.
  const points: SeriesPoint[] = [];
  points.push(makePoint(new Date(COMPETITION_START), running, 'Kickoff'));

  let lastTs = COMPETITION_START;
  for (const ev of events) {
    // Ignore any stray events that somehow predate kickoff
    if (ev.ts < COMPETITION_START) continue;
    running[ev.player_id] = Math.round((running[ev.player_id] + ev.delta) * 100) / 100;
    const info: BetEventInfo = { player_id: ev.player_id, event: ev.event, kind: ev.kind, delta: ev.delta };
    if (ev.ts === lastTs && points.length > 1) {
      // Same timestamp — update the last point in place, accumulating events
      const prev = points[points.length - 1];
      points[points.length - 1] = makePoint(new Date(ev.ts), running, prev.label, [...(prev.betEvents || []), info]);
    } else {
      points.push(makePoint(new Date(ev.ts), running, undefined, [info]));
      lastTs = ev.ts;
    }
  }

  return points;
}

function makePoint(date: Date, balances: Record<PlayerId, number>, label?: string, betEvents?: BetEventInfo[]): SeriesPoint {
  const team = TEAM.reduce((s, t) => s + balances[t.id], 0);
  return {
    label: label || date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    ts: date.getTime(),
    team: Math.round(team * 100) / 100,
    fitz: balances.fitz,
    miller: balances.miller,
    roberto: balances.roberto,
    riley: balances.riley,
    betEvents,
  };
}

function filterSeriesByRange(series: SeriesPoint[], range: RangeMode): SeriesPoint[] {
  const ms = RANGE_MS[range];
  if (ms === null) return series; // ALL

  const cutoff = Date.now() - ms;
  const inRange = series.filter((p) => p.ts >= cutoff);
  const before = series.filter((p) => p.ts < cutoff);

  let result: SeriesPoint[];
  if (before.length > 0) {
    // Carry the last known balances forward to the cutoff so the line
    // starts at the right value rather than appearing to jump from zero.
    const last = before[before.length - 1];
    const anchor: SeriesPoint = { ...last, ts: cutoff, label: relabel(new Date(cutoff), range) };
    result = [anchor, ...inRange];
  } else {
    result = inRange;
  }

  // For short ranges, relabel points with time-of-day so same-day points
  // are distinguishable on the x-axis.
  if (range === '1D' || range === '1W') {
    result = result.map((p) => ({ ...p, label: relabel(new Date(p.ts), range) }));
  }

  return result;
}

function relabel(date: Date, range: RangeMode): string {
  if (range === '1D') {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '1W') {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' });
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
