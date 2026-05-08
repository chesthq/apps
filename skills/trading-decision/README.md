# trading-decision

Three paid x402 signals in parallel, one buy/hold/sell decision. Each call settles its own USDC payment on Solana, three on-chain receipts per decision. Receipts split four ways: three providers (publishers), the skill author (referrer), and the chest.sh platform.

## Two ways to run

### As a Claude Code skill (recommended)

This directory ships with `SKILL.md`. Drop the directory into your Claude Code skills folder and ask:

> Should I long bitcoin?

The skill prompts for a Chest agent token (one-time), saves it to `~/.chest/auth.json`, then runs the same script below with the symbol extracted from your question.

### As a CLI

```bash
# 1. Mint an agent key at https://chest.sh/app/agent-wallet
export CHEST_API_KEY=ca_live_…

# 2. Top up the agent wallet (devnet USDC) at the address shown there.
#    https://faucet.circle.com / https://faucet.solana.com

# 3. Decide.
node index.mjs SOL
node index.mjs "should I long bitcoin"
```

Sample output:

```
Trading decision: SOL
Pulling 3 paid signals in parallel through https://gate.chest.sh/g/market-read

  ✓ price        842ms   score= 0.74   tx=5baE5Jv6VYY…   amt=1000   mid $148.6234
              split: provider 850 · skill author 100 · platform 50
  ✓ orderbook   1107ms   score= 0.18   tx=46Wb4bBvuBR…   amt=1000   spread $0.31 · bids 5 · asks 5
              split: provider 850 · skill author 100 · platform 50
  ✓ sentiment    934ms   score=-0.12   tx=2hGn8Yc4Vrm…   amt=1000   10 tokens tracked
              split: provider 850 · skill author 100 · platform 50

  consensus score : 0.267 (mean of 3 sources)
  decision        : BUY SOL
  total spent     : 3000 atomic USDC (3 of 3 settled)
  → providers     : 2550 atomic USDC (3 publishers)
  → skill author  : 300 atomic USDC (this skill's referrer wallet)
  → platform      : 150 atomic USDC (chest.sh)
  total latency   : 1107ms (parallel)
```

## Swap upstreams

Defaults pull all three signals from `gate.chest.sh/g/market-read`. To point at three distinct publisher gates (so each on-chain receipt routes to a different `payTo` wallet), set:

```bash
export SOURCE_PRICE_URL="https://gate.chest.sh/g/<your-price-gate>/<path>"
export SOURCE_BOOK_URL="https://gate.chest.sh/g/<your-orderbook-gate>/<path>"
export SOURCE_VIBE_URL="https://gate.chest.sh/g/<your-sentiment-gate>/<path>"
```

The bot doesn't care what the upstreams return as long as they hand back JSON. Score functions are local to `index.mjs`.

## What this demonstrates

- One agent (`CHEST_API_KEY=ca_live_…`) routes paid traffic to three different upstreams in parallel.
- Each call goes through `gate.chest.sh`, which signs a Solana USDC transfer via Privy on the agent's behalf, settles the tx, and returns the upstream response with an `x-payment-response` receipt.
- The receipt now carries the per-call breakdown: provider (`merchantAmount`), skill author (`referrerAmount`), platform (`protocolAmount`).
- Skill authors get paid for every call routed through their skill, exactly the same mechanism the SDK uses for any referrer wallet.
- The agent never holds Solana keys, just an API key.
