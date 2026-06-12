export type PlayerId = 'fitz' | 'miller' | 'roberto' | 'riley';

export interface TeamMember {
  id: PlayerId;
  name: string;
  country: 'IRL' | 'ENG';
  color: string;
  accent: string;
  avatar: string;
}

export const TEAM: TeamMember[] = [
  { id: 'fitz', name: 'Fitz', country: 'IRL', color: '#169B62', accent: '#1FB876', avatar: '/avatars/fitz.jpg' },
  { id: 'miller', name: 'Miller', country: 'IRL', color: '#C25A1F', accent: '#FF883E', avatar: '/avatars/miller.jpg' },
  { id: 'roberto', name: 'Roberto', country: 'ENG', color: '#CE1124', accent: '#E63946', avatar: '/avatars/roberto.jpg' },
  { id: 'riley', name: 'Riley', country: 'ENG', color: '#7A0F1E', accent: '#B91C2C', avatar: '/avatars/riley.jpg' },
];

export const STARTING_STAKE = 100;

export interface Bet {
  id: string;
  player_id: PlayerId;
  fixture_id?: number;
  event: string;
  selection: string;
  stake: number;
  odds: number;
  status: 'open' | 'won' | 'lost' | 'void';
  screenshot_url?: string;
  created_at: string;
}

export interface BalanceRow {
  player_id: PlayerId;
  balance: number;
  updated_at: string;
}

// API-Football response shapes (partial — only what we use)
export interface AFFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed: number | null };
    venue: { name: string; city: string };
  };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

export interface AFTeamForm {
  fixture_id: number;
  date: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  home_away: 'H' | 'A';
}

export interface AFPlayerStats {
  player: { id: number; name: string; photo: string };
  statistics: {
    games: { appearances: number | null; minutes: number | null; position: string | null; rating: string | null };
    goals: { total: number | null; assists: number | null };
    shots: { total: number | null; on: number | null };
    passes: { total: number | null; key: number | null; accuracy: string | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    cards: { yellow: number | null; red: number | null };
  }[];
}
