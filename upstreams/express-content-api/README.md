# express-content-api

A small Express content API designed to sit behind a Chest Gate. Same pattern as [`hono-content-api`](../hono-content-api): your upstream stays free of payment logic; the gate handles everything.

## Run the upstream

```bash
npm install
npm start
# → Demo content API on http://localhost:8006
```

## Wrap it with a gate

1. Deploy this app to a publicly reachable host.
2. Sign in at [chest.sh](https://chest.sh) and open *Gates → New gate*.
3. Configure:
   - **Upstream URL**: `https://<your-public-host>`
   - **Slug**: `my-content`
   - **Default price**: `$0.10`
   - **Free routes**: `GET /articles`, `GET /articles/:id/preview`
   - **Paid routes**: `GET /articles/:id`
   - **Payout wallet**: your Solana address

Live in ~10 seconds. See the [Hono walkthrough](../hono-content-api/README.md) for a fuller example.
