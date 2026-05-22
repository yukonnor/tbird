# tbird — Project Context for Claude

## What It Is

A birding app that helps eBird users find target species based on recent sightings, weather, tides, and AI recommendations. Built for personal use and friends.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Vercel (frontend) + Render (backend)

## What's Already Built

- User auth
- Target species list management (add, bulk import, region search)
- Target finder — shows where target species have been seen recently (eBird API)
- Hotspot results enrichment + hotspot ignore list
- 15-minute cache for eBird observation and hotspot API responses
- Weather integration — current conditions per hotspot (OpenWeather API, 1h cache)

## Roadmap

### 1. Weather Integration ✓ Done
- Remaining: factor weather into AI recommendations

### 2. Tide Integration
- Add NOAA Tides & Currents API
- Show tide levels for coastal hotspots
- Critical for shorebirds, waders, etc.
- Factor into time-of-day recommendations

### 3. AI Recommendations (Anthropic API)
- "Where to Go" feature with time-based suggestions
- Claude analyzes: recent sighting patterns by time of day, weather conditions, tide levels, historical patterns
- Example outputs:
  - "Best bet right now: Crissy Field (high tide, 3 targets seen this morning)"
  - "Tomorrow morning: Try Bolinas Lagoon (low tide at dawn, great for shorebirds)"

### 4. Deployment
- Deploy frontend to Vercel
- Deploy backend to Render
- Set up Supabase PostgreSQL
- Configure all environment variables

## Architecture

### Backend (`/backend/src/`)

**Routes** (`routes/`): `ebirdRoutes.js`, `targetRoutes.js`, `authRoutes.js`, `weatherRoutes.js` — all mounted under `/api/` in `index.js`.

**Services** (`services/`):
- `ebirdService.js` — eBird API client (axios). Pattern for all new API integrations: use the `cached(key, ttlMs, fetchFn)` utility (in-memory `Map`) to wrap every external call. TTLs: 15 min for observations/hotspots, 24h for taxonomy.
- `targetFinderService.js` — orchestrates the main feature: fetches targets from DB, calls eBird for regional observations + per-hotspot enrichment, ranks hotspots by target count then recency.
- `weatherService.js` — OpenWeather current conditions (`GET /api/weather?lat=&lng=`). 1h cache keyed to coords rounded to 2 decimal places (~1km) so nearby hotspots share entries. Returns: temp, feelsLike, description, windSpeed, windDeg, windGust, precipitation.
- `auth.js` — JWT middleware (7-day expiry), injects `req.user`.

**Database**: PostgreSQL via Supabase. Connection pool in `db/pool.js` using `DATABASE_URL` env var.

**Adding a new external API** (follow this pattern):
1. Create `services/<name>Service.js` — axios client + `cached()` wrapper + exported functions
2. Create `routes/<name>Routes.js` — thin route handlers calling the service
3. Register in `index.js`: `app.use('/api/<name>', <name>Router)`
4. Add key to `backend/.env.example`

### Frontend (`/frontend/src/`)

**Pages** (`pages/`): `FindTargetsPage.jsx` is the main feature — shows hotspot cards with target species and weather. Auto-loads weather for top 10 hotspots; "Load weather" button for the rest. Other pages: Login, Register, TargetLists, CreateTargetList, TargetListDetail, IgnoredHotspots, TestPage.

**API client** (`services/api.js`): Single axios instance pointed at `VITE_API_URL` (default `http://localhost:3001`). JWT token injected via request interceptor from localStorage. All backend calls go through wrapper functions here.

**Auth** (`context/AuthContext.jsx`): `useAuth()` hook for auth state, login/logout, token storage.

**Env vars**: Frontend uses `VITE_API_URL`. Backend uses `PORT`, `EBIRD_API_KEY`, `OPENWEATHER_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `JWT_SECRET`.

## Known Limitations

- eBird API returns 400 for atlas block locations — atlas checklists are a blind spot (see memory for details)
