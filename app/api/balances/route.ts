import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TEAM, STARTING_STAKE, PlayerId } from '@/lib/types';

export const revalidate = 0;

// Balances are fully derived from bets — no manual override.
// balance = STARTING_STAKE
//           - stake of every bet that is 'open' or 'lost'
//           + (stake * odds) of every bet that is 'won'
// 'void' bets have no effect (stake never really at risk).
export async function GET() {
  try {
    const { data: bets, error } = await supabase().from('bets').select('player_id, stake, odds, status');
    if (error) throw error;

    const balances: Record<PlayerId, number> = {} as any;
    for (const t of TEAM) balances[t.id] = STARTING_STAKE;

    (bets || []).forEach((b: any) => {
      const pid = b.player_id as PlayerId;
      if (!(pid in balances)) return;
      const stake = Number(b.stake);
      const odds = Number(b.odds);
      if (b.status === 'open' || b.status === 'lost') {
        balances[pid] -= stake;
      } else if (b.status === 'won') {
        balances[pid] += stake * odds - stake;
      } else if (b.status === 'cashout') {
        // Cashout: stake was at risk but returned (with some profit).
        // Since we don't store the exact return amount, treat as stake refunded
        // (conservative; no net balance change). Improve if we add returns field.
      }
      // 'void' → no change
    });

    const result = TEAM.map((t) => ({
      player_id: t.id,
      balance: Math.round(balances[t.id] * 100) / 100,
      updated_at: new Date().toISOString(),
    }));

    return NextResponse.json({ balances: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
