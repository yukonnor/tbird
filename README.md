# tbird

A birding application that helps eBird users find target species based on recent sightings, weather, tides, and AI recommendations.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Vercel (frontend) + Render (backend)

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies (root, frontend, and backend)
npm install
npm run install:all
```

### Environment Variables

Copy the example files and fill in your keys:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run individually
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3001
```

### API Health Check

```
GET http://localhost:3001/api/health
```

## Project Structure

```
tbird/
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
├── backend/           # Express API server
│   └── src/
│       ├── routes/
│       ├── services/
│       └── middleware/
└── package.json       # Root scripts (dev, install:all)
```
