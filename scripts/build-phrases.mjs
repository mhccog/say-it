// Turns data/phrases.psv into src/data/phrases.json (run: npm run phrases)
import { readFileSync, writeFileSync } from 'node:fs'
const lines = readFileSync('data/phrases.psv', 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'))
const out = lines.map((l, i) => {
  const [need, feeling, situation, sources, ...rest] = l.split('|')
  return { id: 'p' + String(i + 1).padStart(3, '0'), need, feeling, situation, sources: sources.split(','), text: rest.join('|').trim() }
})
writeFileSync('src/data/phrases.json', JSON.stringify(out, null, 1))
console.log(out.length + ' phrases')
