// Turns data/phrases.psv into src/data/phrases.json (run: npm run phrases)
// Line format: need|feeling|situation|sources|text|delivery|basis|context  (last three optional)
// IDs come from the order of phrase lines, so ONLY APPEND to the file (see header there).
import { readFileSync, writeFileSync } from 'node:fs'
const lines = readFileSync('data/phrases.psv', 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'))
const out = lines.map((l, i) => {
  const [need, feeling, situation, sources, text, delivery, basis, ctx, emotion] = l.split('|')
  const o = { id: 'p' + String(i + 1).padStart(3, '0'), need, feeling, situation, sources: sources.split(','), text: text.trim() }
  if (delivery?.trim()) o.delivery = delivery.trim()
  if (basis?.trim()) o.basis = basis.trim()
  if (ctx?.trim()) o.ctx = ctx.trim()
  if (emotion?.trim()) o.emotion = emotion.trim()
  return o
})
writeFileSync('src/data/phrases.json', JSON.stringify(out, null, 1))
console.log(out.length + ' phrases')
