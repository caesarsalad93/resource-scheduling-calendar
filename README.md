# Resource Scheduling Calendar

A read-only scheduling calendar for convention and expo events. Displays events in two grid views — panels-as-columns and rooms-as-columns — with day/district filtering, category-based color coding, and print-friendly output.

Data syncs from Airtable to PostgreSQL. No CRUD UI; all content is managed in Airtable.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Express.js, Drizzle ORM
- **Database:** PostgreSQL via Neon serverless (HTTP driver)
- **Deployment:** Vercel (static frontend + serverless API)

## Data Flow

```
Airtable → POST /api/sync/airtable → PostgreSQL → GET /api/events → Frontend
```

## Project Structure

```
shared/        Drizzle schema, Zod validation, shared types (Panel, Room, Event)
server/        Express API routes, storage layer, database config
client/        React SPA (Vite)
api/           Vercel serverless entry point
```

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Airtable base with "Panels", "Rooms", and "Events" tables

### Setup

```bash
npm install
cp .env.example .env  # then fill in your values
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AIRTABLE_PERSONAL_ACCESS_TOKEN` | For sync | Airtable personal access token |
| `AIRTABLE_BASE_ID` | For sync | Airtable base identifier |
| `PORT` | No | Server port (default: 3000) |

### Commands

```bash
npm run dev          # Start dev server (Express + Vite)
npm run build        # Build frontend + server bundle
npm run start        # Start production server
npm run check        # TypeScript type check
npm run db:push      # Push Drizzle schema to database
```

### Seed Data

Push the schema, then sync from Airtable:

```bash
npm run db:push
curl -X POST http://localhost:3000/api/sync/airtable
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/panels` | All panels |
| `GET` | `/api/rooms` | All rooms |
| `GET` | `/api/events` | All events (optional `?date=YYYY-MM-DD`, `?roomId=UUID`) |
| `POST` | `/api/sync/airtable` | Destructive sync — clears all data, reloads from Airtable |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel dashboard](https://vercel.com)
3. Set environment variables (`DATABASE_URL`, `AIRTABLE_PERSONAL_ACCESS_TOKEN`, `AIRTABLE_BASE_ID`)
4. Deploy
5. Seed data: `curl -X POST https://<your-app>.vercel.app/api/sync/airtable`

Local Vercel testing:

```bash
npx vercel dev
```

## Grid Modes

- **Panels view** — Panels as columns, events positioned by time slot (9 AM - 9 PM)
- **Rooms view** — Rooms as columns, events display their panel name. Filterable by district.

Filters persist in localStorage and URL query params (`?mode=panels&date=2025-07-24`).
