import { NextResponse } from 'next/server';
import { getFixture, getHeadToHead, getTeamRecentForm, getMatchLineups, getMatchPlayerStats } from '@/lib/api-football';

export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const fixtureArr = await getFixture(id);
    const fixture = fixtureArr?.[0];
    if (!fixture) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });

    const homeId = fixture.teams.home.id;
    const awayId = fixture.teams.away.id;

    // Parallel fetches (each is cached)
    const [h2h, homeForm, awayForm] = await Promise.all([
      getHeadToHead(homeId, awayId).catch(() => []),
      getTeamRecentForm(homeId, 5).catch(() => []),
      getTeamRecentForm(awayId, 5).catch(() => []),
    ]);

    // Lineups & player stats only if match has started
    const status = fixture.fixture.status.short;
    const isStartedOrFinished = !['NS','TBD','PST','CANC','SUSP','AWD','WO'].includes(status);
    let lineups: any[] = [];
    let playerStats: any[] = [];
    if (isStartedOrFinished) {
      [lineups, playerStats] = await Promise.all([
        getMatchLineups(id).catch(() => []),
        getMatchPlayerStats(id).catch(() => []),
      ]);
    }

    return NextResponse.json({ fixture, h2h, homeForm, awayForm, lineups, playerStats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fetch failed' }, { status: 500 });
  }
}
