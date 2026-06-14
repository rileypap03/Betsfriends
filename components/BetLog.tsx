'use client';

import { useEffect, useState } from 'react';
import { TEAM, PlayerId } from '@/lib/types';
import { Bet, BetCard, groupBetsByDay } from '@/components/BetCard';
import { Camera, TriangleAlert } from 'lucide-react';

interface ScannedBet {
  event: string | null;
  selection: string | null;
  stake: number | null;
  odds: number | null;
  bet_type?: string;
  legs?: string[];
}

export default function BetLog({ prefilledEvent }: { prefilledEvent?: string } = {}) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual add form (collapsed by default, expand via "+ Add manually")
  const [showManualForm, setShowManualForm] = useState(false);
  const [form, setForm] = useState({
    player_id: 'fitz' as PlayerId,
    event: prefilledEvent || '',
    selection: '',
    stake: '',
    odds: '',
  });
  const [fixtures, setFixtures] = useState<any[]>([]);

  // Scan flow
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scannedBet, setScannedBet] = useState<ScannedBet | null>(null);
  const [scanPlayer, setScanPlayer] = useState<PlayerId>('fitz');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/fixtures')
      .then(r => r.json())
      .then(j => {
        const upcoming = (j.fixtures || [])
          .filter((f: any) => f.fixture.status.short === 'NS')
          .slice(0, 30);
        setFixtures(upcoming);
      });
  }, []);

  async function load() {
    const res = await fetch('/api/bets');
    const j = await res.json();
    setBets(j.bets || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (prefilledEvent) setForm((f) => ({ ...f, event: prefilledEvent })); }, [prefilledEvent]);

  async function handleScreenshot(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true); setScanError(''); setScannedBet(null);
    const reader = new FileReader();
    reader.onload = async (ev: any) => {
      try {
        const res = await fetch('/api/read-bet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: ev.target.result }) });
        const j = await res.json();
        if (j.error) { setScanError(j.error); setScanning(false); return; }
        const b = j.bet;
        const event = b.bet_type === 'acca' && b.legs?.length ? 'Accumulator' : (b.event || '');
        const selection = b.bet_type === 'acca' && b.legs?.length ? b.legs.join(' + ') : (b.selection || '');
        setScannedBet({
          event,
          selection,
          stake: b.stake ?? null,
          odds: b.odds ?? null,
          bet_type: b.bet_type,
          legs: b.legs,
        });
      } catch { setScanError('Could not read screenshot.'); }
      setScanning(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function confirmScannedBet() {
    if (!scannedBet) return;
    if (!scannedBet.event || !scannedBet.selection || !scannedBet.stake || !scannedBet.odds) {
      setScanError('Missing some details — fill them in below or try scanning again.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: scanPlayer,
        event: scannedBet.event,
        selection: scannedBet.selection,
        stake: scannedBet.stake,
        odds: scannedBet.odds,
      }),
    });
    if (res.ok) {
      setScannedBet(null);
      await load();
    } else {
      const j = await res.json();
      setScanError(j.error || 'Failed to add bet');
    }
    setSubmitting(false);
  }

  function discardScannedBet() {
    setScannedBet(null);
    setScanError('');
  }

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

      {/* Scan-first add flow */}
      <div className="card p-4 space-y-3">
        {!scannedBet && !scanning && (
          <div className="flex flex-col items-center gap-3 py-4">
            <label className="cursor-pointer btn-primary text-center inline-flex items-center gap-2">
              <Camera size={16} strokeWidth={2} fill="rgba(10,10,10,0.15)" />
              Scan Bet Slip
              <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
            </label>
            <button onClick={() => setShowManualForm((v) => !v)} className="text-xs text-text-muted underline">
              {showManualForm ? 'Hide manual entry' : '+ Add manually instead'}
            </button>
          </div>
        )}

        {scanning && (
          <div className="text-center py-6 text-text-muted text-sm">
            <div className="animate-pulse">Reading your bet screenshot...</div>
          </div>
        )}

        {scanError && (
          <div className="text-xs p-2 rounded" style={{ color: 'var(--red-bright)', background: 'rgba(228,0,43,0.06)' }}>
            {scanError}
          </div>
        )}

        {/* Scanned bet preview/confirmation */}
        {scannedBet && (
          <div className="space-y-3">
            <div className="eyebrow">Scanned bet — review &amp; confirm</div>
            <div>
              <label className="eyebrow block mb-1">Player</label>
              <select value={scanPlayer} onChange={(e) => setScanPlayer(e.target.value as PlayerId)} className="input-base w-full">
                {TEAM.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="card p-3" style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.3)' }}>
              <div className="font-semibold text-sm break-words">{scannedBet.event}</div>
              <div className="text-xs text-text-muted mt-1 break-words whitespace-pre-wrap">{scannedBet.selection}</div>
              <div className="flex gap-4 mt-2">
                <div>
                  <div className="text-[10px] eyebrow">Stake</div>
                  <div className="font-display">£{scannedBet.stake?.toFixed(2) ?? '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] eyebrow">Odds</div>
                  <div className="font-display">{scannedBet.odds?.toFixed(2) ?? '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] eyebrow">Potential</div>
                  <div className="font-display" style={{ color: 'var(--gold-bright)' }}>
                    £{scannedBet.stake && scannedBet.odds ? (scannedBet.stake * scannedBet.odds).toFixed(2) : '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={confirmScannedBet} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Adding...' : '✓ Confirm & Add'}
              </button>
              <button onClick={discardScannedBet} className="btn-secondary">Discard</button>
            </div>
          </div>
        )}

        {/* Manual form */}
        {showManualForm && !scannedBet && !scanning && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <div>
                <label className="eyebrow block mb-1">Player</label>
                <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value as PlayerId })} className="input-base w-full">
                  {TEAM.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="eyebrow block mb-1">Match</label>
                <select value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} className="input-base w-full">
                  <option value="">Select a match...</option>
                  {fixtures.map((f: any) => {
                    const label = f.teams.home.name + ' vs ' + f.teams.away.name;
                    const date = new Date(f.fixture.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
                    return <option key={f.fixture.id} value={label}>{date} · {label}</option>;
                  })}
                  <option value="other">Other (type below)</option>
                </select>
              </div>
              {form.event === 'other' && (
              <div className="md:col-span-2">
                <label className="eyebrow block mb-1">Custom match</label>
                <input onChange={(e) => setForm({ ...form, event: e.target.value })} className="input-base w-full" placeholder="e.g. Brazil vs Argentina" />
              </div>
              )}
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
              <button onClick={addBet} disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add Bet'}</button>
            </div>
          </div>
        )}
      </div>

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
