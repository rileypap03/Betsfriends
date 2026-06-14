'use client';

import { useEffect, useState } from 'react';
import { TEAM, STARTING_STAKE, PlayerId } from '@/lib/types';
import { Bet, BetCard, groupBetsByDay } from '@/components/BetCard';
import Header from '@/components/Header';

export default function PlayerPage({ params }: { params: { id: string } }) {
  const playerId = params.id as PlayerId;
  const player = TEAM.find((t) => t.id === playerId);

  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bets')
      .then((r) => r.json())
      .then((j) => {
        setBets((j.bets || []).filter((b: Bet) => b.player_id === playerId));
        setLoading(false);
      });
  }, [playerId]);

  if (!player) {
    return (
      <main className="max-w-3xl mx-auto p-4 pb-24 relative z-10">
        <Header back />
        <div className="card p-4 text-red-bright text-sm">Player not found.</div>
      </main>
    );
  }

  // Balance derived the same way as /api/balances
  let balance = STARTING_STAKE;
  for (const b of bets) {
    const stake = Number(b.stake);
    const odds = Number(b.odds);
    if (b.status === 'open' || b.status === 'lost') balance -= stake;
    else if (b.status === 'won') balance += stake * odds - stake;
  }
  const pnl = balance - STARTING_STAKE;
  const dir = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat';

  const openBets = bets.filter((b) => b.status === 'open');
  const wonCount = bets.filter((b) => b.status === 'won').length;
  const lostCount = bets.filter((b) => b.status === 'lost').length;

  return (
    <main className="max-w-3xl mx-auto p-4 pb-24 relative z-10">
      <Header back />

      {/* Player header card */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-xl bg-cover bg-center border-2"
            style={{ backgroundImage: `url(${player.avatar})`, backgroundColor: player.color, borderColor: player.accent }}
          />
          <div className="display-title text-2xl italic text-center">{player.name}</div>
          <div className="text-xs font-bold tracking-wide" style={{ color: player.accent }}>★ {player.country}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Balance" value={`£${balance.toFixed(2)}`} accent="gold" />
        <Stat
          label="P&L"
          value={`${pnl >= 0 ? '+' : '−'}£${Math.abs(pnl).toFixed(2)}`}
          accent={dir === 'up' ? 'up' : dir === 'down' ? 'down' : undefined}
        />
        <Stat label="Open Bets" value={String(openBets.length)} sub={`£${openBets.reduce((s, b) => s + Number(b.stake), 0).toFixed(2)} at stake`} />
        <Stat label="Record" value={`${wonCount}W / ${lostCount}L`} sub={`${bets.length} total bets`} />
      </div>

      {/* Bets list, grouped by day */}
      <div className="space-y-5">
        {loading && <div className="text-text-muted text-sm">Loading bets…</div>}
        {!loading && bets.length === 0 && (
          <div className="text-center py-10 text-text-dim text-sm">{player.name} hasn't logged any bets yet.</div>
        )}
        {groupBetsByDay(bets).map(({ dateKey, label, items }) => (
          <div key={dateKey}>
            <div className="eyebrow mb-2 flex items-center gap-2">
              <span className="w-1 h-3 bg-gold inline-block" />
              {label}
              <span className="text-text-dim">· {items.length} bet{items.length === 1 ? '' : 's'}</span>
            </div>
            <div className="space-y-2">
              {items.map((bet) => (
                <BetCard key={bet.id} bet={bet} showPlayer={false} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  const accentColor = accent === 'up' ? 'var(--green-bright)' : accent === 'down' ? 'var(--red-bright)' : accent === 'gold' ? 'var(--gold-bright)' : 'var(--text)';
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-2xl mt-1" style={{ color: accentColor }}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}
