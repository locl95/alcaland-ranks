# Project Context

Orientation for anyone (human or agent) picking up this codebase.
For *how to work* here — coding conventions, when to ask vs. assume — read `CLAUDE.md`.

## What this is

**Alcaland Ranks** — a World of Warcraft **Mythic+ ladder tracker**. Users assemble a
"ladder" of characters and compare their Mythic+ scores, best runs per dungeon, and
week-over-week movement.

## Stack

- React + TypeScript + Vite
- **TanStack Query** — all data fetching and mutations
- **Redux Toolkit** — auth state only
- React Router, Radix dropdown, lucide-react icons, date-fns
- Vitest + Testing Library (unit), Playwright (acceptance)
- Plain CSS, one file per component. No Tailwind, no component library.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm test` | Vitest watch |
| `pnpm test:run` | Vitest once |
| `pnpm test:acceptance` | Playwright (boots its own dev server via `.env.acceptance`) |
| `pnpm lint` | ESLint over `src` |
| `pnpm format` | Prettier over `src` |

`tsconfig.json` has `"include": ["src"]` — **`acceptance/` is not type-checked** by
`tsc -p tsconfig.json`, and Playwright transpiles without checking types. Errors there
surface only in the editor.

## Backend

Everything is served by **`serresiete-backend`** (separate repo, `http://localhost:8080`
in dev via `VITE_API_HOST`). The frontend makes **no API calls to raider.io** or any
other external service — all data is proxied.

The one exception is images: `Dungeon.icon_url` from the season payload is rendered
straight into an `<img src>`, so the browser does load raider.io's CDN directly. This is
deliberate — see "Dungeon icons" below.

## Architecture

Feature-based folders under `src/features/`, with `src/shared/` for cross-cutting code.

- `src/app/App.tsx` — pure routing shell, no data logic
- `src/app/App.css` — global layout. The background gradient and footer live in the
  `app-layout` div. **Do not add backgrounds or `min-height: 100vh` to page containers.**
  Pages use the shared `.page` / `.page-inner` wrappers, which grow to fill the shell.
- `src/styles/app/theme.css` — the design system: self-hosted fonts, colour tokens,
  the CSS reset, and the shared `.num` / `.eyebrow` / `.score-*` helpers. See
  "Design system" below. Components consume tokens; they don't hardcode colours.
- `src/shared/api/httpClient.ts` — two request tiers:
  - `serviceGet` / `serviceRequest` — service token, public data
  - `userRequest` / `userRequestVoid` — user JWT, with 401 refresh + request queueing
- `src/features/views/hooks/` — one hook per screen concern (`useViewsData`,
  `useViewDetail`, `useCreateViewForm`, `useEditViewForm`, `useSyncView`, `useStaticData`)
- `src/features/views/api/viewQueries.ts` — all query keys and fetch functions

### Query keys

| Key | Notes |
| --- | --- |
| `["views", "featured"]` | Service token, public, `staleTime: Infinity` |
| `["views", "own"]` | User JWT, only when authenticated, cleared on logout |
| `["viewData", id]` | Live data; polls every 2s while any character has `score === null` |
| `["viewCachedData", id]` | Previous snapshot, `staleTime: Infinity` |
| `["wowStatic"]` | Season + dungeon list, `staleTime: Infinity` |

Global default `staleTime` is 5 minutes (`src/app/queryClient.ts`).

### Auth

`bootstrapAuth()` runs in `index.tsx` *before* first render, refreshing the stored token
so no expired access token ever reaches the app. Only the refresh token is persisted;
the username is decoded from the access token's JWT payload.

Migrating to httpOnly cookies is deferred — it needs backend changes that another
project (osborno-gestiones) also depends on.

### Design system

Two rules carry most of it:

**The rarity ramp is the colour system.** Grey → green → blue → purple → orange mirrors
WoW item quality, and `getScoreTier` already maps M+ score onto it. It drives score
text, the ladder row spine, and the expanded panel accent. Colour here means something —
don't use a ramp colour decoratively.

**Cyan (`--beacon`) means "this responds to you"** — focus rings, hover and active
states, the primary action, the active tab. It appears on ~20 rules because every hover
state uses it; what it must never do is sit on static content. (The one deliberate
exception is the loading spinner, where it reads as "the app is working".) It used to be
scattered across decoration, which is why nothing stood out.

Typography is three faces: `--font-display` (Saira Condensed) for headings and character
names, `--font-data` (IBM Plex Mono, via the `.num` class) for every number that gets
compared against another number, and `--font-ui` (system) for labels and prose. The fonts
are self-hosted `woff2` in `src/assets/fonts/`, latin subset only, ~67KB total — no CDN.

## Vocabulary: the API and the UI use different words

This is the single biggest source of confusion. **Both are correct** — use UI wording in
user-facing strings, API wording in types and network code. Do not "unify" them.

| API / code | UI |
| --- | --- |
| `view` (`SimpleView`, `viewKeys`, `/views/:id`) | "ladder" |
| `entity` (`entitiesIds`, `WowEntityRequest`) | "character" |

### Two different async systems — do not conflate

- **Operation** — the result of any *write* (create/update/delete a view). The write
  returns `{id}`; poll `/operations/:id` until the status leaves `PENDING`. 2s × 30.
- **Task** — the manual **Sync** button only. `POST /tasks` with
  `CACHE_GAME_VIEW_DATA_TASK`, poll `/tasks/:id`. 2s × 10, and the server may respond
  with a `retryAfter` cooldown (persisted in `localStorage` under
  `alcaland:cooldown:<viewId>`).

### `data` vs `cached-data`

`/views/:id/data` is current; `/views/:id/cached-data` is the **previous snapshot**. The
app renders both to show movement — rank change and score delta. When `cachedCharacters`
is empty there is no history yet and deltas must not render; `hasHistoricalData` guards
this.

### Ownership

- **featured** — curated public ladders, service token, visible logged out
- **own** — the user's ladders, user JWT; editing requires `username === view.owner`

## Mythic+ jargon appearing in types

- **keystone / `mythic_level`** — dungeon difficulty; higher = more score
- **`par_time_ms`** — the dungeon's time limit; beating it is "timing the key"
- **`num_keystone_upgrades`** — 0–3, rendered `+`/`++`/`+++`; 0 means depleted
- **score** — raider.io Mythic+ rating, colored in tiers by `getScoreClass` mirroring
  WoW item-rarity colors
- **affixes** — weekly rotating run modifiers

## Decisions worth knowing

### Entity verification returns three lists

`POST /entities/exists` returns `exist`, `nonExisting`, and `unchecked` — the last
meaning the backend *could not determine* the answer. `verifyEntity` collapses these to
`'valid' | 'invalid' | 'unverified'`, with `unchecked` mapping to `unverified` (same
meaning to the user: `?` badge, saving still allowed).

If `unchecked` ever needs to *block* saving, give it its own status rather than
overloading `unverified`. Any mock of this endpoint must include all three keys —
omitting `unchecked` makes `.some()` throw, which the surrounding `catch` silently turns
into `unverified`.

### Dungeon icons come from the backend, not the repo

Icons were once 8 `.webp` files in `src/assets/dungeons/` plus a hardcoded
`short_name → image` map. That required hand-adding files and editing the map every
season (~4-5 months), and forgetting broke the dungeon grid.

Now `Dungeon.icon_url` is rendered directly. The accepted tradeoff: the browser hotlinks
raider.io's CDN. Reasonable here because the app already depends entirely on raider.io
for its data — if that CDN is down there are no scores to show anyway.

Two constraints this creates:
- The backend must return a **stable** URL — no signed tokens or cache-busting params,
  or browser caching breaks and images refetch.
- `icon_url` is typed non-nullable and neither call site guards it, so a 404 renders a
  broken-image glyph. There is no `onError` fallback yet.

## Known rough edges

- `authApi.ts` logout swallows errors — the server session may outlive the local one
- JWT in localStorage — a documented tradeoff, hard to avoid in a pure SPA
