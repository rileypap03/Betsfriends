# DUXTOMER · World Cup 26

A shared, installable web app for the DUXTOMER team's World Cup 26 sweepstakes. Tracks balances, logs bets with conflict detection, and pulls live fixtures, form, head-to-head, and player stats from API-Football.

Installs to home screen like a real app on iOS and Android. Custom splash screens per device.

Stack: **Next.js 14** (App Router, TypeScript) · **Supabase** (Postgres + cache) · **Vercel** (hosting) · **API-Football** (data) · **Tailwind** · **PWA**.

---

## What's in v1

- 🏠 **Installable to home screen** with custom DUXTOMER icon and per-device splash screens
- 🎬 Animated in-app splash on launch (team photo, WORLD CUP 26 callout, fade in/out)
- 🔐 Shared-password gate (cookie auth, no per-user signup)
- 🏆 Live leaderboard for Fitz / Miller / Roberto / Riley with editable balances
- 📋 Shared bet log with **automatic conflict detection** (warns when two of you bet opposite sides of the same market — pure margin loss)
- 📅 World Cup fixtures (upcoming / live / finished filter)
- ⚽ Match detail with last-5 form, head-to-head, player stats (goals, assists, shots, tackles, pass %, rating)
- 💾 Server-side caching of all API-Football responses (stays under the 100 req/day free tier)

---

## How the team installs the app on their phone

After you've deployed (see below), share the URL with the team. They open it in their phone browser, then:

**iPhone (Safari)**
1. Open the URL in Safari (must be Safari, not Chrome on iOS)
2. Tap the Share button (square with up arrow) at the bottom
3. Scroll down, tap **"Add to Home Screen"**
4. Tap **"Add"** — the DUXTOMER icon appears on the home screen
5. Launching it shows the custom splash screen, then opens full-screen with no Safari chrome

**Android (Chrome)**
1. Open the URL in Chrome
2. An "Install app" prompt may appear at the bottom — tap it
3. Or: tap the ⋮ menu → **"Add to Home screen"** / **"Install app"**
4. Confirm — DUXTOMER appears as an app

The app shows a one-time install hint on first visit (with platform-specific instructions) which they can dismiss.

---

## Setup (≈ 30 minutes)

### 1. Get the credentials

**a) Supabase project (free)**
1. Go to [supabase.com](https://supabase.com), create a new project
2. **Settings → API**, copy `Project URL` and `service_role` key

**b) API-Football key (free tier = 100 req/day)**
1. Sign up at [api-football.com](https://www.api-football.com/) — free plan
2. Copy your API key

**c) Vercel account (free)**
- Sign up at [vercel.com](https://vercel.com)

### 2. Create the database

1. In Supabase: **SQL Editor → New query**
2. Paste contents of `supabase/schema.sql`, click **Run**

### 3. Local dev (optional)

```bash
npm install
cp .env.local.example .env.local
# Fill in env vars
npm run dev
```

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Vercel → **Add New → Project → Import** your repo
3. Add **Environment Variables**:
   - `TEAM_PASSWORD` — shared team password
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `API_FOOTBALL_KEY`
   - `API_FOOTBALL_LEAGUE` = `1`
   - `API_FOOTBALL_SEASON` = `2026`
4. Deploy → get your `*.vercel.app` URL
5. Share URL + password with the team. They open it on their phone and install via the steps above.

### 5. Custom domain (optional, recommended)

Vercel projects → Settings → Domains. Add a domain like `duxtomer.app` or `wc26.duxtomer.com`. Vercel handles SSL automatically. PWAs **require HTTPS** to be installable — Vercel's default `*.vercel.app` URLs already have it, so this is purely cosmetic.

---

## PWA assets

All in `public/`:
- `icons/` — app icons at 16/32/48/72/96/128/144/152/180/192/384/512 + maskable + Apple touch icon
- `splash/` — iOS startup images for iPhone Pro Max, Pro, Plus, standard, mini, SE, iPad Pro, iPad
- `splash-poster.jpg` — 1080×1920 used by the in-app splash component
- `duxtomer-team.png` — group photo used on the splash screen
- `avatars/` — individual portraits used in leaderboard and bet log

To regenerate any of these, edit `generate_pwa_assets.py` (in the repo root) and re-run it.

---

## API budget

100 req/day with our caching = comfortable for 4 users. Cache TTLs:
- Upcoming fixtures: 1hr
- Match details: 30 min
- Team form / H2H: 12 hr
- Player stats: 6 hr

To force a refresh: `delete from api_cache where cache_key like 'something%';` in Supabase SQL editor.

---

## Architecture notes

- **Auth**: middleware checks `wc26_auth` cookie; `/api/login` verifies password.
- **No realtime**: data refreshes on page load. To auto-refresh during live matches, add a `setInterval` to the match page (60s poll).
- **No service worker**: the app works offline-first on Vercel's edge cache but doesn't have an explicit SW. If you want true offline support, add `next-pwa` to the build.

---

## Extending it

| Feature | Where |
|---|---|
| Top scorers page | `getTopScorers()` in `lib/api-football.ts` ready to use |
| Group standings | `getStandings()` ready |
| Per-player profile pages | Add `getPlayer(id)` to `lib/api-football.ts` |
| Live auto-refresh during matches | `setInterval` in `app/match/[id]/page.tsx` |
| Screenshot uploads on bets | Add to bet form, base64 in `bets.screenshot_url` (or Supabase Storage for big files) |
| Push notifications before kickoff | Wire up `web-push` + Supabase scheduled function |

---

## Troubleshooting

**Splash screen doesn't appear on iOS install**
Must install from Safari, not Chrome on iOS. Other browsers don't support PWAs there.

**Icon looks blurry on home screen**
Clear the site data in your browser, re-add to home screen — iOS aggressively caches icons.

**"API-Football rate limit reached"**
Check `select count(*) from api_cache;` — if it's near-empty, the cache isn't writing. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel.

**Cookie loop on localhost**
The `wc26_auth` cookie's `secure` flag is off in dev. If it still loops, hard-refresh the browser.
