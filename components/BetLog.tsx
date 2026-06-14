'use client';

import { useEffect, useState } from 'react';
import { TEAM, PlayerId } from '@/lib/types';
import { Bet, BetCard, groupBetsByDay } from '@/components/BetCard';
import { TriangleAlert } from 'lucide-react';

export default function BetLog() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/bets');
    const j = await res.json();
    setBets(j.bets || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    await fetch('/api/bets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function deleteBet(id: string) {
    if (!confirm('Delete bet?')) return;
    await fetch(`/api/bets?id=${id}`, { method: 'DELETE' });
    await load();
  }

  // Conflict detection
  const openBets = bets.filter((b) => b.status === 'open');
  const conflictsByEvent: Record<string, Bet[]> = {};
  openBets.forEach((b) => {
    const k = b.event.toLowerCase().trim();
    (conflictsByEvent[k] ||= []).push(b);
  });
  const conflicts = Object.values(conflictsByEvent).filter((arr) => {
    const sels = new Set(arr.map((b) => b.selection.toLowerCase().trim()));
    return sels.size > 1;
  });
  const conflictIds = new Set(conflicts.flatMap((c) => c.map((b) => b.id)));

  const totalStake = openBets.reduce((s, b) => s + Number(b.stake), 0);
  const maxReturn = openBets.reduce((s, b) => s + Number(b.stake) * Number(b.odds), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="eyebrow">Open</div>
          <div className="font-display text-2xl">{openBets.length}</div>
          <div className="text-xs text-text-muted mt-1">£{totalStake.toFixed(2)} at stake · max return £{maxReturn.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="eyebrow">Settled</div>
          <div className="font-display text-2xl">
            {bets.filter((b) => b.status === 'won').length}W / {bets.filter((b) => b.status === 'lost').length}L
          </div>
          <div className="text-xs text-text-muted mt-1">{bets.length} total bets</div>
        </div>
      </div>

      {/* Conflict warnings */}
      {conflicts.map((arr, i) => (
        <div key={i} className="card p-3" style={{ borderColor: 'rgba(228,0,43,0.4)', background: 'rgba(228,0,43,0.06)' }}>
          <div className="text-sm flex gap-2">
            <TriangleAlert size={16} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: 'var(--red-bright)' }} fill="rgba(228,0,43,0.2)" />
            <span>
              <strong>{arr[0].event}:</strong>{' '}
              {arr.map((b) => `${TEAM.find((t) => t.id === b.player_id)?.name} on "${b.selection}"`).join(' vs ')}
              <span className="text-text-muted"> — you'll lose the bookmaker's margin on these.</span>
            </span>
          </div>
        </div>
      ))}

      {/* Bets list, grouped by day */}
      <div className="space-y-5">
        {loading && <div className="text-text-muted text-sm">Loading bets…</div>}
        {!loading && bets.length === 0 && (
          <div className="text-center py-10 text-text-dim text-sm">No bets logged yet. Scan a bet slip above to get started.</div>
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
                <BetCard
                  key={bet.id}
                  bet={bet}
                  isConflict={conflictIds.has(bet.id)}
                  onSetStatus={setStatus}
                  onDelete={deleteBet}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
