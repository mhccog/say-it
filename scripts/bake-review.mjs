// Bakes a Review-mode export (say-it-review.json) into data/review.json, so kept / binned / edited choices
// ship with the app. It never touches data/phrases.psv, so phrase IDs stay exactly the same.
// Run: npm run bake -- path/to/say-it-review.json   then commit data/review.json and src/data/phrases.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const file = process.argv[2]
if (!file) { console.error('Usage: npm run bake -- path/to/say-it-review.json'); process.exit(1) }
const payload = JSON.parse(readFileSync(file, 'utf8'))
if (payload.app !== 'say-it' || !Array.isArray(payload.items)) { console.error('Not a Say it review export.'); process.exit(1) }

const phrases = JSON.parse(readFileSync('src/data/phrases.json', 'utf8'))
const byId = new Map(phrases.map((p) => [p.id, p]))
const baked = existsSync('data/review.json') ? JSON.parse(readFileSync('data/review.json', 'utf8')) : {}
let changed = 0, skipped = 0
for (const it of payload.items) {
  const p = byId.get(it.id)
  if (!p) { console.warn(`skip ${it.id}: no such phrase`); skipped++; continue }
  if (it.original && it.original !== p.text) { console.warn(`skip ${it.id}: the original text does not match this phrase`); skipped++; continue }
  const entry = {}
  if (it.status === 'keep' || it.status === 'bin') entry.status = it.status
  if (it.edited && it.text && it.text.trim() !== p.text) entry.text = it.text.trim()
  if (Object.keys(entry).length) baked[it.id] = entry; else delete baked[it.id]
  changed++
}
const sorted = Object.fromEntries(Object.keys(baked).sort().map((k) => [k, baked[k]]))
writeFileSync('data/review.json', JSON.stringify(sorted, null, 1) + '\n')
execFileSync('node', ['scripts/build-phrases.mjs'], { stdio: 'inherit' })
console.log(`Baked ${changed} choices (${skipped} skipped). Now commit data/review.json and src/data/phrases.json.`)
