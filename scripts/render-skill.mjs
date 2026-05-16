#!/usr/bin/env node
// Fetches chest.sh/skill.md and writes it to plugins/chest/skills/chest/SKILL.md.
// Used by the sync workflow and for local rendering.

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const SOURCE = process.env.SKILL_SOURCE_URL ?? 'https://chest.sh/skill.md'
const OUT = resolve(process.cwd(), 'plugins/chest/skills/chest/SKILL.md')

const res = await fetch(SOURCE)
if (!res.ok) {
  console.error(`Failed to fetch ${SOURCE}: ${res.status}`)
  process.exit(1)
}
const body = await res.text()

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, body)
console.log(`Wrote ${OUT} (${body.length} bytes from ${SOURCE})`)
