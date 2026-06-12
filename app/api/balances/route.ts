import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET() {
  try {
    const [balRes, histRes] = await Promise.all([
      supabase().from('balances').select('*'),
      supabase().from('balance_history').select('*').order('recorded_at', { ascending: true }),
    ]);
    if (balRes.error) throw balRes.error;
    if (histRes.error) throw histRes.error;
    return NextResponse.json({ balances: balRes.data, history: histRes.data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { player_id, balance } = await req.json();
    if (!['fitz','miller','roberto','riley'].includes(player_id)) {
      return NextResponse.json({ error: 'Invalid player_id' }, { status: 400 });
    }
    const b = parseFloat(balance);
    if (isNaN(b) || b < 0) return NextResponse.json({ error: 'Invalid balance' }, { status: 400 });

    const now = new Date().toISOString();
    const [upd, hist] = await Promise.all([
      supabase().from('balances').upsert({ player_id, balance: b, updated_at: now }),
      supabase().from('balance_history').insert({ player_id, balance: b, recorded_at: now }),
    ]);
    if (upd.error) throw upd.error;
    if (hist.error) throw hist.error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
