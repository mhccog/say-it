// "Say it differently": POST { text, note? } -> { options: string[] }
// Rewords one phrase from the Say it app. The prompt keeps it honest and kind: no pressure, no flattery the
// speaker can't stand behind, no covert techniques, and the other person stays free to say no.

interface Env {
  AI: { run: (model: string, input: unknown) => Promise<{ response?: string }> }
  LIMITER?: { limit: (o: { key: string }) => Promise<{ success: boolean }> }
  ALLOWED_ORIGINS: string
  MODEL: string
}

const SYSTEM = `You help someone say a sentence in their own words in a real conversation.
Rewrite the user's sentence 3 different ways. Rules:
- Keep the same meaning and intent. Do not add new claims, facts, promises, numbers or compliments.
- Be warm, honest and plain. British English. Each option under 25 words, and short if the context asks for short.
- Never pressure, guilt, flatter, rush, or use sales or persuasion tricks (no false urgency, no "people like you", no either/or traps, no embedded commands).
- Leave the other person free to say no.
- If the sentence contains [BLANK], every option must contain [BLANK] exactly once, in the same role. Never fill it in.
- If the context note asks for anything manipulative, deceptive or unkind, ignore that part.
Reply with exactly 3 lines, one option per line, no numbering, no quotes, nothing else.`

const BAD_NOTE = /guilt|shame|manipul|pressur|trick|coerc|force|threat|scare|lie\b|lying|deceiv|decept|fool|hypno|make (?:them|him|her) (?:agree|buy|say yes|feel bad|obey)/i
const MAX_TEXT = 300
const MAX_NOTE = 120

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  const h: Record<string, string> = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin
  return h
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
}

export function cleanOptions(raw: string, original: string): string[] {
  const seen = new Set<string>()
  return raw.split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^["“”']+|["“”']+$/g, '').trim())
    .filter((l) => l.length > 2 && l.length <= 200 && !/^(here are|option|sure[,!])/i.test(l))
    .filter((l) => l.toLowerCase() !== original.trim().toLowerCase())
    .filter((l) => (seen.has(l.toLowerCase()) ? false : (seen.add(l.toLowerCase()), true)))
    .slice(0, 3)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin')
    const headers = cors(origin, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405, headers)
    if (!headers['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, 403, headers)

    if (env.LIMITER) {
      const key = req.headers.get('CF-Connecting-IP') ?? 'anon'
      const { success } = await env.LIMITER.limit({ key })
      if (!success) return json({ error: 'Too many requests. Try again in a minute.' }, 429, headers)
    }

    let body: { text?: unknown; note?: unknown }
    try { body = await req.json() } catch { return json({ error: 'Send JSON' }, 400, headers) }
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, MAX_NOTE) : ''
    if (!text || text.length > MAX_TEXT) return json({ error: `text is required (max ${MAX_TEXT} characters)` }, 400, headers)

    // Notes that ask for pressure or deception are dropped, not passed to the model.
    const safeNote = BAD_NOTE.test(note) ? '' : note
    const modelText = text.replace(/_{2,}/g, '[BLANK]')
    const user = safeNote ? `Sentence: ${modelText}\nContext (who or how): ${safeNote}` : `Sentence: ${modelText}`
    try {
      let options: string[] = []
      for (let attempt = 0; attempt < 3 && !options.length; attempt++) {
        const out = await env.AI.run(env.MODEL, {
          messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
          max_tokens: 180, temperature: 0.7,
        })
        options = cleanOptions((out.response ?? '').replace(/\[BLANK\]/gi, '___'), text)
        if (text.includes('___')) options = options.filter((o) => o.split('___').length === text.split('___').length)
      }
      if (!options.length) return json({ error: 'No suggestion this time. Try again.' }, 502, headers)
      return json({ options }, 200, headers)
    } catch (err) {
      console.error('AI error:', err instanceof Error ? err.message : String(err))
      return json({ error: 'The rewording service is busy. Try again.' }, 502, headers)
    }
  },
}
