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

### `skills/` — Claude Code skills that pay gates

Drop-in skills that an agent runs locally, paying USDC per call through a Chest gate. The on-chain receipt splits between the data provider, the skill author (referrer), and the platform.

| Skill | What it does |
|---|---|
| [`skills/trading-decision`](./skills/trading-decision) | Pulls price, technicals, and sentiment in parallel from three x402 gates and returns a buy/hold/sell verdict. Three on-chain receipts per decision. |

Install:

```bash
git clone --depth 1 https://github.com/chesthq/apps
cp -r apps/skills/trading-decision ~/.claude/skills/trading-decision
```

Then mint an agent token at [chest.sh/app/agent-wallet](https://chest.sh/app/agent-wallet) (scope to the matching app), top up with devnet USDC, and ask Claude Code "should I long bitcoin?".

## Coming soon

- `plugins/` — drop-in libraries (`call-a-gate` Node script, Next.js route handler)
- `mcp/` — MCP servers that expose paid gates as tools

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
