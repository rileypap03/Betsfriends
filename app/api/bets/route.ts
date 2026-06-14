import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('bets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ bets: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { player_id, fixture_id, event, selection, stake, odds, screenshot_url } = body;

    if (!['fitz','miller','roberto','riley'].includes(player_id)) {
      return NextResponse.json({ error: 'Invalid player_id' }, { status: 400 });
    }
    if (!event || !selection) return NextResponse.json({ error: 'event and selection required' }, { status: 400 });
    const s = parseFloat(stake);
    const o = parseFloat(odds);
    if (isNaN(s) || s <= 0) return NextResponse.json({ error: 'Invalid stake' }, { status: 400 });
    if (isNaN(o) || o < 1.01) return NextResponse.json({ error: 'Invalid odds' }, { status: 400 });

    const { data, error } = await supabase()
      .from('bets')
      .insert({
        player_id,
        fixture_id: fixture_id || null,
        event: String(event).slice(0, 200),
        selection: String(selection).slice(0, 500),
        stake: s,
        odds: o,
        screenshot_url: screenshot_url || null,
        status: 'open',
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ bet: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !['open', 'won', 'lost', 'void'].includes(status)) {
      return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
    }
    const settled_at = status === 'open' ? null : new Date().toISOString();
    const { data, error } = await supabase()
      .from('bets')
      .update({ status, settled_at })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ bet: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase().from('bets').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
