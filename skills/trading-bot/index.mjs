#!/usr/bin/env node
// trading-bot: pulls three paid signals in parallel through Chest Gate, then
// emits a buy/hold/sell decision. Each source is a separate x402 settlement
// on Solana, so a single decision produces three on-chain receipts. The
// receipts split between three providers, the skill author, and the platform.
//
// Setup:
//   1. Mint a key at https://chest.sh/app/agent-wallet (scope to @demo/trading-bot)
//   2. Either:
//        export CHEST_API_KEY=ca_live_…
//      or save it to ~/.chest/auth.json (the skill flow does this for you)
//   3. Top up the agent wallet (devnet USDC) at the address shown in /app/agent-wallet
//   4. node index.mjs SOL
//      node index.mjs "should I long bitcoin"
//
// Default sources (devnet):
//   price       → SOURCE_PRICE_URL or gate.chest.sh/g/market-read/price/<TOKEN>
//   orderbook   → SOURCE_BOOK_URL  or gate.chest.sh/g/market-read/orderbook/<TOKEN>
//   sentiment   → SOURCE_VIBE_URL  or gate.chest.sh/g/market-read/prices

import { paidFetch } from "@chest-gate/sdk";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TOKEN = parseToken(process.argv.slice(2).join(" "));
const APP_SLUG = process.env.CHEST_APP_SLUG ?? "trading-bot";

// Three independent providers, three different chest.sh gate slugs, three
// different payTo wallets. Override any of the URLs via env to point at
// other gates.
const PRICE_URL = process.env.SOURCE_PRICE_URL ?? `https://gate.chest.sh/g/price-feed/price/${TOKEN}`;
const TECH_URL  = process.env.SOURCE_TECH_URL  ?? `https://gate.chest.sh/g/technicals/technicals/${TOKEN}`;
const SENT_URL  = process.env.SOURCE_SENT_URL  ?? `https://gate.chest.sh/g/sentiment/sentiment/${TOKEN}`;

const SOURCES = [
  {
    label: "price",
    url: PRICE_URL,
    score: (body) => {
      // Map 24h % change into a [-1, 1] band. +5% → +1, -5% → -1.
      const change = parseFloat(String(body?.change24h ?? "0").replace("%", ""));
      if (!Number.isFinite(change)) return 0;
      return clamp(change / 5, -1, 1);
    },
    summary: (body) => `mid $${fmt(body?.price)} · 24h ${body?.change24h ?? "n/a"}`,
  },
  {
    label: "technicals",
    url: TECH_URL,
    score: (body) => {
      // Combine RSI signal + MACD trend.
      const rsi = body?.indicators?.rsi14;
      const trend = body?.indicators?.trend;
      let score = 0;
      if (typeof rsi === "number") {
        // RSI: 70+ overbought (bearish), 30- oversold (bullish), 50 neutral.
        score += clamp((50 - rsi) / 20, -1, 1) * 0.5;
      }
      if (trend === "bullish") score += 0.5;
      else if (trend === "bearish") score -= 0.5;
      return clamp(score, -1, 1);
    },
    summary: (body) =>
      `rsi ${body?.indicators?.rsi14 ?? "?"} · trend ${body?.indicators?.trend ?? "?"}`,
  },
  {
    label: "sentiment",
    url: SENT_URL,
    score: (body) => {
      // sentiment.score in [-1, 1]; pass through if numeric.
      const s = body?.sentiment?.score;
      if (typeof s === "number" && Number.isFinite(s)) return clamp(s, -1, 1);
      return 0;
    },
    summary: (body) =>
      `${body?.sentiment?.label ?? "?"} (${body?.sentiment?.score ?? "?"})`,
  },
];

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function fmt(n) { return typeof n === "number" ? n.toFixed(4) : "n/a"; }
function count(a) { return Array.isArray(a) ? a.length : 0; }

function parseToken(input) {
  const raw = (input || "SOL").toLowerCase();
  // Natural-language phrasings: "should i long bitcoin", "buy or sell eth"
  const aliases = [
    [/\bbitcoin\b|\bbtc\b/, "BTC"],
    [/\bethereum\b|\bether\b|\beth\b/, "ETH"],
    [/\bsolana\b|\bsol\b/, "SOL"],
  ];
  for (const [re, sym] of aliases) {
    if (re.test(raw)) return sym;
  }
  // Fall back to the first whitespace-delimited token, uppercased.
  return (raw.split(/\s+/)[0] || "SOL").toUpperCase();
}

function loadApiKey() {
  if (process.env.CHEST_API_KEY) return process.env.CHEST_API_KEY;
  const authPath = join(homedir(), ".chest", "auth.json");
  if (existsSync(authPath)) {
    try {
      const auth = JSON.parse(readFileSync(authPath, "utf-8"));
      if (typeof auth?.token === "string" && auth.token.startsWith("ca_live_")) {
        return auth.token;
      }
    } catch {
      // fall through to the unauth error below
    }
  }
  return null;
}

async function callOne(src, apiKey) {
  const t0 = Date.now();
  try {
    const res = await paidFetch(src.url, {
      mode: "api-key",
      apiKey,
      appSlug: APP_SLUG,
    });
    return {
      label: src.label,
      url: src.url,
      ok: true,
      ms: Date.now() - t0,
      body: res.body,
      receipt: res.receipt,
      payer: res.payer,
      score: src.score(res.body),
      summary: src.summary(res.body),
    };
  } catch (err) {
    return { label: src.label, url: src.url, ok: false, ms: Date.now() - t0, error: err.message };
  }
}

const apiKey = loadApiKey();
if (!apiKey) {
  console.error(
    "No Chest agent token found.\n" +
    "Mint one at https://chest.sh/app/agent-wallet, then either:\n" +
    "  export CHEST_API_KEY=ca_live_…\n" +
    "  or save it to ~/.chest/auth.json as { \"token\": \"ca_live_…\" }",
  );
  process.exit(1);
}

console.log(`\nTrading decision: ${TOKEN}`);
console.log(`Pulling ${SOURCES.length} paid signals in parallel from ${SOURCES.length} providers\n`);

const t0 = Date.now();
const results = await Promise.all(SOURCES.map((s) => callOne(s, apiKey)));
const totalMs = Date.now() - t0;

// Per-source line + split breakdown
let totalAtomic = 0n;
let totalProvider = 0n;
let totalAuthor = 0n;
let totalPlatform = 0n;
let totalScore = 0;
let totalWeight = 0;
for (const r of results) {
  if (!r.ok) {
    console.log(`  ✗ ${r.label.padEnd(10)} ${r.ms}ms   error: ${r.error}`);
    continue;
  }
  const tx = r.receipt?.txSignature ? r.receipt.txSignature.slice(0, 12) + "…" : "(no receipt)";
  const amt = r.receipt?.amount ?? "n/a";
  if (typeof r.receipt?.amount === "string" && /^\d+$/.test(r.receipt.amount)) {
    totalAtomic += BigInt(r.receipt.amount);
  }
  const merchant = readAtomic(r.receipt?.merchantAmount);
  const referrer = readAtomic(r.receipt?.referrerAmount);
  const protocol = readAtomic(r.receipt?.protocolAmount);
  totalProvider += merchant;
  totalAuthor += referrer;
  totalPlatform += protocol;

  console.log(
    `  ✓ ${r.label.padEnd(10)} ${String(r.ms).padStart(4)}ms   ` +
      `score=${r.score.toFixed(2).padStart(5)}   ` +
      `tx=${tx}   amt=${amt}   ${r.summary}`,
  );
  if (merchant || referrer || protocol) {
    console.log(
      `              split: provider ${merchant} · skill author ${referrer} · platform ${protocol}`,
    );
  }
  totalScore += r.score;
  totalWeight += 1;
}

const ok = results.filter(r => r.ok);
if (ok.length === 0) {
  console.error("\nAll sources failed. Aborting decision.");
  process.exit(2);
}

const consensus = totalWeight ? totalScore / totalWeight : 0;
const verdict =
  consensus > 0.25 ? "BUY"
  : consensus < -0.25 ? "SELL"
  : "HOLD";

console.log();
console.log(`  consensus score : ${consensus.toFixed(3)} (mean of ${totalWeight} sources)`);
console.log(`  decision        : ${verdict} ${TOKEN}`);
console.log(`  total spent     : ${totalAtomic} atomic USDC (${ok.length} of ${results.length} settled)`);
if (totalProvider || totalAuthor || totalPlatform) {
  console.log(`  → providers     : ${totalProvider} atomic USDC (${SOURCES.length} publishers)`);
  console.log(`  → skill author  : ${totalAuthor} atomic USDC (this skill's referrer wallet)`);
  console.log(`  → platform      : ${totalPlatform} atomic USDC (chest.sh)`);
}
console.log(`  total latency   : ${totalMs}ms (parallel)`);
console.log();

function readAtomic(v) {
  if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
  if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.round(v));
  return 0n;
}
