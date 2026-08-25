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
- React Router, lucide-react icons, date-fns
- **Radix UI** — `react-dialog` (the three modals) and `react-dropdown-menu` (the account
  menu and the character menu)
- Vitest + Testing Library (unit), Playwright (acceptance)
- Plain CSS, one file per component. No Tailwind, no component library.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (port 5173) |
| `pnpm test` | Vitest watch |
| `pnpm test:run` | Vitest once |
| `pnpm test:acceptance` | Playwright (boots its own dev server via `.env.acceptance`) |
| `pnpm lint` | `eslint src --max-warnings 0` |
| `pnpm format` | Prettier over `src` |

`pnpm lint` runs with `--max-warnings 0`, so a `react-hooks/exhaustive-deps` **warning
fails the build** like an error.

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
  motion tokens, the CSS reset, and the shared `.num` / `.eyebrow` / `.score-*` helpers.
  See "Design system" below. Components consume tokens; they don't hardcode values.
- `src/shared/api/httpClient.ts` — two request tiers:
  - `serviceGet` / `serviceRequest` — service token, public data
  - `userRequest` / `userRequestVoid` — user JWT, with 401 refresh + request queueing
- `src/features/views/hooks/` — one hook per **screen concern** (`useViewsData`,
  `useViewDetail`, `useCreateViewForm`, `useEditViewForm`, `useSyncView`, `useStaticData`)
- `src/features/views/components/shared/` — cross-screen UI parts and their mechanics
  (`realm-select`, `verification-badge`, `dialog.css` / `dialog.ts`). Not in `hooks/`,
  which is reserved for screen concerns.
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

## Design system

Three rules carry most of it:

**The rarity ramp is the colour system.** Grey → green → blue → purple → orange mirrors
WoW item quality, and `getScoreTier` already maps M+ score onto it. It drives score
text, the ladder row spine, and the expanded panel accent. Colour here means something —
don't use a ramp colour decoratively.

**Cyan (`--beacon`) means "this responds to you"** — focus rings, hover and active
states, the primary action, the active tab. It appears on ~20 rules because every hover
state uses it; what it must never do is sit on static content. (The one deliberate
exception is the loading spinner, where it reads as "the app is working".) It used to be
scattered across decoration, which is why nothing stood out.

**Two motion tokens cover every state change.** `--motion-base` (0.18s) and
`--motion-fast` (0.15s) in `theme.css` replace what used to be 68 hand-written durations
across 15 files. Every hover, focus and state transition uses one of them.

The durations that stay literal are deliberately **not** part of that scale, because each
does a job of its own: spinner loops (`1s linear`), the views-list row stagger
(`40ms` / `220ms`), dialog entrances. If you find yourself reaching for
`var(--motion-base)` on something that isn't "the interface reacting to the pointer or
keyboard", write the literal instead.

Typography is three faces: `--font-display` (Saira Condensed) for headings and character
names, `--font-data` (IBM Plex Mono, via the `.num` class) for every number that gets
compared against another number, and `--font-ui` (system) for labels and prose. The fonts
are self-hosted `woff2` in `src/assets/fonts/`, latin subset only, ~67KB total — no CDN.

## UI mechanics that are easy to get wrong

These are the traps that have already cost time. Each one has a comment at the site;
this is the index.

### Never put a `transform` on `.dialog-panel`

A `transform` makes an element the **containing block for every `position: fixed`
descendant**. The realm list and the character menu are both `position: fixed` and
position themselves against the viewport, so a transform on the panel sends them to
coordinates relative to the panel instead — the list lands hundreds of pixels adrift.

The panel is therefore centred with `inset: 0; margin: auto; height: fit-content`, and
its entry animation is a **fade only**. Not even mid-animation: a user can focus the
realm field well inside the animation's duration.

### Dialog behaviour comes from Radix, not from us

All three modals (`create-view`, `edit-view`, `sync-error-dialog`) are
`Dialog.Root` → `Dialog.Portal` → `Dialog.Overlay` + `Dialog.Content`. Focus trap, focus
restore, scroll lock (`react-remove-scroll`), `aria-modal`, Escape and outside-click all
come from Radix. `dialog.css` is **look only** — it exists so the three cannot drift
apart again.

Don't hand-roll `body.style.overflow` or a keydown listener in a dialog. That was the
previous approach and it leaked: the background scrolled behind an open dialog.

### Escape ordering inside a dialog

Radix listens for Escape in the **capture phase on `document`**, so a popup nested in a
dialog cannot stop the event from reaching the dialog first — bubble-phase
`stopPropagation` is too late. The dialog has to ask instead:

```tsx
onEscapeKeyDown={(e) => { if (hasOpenPopupInside(panelRef.current)) e.preventDefault(); }}
```

`hasOpenPopupInside()` (`shared/dialog.ts`) looks for an open `[role="listbox"]` **within
the panel** — scoped, not document-wide, so a listbox elsewhere on the page cannot swallow
this dialog's Escape. The nested popup therefore has to render inside the panel;
`RealmSelect` is deliberately not portalled. Escape closes the list first; a second press
closes the dialog.

### Reach for the Radix primitive before hand-rolling a popup

Both menus in the app are `@radix-ui/react-dropdown-menu`: the account menu in
`views-page.tsx` and the character menu in the ladder. The character menu used to be
hand-rolled, and the gap showed — it advertised `role="menu"` while having **no arrow-key
navigation**, no focus return and no horizontal collision handling. Radix brings all of
that, plus portalling past `.ladder-card`'s clipping.

Two consequences worth knowing:

- An open Radix menu is **modal**: it sets `pointer-events: none` on `document.body`. In
  tests, `userEvent.click(document.body)` therefore needs `{ pointerEventsCheck: 0 }` —
  the inertness is the behaviour under test, not an obstacle to it.
- The global `:focus-visible` rule in `theme.css` outlines the highlighted item at a 2px
  offset, so a menu must have **padding rather than `overflow: hidden`**, or the ring is
  sliced into a stray line. `.char-menu-dropdown` and `.user-menu-content` both use
  `padding: 0.25rem` with rounded items.

`RealmSelect` is the one popup still positioned by hand, because Radix has no combobox
primitive (its Select does not filter). Its positioning encodes two rules worth keeping:

- **Measure the popup, never hardcode its height.** The old character menu assumed 84px
  and actually rendered at 70px, so it flipped 14px too early. A hardcoded height goes
  stale the moment someone adds an item.
- **`useLayoutEffect`, not `useEffect`.** The list is `position: fixed` with no placement
  until the effect runs. Measuring after paint shows it once at its static position before
  it snaps under the input — a visible flash on first open.

A corollary: the list's `max-height` belongs in **CSS**, not in the placement maths. If the
cap is applied inline after measuring, the first measurement sees an unbounded element and
the flip decision is wrong. `.realm-options` sets `max-height: 12rem` in CSS for exactly
this reason.

### No nested interactive elements

Rows that are clickable *and* contain a control are a real `<button>` with the control as
its **sibling** — never a `div[role="button"]` wrapping a `<button>`. That shape is invalid
ARIA and, worse, makes the inner control unreachable by keyboard because the row swallows
Enter and Space.

Both list rows follow this: `.ladder-row-toggle` (with the character menu beside it) and
`.view-row-open` (with the delete control beside it). Using a real button also removes the
hand-rolled `role`, `tabIndex`, `aria-disabled`, keydown handler and `stopPropagation`
guard — the platform already does all of it.

One consequence: focus lands on the inner button, so row-level cues key off
`:has(.view-row-open:focus-visible)` and the default ring is suppressed there. The focus
indicator is the cyan spine plus the lifted background, matching hover.

### Realm select keyboard contract

`RealmSelect` is a combobox inside a form inside a dialog, which makes key handling
delicate:

- **Enter must never reach the surrounding form.** An open list means the user is picking
  a realm, not submitting the dialog. Enter is always `preventDefault()`ed.
- **Escape closes the list, not the dialog** — see "Escape ordering" above.
- Arrow keys wrap; typing re-filters and resets the highlight to the best match.
- Ids are **per-instance via `useId()`**. The create dialog renders one `RealmSelect` per
  character row, so `aria-controls` / `aria-activedescendant` would otherwise collide.

### views-list column alignment

`.views-list-container-box` defines `--row-pad-x`, `--row-gap` and `--row-actions-w`. The
count column's position falls out of those three, and the header label reuses them via
`calc()` instead of a hand-tuned padding, so it stays over the numbers at every breakpoint.

`.view-row-actions` reserves its width whether or not the delete control renders — it only
appears on ladders you own, and without the reservation the count column shifts between
rows.

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

### The two forms use different id strategies, on purpose

This looks like an inconsistency and is not. Do not unify them.

| | `useCreateViewForm` | `useEditViewForm` |
| --- | --- | --- |
| Type | `id: string` | `id: number` |
| Source | `crypto.randomUUID()` | `profile.id`, or `nextTempId()` |

`EditableCharacter.id` has to round-trip through `RaiderioProfile.id`, which is the **real
backend entity id**, so it must be a number. A character added in the edit dialog has no
backend id yet, so it borrows a **negative** one: the backend only ever issues positives,
which makes a collision impossible while both share a list.

`CharacterRow` in the create form has no backend counterpart at all — the rows are purely
local — so a self-contained UUID is the simpler choice.

Either way the id **stays on the client**: `saveCharacters` sends name, region and realm
only. Nothing downstream depends on its value.

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

## Testing notes

**jsdom has no layout engine.** Every measurement reads zero: `getBoundingClientRect()`,
`offsetHeight`, and so on. Anything that depends on real geometry — popup flipping, column
alignment — can only be verified in a browser, so verify it with Playwright rather than
adding defensive code to satisfy a unit test.

jsdom also ships no `scrollIntoView`; `src/test/setup.ts` stubs it on `Element.prototype`
rather than having components guard the call.

**A ladder row exposes two buttons carrying the character's name**: the row toggle, whose
accessible name is the whole row (`"1 Arthas Tarren Mill EU 2,500"`), and the menu trigger,
labelled `"Open Arthas on another site"`. `getByRole('button', { name: /Arthas/ })` matches
both — scope to `.ladder-row-toggle`. Testing Library's `getByText` is unambiguous here
(one `<p class="ladder-character-name">`); Playwright's is not, and needs the same scoping.

**`tsconfig.json` has `"include": ["src"]`** — `acceptance/` is **not type-checked** by
`tsc -p tsconfig.json`, and Playwright transpiles without checking types. Errors there
surface only in the editor.

**Playwright hardcodes port 5173 with `reuseExistingServer` locally.** If a plain
`pnpm dev` is already running there, the acceptance suite will silently reuse it — and
that server is *not* in `--mode acceptance`, so the API mocks are absent and tests fail
for the wrong reason. Don't kill the existing server; run against another port with a
config that overrides `baseURL` and `webServer`.

## Build & deploy

Deployed to Netlify (`alcaland-ranks.netlify.app`).

`/dist` is in `.gitignore`, but **two files inside it are tracked anyway**:

- `dist/_redirects` — needed by Netlify so client-side routes don't 404
- `dist/index.html`

Because they are already tracked, `git add` works on them despite the ignore rule (git
prints an "ignored by one of your .gitignore files" hint that can be disregarded). Any
build refreshes `dist/index.html`, so it routinely shows as modified after running
`vite build` for verification.

## Known rough edges

- `authApi.ts` logout swallows errors — the server session may outlive the local one
- JWT in localStorage — a documented tradeoff, hard to avoid in a pure SPA
- The Netlify setup as a whole (why `dist` is partly tracked rather than built by CI)
  has not been revisited — flagged, deliberately parked
