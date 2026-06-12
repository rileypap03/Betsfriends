import { NextResponse } from 'next/server';
import { getStandings, getTopScorers } from '@/lib/api-football';

export const revalidate = 0;

export async function GET() {
  try {
    const [standings, topScorers] = await Promise.all([
      getStandings().catch(() => []),
      getTopScorers().catch(() => []),
    ]);
    return NextResponse.json({ standings, topScorers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fetch failed' }, { status: 500 });
  }
}
