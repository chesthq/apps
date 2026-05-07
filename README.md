# apps

Copy-paste starter apps for [Chest Gate](https://chest.sh), the x402 payment layer for APIs and AI agents on Solana.

In Chest, an **app** is anything identified by a `@author/app-name` slug. The dashboard recognises three kinds — `skill`, `plugin`, and `mcp` — and a fourth folder, `upstreams/`, holds example APIs you can put behind a Chest gate (those aren't apps, they're the thing apps pay).

## What's here

### `upstreams/` — APIs to put behind a gate

Sample APIs you can deploy and then point a Chest gate at. Earn USDC per request without writing any payment code.

| App | Stack |
|---|---|
| [`upstreams/hono-content-api`](./upstreams/hono-content-api) | Hono content API with free + paid routes |
| [`upstreams/express-content-api`](./upstreams/express-content-api) | Express content API with free + paid routes |

Workflow:

1. Run the upstream locally to confirm it works.
2. Deploy somewhere publicly reachable (Fly, Railway, Vercel).
3. Sign in at [chest.sh](https://chest.sh) → *Gates → New gate*, point at your public URL, set free + paid routes.
4. Live in ~10 seconds. Any x402 client now pays USDC to hit the paid routes.

## Coming soon

- `skills/` — Claude Code skills that pay gates (`market-read`, `trading-bot` revshare demo)
- `plugins/` — drop-in libraries (`call-a-gate` Node script, Next.js route handler)
- `mcp/` — MCP servers that expose paid gates as tools

These are blocked on the published `@chest-gate/sdk@0.2.0` having a working signing path against production. Will land once that's resolved.

## Conventions

- Node 20+, ESM where possible.
- Pinned versions, no workspace aliases.
- `.env.example` only — real keys never in the repo.

## Links

- Dashboard: [chest.sh](https://chest.sh)
- SDK on npm: [`@chest-gate/sdk`](https://www.npmjs.com/package/@chest-gate/sdk)
- Main monorepo: [github.com/chesthq/chest-gate](https://github.com/chesthq/chest-gate)

## License

MIT.
