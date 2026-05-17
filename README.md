# UK Petitions · Live Dashboard

Live signature stats for a single UK Parliament petition, optimised for full-screen 16:9 displays (kiosk / TV / office dashboard) and responsive on mobile. Auto-refreshes every 60 seconds.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + React 19
- Tailwind CSS v4 (CSS-first config)
- shadcn/ui (CLI v4)
- UK Parliament Petitions JSON API (`petition.parliament.uk`)

## Running it

This project assumes you do not have Node.js on the host. Everything runs in Docker.

```
docker compose up
```

Then open <http://localhost:3000>.

See [CLAUDE.md](CLAUDE.md) for the full Docker workflow, architecture notes, and design intent.
