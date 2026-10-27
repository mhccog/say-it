import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, Download, Eye, Info, Pencil, Trash2, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  CHASE_SPOT, EMOTIONS, EMOTION_NOTE, FEELINGS, PROFILES, FEELING_TIPS, NEEDS, SITUATIONS, SOURCES, TIPS, sourceHref,
  type NeedId, type Situation,
} from '@/data/content'
import phrasesRaw from '@/data/phrases.json'

interface Phrase { id: string; need: string; feeling: string; situation: Situation; sources: string[]; text: string; delivery?: string; basis?: string; ctx?: string; emotion?: string }
const PHRASES = phrasesRaw as Phrase[]

type Status = 'keep' | 'bin'
type Review = Record<string, { status?: Status; text?: string }>
const KEY = 'say-it:review:v1'

function loadReview(): Review {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true } catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    ta.remove(); return ok
  }
}

function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button" title={title} aria-pressed={active} onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25'
          : 'border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-accent',
      )}
    >{children}</button>
  )
}

export default function App() {
  const [need, setNeed] = useState<NeedId | null>(null)
  const [feeling, setFeeling] = useState<string | null>(null)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [mode, setMode] = useState<'feel' | 'now' | 'map'>('feel')
  const [situation, setSituation] = useState<Situation | 'all'>('all')
  const [spotOpen, setSpotOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const LIMIT = 8
  const [reviewMode, setReviewMode] = useState(false)
  const [showBinned, setShowBinned] = useState(false)
  const [review, setReview] = useState<Review>(loadReview)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [about, setAbout] = useState(false)
  const [installEvt, setInstallEvt] = useState<any>(null)
  const toastTimer = useRef<number>(0)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(review)) }, [review])
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const say = (m: string) => { setToast(m); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 1600) }
  const textOf = (p: Phrase) => review[p.id]?.text ?? p.text
  const statusOf = (p: Phrase): Status | 'draft' => review[p.id]?.status ?? 'draft'
  const setStatus = (id: string, status?: Status) => setReview((r) => ({ ...r, [id]: { ...r[id], status } }))

  const needObj = NEEDS.find((n) => n.id === need) ?? null
  const feelingObj = FEELINGS.find((f) => f.id === feeling) ?? null

  const { best, more } = useMemo(() => {
    const visible = (p: Phrase) => (showBinned || statusOf(p) !== 'bin') && (situation === 'all' || p.situation === situation)
    const pool = PHRASES.filter(visible)
    const bestList = need && feeling ? pool.filter((p) => p.feeling === feeling && (p.need === need || p.need === 'any')) : []
    // exact type first, then general
    const rank = (p: Phrase) => (p.need === need ? 0 : emotion && p.emotion === emotion ? 1 : p.ctx ? 3 : 2)
    bestList.sort((a, b) => rank(a) - rank(b))
    const moreList = need && feeling && bestList.length < 3 ? pool.filter((p) => p.need === need && p.feeling !== feeling) : []
    return { best: bestList, more: moreList }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need, feeling, emotion, situation, review, showBinned])

  useEffect(() => { setShowAll(false) }, [need, feeling, situation])
  useEffect(() => {
    if (need && feeling) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [need, feeling])

  const counts = useMemo(() => {
    let keep = 0, bin = 0, edited = 0
    for (const p of PHRASES) { const r = review[p.id]; if (r?.status === 'keep') keep++; if (r?.status === 'bin') bin++; if (r?.text) edited++ }
    return { keep, bin, edited }
  }, [review])

  function exportData() {
    const items = PHRASES.filter((p) => review[p.id]).map((p) => ({
      id: p.id, need: p.need, feeling: p.feeling, situation: p.situation,
      status: review[p.id].status ?? 'draft', original: p.text, text: review[p.id].text ?? p.text,
      edited: !!review[p.id].text,
    }))
    const payload = { app: 'say-it', version: 1, exportedAt: new Date().toISOString(), counts, items }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'say-it-review.json'
    document.body.appendChild(a); a.click(); a.remove()
    copyText(json).then((ok) => say(ok ? 'Exported and copied' : 'Exported'))
  }

  async function onCopy(p: Phrase) {
    const ok = await copyText(textOf(p))
    say(ok ? 'Copied. Paste it anywhere.' : 'Could not copy')
  }

  // Group "KEY@time" entries by key so one source shows once, with a link per timestamp.
  function srcGroups(keys: string[], prefix = '') {
    const groups = new Map<string, string[]>()
    for (const k of keys) {
      const [key, ts] = k.split('@')
      if (!groups.has(key)) groups.set(key, [])
      if (ts) groups.get(key)!.push(ts)
    }
    const linkCls = 'underline underline-offset-2 hover:text-foreground'
    return [...groups.entries()].map(([key, times]) => {
      const s = SOURCES[key]
      if (!s) return null
      const href = sourceHref(key)
      return (
        <span key={prefix + key}>
          {prefix}
          {s.platform && <span className="mr-1.5 rounded-full bg-secondary px-1.5 py-0.5 font-medium text-foreground/70">{s.platform}</span>}
          {href ? <a href={href} target="_blank" rel="noreferrer" className={times.length ? '' : linkCls}>{s.label}</a> : s.label}
          {times.map((t) => (
            <a key={t} href={sourceHref(key, t)} target="_blank" rel="noreferrer" className={cn('ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 font-medium text-foreground/70 hover:bg-accent', )} title="Opens YouTube at this moment">&#9654; {t}</a>
          ))}
        </span>
      )
    })
  }

  const emotionObj = EMOTIONS.find((e) => e.id === emotion) ?? null

  function pickFeeling(id: string) {
    setFeeling(id === feeling ? null : id)
    // choosing a feeling directly means we are no longer reasoning from an emotion
    if (emotionObj && !emotionObj.targets.includes(id)) setEmotion(null)
  }
  function pickEmotion(id: string) {
    if (id === emotion) { setEmotion(null); return }
    const e = EMOTIONS.find((x) => x.id === id)!
    setEmotion(id)
    if (!feeling || !e.targets.includes(feeling)) setFeeling(e.targets[0]) // suggest the first target
  }

  function renderEmotionDetail(e: (typeof EMOTIONS)[number], showAim = true) {
    const row = (k: string, v: string) => (
      <div className="grid grid-cols-[3.2rem_1fr] gap-2"><span className="font-semibold text-accent-foreground">{k}</span><span>{v}</span></div>
    )
    return (
      <div className="pop mt-2 space-y-2 rounded-3xl border border-primary/20 bg-accent/60 p-4 text-sm">
        <p className="font-semibold">How to spot {e.label.toLowerCase()}</p>
        {row('Face', e.face)}{row('Voice', e.voice)}{row('Words', e.words)}
        <p className="rounded-2xl bg-card/80 p-2.5"><span className="font-semibold">How to respond: </span>{e.respond}</p>
        {showAim && <div>
          <p className="mb-1.5 font-semibold">Aim for (tap to switch)</p>
          <div className="flex flex-wrap gap-2">
            {e.targets.map((t, i) => {
              const f = FEELINGS.find((x) => x.id === t)!
              return <Chip key={t} active={feeling === t} onClick={() => setFeeling(t)}><span className="mr-1">{f.emoji}</span>{f.label}{i === 0 && <span className="ml-1.5 text-[0.65rem] uppercase tracking-wide opacity-70">suggested</span>}</Chip>
            })}
          </div>
        </div>}
        <p className="text-xs text-muted-foreground">{EMOTION_NOTE} Source: <a className="underline" href={SOURCES.EK.url} target="_blank" rel="noreferrer">Paul Ekman Group</a>.</p>
      </div>
    )
  }

  function renderCard(p: Phrase, general?: boolean) {
    const st = statusOf(p)
    const tipIds = FEELING_TIPS[p.feeling] ?? []
    const tip = TIPS[tipIds[hash(p.id) % Math.max(tipIds.length, 1)]]
    const example = p.basis === 'source-example' ? "Coach's own example" : p.basis === 'source-example/adapted' ? "Based on a coach's example" : p.basis === 'nci' ? 'From NCI (secondary)' : p.basis === 'social' ? "From a coach's post (summarised)" : null
    const sit = SITUATIONS.find((s) => s.id === p.situation)!
    const isEditing = editing === p.id
    return (
      <div key={p.id} className={cn('pop group relative rounded-3xl border bg-card p-4 shadow-sm shadow-black/[0.03] transition-shadow', st === 'bin' && 'opacity-50', st === 'keep' && 'border-primary/40')}>
        <button type="button" onClick={() => !isEditing && onCopy(p)} className="block w-full text-left" aria-label="Copy phrase">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-full">{sit.label}</Badge>
            {general && <Badge variant="outline" className="rounded-full text-muted-foreground">General</Badge>}
            {p.emotion && <Badge variant="outline" className="rounded-full border-violet-200 bg-violet-50 text-violet-800">For {EMOTIONS.find((e) => e.id === p.emotion)?.label.toLowerCase()}</Badge>}
            {example && <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-800">{example}</Badge>}
            {st === 'draft' && <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 text-amber-800">Draft</Badge>}
            {st === 'keep' && <Badge className="rounded-full">Kept</Badge>}
            {st === 'bin' && <Badge variant="destructive" className="rounded-full">Binned</Badge>}
            {review[p.id]?.text && <Badge variant="outline" className="rounded-full">Edited</Badge>}
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Copy className="size-3" /> tap to copy</span>
          </div>
          {!isEditing && <p className="text-[1.05rem] leading-relaxed font-medium text-foreground">{textOf(p)}</p>}
          {!isEditing && p.ctx && <p className="mt-1.5 text-xs text-muted-foreground">{p.ctx}</p>}
        </button>
        {isEditing && (
          <div>
            <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={3}
              className="w-full rounded-2xl border border-input bg-background p-3 text-base outline-none focus:ring-3 focus:ring-ring/40" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => { setReview((r) => ({ ...r, [p.id]: { ...r[p.id], text: draftText.trim() === p.text ? undefined : draftText.trim(), status: r[p.id]?.status ?? 'keep' } })); setEditing(null) }}><Check /> Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X /> Cancel</Button>
            </div>
          </div>
        )}
        <div className="mt-3 rounded-2xl bg-accent/70 p-3 text-sm text-accent-foreground">
          <span className="font-semibold">How to say it: </span>{p.delivery ?? tip.text}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Source:</span>
          {srcGroups(p.sources)}
          {!p.delivery && srcGroups([tip.source], 'Tip: ')}
        </div>
        {reviewMode && !isEditing && (
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            <Button size="sm" variant={st === 'keep' ? 'default' : 'outline'} onClick={() => setStatus(p.id, st === 'keep' ? undefined : 'keep')}><Check /> Keep</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); setDraftText(textOf(p)) }}><Pencil /> Edit</Button>
            {st === 'bin'
              ? <Button size="sm" variant="outline" onClick={() => setStatus(p.id, undefined)}><Undo2 /> Restore</Button>
              : <Button size="sm" variant="outline" onClick={() => setStatus(p.id, 'bin')}><Trash2 /> Bin</Button>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-svh max-w-2xl px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-2 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur">
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="size-9 rounded-xl" />
        <div className="leading-tight">
          <h1 className="text-lg font-bold tracking-tight">Say it</h1>
          <p className="text-xs text-muted-foreground">Pick who, pick the feeling</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant={reviewMode ? 'default' : 'outline'} onClick={() => setReviewMode((v) => !v)}><Eye /> Review</Button>
          <Button size="icon" variant="outline" onClick={() => setAbout(true)} aria-label="About"><Info /></Button>
        </div>
      </header>

      <section aria-labelledby="who">
        <h2 id="who" className="mb-2 text-sm font-semibold text-muted-foreground">1. Who are you talking to?</h2>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((n) => (
            <Chip key={n.id} active={need === n.id} onClick={() => { setNeed(n.id === need ? null : n.id); setSpotOpen(false) }} title={n.hint}>{n.label}</Chip>
          ))}
        </div>
        {needObj ? (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{needObj.label}</span> ({needObj.tier.toLowerCase()}): {needObj.hint.toLowerCase()}.</p>
            <button type="button" onClick={() => setSpotOpen((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary">
              What to listen for <ChevronDown className={cn('size-4 transition-transform', spotOpen && 'rotate-180')} />
            </button>
            {spotOpen && (
              <div className="pop mt-2 rounded-3xl border border-primary/20 bg-accent/60 p-4 text-sm">
                <p className="mb-2 italic text-accent-foreground">The quiet question underneath: &ldquo;{needObj.question}&rdquo;</p>
                <p className="mb-1 font-semibold">You might notice</p>
                <ul className="mb-2 list-disc space-y-0.5 pl-5">{needObj.listenFor.map((l) => <li key={l}>{l}</li>)}</ul>
                <p className="mb-1 font-semibold">They might say</p>
                <ul className="mb-2 list-disc space-y-0.5 pl-5">{needObj.mightSay.map((l) => <li key={l}>{l}</li>)}</ul>
                <p className="mb-2"><span className="font-semibold">Speaking to it: </span>{needObj.speakTo}</p>
                <p className="mb-2 text-xs text-muted-foreground">Hear Chase describe this type: <a className="underline" href={sourceHref('C24', CHASE_SPOT[needObj.id])} target="_blank" rel="noreferrer">YouTube at {CHASE_SPOT[needObj.id]}</a></p>
                <p className="rounded-2xl bg-card/80 p-2.5 text-xs text-muted-foreground">These are things to listen for, not labels. Most people show a mix, and a few minutes can&rsquo;t tell you who someone is. If you are unsure, just ask.</p>
              </div>
            )}
          </div>
        ) : <p className="mt-2 text-sm text-muted-foreground">Tap the need you think they are showing right now.</p>}
      </section>

      <section aria-labelledby="feel" className="mt-6">
        <h2 id="feel" className="mb-2 text-sm font-semibold text-muted-foreground">2. How do you want them to feel?</h2>
        <div role="tablist" className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1 text-sm font-medium">
          {([['feel', 'Aim for'], ['now', 'They feel now'], ['map', 'Side by side']] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={mode === id} type="button" onClick={() => setMode(id)}
              className={cn('rounded-full px-2 py-2 transition-all', mode === id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>{label}</button>
          ))}
        </div>

        {mode === 'feel' && (
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map((f) => (
              <Chip key={f.id} active={feeling === f.id} onClick={() => pickFeeling(f.id)}><span className="mr-1">{f.emoji}</span>{f.label}</Chip>
            ))}
          </div>
        )}

        {mode === 'now' && (
          <>
            <p className="mb-2 text-sm text-muted-foreground">What are they feeling right now? We will suggest what to aim for.</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => (
                <Chip key={e.id} active={emotion === e.id} onClick={() => pickEmotion(e.id)}><span className="mr-1">{e.emoji}</span>{e.label}</Chip>
              ))}
            </div>
            {emotionObj && renderEmotionDetail(emotionObj)}
          </>
        )}

        {mode === 'map' && (
          <div>
            <div className="mb-1.5 grid grid-cols-[7.2rem_1fr] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>They feel</span><span>Aim for</span>
            </div>
            <div className="space-y-2">
              {EMOTIONS.map((e) => (
                <div key={e.id} className={cn('rounded-2xl border bg-card p-2', emotion === e.id ? 'border-primary/50' : 'border-border')}>
                  <div className="grid grid-cols-[7.2rem_1fr] items-center gap-2">
                    <button type="button" aria-pressed={emotion === e.id} onClick={() => pickEmotion(e.id)}
                      className={cn('rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-all active:scale-95', emotion === e.id ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                      <span className="mr-1">{e.emoji}</span>{e.label}
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {e.targets.map((t) => {
                        const f = FEELINGS.find((x) => x.id === t)!
                        const on = feeling === t && emotion === e.id
                        return (
                          <button key={t} type="button" aria-pressed={on} onClick={() => { setEmotion(e.id); setFeeling(t) }}
                            className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-95', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-accent')}>{f.label}</button>
                        )
                      })}
                    </div>
                  </div>
                  {emotion === e.id && renderEmotionDetail(e, false)}
                </div>
              ))}
              {(() => {
                const mapped = new Set(EMOTIONS.flatMap((e) => e.targets))
                const rest = FEELINGS.filter((f) => !mapped.has(f.id))
                return rest.length > 0 && (
                  <div className="rounded-2xl border border-dashed bg-card/60 p-2">
                    <div className="grid grid-cols-[7.2rem_1fr] items-center gap-2">
                      <span className="px-2.5 text-sm text-muted-foreground">Any mood</span>
                      <div className="flex flex-wrap gap-1.5">
                        {rest.map((f) => <button key={f.id} type="button" onClick={() => { setEmotion(null); setFeeling(f.id) }} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', feeling === f.id && !emotion ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')}>{f.label}</button>)}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">3. Where in the conversation? <span className="font-normal">(optional)</span></h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={situation === 'all'} onClick={() => setSituation('all')}>All</Chip>
          {SITUATIONS.map((s) => <Chip key={s.id} active={situation === s.id} onClick={() => setSituation(s.id === situation ? 'all' : s.id)}>{s.label}</Chip>)}
        </div>
      </section>

      <section ref={resultsRef} className="mt-7 scroll-mt-24">
        {need && feeling ? (
          <>
            <h2 className="mb-3 text-base font-bold">
              Words for <span className="text-primary">{needObj?.label}</span> &rarr; <span className="text-primary">{feelingObj?.label}</span>
              {emotionObj && <span className="ml-2 text-xs font-normal text-muted-foreground">(they seem to feel {emotionObj.label.toLowerCase()})</span>}
            </h2>
            {best.length === 0 && more.length === 0 && <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Nothing here for this mix yet. Try &ldquo;All&rdquo; under step 3, or another feeling.</p>}
            <div className="space-y-3">{(showAll ? best : best.slice(0, LIMIT)).map((p) => renderCard(p, p.need === 'any'))}</div>
            {!showAll && best.length > LIMIT && <Button variant="outline" className="mt-3 w-full rounded-full" onClick={() => setShowAll(true)}>Show {best.length - LIMIT} more</Button>}
            {more.length > 0 && (
              <>
                <h3 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">More for {needObj?.label} (other feelings)</h3>
                <div className="space-y-3">{more.map((p) => renderCard(p))}</div>
              </>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
            <p className="text-base font-medium text-foreground">Pick a type and a feeling</p>
            <p className="mt-1">Your phrase cards show up here. Tap a card to copy it.</p>
          </div>
        )}
      </section>

      {reviewMode && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2">
            <span className="text-sm"><b>Review mode</b> · Kept {counts.keep} · Binned {counts.bin} · Edited {counts.edited}</span>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={showBinned} onChange={(e) => setShowBinned(e.target.checked)} /> show binned</label>
            <Button size="sm" onClick={exportData}><Download /> Export</Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm('Clear all your keep / edit / bin choices on this device?')) setReview({}) }}>Reset</Button>
          </div>
        </div>
      )}

      {toast && <div role="status" className="pop fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast}</div>}

      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>About Say it</DialogTitle>
            <DialogDescription>A phrase helper built from personal notes plus public writing from Vanessa Van Edwards, Vinh Giang and Chase Hughes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><b>How it works.</b> The six types are Chase Hughes&rsquo;s social needs. Phrases are original drafts, and each cites where the idea came from. The &ldquo;How to say it&rdquo; tips are delivery ideas (mainly Vinh Giang&rsquo;s).</p>
            <p><b>Please use it kindly.</b> Types are things to listen for, not labels. The aim is that the other person feels heard, respected or at ease, never pressured. No hidden tricks are included.</p>
            <p><b>Review mode.</b> Tap Review to keep, edit or bin each phrase. Your choices live on this device. Press Export to send them on.</p>
            <p><b>Add to your home screen.</b> iPhone: Safari &rarr; Share &rarr; Add to Home Screen. Android: Chrome menu &rarr; Install app. It then works offline.</p>
            <div className="rounded-2xl bg-secondary/60 p-3 text-xs">
              <p className="mb-1 font-semibold text-foreground">Follow the coaches (official accounts)</p>
              {PROFILES.map((p) => (
                <p key={p.who} className="text-muted-foreground">{p.who}: {p.links.map(([n, u], i) => <span key={n}>{i > 0 && ' · '}<a className="underline" href={u} target="_blank" rel="noreferrer">{n}</a></span>)}</p>
              ))}
            </div>
            {installEvt && <Button onClick={async () => { installEvt.prompt(); setInstallEvt(null) }}>Install on this device</Button>}
            <p className="text-xs text-muted-foreground">Phrases: {PHRASES.length} (all drafts until you keep them). Source links are on each card.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
