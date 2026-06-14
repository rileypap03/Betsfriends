/**
 * Data layer — Football-Data.org v4 API client with Supabase-backed caching.
 *
 * Note: file name is historical (was originally API-Football). The functions
 * called by the rest of the app keep the same signatures, but they now hit
 * football-data.org and normalize responses into the shape the UI expects.
 *
 * Free tier: 10 req/min · covers FIFA World Cup (competition code "WC").
 */

import { supabase } from './supabase';

const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION_CODE = 'WC'; // FIFA World Cup
const SEASON = process.env.FOOTBALL_DATA_SEASON || '2026';

// Cache TTLs (ms)
const TTL = {
  fixtures: 60 * 60 * 1000,        // 1 hour
  match_details: 30 * 60 * 1000,   // 30 min
  team_form: 12 * 60 * 60 * 1000,  // 12 hours
  player_stats: 6 * 60 * 60 * 1000,
  standings: 60 * 60 * 1000,
};

interface CacheRow { data: any; fetched_at: string; }

async function getCache(key: string, maxAge: number): Promise<any | null> {
  if (maxAge <= 0) return null;
  const { data, error } = await supabase()
    .from('api_cache')
    .select('data, fetched_at')
    .eq('cache_key', key)
    .maybeSingle<CacheRow>();
  if (error || !data) return null;
  const age = Date.now() - new Date(data.fetched_at).getTime();
  if (age > maxAge) return null;
  return data.data;
}

async function setCache(key: string, value: any): Promise<void> {
  await supabase()
    .from('api_cache')
    .upsert({ cache_key: key, data: value, fetched_at: new Date().toISOString() }, { onConflict: 'cache_key' });
}

async function fetchFD(path: string): Promise<any> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_KEY not set');
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Token': key },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      throw new Error(`Football-Data rate limit reached (10 req/min on free tier). Wait a minute or extend cache TTLs.`);
    }
    if (res.status === 403) {
      throw new Error(`Football-Data 403: this resource isn't available on your plan. ${text.slice(0, 150)}`);
    }
    throw new Error(`Football-Data ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// =========================================================================
// NORMALIZERS — convert Football-Data.org shape to the API-Football-ish
// shape the UI components were originally written against.
// =========================================================================

function mapStatus(status: string, minute: number | null): { short: string; long: string; elapsed: number | null } {
  // Football-Data statuses: SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED,
  //                        POSTPONED, SUSPENDED, CANCELLED, AWARDED
  switch (status) {
    case 'IN_PLAY':
      return { short: minute && minute > 45 ? '2H' : '1H', long: 'Live', elapsed: minute };
    case 'PAUSED':
      return { short: 'HT', long: 'Half Time', elapsed: minute };
    case 'FINISHED':
      return { short: 'FT', long: 'Full Time', elapsed: 90 };
    case 'AWARDED':
      return { short: 'AWD', long: 'Awarded', elapsed: null };
    case 'POSTPONED':
      return { short: 'PST', long: 'Postponed', elapsed: null };
    case 'SUSPENDED':
      return { short: 'SUSP', long: 'Suspended', elapsed: null };
    case 'CANCELLED':
      return { short: 'CANC', long: 'Cancelled', elapsed: null };
    case 'SCHEDULED':
    case 'TIMED':
    default:
      return { short: 'NS', long: 'Scheduled', elapsed: null };
  }
}

function mapRound(stage: string | null, group: string | null): string {
  if (group && group.startsWith('GROUP_')) {
    return `Group ${group.replace('GROUP_', '')}`;
  }
  if (!stage) return '';
  // GROUP_STAGE, LAST_16, QUARTER_FINALS, SEMI_FINALS, FINAL, etc.
  return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeMatch(m: any): any {
  const status = mapStatus(m.status, m.minute ?? null);
  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      status,
      venue: { name: m.venue || '', city: m.area?.name || '' },
    },
    league: {
      round: mapRound(m.stage, m.group),
    },
    teams: {
      home: {
        id: m.homeTeam?.id,
        name: m.homeTeam?.name || m.homeTeam?.shortName || 'TBD',
        logo: m.homeTeam?.crest || '',
        winner: m.score?.winner === 'HOME_TEAM' ? true : m.score?.winner === 'AWAY_TEAM' ? false : null,
      },
      away: {
        id: m.awayTeam?.id,
        name: m.awayTeam?.name || m.awayTeam?.shortName || 'TBD',
        logo: m.awayTeam?.crest || '',
        winner: m.score?.winner === 'AWAY_TEAM' ? true : m.score?.winner === 'HOME_TEAM' ? false : null,
      },
    },
    goals: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
    score: {
      halftime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null },
      fulltime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
    },
  };
}

// =========================================================================
// PUBLIC API — same signatures as before, now backed by football-data.org
// =========================================================================

const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P'];

export async function getFixtures(): Promise<any[]> {
  const cacheKey = `fd:fixtures:${SEASON}`;
  const cached = await getCache(cacheKey, TTL.fixtures);
  if (cached) {
    const hasLive = (cached as any[]).some((m) => LIVE_STATUSES.includes(m?.fixture?.status?.short));
    if (!hasLive) return cached;
  }
  const json = await fetchFD(`/competitions/${COMPETITION_CODE}/matches?season=${SEASON}`);
  const matches = (json.matches || []).map(normalizeMatch);
  await setCache(cacheKey, matches);
  return matches;
}

export async function getFixture(id: number): Promise<any> {
  const cacheKey = `fd:fixture:${id}`;
  const cached = await getCache(cacheKey, TTL.match_details);
  if (cached) {
    const status = cached?.[0]?.fixture?.status?.short;
    const isLive = LIVE_STATUSES.includes(status);
    if (!isLive) return cached;
  }
  const json = await fetchFD(`/matches/${id}`);
  const normalized = [normalizeMatch(json)];
  await setCache(cacheKey, normalized);
  return normalized;
}

export async function getHeadToHead(homeId: number, awayId: number): Promise<any[]> {
  const cacheKey = `fd:h2h:${Math.min(homeId, awayId)}:${Math.max(homeId, awayId)}`;
  const cached = await getCache(cacheKey, TTL.team_form);
  if (cached) return cached;

  // Football-Data doesn't have a dedicated H2H endpoint on the free tier.
  // Approach: fetch home team's finished matches and filter to those vs the away team.
  try {
    const json = await fetchFD(`/teams/${homeId}/matches?status=FINISHED&limit=100`);
    const filtered = (json.matches || [])
      .filter((m: any) => m.homeTeam?.id === awayId || m.awayTeam?.id === awayId)
      .slice(0, 10)
      .map(normalizeMatch);
    await setCache(cacheKey, filtered);
    return filtered;
  } catch (e) {
    await setCache(cacheKey, []);
    return [];
  }
}

export async function getTeamRecentForm(teamId: number, last = 5): Promise<any[]> {
  const cacheKey = `fd:form:${teamId}:${last}`;
  const cached = await getCache(cacheKey, TTL.team_form);
  if (cached) return cached;
  try {
    const json = await fetchFD(`/teams/${teamId}/matches?status=FINISHED&limit=${last}`);
    const matches = (json.matches || []).slice(0, last).map(normalizeMatch);
    await setCache(cacheKey, matches);
    return matches;
  } catch (e) {
    await setCache(cacheKey, []);
    return [];
  }
}

export async function getMatchLineups(_fixtureId: number): Promise<any[]> {
  // Football-Data.org doesn't expose lineups on the free tier in a usable shape.
  return [];
}

export async function getMatchPlayerStats(_fixtureId: number): Promise<any[]> {
  // Per-match player stats (tackles, pass %, ratings) aren't available on
  // football-data.org at any tier. Return empty so the UI shows its empty state.
  return [];
}

export async function getTopScorers(): Promise<any[]> {
  const cacheKey = `fd:topscorers:${SEASON}`;
  const cached = await getCache(cacheKey, TTL.player_stats);
  if (cached) return cached;
  try {
    const json = await fetchFD(`/competitions/${COMPETITION_CODE}/scorers?season=${SEASON}&limit=20`);
    const data = json.scorers || [];
    await setCache(cacheKey, data);
    return data;
  } catch (e) {
    return [];
  }
}

export async function getStandings(): Promise<any[]> {
  const cacheKey = `fd:standings:${SEASON}`;
  const cached = await getCache(cacheKey, TTL.standings);
  if (cached) return cached;
  try {
    const json = await fetchFD(`/competitions/${COMPETITION_CODE}/standings?season=${SEASON}`);
    const data = json.standings || [];
    await setCache(cacheKey, data);
    return data;
  } catch (e) {
    return [];
  }
}

export async function getTeamSquad(teamId: number): Promise<any[]> {
  const cacheKey = `fd:squad:${teamId}`;
  const cached = await getCache(cacheKey, TTL.team_form);
  if (cached) return cached;
  try {
    const json = await fetchFD(`/teams/${teamId}`);
    const squad = json.squad || [];
    await setCache(cacheKey, squad);
    return squad;
  } catch (e) {
    return [];
  }
}
