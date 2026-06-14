'use client';

import { TEAM, PlayerId } from '@/lib/types';

export interface Bet {
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

export function groupBetsByDay(bets: Bet[]): { dateKey: string; label: string; items: Bet[] }[] {
  const groups = new Map<string, Bet[]>();
  for (const bet of bets) {
    const d = new Date(bet.created_at);
    const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(bet);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // most recent day first
    .map(([dateKey, items]) => {
      let label: string;
      if (dateKey === today) label = 'Today';
      else if (dateKey === yesterday) label = 'Yesterday';
      else label = new Date(dateKey).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' });
      return { dateKey, label, items };
    });
}

interface BetCardProps {
  bet: Bet;
  isConflict?: boolean;
  showPlayer?: boolean;
  onSetStatus?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export function BetCard({ bet, isConflict, showPlayer = true, onSetStatus, onDelete }: BetCardProps) {
  const player = TEAM.find((t) => t.id === bet.player_id)!;
  const stake = Number(bet.stake);
  const odds = Number(bet.odds);
  const potential = stake * odds;
  const profit = potential - stake;
  const editable = !!(onSetStatus || onDelete);

  return (
    <div
      className={`card p-3 text-sm ${bet.status === 'lost' ? 'opacity-70' : ''} ${bet.status === 'void' ? 'opacity-50' : ''}`}
      style={{
        borderColor: isConflict ? 'rgba(228,0,43,0.5)' : undefined,
        background: isConflict ? 'rgba(228,0,43,0.05)' : undefined,
        borderLeftWidth: bet.status === 'won' ? 3 : bet.status === 'lost' ? 3 : undefined,
        borderLeftColor: bet.status === 'won' ? 'var(--green-bright)' : bet.status === 'lost' ? 'var(--red-bright)' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {showPlayer && (
          <div
            className="w-7 h-7 rounded bg-cover bg-center shrink-0"
            style={{ backgroundImage: `url(${player.avatar})`, backgroundColor: player.color }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold break-words">{bet.event}</div>
          <div className="text-xs text-text-muted mt-0.5 break-words whitespace-pre-wrap">
            {showPlayer ? `${player.name} · ` : ''}{bet.selection}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/5">
        <div className="flex gap-4">
          <div>
            <div className="text-[10px] eyebrow">Stake</div>
            <div className="font-display">£{stake.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] eyebrow">Odds</div>
            <div className="font-display">{odds.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] eyebrow">{bet.status === 'open' ? 'Potential' : bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : '—'}</div>
            <div className="font-display" style={{ color: bet.status === 'won' ? 'var(--green-bright)' : bet.status === 'lost' ? 'var(--red-bright)' : 'var(--gold-bright)' }}>
              {bet.status === 'lost' ? `−£${stake.toFixed(2)}` : bet.status === 'won' ? `+£${profit.toFixed(2)}` : bet.status === 'void' ? 'VOID' : `£${potential.toFixed(2)}`}
            </div>
          </div>
        </div>
        {editable && (
          <div className="flex gap-1 shrink-0">
            {bet.status === 'open' ? (
              <>
                <button onClick={() => onSetStatus?.(bet.id, 'won')} className="btn-secondary !px-2 !py-1 !text-[10px]">W</button>
                <button onClick={() => onSetStatus?.(bet.id, 'lost')} className="btn-secondary !px-2 !py-1 !text-[10px]">L</button>
                <button onClick={() => onSetStatus?.(bet.id, 'void')} className="btn-secondary !px-2 !py-1 !text-[10px]">V</button>
              </>
            ) : (
              <button onClick={() => onSetStatus?.(bet.id, 'open')} className="btn-secondary !px-2 !py-1 !text-[10px]">Reopen</button>
            )}
            <button onClick={() => onDelete?.(bet.id)} className="btn-secondary !px-2 !py-1 !text-[10px]">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
