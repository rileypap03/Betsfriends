import { NextResponse } from 'next/server';
import { getFixtures, getTeamRecentForm } from '@/lib/api-football';
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
      .slice(0, 4); // cap to avoid rate limits (10 req/min on football-data free tier)

    if (upcoming.length === 0) {
      const empty = { tips: [], generatedAt: new Date().toISOString(), message: 'No matches in the next 48 hours.' };
      await setCache(cacheKey, empty);
      return NextResponse.json(empty);
    }

    // Gather recent form for each team involved (sequential to respect rate limit)
    const matchSummaries: string[] = [];
    for (const f of upcoming) {
      const home = f.teams.home;
      const away = f.teams.away;
      const [homeForm, awayForm] = await Promise.all([
        getTeamRecentForm(home.id, 5).catch(() => []),
        getTeamRecentForm(away.id, 5).catch(() => []),
      ]);
      const date = new Date(f.fixture.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      matchSummaries.push(
        `${date} — ${home.name} vs ${away.name} (${f.league?.round || ''})\n` +
        `  ${home.name} recent form: ${formString(homeForm, home.name)}\n` +
        `  ${away.name} recent form: ${formString(awayForm, away.name)}`
      );
    }

    const prompt =
      `You are a betting analyst for a small friends' World Cup 2026 sweepstake group called BetsFriends. ` +
      `Based ONLY on the recent form data below (no odds data available), write 2-3 short, punchy daily tips ` +
      `for upcoming matches. Each tip should reference a specific match and form trend, and suggest what kind of ` +
      `bet might be interesting (e.g. "X to win", "Both teams to score", "Over 2.5 goals") with a brief reason. ` +
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
