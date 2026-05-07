# hono-content-api

A small Hono content API designed to sit behind a Chest Gate. Your upstream stays free of payment logic; the gate handles 402 challenges, settlement, and revshare.

## Run the upstream

```bash
npm install
npm start
# → Demo content API on http://localhost:8005
```

```bash
curl http://localhost:8005/articles            # free, returns previews
curl http://localhost:8005/articles/first      # free locally, paid once gated
```

## Wrap it with a gate

1. Deploy this app somewhere publicly reachable (Fly, Railway, Vercel, your own box).
2. Sign in at [chest.sh](https://chest.sh) and open *Gates → New gate*.
3. Set:
   - **Upstream URL**: `https://<your-public-host>`
   - **Slug**: `my-content` (becomes `gate.chest.sh/g/my-content`)
   - **Default price**: `$0.10`
   - **Free routes**: `GET /articles`, `GET /articles/:id/preview`
   - **Paid routes**: `GET /articles/:id` at `$0.10`
   - **Payout wallet**: your Solana address
4. Save. Live in ~10 seconds.

```bash
curl -i https://gate.chest.sh/g/my-content/articles/first
# → 402 Payment Required, with x-payment challenge headers
```

Any x402-aware caller (e.g. [`call-a-gate`](../call-a-gate)) will pay and retry automatically.

## What you didn't have to do

- Implement the x402 spec.
- Verify Solana signatures or settle USDC transfers.
- Manage a `payTo` wallet, fee-payer, or session tokens.
- Add middleware to your Hono app.

The gate is a reverse proxy. Your code stays vanilla Hono.
