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

type ViewMode = 'team' | PlayerId;

export default function BalanceChart() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('team');

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

  const lineDefs =
    view === 'team'
      ? [{ key: 'team', name: 'Team Total', color: '#C9A84C' }]
      : [{ key: view, name: TEAM.find((t) => t.id === view)?.name || view, color: TEAM.find((t) => t.id === view)?.accent || '#C9A84C' }];

  // Reference line: starting baseline (team = 4x stake, individual = stake)
  const baseline = view === 'team' ? TEAM.length * STARTING_STAKE : STARTING_STAKE;

  // Current value + P&L for the callout
  const latest = series[series.length - 1];
  const currentValue = view === 'team' ? latest.team : latest[view];
  const pnl = currentValue - baseline;
  const pnlPct = (pnl / baseline) * 100;
  const dir = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat';

  return (
    <div className="space-y-3">
      {/* View selector */}
      <div className="flex gap-1 card p-1 overflow-x-auto">
        <button
          onClick={() => setView('team')}
          className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
          style={view === 'team' ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}
        >
          Team
        </button>
        {TEAM.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
            style={view === t.id ? { background: 'rgba(255,255,255,0.1)', color: 'white' } : { color: '#9A9A9A' }}
          >
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

      {/* Chart */}
      <div className="card p-3" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#9A9A9A' }}
              formatter={(value: number, name: string) => [`£${value.toFixed(2)}`, name]}
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
      </div>
    </div>
  );
}

interface SeriesPoint {
  label: string;
  ts: number;
  team: number;
  fitz: number;
  miller: number;
  roberto: number;
  riley: number;
}

function buildSeries(bets: Bet[]): SeriesPoint[] {
  if (bets.length === 0) return [];

  // Build a list of balance-changing events: { ts, player_id, delta }
  type Ev = { ts: number; player_id: PlayerId; delta: number };
  const events: Ev[] = [];

  for (const b of bets) {
    const stake = Number(b.stake);
    const odds = Number(b.odds);
    const placedAt = new Date(b.created_at).getTime();
    // Stake is deducted the moment the bet is placed
    events.push({ ts: placedAt, player_id: b.player_id, delta: -stake });

    if (b.status !== 'open' && b.settled_at) {
      const settledAt = new Date(b.settled_at).getTime();
      if (b.status === 'won') {
        events.push({ ts: settledAt, player_id: b.player_id, delta: stake * odds }); // returns stake + profit
      } else if (b.status === 'void') {
        events.push({ ts: settledAt, player_id: b.player_id, delta: stake }); // refund
      }
      // 'lost' → no further change, stake stays deducted
    }
  }

  events.sort((a, b) => a.ts - b.ts);

  // Running balances, starting at STARTING_STAKE each
  const running: Record<PlayerId, number> = {} as any;
  for (const t of TEAM) running[t.id] = STARTING_STAKE;

  // Starting point
  const points: SeriesPoint[] = [];
  const firstTs = events[0].ts;
  points.push(makePoint(new Date(firstTs - 1), running));

  let lastTs = -1;
  for (const ev of events) {
    running[ev.player_id] = Math.round((running[ev.player_id] + ev.delta) * 100) / 100;
    if (ev.ts === lastTs) {
      // Same timestamp — update the last point in place
      points[points.length - 1] = makePoint(new Date(ev.ts), running, points[points.length - 1].label);
    } else {
      points.push(makePoint(new Date(ev.ts), running));
      lastTs = ev.ts;
    }
  }

  return points;
}

function makePoint(date: Date, balances: Record<PlayerId, number>, label?: string): SeriesPoint {
  const team = TEAM.reduce((s, t) => s + balances[t.id], 0);
  return {
    label: label || date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    ts: date.getTime(),
    team: Math.round(team * 100) / 100,
    fitz: balances.fitz,
    miller: balances.miller,
    roberto: balances.roberto,
    riley: balances.riley,
  };
}
