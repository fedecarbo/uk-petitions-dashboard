@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A web app that displays live statistics for a **single UK Parliament petition**, optimised for full-screen 16:9 displays (kiosk, TV, office dashboard) and responsive on mobile.

Flow: land on a minimalist search → enter a petition ID or paste a `petition.parliament.uk` URL → land on the dashboard which auto-refreshes every 60 seconds. Data comes from `petition.parliament.uk/petitions/{id}.json`.

## Working style — design is still moving

The user is a **designer** and is actively adding, removing, and rearranging things on the dashboard. Treat the present layout as a snapshot, not a spec:

- When asked to tweak something, make the smallest change that satisfies the ask. Don't refactor surrounding decisions to be "consistent" with a value the user is about to change anyway.
- Don't pin down the *current* dashboard structure (tile sizes, column ratios, type scales, tile contents) in this file or in memory — read the code when you need to know. Files in [src/components/dashboards/](src/components/dashboards/) are the source of truth.
- Don't propose new visual decisions (themes, animations, additional tiles, new colours) unless asked.
- Speak in plain English when explaining things — see the auto-memory note on the user being a designer.

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
  - `/p/[id]` → live petition dashboard. The page ([src/app/p/[id]/page.tsx](src/app/p/%5Bid%5D/page.tsx)) is a **Server Component** that renders [DashboardSplit](src/components/dashboards/split.tsx); a `?view=stats|map` query param switches the right-rail content. Polling lives in the [usePetition](src/hooks/use-petition.ts) hook.
- **CORS proxy is mandatory.** The UK petitions API at `petition.parliament.uk` does **not** send CORS headers, so the browser cannot fetch it directly. All petition data flows through [src/app/api/petitions/[id]/route.ts](src/app/api/petitions/%5Bid%5D/route.ts), which calls upstream server-side and returns the JSON. Never call the upstream API from the client.
- **Petition ID parsing** in [src/lib/parse-petition-id.ts](src/lib/parse-petition-id.ts) accepts a bare numeric ID or a full `petition.parliament.uk/petitions/{id}` URL.
- **Typed API surface** in [src/lib/petitions-api.ts](src/lib/petitions-api.ts). Extend this when adding new fields from the upstream payload — don't scatter `any` casts in components.

## Design intent (still true)

- **Hierarchy on the dashboard**: the signature count is the hero. When adding features, do not let supporting content out-weight it.
- **Welcome view is intentionally minimal** — eyebrow caption + bold search + one example link. No trending lists, no marketing copy.
- **Mobile is the secondary target.** TV/desktop is primary. Don't optimise for mobile at the cost of TV/desktop unless asked.
- **Brand palette lives in [src/app/globals.css](src/app/globals.css).** Don't introduce hex codes in components — add a token if a colour doesn't exist yet. See the brand-palette and mint-is-focus-only memories for the rules.

## Typography — allowed text sizes

To stay close to the GOV.UK (GDS) type scale, authored components use **only** these Tailwind text-size classes (each is the nearest stock class to a GDS step):

`text-base` (16, body floor) · `text-lg` (≈19) · `text-2xl` (24) · `text-3xl` (≈27) · `text-4xl` (36) · `text-5xl` (48) · `text-6xl` (60) · `text-7xl` (≈80, display).

**All text is a single fixed size — do not add responsive size variants.** GDS uses a two-screen model, and only a few big titles scale. The **only** elements that carry a text-size breakpoint (a single small→large step at `lg`) are the landing headline ([page.tsx](src/app/page.tsx)) and the search input ([petition-search.tsx](src/components/petition-search.tsx)). Everything else — including section headings, panel titles, the map/detail counts, body, labels, badges, captions — is one fixed size.

**Stats-view hero — two steps, all on-scale.** The stats-view petition title and hero count ([split.tsx](src/components/dashboards/split.tsx)) step across **two** breakpoints (more than the single `lg` step above), but every size stays on the GDS scale: title `text-4xl` → `lg:text-5xl` → `wide:text-6xl` (36→48→60); count `text-4xl` → `lg:text-5xl` → `wide:text-7xl` (36→48→80, one step above the title so the count is the hero on a big screen). The `wide` breakpoint is a custom token in [globals.css](src/app/globals.css) — `--breakpoint-wide: 105rem` (1680px) — that exists so 60px appears **only on a large external display**, not on the 14" MacBook (1512px logical, where 60px feels too big). To retune where 60px kicks in, change that one token.

Two further exceptions:
- `text-sm` (14) — chart axis/tick labels that genuinely must be small. Not for badges, captions, or other chrome (those use the 16px floor).
- `text-7xl` (≈80) is allowed for display.

**Never** use `text-xs`, `text-xl`, `text-8xl`, `text-9xl`, or arbitrary `text-[Npx]`. The 18→24 gap in the subset is intentional and mirrors GDS's own 19→24 jump. This rule covers code we author — `src/components/ui/*` shadcn primitives keep their own size variants.

## What's deferred (do not build without asking)

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
