import { NextResponse } from 'next/server';
import { getStandings } from '@/lib/api-football';

export const revalidate = 0;

// Temporary debug endpoint to inspect the raw shape of the standings
// response from football-data.org. Remove once group tables are fixed.
export async function GET() {
  try {
    const standings = await getStandings();
    return NextResponse.json({
      count: standings.length,
      sample: standings.slice(0, 3),
      allTypes: standings.map((s: any) => ({ type: s.type, group: s.group, stage: s.stage, tableLength: s.table?.length })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
