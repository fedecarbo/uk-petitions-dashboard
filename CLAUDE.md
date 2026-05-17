@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A web app that displays live statistics for a **single UK Parliament petition**, optimised for full-screen 16:9 displays (kiosk, TV, office dashboard) and responsive on mobile.

Flow: land on a minimalist search → enter a petition ID or paste a `petition.parliament.uk` URL → land on the dashboard which auto-refreshes every 60 seconds. Data comes from `petition.parliament.uk/petitions/{id}.json`.

## Current status: actively iterating on layout

The user is **trying things** on the dashboard's visual design — layout, typography, spacing, tile structure. Recent sessions have made many small back-and-forth changes (type scales, max-widths, gap sizes, tile structure, count placement). **Do not treat any current values as load-bearing conventions** — column ratios, font sizes, margins, and tile composition are all still in flux and may flip next session.

What this means in practice:
- When asked to tweak the dashboard, make the smallest change that satisfies the ask. Don't refactor surrounding decisions to be "consistent" with a value the user is about to change anyway.
- The `?layout=split|centered` switcher exists explicitly to compare variants in-browser during this iteration phase. Default is `split` (the active variant); `centered` is dormant but kept so the user can A/B against it.
- Don't propose new visual decisions (themes, animations, colours, additional tiles) unless asked. The user wants to nail layout fundamentals first.

## Running the project — Docker only

The host machine does **NOT** have Node.js installed. Never run `npm`, `npx`, `node`, `next`, or `shadcn` directly on the host — they will fail. Every command must run inside Docker.

### Day-to-day

- Start dev server: `docker compose up` (app at http://localhost:3000)
- Stop: `docker compose down`
- Rebuild after dependency or Dockerfile changes: `docker compose up --build`
- Tail logs: `docker compose logs -f web`

### One-off commands inside the running container

- Install a package: `docker compose exec web npm install <pkg>`
- Add a shadcn component: `docker compose exec web npx shadcn@latest add <component>`
- Lint: `docker compose exec web npm run lint`
- Production build (smoke test): `docker compose exec web npm run build` — but read the build pitfall in Notes first.

### If the container isn't running

Use a throwaway container with the project bind-mounted:

```
docker run --rm -it -v "$PWD":/app -w /app node:22-alpine <command>
```

This is how `create-next-app` and the initial `shadcn init` were run during scaffolding.

## Architecture

- **Next.js 16 App Router + TypeScript + Turbopack**, Tailwind CSS v4 (CSS-first config in [src/app/globals.css](src/app/globals.css)), shadcn/ui (CLI v4, `shadcn` package, base-ui primitives).
- **Routes:**
  - `/` → welcome view with a centred search input ([src/app/page.tsx](src/app/page.tsx)).
  - `/p/[id]` → live petition dashboard. The page ([src/app/p/[id]/page.tsx](src/app/p/%5Bid%5D/page.tsx)) is a **Server Component** that reads `?layout=` and renders one of the Client-Component variants in [src/components/dashboards/](src/components/dashboards/). Polling lives in the [usePetition](src/hooks/use-petition.ts) hook so both variants share it.
- **CORS proxy is mandatory.** The UK petitions API at `petition.parliament.uk` does **not** send CORS headers, so the browser cannot fetch it directly. All petition data flows through [src/app/api/petitions/[id]/route.ts](src/app/api/petitions/%5Bid%5D/route.ts), which calls upstream server-side and returns the JSON. Never call the upstream API from the client.
- **Petition ID parsing** in [src/lib/parse-petition-id.ts](src/lib/parse-petition-id.ts) accepts a bare numeric ID or a full `petition.parliament.uk/petitions/{id}` URL.
- **Typed API surface** in [src/lib/petitions-api.ts](src/lib/petitions-api.ts). Extend this when adding new fields from the upstream payload — don't scatter `any` casts in components.

## Current dashboard layout (`split` variant) — what's there right now

This is the present structure; it has changed several times and may change again. Anchor on the *intent*, not the exact class strings.

- **Viewport lock**: at `lg:` and up, `main` is `h-dvh overflow-hidden` — the page itself cannot scroll. Mobile (<`lg:`) falls back to `min-h-dvh` with normal page scroll because TV-scale type doesn't fit a phone otherwise.
- **Header**: thin strip (`shrink-0`), back link on the left, `<LiveIndicator />` on the right.
- **Body grid**: 2-column `[2fr_1fr]` at `lg:+`.
  - **Left column** — two stacked outlined tiles (`rounded-2xl border border-border/50 p-6`):
    1. **Content tile** (`shrink-0`, capped at `lg:max-h-[65%]` with `overflow-y-auto` as a safety net): contains `<PetitionStatus />`, the petition title (`<h1>`), the action paragraph (`background`), and the additional details paragraph (`additional_details`). Title spans full tile width to fit 80 chars in ≤2 lines; both paragraphs are capped at `max-w-3xl` for prose readability.
    2. **Count tile** (`flex-1 justify-center`): signature count + "Signatures" caption, vertically centred in the remaining space.
  - **Right column** — `<StatCarousel />` ([src/components/dashboards/stat-carousel.tsx](src/components/dashboards/stat-carousel.tsx)) auto-rotates between stat cards in [src/components/dashboards/stats/](src/components/dashboards/stats/). Tabs at the top let a viewer pin a card.
- **Typography** has been calibrated multiple times — see the running theme of tension between "TV-readable at 3 m" and "fit on a 900-1000 px desktop window without cropping". Current scale prioritises fit on a desktop window because that's what's being tested.

## Design intent (still true)

- **Skeleton first, theme later.** shadcn's neutral defaults are placeholders. Do not introduce brand colours, dark/light toggles, or new colour tokens until the user explicitly asks. Typography scale, spacing, and tile layout are the active design surface.
- **Hierarchy on the dashboard**: the signature count is the hero. When adding features, do not let supporting content out-weight it.
- **Welcome view is intentionally minimal** — eyebrow caption + bold search + one example link. No trending lists, no marketing copy.
- **Mobile is the secondary target.** TV/desktop is primary. Don't optimise for mobile at the cost of TV/desktop unless asked.

## What's deferred (do not build without asking)

- **Theme system** — dark/light toggle, custom colour tokens.
- **Welcome-view trending petitions list** — kept off intentionally to preserve minimalism.
- **Other**: authentication, persistence, sharing/social meta, count-up animation.

## Notes / pitfalls

- `AGENTS.md` (imported at the top of this file) is generated by `create-next-app` v16 and warns that this Next.js release has breaking changes vs. older versions. When in doubt about Next.js APIs, prefer reading `node_modules/next/dist/docs/` over recalled patterns.
- Polling interval is `POLL_INTERVAL_MS = 60_000` in [src/hooks/use-petition.ts](src/hooks/use-petition.ts); the upstream API has no published rate limit but 60s is the community recommendation.
- **`npm run build` and the dev volume don't mix.** `docker-compose.yml` mounts `.next` as an anonymous volume so HMR works; this same mount prevents a clean rebuild inside the running dev container. For a clean production build, use a throwaway container:
  ```
  docker run --rm -v "$PWD":/app -w /app node:22-alpine sh -c "rm -rf .next && npm run build"
  ```
- A custom `src/app/global-error.tsx` exists to work around a Next 16 prerender crash on the auto-generated `/_global-error` route. Don't delete it without verifying the build still passes.
- **NEVER load Geist via `next/font/google` in this project.** It's broken in Next 16 — emits an invalid `unicode-range: U+??` for Geist's `latin` subset, so the basic-Latin `@font-face` is rejected and Geist silently never renders for ASCII text (the page falls back to Arial or worse). [src/app/layout.tsx](src/app/layout.tsx) imports `GeistSans` from `"geist/font/sans"` and `GeistMono` from `"geist/font/mono"` instead — Vercel's package, no subset machinery to corrupt. The `--font-geist-sans` / `--font-geist-mono` variable contract is the same, so [src/app/globals.css](src/app/globals.css) does not need to change. **Do not "modernise" this back to `next/font/google` — the choice is deliberate.** To verify a session hasn't regressed it: `curl -s 'http://localhost:3000/_next/static/chunks/<hash>.css' | grep 'U+??'` — any hit means it's broken.
- **Defence in depth on font fallbacks.** Every `--font-*` token in `@theme inline` must end in a generic keyword (`sans-serif`, `monospace`) so that if Geist + its synthetic fallback both fail, the browser still picks something sans-serif rather than rendering Times. When diagnosing fonts, inspect the **in-memory** bundle (`curl -s 'http://localhost:3000/_next/static/chunks/<hash>.css' | grep font-family`) — Turbopack does NOT serve `.next/static/chunks/*.css` from disk in dev, so checking the on-disk file is misleading. Tailwind 4 escapes selectors starting with a digit, so `2xl:text-5xl` appears in the bundle as `.\32 xl\:text-5xl` — grep `2xl` (not `2xl:`) when verifying responsive variants.
- **React 19 strict lint rules to know.** `react-hooks/set-state-in-effect` forbids calling `setState` synchronously inside an effect body — push the call into an async callback or event handler. `react-hooks/purity` forbids impure calls during render, including `useRef(Date.now())` — initialise refs to `0`/`null` and set the real value inside an effect. Both rules will fail `npm run lint` even though the code "works".
- The `?layout=` switcher in [src/app/p/[id]/page.tsx](src/app/p/%5Bid%5D/page.tsx) defaults to `split` and falls back to `split` for unknown values. To add a new variant: drop a `<DashboardX>` Client Component in [src/components/dashboards/](src/components/dashboards/), use the [usePetition](src/hooks/use-petition.ts) hook for data, and add the name to the `LAYOUTS` tuple in the page. **Remove the switcher entirely once the user picks a winner** — it should not ossify into a permanent feature.
