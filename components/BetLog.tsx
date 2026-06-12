'use client';

import { useEffect, useState } from 'react';
import { TEAM, PlayerId } from '@/lib/types';

interface Bet {
  id: string;
  player_id: PlayerId;
  fixture_id?: number;
  event: string;
  selection: string;
  stake: number;
  odds: number;
  status: 'open' | 'won' | 'lost' | 'void';
  created_at: string;
}

export default function BetLog({ prefilledEvent }: { prefilledEvent?: string } = {}) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    player_id: 'fitz' as PlayerId,
    event: prefilledEvent || '',
    selection: '',
    stake: '',
    odds: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch('/api/bets');
    const j = await res.json();
    setBets(j.bets || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (prefilledEvent) setForm((f) => ({ ...f, event: prefilledEvent })); }, [prefilledEvent]);

  async function addBet() {
    if (!form.event || !form.selection || !form.stake || !form.odds) {
      alert('Fill all fields');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: form.player_id,
        event: form.event,
        selection: form.selection,
        stake: parseFloat(form.stake),
        odds: parseFloat(form.odds),
      }),
    });
    if (res.ok) {
      setForm({ player_id: form.player_id, event: prefilledEvent || '', selection: '', stake: '', odds: '' });
      await load();
    } else {
      const j = await res.json();
      alert(j.error || 'Failed');
    }
    setSubmitting(false);
  }

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
      {/* Strategy stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="eyebrow">At Stake</div>
          <div className="font-display text-2xl">£{totalStake.toFixed(2)}</div>
          <div className="text-xs text-text-muted mt-1">{openBets.length} open · max return £{maxReturn.toFixed(2)}</div>
        </div>
        <div className={`card p-4 ${conflicts.length > 0 ? '!border-red-500/50' : ''}`} style={conflicts.length > 0 ? { borderColor: 'rgba(228,0,43,0.5)' } : {}}>
          <div className="eyebrow">Coordination</div>
          <div className="font-display text-2xl" style={{ color: conflicts.length === 0 ? 'var(--green-bright)' : 'var(--red-bright)' }}>
            {conflicts.length === 0 ? '✓ Clean' : `⚠ ${conflicts.length} conflict`}
          </div>
          <div className="text-xs text-text-muted mt-1">{conflicts.length === 0 ? 'No accidental hedging' : 'Team is betting against itself'}</div>
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
            <span>⚠️</span>
            <span>
              <strong>{arr[0].event}:</strong>{' '}
              {arr.map((b) => `${TEAM.find((t) => t.id === b.player_id)?.name} on "${b.selection}"`).join(' vs ')}
              <span className="text-text-muted"> — you'll lose the bookmaker's margin on these.</span>
            </span>
          </div>
        </div>
      ))}

      {/* Add form */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div>
            <label className="eyebrow block mb-1">Player</label>
            <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value as PlayerId })} className="input-base w-full">
              {TEAM.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="eyebrow block mb-1">Match</label>
            <input value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} className="input-base w-full" placeholder="e.g. Brazil vs Argentina" />
          </div>
          <div className="md:col-span-2">
            <label className="eyebrow block mb-1">Selection</label>
            <input value={form.selection} onChange={(e) => setForm({ ...form, selection: e.target.value })} className="input-base w-full" placeholder="e.g. Brazil to win" />
          </div>
          <div>
            <label className="eyebrow block mb-1">Stake £</label>
            <input type="number" step="0.01" value={form.stake} onChange={(e) => setForm({ ...form, stake: e.target.value })} className="input-base w-full" placeholder="10" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="eyebrow block mb-1">Odds</label>
            <input type="number" step="0.01" value={form.odds} onChange={(e) => setForm({ ...form, odds: e.target.value })} className="input-base w-full max-w-[120px]" placeholder="2.50" />
          </div>
          <button onClick={addBet} disabled={submitting} className="btn-primary">{submitting ? 'Adding…' : 'Add Bet'}</button>
        </div>
      </div>

      {/* Bets list */}
      <div className="space-y-2">
        {loading && <div className="text-text-muted text-sm">Loading bets…</div>}
        {!loading && bets.length === 0 && (
          <div className="text-center py-10 text-text-dim text-sm">No bets logged yet. Add your first bet above.</div>
        )}
        {bets.map((bet) => {
          const player = TEAM.find((t) => t.id === bet.player_id)!;
          const isConflict = conflictIds.has(bet.id);
          const stake = Number(bet.stake);
          const odds = Number(bet.odds);
          const potential = stake * odds;
          const profit = potential - stake;

          return (
            <div
              key={bet.id}
              className={`card p-3 grid grid-cols-[28px_1fr_auto_auto_auto_auto] gap-3 items-center text-sm ${bet.status === 'lost' ? 'opacity-70' : ''} ${bet.status === 'void' ? 'opacity-50' : ''}`}
              style={{
                borderColor: isConflict ? 'rgba(228,0,43,0.5)' : undefined,
                background: isConflict ? 'rgba(228,0,43,0.05)' : undefined,
                borderLeftWidth: bet.status === 'won' ? 3 : bet.status === 'lost' ? 3 : undefined,
                borderLeftColor: bet.status === 'won' ? 'var(--green-bright)' : bet.status === 'lost' ? 'var(--red-bright)' : undefined,
              }}
            >
              <div
                className="w-7 h-7 rounded bg-cover bg-center"
                style={{ backgroundImage: `url(${player.avatar})`, backgroundColor: player.color }}
              />

              <div>
                <div className="font-semibold">{bet.event}</div>
                <div className="text-xs text-text-muted">{player.name} · {bet.selection}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] eyebrow">Stake</div>
                <div className="font-display">£{stake.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] eyebrow">Odds</div>
                <div className="font-display">{odds.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] eyebrow">{bet.status === 'open' ? 'Potential' : bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : '—'}</div>
                <div className="font-display" style={{ color: bet.status === 'won' ? 'var(--green-bright)' : bet.status === 'lost' ? 'var(--red-bright)' : 'var(--gold-bright)' }}>
                  {bet.status === 'lost' ? `−£${stake.toFixed(2)}` : bet.status === 'won' ? `+£${profit.toFixed(2)}` : bet.status === 'void' ? 'VOID' : `£${potential.toFixed(2)}`}
                </div>
              </div>
              <div className="flex gap-1">
                {bet.status === 'open' ? (
                  <>
                    <button onClick={() => setStatus(bet.id, 'won')} className="btn-secondary !px-2 !py-1 !text-[10px]">W</button>
                    <button onClick={() => setStatus(bet.id, 'lost')} className="btn-secondary !px-2 !py-1 !text-[10px]">L</button>
                    <button onClick={() => setStatus(bet.id, 'void')} className="btn-secondary !px-2 !py-1 !text-[10px]">V</button>
                  </>
                ) : (
                  <button onClick={() => setStatus(bet.id, 'open')} className="btn-secondary !px-2 !py-1 !text-[10px]">Reopen</button>
                )}
                <button onClick={() => deleteBet(bet.id)} className="btn-secondary !px-2 !py-1 !text-[10px]">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
