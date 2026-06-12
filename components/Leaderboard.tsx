'use client';

import { useEffect, useState } from 'react';
import { TEAM, STARTING_STAKE, PlayerId } from '@/lib/types';

interface Balance { player_id: PlayerId; balance: number; updated_at: string; }

export default function Leaderboard() {
  const [balances, setBalances] = useState<Record<PlayerId, number>>({} as any);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/balances');
    const j = await res.json();
    const map: any = {};
    (j.balances || []).forEach((b: Balance) => { map[b.player_id] = b.balance; });
    setBalances(map);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function update(player_id: PlayerId, newBalance: number) {
    setBalances((b) => ({ ...b, [player_id]: newBalance }));
    await fetch('/api/balances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id, balance: newBalance }),
    });
  }

  if (loading) return <div className="text-text-muted text-sm">Loading…</div>;

  const ranked = [...TEAM].sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0));
  const teamTotal = Object.values(balances).reduce((s, v) => s + (v || 0), 0);
  const teamPnL = teamTotal - TEAM.length * STARTING_STAKE;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Team Total" value={`£${teamTotal.toFixed(2)}`} sub={`${TEAM.length} players × £${STARTING_STAKE}`} accent="gold" />
        <Stat
          label="Team P&L"
          value={`${teamPnL >= 0 ? '+' : '−'}£${Math.abs(teamPnL).toFixed(2)}`}
          sub={teamPnL > 0 ? 'Lock-in mode' : teamPnL < 0 ? 'Need variance' : 'Even'}
          accent={teamPnL > 0 ? 'up' : teamPnL < 0 ? 'down' : ''}
        />
        <Stat label="Top" value={ranked[0].name} sub={`£${(balances[ranked[0].id] ?? 0).toFixed(2)}`} accent="up" />
        <Stat label="Bottom" value={ranked[ranked.length - 1].name} sub={`£${(balances[ranked[ranked.length - 1].id] ?? 0).toFixed(2)}`} accent="down" />
      </div>
      <div className="space-y-3">
        {ranked.map((member, idx) => {
          const bal = balances[member.id] ?? STARTING_STAKE;
          const pnl = bal - STARTING_STAKE;
          const pct = (pnl / STARTING_STAKE) * 100;
          const dir = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat';
          return (
            <div
              key={member.id}
              className={`card p-4 grid grid-cols-[36px_48px_1fr] md:grid-cols-[40px_56px_1fr_auto] items-center gap-3 ${idx === 0 ? 'border-gold' : ''}`}
              style={idx === 0 ? { borderColor: 'var(--gold)' } : {}}
            >
              <div className="font-display text-3xl text-text-dim text-center" style={idx === 0 ? { color: 'var(--gold-bright)' } : idx === 1 ? { color: '#B8C5D6' } : idx === 2 ? { color: '#C4854A' } : {}}>
                {idx + 1}
              </div>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl bg-cover bg-center border-2"
                style={{ backgroundImage: `url(${member.avatar})`, backgroundColor: member.color, borderColor: member.accent }}
              />

              <div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                  <span style={{ color: member.accent }} className="font-bold tracking-wide">★ {member.country}</span>
                  <span>·</span>
                  <span>Stake: £{STARTING_STAKE}</span>
                  <span>·</span>
                  <span>Current:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bal}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setBalances((b) => ({ ...b, [member.id]: isNaN(v) ? 0 : v }));
                    }}
                    onBlur={() => update(member.id, bal)}
                    className="input-base w-20 text-right font-display text-sm"
                  />
                </div>
              </div>
              <div className="text-right col-span-3 md:col-span-1 flex items-baseline justify-between md:block border-t md:border-0 border-white/10 pt-2 md:pt-0">
                <div className={`font-display text-2xl ${dir === 'up' ? 'text-green-bright' : dir === 'down' ? 'text-red-bright' : 'text-text-muted'}`}
                  style={dir === 'up' ? { color: 'var(--green-bright)' } : dir === 'down' ? { color: 'var(--red-bright)' } : {}}
                >
                  {pnl >= 0 ? '+' : '−'}£{Math.abs(pnl).toFixed(2)}
                </div>
                <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded inline-block`}
                  style={{
                    background: dir === 'up' ? 'rgba(0,199,117,0.12)' : dir === 'down' ? 'rgba(255,77,109,0.12)' : 'rgba(138,155,191,0.12)',
                    color: dir === 'up' ? '#00C775' : dir === 'down' ? '#FF4D6D' : '#8A9BBF',
                  }}
                >
                  {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—'} {pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  const accentColor = accent === 'up' ? 'var(--green-bright)' : accent === 'down' ? 'var(--red-bright)' : accent === 'gold' ? 'var(--gold-bright)' : 'var(--text)';
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-3xl mt-1" style={{ color: accentColor }}>{value}</div>
      <div className="text-xs text-text-muted mt-1">{sub}</div>
    </div>
  );
}
