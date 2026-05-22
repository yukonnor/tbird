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

## Roadmap

### 1. Weather Integration
- Add OpenWeather API (or similar)
- Show current weather at each hotspot
- Factor weather into recommendations (temp, wind, precipitation)

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

## Known Limitations

- eBird API returns 400 for atlas block locations — atlas checklists are a blind spot (see memory for details)
