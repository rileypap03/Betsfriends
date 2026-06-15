'use client';

import { useState } from 'react';
import { PlayerId } from '@/lib/types';
import { Camera } from 'lucide-react';

interface ScannedBet {
  event: string | null;
  selection: string | null;
  stake: number | null;
  odds: number | null;
  bet_type?: string;
  legs?: string[];
}

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
        const res = await fetch('/api/read-bet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: ev.target.result }) });
        const j = await res.json();
        if (j.error) { setScanError(j.error); setScanning(false); return; }
        const b = j.bet;
        const event = b.bet_type === 'acca' && b.legs?.length ? 'Accumulator' : (b.event || '');
        const selection = b.bet_type === 'acca' && b.legs?.length ? b.legs.join(' + ') : (b.selection || '');
        setScannedBet({ event, selection, stake: b.stake ?? null, odds: b.odds ?? null, bet_type: b.bet_type, legs: b.legs });
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

      {scannedBet && (
        <div className="card p-3 mt-2 space-y-2" style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.3)' }} onClick={(e) => e.stopPropagation()}>
          <div className="eyebrow">Scanned bet — confirm</div>
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
              <div className="text-[10px] eyebrow">Potential</div>
              <div className="font-display" style={{ color: 'var(--gold-bright)' }}>
                £{scannedBet.stake && scannedBet.odds ? (scannedBet.stake * scannedBet.odds).toFixed(2) : '—'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={confirm} disabled={submitting} className="btn-primary flex-1 !text-sm !py-2.5">
              {submitting ? 'Adding...' : '✓ Confirm & Add'}
            </button>
            <button onClick={discard} className="btn-secondary !text-xs">Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}
