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

## Stack

- React 19 + TypeScript + Vite + Tailwind CSS
- [ProAppStore SDK](https://docs.proappstore.online/) (auth, database, storage, rooms, AI)
- Vitest + Testing Library for tests
