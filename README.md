# coffeerating

A [ProAppStore](https://proappstore.online) web app.

## Development

```bash
pnpm install
pnpm dev        # start dev server
pnpm build      # production build
pnpm test       # run tests
pnpm typecheck  # type-check without emit
```

## Deployment

Push to `main` → auto-deploys via GitHub Actions to `coffeerating.proappstore.online`.

Before pushing, run `pnpm test` and `pnpm build`. The workflow deploys to Cloudflare
R2 and supplies `VITE_COMMIT_SHA`, embedded in the HTML as `meta[name="build-commit"]`.
Local builds use `development` unless that variable is set.

After the deploy succeeds, verify the exact release and browser startup:

```bash
cd e2e
npm install
npx playwright install chromium
E2E_BASE_URL=https://coffeerating.proappstore.online RELEASE_COMMIT_SHA=$(git rev-parse HEAD) npm test
```

The release checks cover the commit identity, sign-in screen, manifest, icon assets,
and active service worker. The signed-in check requires an `E2E_SESSION_TOKEN` for a
throwaway account and is skipped when none is supplied.

## Stack

- React 19 + TypeScript + Vite + Tailwind CSS
- [ProAppStore SDK](https://docs.proappstore.online/) (auth, database, storage, rooms, AI)
- Vitest + Testing Library for tests
