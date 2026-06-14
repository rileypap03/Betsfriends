import { NextResponse } from 'next/server';
import { getTeamSquad, getTeamRecentForm, getTopScorers } from '@/lib/api-football';

export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const [squad, form, topScorers] = await Promise.all([
      getTeamSquad(id).catch(() => []),
      getTeamRecentForm(id, 5).catch(() => []),
      getTopScorers().catch(() => []),
    ]);

    // Filter top scorers to just this team's players
    const teamScorers = (topScorers || []).filter((s: any) => s.team?.id === id);

    return NextResponse.json({ squad, form, topScorers: teamScorers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fetch failed' }, { status: 500 });
  }
}
