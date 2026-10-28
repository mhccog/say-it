// "Practice out loud": everything here runs in the browser. Pitch and pace come from Web Audio on this device.
// Word checking uses the browser's speech recognition, and only when it can run on the device (processLocally),
// unless the user opts in to the browser's online speech service.

type SR = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number; processLocally?: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type SRCtor = (new () => SR) & { available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>; install?: (o: { langs: string[]; processLocally: boolean }) => Promise<boolean> }

export function speechCtor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface Support { mic: boolean; audio: boolean; speech: boolean; localSpeech: boolean }

export async function detectSupport(lang = 'en-GB'): Promise<Support> {
  const mic = !!navigator.mediaDevices?.getUserMedia
  const audio = typeof window.AudioContext !== 'undefined' || 'webkitAudioContext' in window
  const C = speechCtor()
  let localSpeech = false
  if (C?.available) {
    try { localSpeech = (await C.available({ langs: [lang], processLocally: true })) === 'available' } catch { localSpeech = false }
  }
  return { mic, audio, speech: !!C, localSpeech }
}

/** Autocorrelation pitch estimate in Hz, or 0 when the frame is quiet or unvoiced. */
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  let rms = 0
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / buf.length)
  if (rms < 0.012) return 0
  const minLag = Math.floor(sampleRate / 400), maxLag = Math.floor(sampleRate / 70)
  let best = 0, bestLag = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < buf.length - lag; i++) sum += buf[i] * buf[i + lag]
    if (sum > best) { best = sum; bestLag = lag }
  }
  let energy = 0
  for (let i = 0; i < buf.length; i++) energy += buf[i] * buf[i]
  if (!bestLag || best / energy < 0.3) return 0
  return sampleRate / bestLag
}

const FILLERS = /\b(um+|uh+|erm+|er|ah+|hmm+|you know|i mean|sort of|kind of)\b/gi
const words = (s: string) => s.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter((w) => w && w !== '___')

export interface Result {
  transcript?: string; wordMatch?: number; fillers?: number
  wpm?: number; endsLower?: boolean; voicedSeconds: number
  line: string
}

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0 }

/** Turn the measurements into one encouraging line. */
export function analyse(target: string, frames: { t: number; hz: number }[], transcript?: string): Result {
  const voiced = frames.filter((f) => f.hz > 0)
  const voicedSeconds = voiced.length ? voiced[voiced.length - 1].t - voiced[0].t : 0
  const targetWords = words(target)
  const r: Result = { voicedSeconds, line: '' }
  if (voiced.length >= 8) {
    const n = voiced.length
    const start = median(voiced.slice(0, Math.ceil(n / 2)).map((f) => f.hz))
    const end = median(voiced.slice(Math.floor(n * 0.75)).map((f) => f.hz))
    r.endsLower = end < start * 0.97
  }
  if (voicedSeconds > 0.6) r.wpm = Math.round(((transcript ? words(transcript).length : targetWords.length) / voicedSeconds) * 60)
  if (transcript !== undefined) {
    r.transcript = transcript
    const said = new Set(words(transcript))
    r.wordMatch = targetWords.length ? targetWords.filter((w) => said.has(w)).length / targetWords.length : 1
    r.fillers = (transcript.match(FILLERS) ?? []).length
  }
  if (voiced.length < 8) r.line = 'I couldn\u2019t hear much. Try again a little closer to the mic.'
  else if (r.wordMatch !== undefined && r.wordMatch < 0.6) r.line = 'Good go. Try it once more, close to the words on the card.'
  else if (r.fillers) r.line = 'Lovely. Next time, swap the \u201cum\u201d for a short pause.'
  else if (r.endsLower === false) r.line = 'Nice and warm. Let the last word drop a little lower; it will sound more sure.'
  else if (r.wpm && r.wpm > 185) r.line = 'Good energy. Slow down a touch on the line that matters.'
  else r.line = 'That sounded calm and clear. Well done.'
  return r
}

export interface Session { stop: () => void; done: Promise<Result> }

/** Record one attempt: pitch frames from Web Audio, plus words when speech recognition is allowed. */
export async function practise(target: string, opts: { useSpeech: boolean; local: boolean; maxSeconds?: number; lang?: string }): Promise<Session> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AC()
  await ctx.resume()
  const src = ctx.createMediaStreamSource(stream)
  const an = ctx.createAnalyser(); an.fftSize = 2048
  src.connect(an)
  const buf = new Float32Array(an.fftSize)
  const frames: { t: number; hz: number }[] = []
  const t0 = performance.now()
  let lastVoiced = -1
  const timer = window.setInterval(() => {
    an.getFloatTimeDomainData(buf)
    const t = (performance.now() - t0) / 1000, hz = detectPitch(buf, ctx.sampleRate)
    frames.push({ t, hz })
    if (hz > 0) lastVoiced = t
    else if (lastVoiced > 0 && t - lastVoiced > 1.6) stop() // they have finished the line
  }, 40)

  let transcript: string | undefined
  let rec: SR | null = null
  let finish!: (r: Result) => void
  const done = new Promise<Result>((res) => { finish = res })
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    window.clearInterval(timer); window.clearTimeout(limit)
    try { rec?.stop() } catch { /* already stopped */ }
    stream.getTracks().forEach((t) => t.stop())
    ctx.close().catch(() => {})
    // give recognition a moment to deliver its final words
    window.setTimeout(() => finish(analyse(target, frames, transcript)), rec ? 700 : 0)
  }
  const limit = window.setTimeout(stop, (opts.maxSeconds ?? 12) * 1000)

  const C = speechCtor()
  if (opts.useSpeech && C) {
    rec = new C()
    rec.lang = opts.lang ?? 'en-GB'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1
    if (opts.local) rec.processLocally = true
    transcript = ''
    rec.onresult = (e) => { transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ') }
    rec.onerror = () => { /* fall back to pitch and pace only */ if (!transcript) transcript = undefined }
    rec.onend = () => { rec = null }
    try { rec.start() } catch { transcript = undefined; rec = null }
  }
  return { stop, done }
}
