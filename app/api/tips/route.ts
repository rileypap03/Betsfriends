import { NextResponse } from 'next/server';
import { getFixtures, getTeamRecentForm, getStandings, getHeadToHead } from '@/lib/api-football';
import { groupForTeam } from '@/lib/wc2026-groups';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

const CACHE_KEY_PREFIX = 'daily-tips:';
const TTL = 12 * 60 * 60 * 1000; // 12 hours

interface CacheRow { data: any; fetched_at: string; }

async function getCache(key: string): Promise<any | null> {
  const { data, error } = await supabase()
    .from('api_cache')
    .select('data, fetched_at')
    .eq('cache_key', key)
    .maybeSingle<CacheRow>();
  if (error || !data) return null;
  const age = Date.now() - new Date(data.fetched_at).getTime();
  if (age > TTL) return null;
  return data.data;
}

async function setCache(key: string, value: any): Promise<void> {
  await supabase()
    .from('api_cache')
    .upsert({ cache_key: key, data: value, fetched_at: new Date().toISOString() }, { onConflict: 'cache_key' });
}

function formString(games: any[], teamName: string): string {
  if (!games || games.length === 0) return 'no recent form data';
  return games
    .slice(0, 5)
    .map((g) => {
      const isHome = g.teams.home.name === teamName;
      const us = isHome ? g.goals.home : g.goals.away;
      const them = isHome ? g.goals.away : g.goals.home;
      if (us === null || them === null) return null;
      const opp = isHome ? g.teams.away.name : g.teams.home.name;
      const result = us > them ? 'W' : us < them ? 'L' : 'D';
      return `${result} ${us}-${them} vs ${opp}`;
    })
    .filter(Boolean)
    .join(', ') || 'no recent form data';
}

function h2hString(games: any[], homeName: string, awayName: string): string {
  if (!games || games.length === 0) return 'no recent head-to-head meetings on record';
  return games
    .slice(0, 3)
    .map((g) => {
      const home = g.teams.home.name;
      const away = g.teams.away.name;
      const hg = g.goals.home;
      const ag = g.goals.away;
      if (hg === null || ag === null) return null;
      return `${home} ${hg}-${ag} ${away}`;
    })
    .filter(Boolean)
    .join(', ') || 'no recent head-to-head meetings on record';
}

// Build a quick lookup of group standings rows by team id, using the
// official WC2026 group rosters to bucket the combined 48-team table
// (see lib/wc2026-groups.ts for why this bucketing is needed).
function buildStandingsLookup(standings: any[]): Map<number, any> {
  const lookup = new Map<number, any>();
  const totals = (standings || []).filter((s: any) => s.type === 'TOTAL');
  const allRows: any[] = totals.flatMap((s: any) => s.table || []);
  for (const row of allRows) {
    if (row.team?.id) lookup.set(row.team.id, row);
  }
  return lookup;
}

function standingsString(row: any, teamName: string): string {
  if (!row) return 'no group standings data';
  const group = groupForTeam(row.team || {});
  const groupLabel = group ? `Group ${group}` : 'group';
  return `${groupLabel} — ${row.position ?? '?'}${ordinal(row.position)} place, ${row.points ?? 0} pts from ${row.playedGames ?? 0} games (GD ${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference ?? 0})`;
}

function ordinal(n?: number): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${CACHE_KEY_PREFIX}${today}`;
    const cached = await getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

    const fixtures = await getFixtures();

    // Fixtures kicking off in the next 48 hours that haven't started yet
    const now = Date.now();
    const windowEnd = now + 48 * 60 * 60 * 1000;
    const upcoming = fixtures
      .filter((f: any) => {
        const t = new Date(f.fixture.date).getTime();
        return f.fixture.status.short === 'NS' && t >= now && t <= windowEnd;
      })
      .sort((a: any, b: any) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
      .slice(0, 3); // cap to avoid rate limits (10 req/min on football-data free tier)

    if (upcoming.length === 0) {
      const empty = { tips: [], generatedAt: new Date().toISOString(), message: 'No matches in the next 48 hours.' };
      await setCache(cacheKey, empty);
      return NextResponse.json(empty);
    }

    // One shared standings call for group-position context on every match
    const standings = await getStandings().catch(() => []);
    const standingsLookup = buildStandingsLookup(standings);

    // Gather recent form (+ H2H for the soonest 2 matches) — sequential to respect rate limit
    const matchSummaries: string[] = [];
    for (const [i, f] of upcoming.entries()) {
      const home = f.teams.home;
      const away = f.teams.away;
      const [homeForm, awayForm, h2h] = await Promise.all([
        getTeamRecentForm(home.id, 5).catch(() => []),
        getTeamRecentForm(away.id, 5).catch(() => []),
        i < 2 ? getHeadToHead(home.id, away.id).catch(() => []) : Promise.resolve([]),
      ]);
      const date = new Date(f.fixture.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const lines = [
        `${date} — ${home.name} vs ${away.name} (${f.league?.round || ''})`,
        `  ${home.name} recent form: ${formString(homeForm, home.name)}`,
        `  ${away.name} recent form: ${formString(awayForm, away.name)}`,
        `  ${home.name} standings: ${standingsString(standingsLookup.get(home.id), home.name)}`,
        `  ${away.name} standings: ${standingsString(standingsLookup.get(away.id), away.name)}`,
      ];
      if (i < 2) {
        lines.push(`  Head-to-head (most recent first): ${h2hString(h2h, home.name, away.name)}`);
      }
      matchSummaries.push(lines.join('\n'));
    }

    const prompt =
      `You are a betting analyst for a small friends' World Cup 2026 sweepstake group called BetsFriends. ` +
      `Based ONLY on the data below (recent form, group standings, and head-to-head history — no odds data available), ` +
      `write 2-3 short, punchy daily tips for upcoming matches. Each tip should reference a specific match and a concrete ` +
      `trend from the data (form, standings pressure, or head-to-head pattern), and suggest what kind of ` +
      `bet might be interesting (e.g. "X to win", "Both teams to score", "Over 2.5 goals", "Draw no bet") with a brief reason. ` +
      `Keep each tip to 1-2 sentences, casual tone suitable for a group chat. Do not invent odds or stats not given. ` +
      `Include a short disclaimer-free caveat that this is just for fun, not professional advice — but keep it brief.\n\n` +
      `Upcoming matches:\n${matchSummaries.join('\n\n')}\n\n` +
      `Return ONLY a JSON array of objects, no markdown, no preamble: [{"match": "Team A vs Team B", "tip": "..."}]`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return NextResponse.json({ error: `Claude API error (${res.status}): ${errBody.slice(0, 300)}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.content?.find((c: any) => c.type === 'text')?.text || '';
    let cleaned = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let tips: any[] = [];
    try {
      tips = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: `Could not parse tips response: ${cleaned.slice(0, 300)}` }, { status: 500 });
    }

    const result = { tips, generatedAt: new Date().toISOString() };
    await setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
