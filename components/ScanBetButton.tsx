'use client';

import { useState } from 'react';
import { PlayerId } from '@/lib/types';
import { Camera } from 'lucide-react';

type BetStatus = 'open' | 'won' | 'lost' | 'cashout';

interface ScannedBet {
  event: string | null;
  selection: string | null;
  stake: number | null;
  odds: number | null;
  status: BetStatus;
  returns: number | null;
  bet_type?: string;
  legs?: string[];
}

const STATUS_META: Record<BetStatus, { label: string; color: string; bg: string }> = {
  open:    { label: 'Open',      color: '#9A9A9A',            bg: 'rgba(154,154,154,0.08)' },
  won:     { label: '✓ Won',     color: 'var(--green-bright)', bg: 'rgba(0,199,117,0.10)' },
  lost:    { label: '✗ Lost',    color: 'var(--red-bright)',   bg: 'rgba(255,77,109,0.10)' },
  cashout: { label: '⚡ Cashed Out', color: 'var(--gold-bright)', bg: 'rgba(201,168,76,0.10)' },
};

export default function ScanBetButton({ playerId, onAdded }: { playerId: PlayerId; onAdded?: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scannedBet, setScannedBet] = useState<ScannedBet | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleScreenshot(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true); setScanError(''); setScannedBet(null);
    const reader = new FileReader();
    reader.onload = async (ev: any) => {
      try {
        const res = await fetch('/api/read-bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: ev.target.result }),
        });
        const j = await res.json();
        if (j.error) { setScanError(j.error); setScanning(false); return; }
        const b = j.bet;
        const event = b.bet_type === 'acca' && b.legs?.length ? 'Accumulator' : (b.event || '');
        const selection = b.bet_type === 'acca' && b.legs?.length ? b.legs.join(' + ') : (b.selection || '');
        const validStatuses: BetStatus[] = ['open', 'won', 'lost', 'cashout'];
        const status: BetStatus = validStatuses.includes(b.status) ? b.status : 'open';
        setScannedBet({
          event, selection,
          stake: b.stake ?? null,
          odds: b.odds ?? null,
          status,
          returns: b.returns ?? null,
          bet_type: b.bet_type,
          legs: b.legs,
        });
      } catch { setScanError('Could not read screenshot.'); }
      setScanning(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function confirm() {
    if (!scannedBet) return;
    if (!scannedBet.event || !scannedBet.selection || !scannedBet.stake || !scannedBet.odds) {
      setScanError('Missing some details — try scanning again with a clearer screenshot.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        event: scannedBet.event,
        selection: scannedBet.selection,
        stake: scannedBet.stake,
        odds: scannedBet.odds,
        status: scannedBet.status,
      }),
    });
    if (res.ok) {
      setScannedBet(null);
      onAdded?.();
    } else {
      const j = await res.json();
      setScanError(j.error || 'Failed to add bet');
    }
    setSubmitting(false);
  }

  function discard() {
    setScannedBet(null);
    setScanError('');
  }

  const meta = scannedBet ? STATUS_META[scannedBet.status] : null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {!scannedBet && !scanning && (
        <label className="cursor-pointer btn-primary !text-sm !px-4 !py-2.5 inline-flex items-center gap-2 w-full justify-center" onClick={(e) => e.stopPropagation()}>
          <Camera size={18} strokeWidth={2} fill="rgba(10,10,10,0.15)" />
          Scan bet
          <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} onClick={(e) => e.stopPropagation()} />
        </label>
      )}

      {scanning && <div className="text-xs text-text-muted animate-pulse mt-1">Reading screenshot…</div>}

      {scanError && (
        <div className="text-xs p-2 rounded mt-1" style={{ color: 'var(--red-bright)', background: 'rgba(228,0,43,0.06)' }}>
          {scanError}
        </div>
      )}

      {scannedBet && meta && (
        <div className="card p-3 mt-2 space-y-2" style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.3)' }} onClick={(e) => e.stopPropagation()}>

          {/* Status badge */}
          <div className="flex items-center justify-between">
            <div className="eyebrow">Scanned bet — confirm</div>
            <div
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ color: meta.color, background: meta.bg }}
            >
              {meta.label}
            </div>
          </div>

          <div className="font-semibold text-sm break-words">{scannedBet.event}</div>
          <div className="text-xs text-text-muted break-words whitespace-pre-wrap">{scannedBet.selection}</div>

          <div className="flex gap-4">
            <div>
              <div className="text-[10px] eyebrow">Stake</div>
              <div className="font-display">£{scannedBet.stake?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div className="text-[10px] eyebrow">Odds</div>
              <div className="font-display">{scannedBet.odds?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div className="text-[10px] eyebrow">
                {scannedBet.status === 'open' ? 'Potential' : scannedBet.status === 'won' ? 'Returned' : scannedBet.status === 'cashout' ? 'Cash Out' : 'Stake Lost'}
              </div>
              <div className="font-display" style={{ color: meta.color }}>
                {scannedBet.status === 'lost'
                  ? `−£${scannedBet.stake?.toFixed(2) ?? '—'}`
                  : scannedBet.returns != null
                  ? `£${scannedBet.returns.toFixed(2)}`
                  : scannedBet.stake && scannedBet.odds
                  ? `£${(scannedBet.stake * scannedBet.odds).toFixed(2)}`
                  : '—'}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={confirm} disabled={submitting} className="btn-primary flex-1 !text-sm !py-2.5">
              {submitting ? 'Adding...' : scannedBet.status === 'open' ? '✓ Confirm & Add' : `✓ Add as ${meta.label}`}
            </button>
            <button onClick={discard} className="btn-secondary !text-xs">Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}
