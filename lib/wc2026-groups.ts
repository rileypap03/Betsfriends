// Official FIFA World Cup 2026 group draw (12 groups of 4 teams).
// football-data.org's free tier returns one combined 48-team standings
// table with `group: null` on every row, so we bucket teams into their
// real groups ourselves using this fixed roster (the draw is final).
//
// Keys are TLA (3-letter codes) where possible, falling back to team name
// matching since football-data.org's `team.name` / `team.shortName` can
// vary slightly (e.g. "Korea Republic" vs "South Korea").

export const WC2026_GROUPS: Record<string, string[]> = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

// Fallback name-based matching for cases where the TLA from
// football-data.org doesn't match the codes above exactly.
const NAME_OVERRIDES: Record<string, string> = {
  'south korea': 'KOR',
  'korea republic': 'KOR',
  'south africa': 'RSA',
  'czechia': 'CZE',
  'czech republic': 'CZE',
  'bosnia-herzegovina': 'BIH',
  'bosnia and herzegovina': 'BIH',
  'switzerland': 'SUI',
  'brazil': 'BRA',
  'morocco': 'MAR',
  'haiti': 'HAI',
  'scotland': 'SCO',
  'united states': 'USA',
  'usa': 'USA',
  'paraguay': 'PAR',
  'australia': 'AUS',
  'turkey': 'TUR',
  'türkiye': 'TUR',
  'turkiye': 'TUR',
  'germany': 'GER',
  'curaçao': 'CUW',
  'curacao': 'CUW',
  'ivory coast': 'CIV',
  "côte d'ivoire": 'CIV',
  'cote d\'ivoire': 'CIV',
  'ecuador': 'ECU',
  'netherlands': 'NED',
  'japan': 'JPN',
  'sweden': 'SWE',
  'tunisia': 'TUN',
  'belgium': 'BEL',
  'egypt': 'EGY',
  'iran': 'IRN',
  'new zealand': 'NZL',
  'spain': 'ESP',
  'cape verde': 'CPV',
  'cape verde islands': 'CPV',
  'saudi arabia': 'KSA',
  'uruguay': 'URU',
  'france': 'FRA',
  'senegal': 'SEN',
  'iraq': 'IRQ',
  'norway': 'NOR',
  'argentina': 'ARG',
  'algeria': 'ALG',
  'austria': 'AUT',
  'jordan': 'JOR',
  'portugal': 'POR',
  'dr congo': 'COD',
  'congo dr': 'COD',
  'democratic republic of the congo': 'COD',
  'uzbekistan': 'UZB',
  'colombia': 'COL',
  'england': 'ENG',
  'croatia': 'CRO',
  'ghana': 'GHA',
  'panama': 'PAN',
  'canada': 'CAN',
  'qatar': 'QAT',
  'mexico': 'MEX',
};

// Build a reverse lookup: TLA -> group letter
const TLA_TO_GROUP = new Map<string, string>();
for (const [letter, codes] of Object.entries(WC2026_GROUPS)) {
  for (const code of codes) TLA_TO_GROUP.set(code, letter);
}

export function groupForTeam(team: { tla?: string; name?: string; shortName?: string }): string | null {
  const tla = team.tla?.toUpperCase();
  if (tla && TLA_TO_GROUP.has(tla)) return TLA_TO_GROUP.get(tla)!;

  const tryNames = [team.name, team.shortName].filter(Boolean) as string[];
  for (const n of tryNames) {
    const code = NAME_OVERRIDES[n.toLowerCase().trim()];
    if (code && TLA_TO_GROUP.has(code)) return TLA_TO_GROUP.get(code)!;
  }
  return null;
}
