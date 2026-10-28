import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { detectSupport, practise, type Result, type Session, type Support } from '@/lib/practice'

/** Practise one line out loud. Pitch and pace are measured on this device; nothing is uploaded by Say it. */
export function Practice({ text, onClose }: { text: string; onClose: () => void }) {
  const [support, setSupport] = useState<Support | null>(null)
  const [online, setOnline] = useState(false) // opt-in: let the browser's own speech service check the words
  const [state, setState] = useState<'idle' | 'listening' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [err, setErr] = useState('')
  const session = useRef<Session | null>(null)

  useEffect(() => { detectSupport().then(setSupport) }, [])
  useEffect(() => () => session.current?.stop(), [])

  if (!support) return <p className="text-sm text-muted-foreground">Checking your browser&hellip;</p>
  if (!support.mic || !support.audio) {
    return (
      <div className="text-sm">
        <p>Practice needs microphone access, which this browser doesn&rsquo;t offer here. Try Safari on iPhone or Chrome.</p>
        <button type="button" className="mt-1 inline-flex min-h-6 items-center text-xs font-medium text-primary" onClick={onClose}>Close</button>
      </div>
    )
  }
  const words = support.localSpeech || (support.speech && online)

  async function start() {
    setErr(''); setResult(null)
    try {
      const s = await practise(text, { useSpeech: !!words, local: support!.localSpeech && !online })
      session.current = s; setState('listening')
      const r = await s.done
      session.current = null; setResult(r); setState('done')
    } catch {
      setState('error'); setErr('I couldn\u2019t use the microphone. Check the permission and try again.')
    }
  }

  return (
    <div className="text-sm">
      <p className="mb-2 text-muted-foreground">Say the line out loud. I&rsquo;ll listen for pace and whether it ends on a lower note{words ? ', and check the words and fillers' : ''}.</p>
      {state === 'listening'
        ? <Button className="min-h-10 rounded-full px-4" onClick={() => session.current?.stop()}><Square /> Stop</Button>
        : <Button className="min-h-10 rounded-full px-4" onClick={start}><Mic /> {state === 'done' ? 'Try again' : 'Start'}</Button>}
      {state === 'listening' && <span className="ml-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite"><span className="size-2 animate-pulse rounded-full bg-destructive" /> Listening&hellip;</span>}
      {err && <p className="mt-2 text-destructive">{err}</p>}
      {result && (
        <div className="pop mt-3 rounded-xl bg-card p-3 shadow-soft" aria-live="polite">
          <p className="font-medium">{result.line}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.wpm ? `Pace about ${result.wpm} words a minute` : 'Pace: not enough to measure'}
            {result.endsLower !== undefined && ` \u00b7 ending ${result.endsLower ? 'lower' : 'not lower'}`}
            {result.fillers !== undefined && ` \u00b7 fillers ${result.fillers}`}
          </p>
        </div>
      )}
      {support.speech && !support.localSpeech && (
        <label className="mt-3 flex min-h-8 items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={online} onChange={(e) => setOnline(e.target.checked)} />
          <span>Also check my words and fillers. This uses your browser&rsquo;s speech service (Apple or Google), which may send the audio to their servers.</span>
        </label>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {online
          ? 'Pitch and pace are worked out on this device. For the words, your browser\u2019s speech service hears the audio. Say it stores nothing.'
          : words
            ? 'Audio stays on this device: pitch, pace and words are all worked out here.'
            : 'Audio stays on this device: pitch and pace are worked out here, and nothing is recorded or uploaded.'}
      </p>
      <button type="button" className="mt-1 inline-flex min-h-6 items-center text-xs font-medium text-primary" onClick={onClose}>Close</button>
    </div>
  )
}
