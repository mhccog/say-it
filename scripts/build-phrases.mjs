// Turns data/phrases.psv (+ data/review.json) into src/data/phrases.json. Run: npm run phrases (the build runs it too).
// Line format: need|feeling|situation|sources|text|delivery|basis|context|emotion|replaces  (fields after text are optional)
// IDs come from the order of phrase lines, so ONLY APPEND to the file (see header there).
// To fix a phrase, append a new row with the old ID in "replaces". The old row stays (so IDs never move) and the app hides it.
// data/review.json holds review choices baked in from an export (npm run bake -- say-it-review.json).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const NEEDS = ['any', 'significance', 'approval', 'acceptance', 'intelligence', 'pity', 'power']
const FEELINGS = ['heard', 'understood', 'liked', 'trusted', 'respected', 'comfortable', 'reassured', 'included', 'important', 'smart', 'control', 'reconciled', 'appreciated', 'curious']
const SITUATIONS = ['opener', 'rapport', 'disagree', 'close']
const EMOTIONS = ['joy', 'sadness', 'fear', 'anger', 'surprise', 'disgust', 'contempt']

const errors = []
const lines = readFileSync('data/phrases.psv', 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'))

// One blank style: any "[hint]" becomes "___", and the hint moves into the card's context line.
function blanks(text) {
  const hints = []
  const out = text.replace(/\[([^\]]+)\]/g, (_, h) => { if (h.trim().toLowerCase() !== 'x') hints.push(h.trim()); return '___' })
  return { text: out, hints }
}

const out = lines.map((l, i) => {
  const id = 'p' + String(i + 1).padStart(3, '0')
  const f = l.split('|')
  if (f.length > 10) errors.push(`${id}: too many fields (${f.length})`)
  const [need, feeling, situation, sources, rawText, delivery, basis, ctx, emotion, replaces] = f.map((x) => x?.trim())
  if (!NEEDS.includes(need)) errors.push(`${id}: unknown need "${need}"`)
  if (!FEELINGS.includes(feeling)) errors.push(`${id}: unknown feeling "${feeling}"`)
  if (!SITUATIONS.includes(situation)) errors.push(`${id}: unknown situation "${situation}"`)
  if (emotion && !EMOTIONS.includes(emotion)) errors.push(`${id}: unknown emotion "${emotion}"`)
  const { text, hints } = blanks(rawText ?? '')
  const o = { id, need, feeling, situation, sources: sources.split(','), text }
  if (delivery) o.delivery = delivery
  if (basis) o.basis = basis
  const ctxParts = [ctx, hints.length ? 'Fill in: ' + hints.join(', ') + '.' : ''].filter(Boolean)
  if (ctxParts.length) o.ctx = ctxParts.join(' ')
  if (emotion) o.emotion = emotion
  if (replaces) o.replaces = replaces.split(',').map((s) => s.trim())
  return o
})

const byId = new Map(out.map((p) => [p.id, p]))
for (const p of out) for (const old of p.replaces ?? []) {
  const target = byId.get(old)
  if (!target) { errors.push(`${p.id}: replaces unknown ${old}`); continue }
  if (old >= p.id) { errors.push(`${p.id}: can only replace an earlier row (${old})`); continue }
  if (target.supersededBy) errors.push(`${old} is replaced twice (${target.supersededBy}, ${p.id})`)
  target.supersededBy = p.id
}

if (existsSync('data/review.json')) {
  const baked = JSON.parse(readFileSync('data/review.json', 'utf8'))
  for (const [id, r] of Object.entries(baked)) {
    const p = byId.get(id)
    if (!p) { errors.push(`data/review.json: unknown ${id}`); continue }
    if (r.status === 'keep' || r.status === 'bin') p.status = r.status
    if (r.text) p.editedText = blanks(r.text).text
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
writeFileSync('src/data/phrases.json', JSON.stringify(out, null, 1) + '\n')
const active = out.filter((p) => !p.supersededBy).length
console.log(`${out.length} phrases (${active} active, ${out.length - active} superseded)`)
