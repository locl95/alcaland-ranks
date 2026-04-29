# Alcaland Ranks

Mythic+ ladder tracker. Track and compare character scores across World of Warcraft Mythic+ dungeons.

Built with React + TypeScript + Vite. Data is served by [serresiete-backend](https://github.com/locl95/serresiete-backend).

## Requirements

- Node 20+
- pnpm 9+
- prettier formatter

## Setup

```bash
pnpm install
```

Copy `.env.e2e` to `.env` and fill in your values:

```bash
cp .env.e2e .env
```

| Variable | Description |
|---|---|
| `VITE_API_HOST` | Base URL of serresiete-backend (e.g. `http://localhost:8080`) |
| `VITE_SERVICE_TOKEN` | Service JWT for read-only endpoints |
| `VITE_FEATURE_FLAG_POLLING_ENABLED` | Enable background polling (`true` / `false`) |

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

Output goes to `dist/`. Preview the production build locally:

```bash
pnpm preview
```

## Testing

### Unit tests — Vitest 2

Tests live alongside source files as `*.test.tsx` / `*.test.ts`. They run in jsdom with no browser required.

```bash
# watch mode
pnpm test

# single run (used in CI)
pnpm test:run
```

### E2E tests — Playwright 1.59

Tests live in `e2e/`. All backend calls are intercepted with `page.route()` — no running backend needed.

```bash
# run headless (used in CI)
pnpm test:e2e

# run with a visible browser window
pnpm exec playwright test --headed

# slow down actions to watch what's happening
# add launchOptions: { slowMo: 500 } under `use` in playwright.config.ts, then:
pnpm exec playwright test --headed -g "test name"

# open the HTML report after a run
pnpm exec playwright show-report
```

Playwright uses Chromium only. Browsers are installed separately:

```bash
pnpm exec playwright install chromium
```

## CI

GitHub Actions runs both test suites on every push and pull request to `main`. The workflow is defined in `.github/workflows/ci.yml`. On failure, the Playwright HTML report is uploaded as an artifact.
