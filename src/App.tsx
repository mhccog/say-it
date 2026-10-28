import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown, Copy, Download, Info, Pencil, Trash2, Undo2, Upload, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ANYONE, CHASE_SPOT, COACH_FACTS, COACH_NOTE, EMOTIONS, EMOTION_BADGE, EMOTION_NOTE, EVIDENCE_KEY, FEELINGS, MIXED, ONLY_IF_TRUE, PROFILES,
  FEELING_TIPS, NEEDS, RESEARCH, SITUATIONS, SOURCES, STORY_TYPES, STUDIES, TIPS, isResearchTip, sourceHref, type NeedId, type Situation,
} from '@/data/content'
import phrasesRaw from '@/data/phrases.json'

interface Phrase {
  id: string; need: string; feeling: string; situation: Situation; sources: string[]; text: string
  delivery?: string; basis?: string; ctx?: string; emotion?: string
  replaces?: string[]; supersededBy?: string; status?: 'keep' | 'bin'; editedText?: string
}
const ALL_PHRASES = phrasesRaw as Phrase[]
const PHRASES = ALL_PHRASES.filter((p) => !p.supersededBy) // superseded rows keep their IDs but are hidden
const IDS = new Set(ALL_PHRASES.map((p) => p.id))

type Status = 'keep' | 'bin' | 'draft'
type Review = Record<string, { status?: Status; text?: string }>
const KEY = 'say-it:review:v1'
const KEPT_KEY = 'say-it:kept-only'
const LIMIT = 8
type NeedChoice = NeedId | 'any'
type Mode = 'feel' | 'now' | 'map'
const MODES: [Mode, string][] = [['feel', 'Aim for'], ['now', 'They feel now'], ['map', 'Side by side']]

function loadReview(): Review {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
const nowIso = () => new Date().toISOString()
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

function Chip({ active, onClick, children, title, small }: { active: boolean; onClick: () => void; children: ReactNode; title?: string; small?: boolean }) {
  return (
    <button
      type="button" title={title} aria-pressed={active} onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-[background-color,border-color,transform] duration-150 active:scale-[0.97]',
        small ? 'min-h-8 px-3 text-[0.8rem]' : 'min-h-10 px-3.5 text-[0.9rem]',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-foreground/85 hover:border-primary/40 hover:bg-accent/60',
      )}
    >{children}</button>
  )
}

function Step({ n, id, title, children }: { n: number; id: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{n}</span>
      <h2 id={id} className="text-[0.95rem] font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

/** A picked step, folded down to one line with a "Change" button. */
function Summary({ n, title, value, onChange }: { n: number; title: string; value: ReactNode; onChange: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft">
      <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"><Check className="size-3.5" /></span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-xs text-muted-foreground"><span className="sr-only">Step {n}: </span>{title}</p>
        <p className="truncate text-[0.95rem] font-semibold">{value}</p>
      </div>
      <Button variant="outline" size="sm" className="min-h-8 rounded-full px-3" onClick={onChange} aria-label={`Change: ${title}`}>Change</Button>
    </div>
  )
}

export default function App() {
  const [need, setNeed] = useState<NeedChoice | null>(null)
  const [feeling, setFeeling] = useState<string | null>(null)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('feel')
  const [situation, setSituation] = useState<Situation | 'all'>('all')
  const [needOpen, setNeedOpen] = useState(true)
  const [feelOpen, setFeelOpen] = useState(true)
  const [spotOpen, setSpotOpen] = useState(false)
  const [showAllKey, setShowAllKey] = useState('')
  const [reviewMode, setReviewMode] = useState(false)
  const [showBinned, setShowBinned] = useState(false)
  const [keptOnly, setKeptOnly] = useState(() => localStorage.getItem(KEPT_KEY) === '1')
  const [review, setReview] = useState<Review>(loadReview)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [about, setAbout] = useState(false)
  const [installEvt, setInstallEvt] = useState<(Event & { prompt: () => void }) | null>(null)
  const toastTimer = useRef<number>(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(review)) }, [review])
  useEffect(() => { localStorage.setItem(KEPT_KEY, keptOnly ? '1' : '0') }, [keptOnly])
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as Event & { prompt: () => void }) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const say = (m: string) => { setToast(m); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 1800) }
  const baseText = (p: Phrase) => p.editedText ?? p.text
  const rawTextOf = (p: Phrase) => review[p.id]?.text ?? baseText(p)
  const textOf = (p: Phrase) => rawTextOf(p)
  const statusOf = (p: Phrase): Status => review[p.id]?.status ?? p.status ?? 'draft'
  const setStatus = (id: string, status: Status) => setReview((r) => ({ ...r, [id]: { ...r[id], status } }))

  const needObj = NEEDS.find((n) => n.id === need) ?? null
  const needLabel = need === 'any' ? ANYONE.label : needObj?.label
  const feelingObj = FEELINGS.find((f) => f.id === feeling) ?? null
  const emotionObj = EMOTIONS.find((e) => e.id === emotion) ?? null
  const hasResults = !!(feeling || emotion)

  const { best, more } = useMemo(() => {
    if (!feeling && !emotion) return { best: [] as Phrase[], more: [] as Phrase[] }
    const st = (p: Phrase) => review[p.id]?.status ?? p.status ?? 'draft'
    const visible = (p: Phrase) =>
      (keptOnly ? st(p) === 'keep' : showBinned || st(p) !== 'bin') && (situation === 'all' || p.situation === situation)
    const pool = PHRASES.filter(visible)
    const matchesMood = (p: Phrase) => (feeling ? p.feeling === feeling : p.emotion === emotion)
    const specific = need && need !== 'any' ? need : null
    let list = pool.filter((p) => matchesMood(p) && (specific ? p.need === specific || p.need === 'any' : p.need === 'any'))
    // "Not sure" with too few general phrases: borrow the type-specific ones too
    if (!specific && list.length < 3) list = pool.filter(matchesMood)
    const rank = (p: Phrase) => (specific && p.need === specific ? 0 : emotion && p.emotion === emotion ? 1 : p.ctx ? 3 : 2)
    list.sort((a, b) => rank(a) - rank(b))
    const moreList = specific && list.length < 3 ? pool.filter((p) => p.need === specific && !matchesMood(p)) : []
    return { best: list, more: moreList }
  }, [need, feeling, emotion, situation, review, showBinned, keptOnly])

  const listKey = [need, feeling, emotion, situation, keptOnly].join('|') // "show more" resets when the picks change
  const showAll = showAllKey === listKey
  const shown = showAll ? best : best.slice(0, LIMIT)

  const counts = useMemo(() => {
    let keep = 0, bin = 0, edited = 0
    for (const p of PHRASES) {
      const s = review[p.id]?.status ?? p.status
      if (s === 'keep') keep++; if (s === 'bin') bin++; if (review[p.id]?.text || p.editedText) edited++
    }
    return { keep, bin, edited }
  }, [review])

  function exportData() {
    const items = ALL_PHRASES.filter((p) => review[p.id]).map((p) => ({
      id: p.id, need: p.need, feeling: p.feeling, situation: p.situation,
      status: review[p.id].status ?? p.status ?? 'draft', original: p.text, text: review[p.id].text ?? baseText(p),
      edited: (review[p.id].text ?? baseText(p)) !== p.text,
    }))
    const payload = { app: 'say-it', version: 1, exportedAt: nowIso(), counts, items }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'say-it-review.json'
    document.body.appendChild(a); a.click(); a.remove()
    copyText(json).then((ok) => say(ok ? 'Exported and copied' : 'Exported'))
  }

  async function importData(file: File) {
    try {
      const payload = JSON.parse(await file.text())
      if (payload?.app !== 'say-it' || !Array.isArray(payload.items)) throw new Error('not an export')
      let n = 0, skipped = 0
      const next: Review = { ...review }
      for (const it of payload.items) {
        if (!IDS.has(it.id)) { skipped++; continue }
        const p = ALL_PHRASES.find((x) => x.id === it.id)!
        const status: Status = it.status === 'keep' || it.status === 'bin' ? it.status : 'draft'
        const text = typeof it.text === 'string' && it.text.trim() && it.text.trim() !== baseText(p) ? it.text.trim() : undefined
        next[it.id] = { status, text }; n++
      }
      setReview(next)
      say(`Imported ${n} choice${n === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}`)
    } catch {
      say('That file is not a Say it export')
    }
  }

  async function onCopy(p: Phrase) {
    const ok = await copyText(textOf(p))
    say(ok ? 'Copied. Paste it anywhere.' : 'Could not copy')
  }

  function pickNeed(id: NeedChoice) {
    if (id === need) { setNeed(null); return }
    setNeed(id); setNeedOpen(false); setSpotOpen(false)
  }
  function pickFeeling(id: string) {
    if (id === feeling) { setFeeling(null); return }
    setFeeling(id)
    if (emotionObj && !emotionObj.targets.includes(id)) setEmotion(null)
    setFeelOpen(false)
  }
  function pickEmotion(id: string) {
    if (id === emotion) { setEmotion(null); return }
    const e = EMOTIONS.find((x) => x.id === id)!
    setEmotion(id)
    if (!feeling || !e.targets.includes(feeling)) setFeeling(e.targets[0]) // suggest the first target
  }
  function pickPair(e: string, f: string) { setEmotion(e); setFeeling(f); setFeelOpen(false) }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = MODES.length - 1
    const next = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1
    if (next < 0) return
    e.preventDefault(); setMode(MODES[next][0]); tabRefs.current[next]?.focus()
  }

  function goTop(which: 'need' | 'feel') {
    if (which === 'need') setNeedOpen(true); else setFeelOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Group "KEY@time" entries by key so one source shows once, with a link per timestamp.
  function srcGroups(keys: string[], prefix = '') {
    const groups = new Map<string, string[]>()
    for (const k of keys) {
      const [key, ts] = k.split('@')
      if (!groups.has(key)) groups.set(key, [])
      if (ts) groups.get(key)!.push(ts)
    }
    const pill = 'inline-flex min-h-6 items-center rounded-full bg-secondary px-2 font-medium text-foreground/70'
    return [...groups.entries()].map(([key, times]) => {
      const s = SOURCES[key]
      if (!s) return null
      const href = sourceHref(key)
      return (
        <span key={prefix + key} className="inline-flex flex-wrap items-center gap-1.5">
          {prefix}
          {s.platform && <span className={pill}>{s.platform}</span>}
          {href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center underline decoration-border underline-offset-2 hover:text-foreground">{s.label}</a> : <span>{s.label}</span>}
          {times.map((t) => (
            <a key={t} href={sourceHref(key, t)} target="_blank" rel="noreferrer" className={cn(pill, 'hover:bg-accent')} aria-label={`${s.label} at ${t} (YouTube)`}>&#9654; {t}</a>
          ))}
        </span>
      )
    })
  }

  function renderEmotionDetail(e: (typeof EMOTIONS)[number], showAim = true) {
    const row = (k: string, v: string) => (
      <div className="grid grid-cols-[3.4rem_1fr] gap-2"><span className="font-semibold text-accent-foreground">{k}</span><span>{v}</span></div>
    )
    return (
      <div className="pop mt-2.5 space-y-2 rounded-2xl border border-primary/15 bg-accent/50 p-4 text-sm">
        <p className="font-semibold">How to spot {e.label.toLowerCase()}</p>
        {row('Face', e.face)}{row('Voice', e.voice)}{row('Words', e.words)}
        <p className="rounded-xl bg-card p-2.5"><span className="font-semibold">How to respond: </span>{e.respond}</p>
        {showAim && <div>
          <p className="mb-1.5 font-semibold">Aim for</p>
          <div className="flex flex-wrap gap-2">
            {e.targets.map((t, i) => {
              const f = FEELINGS.find((x) => x.id === t)!
              return <Chip small key={t} active={feeling === t} onClick={() => pickPair(e.id, t)}><span aria-hidden className="mr-1">{f.emoji}</span>{f.label}{i === 0 && <span className="ml-1.5 text-[0.65rem] uppercase tracking-wide opacity-70">suggested</span>}</Chip>
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
    const example = p.basis === 'source-example' ? "Coach's own example" : p.basis === 'source-example/adapted' ? "Based on a coach's example" : p.basis === 'nci' ? 'From NCI (secondary)' : p.basis === 'social' ? "From a coach's post (opinion clip)" : null
    const study = RESEARCH[p.id] ? STUDIES[RESEARCH[p.id]] : null
    const coachView = STORY_TYPES.has(p.id) || p.basis === 'social'
    const tipText = p.delivery ?? tip.text
    const tipResearch = isResearchTip(tipText)
    const sit = SITUATIONS.find((s) => s.id === p.situation)!
    const isEditing = editing === p.id
    const text = textOf(p)
    const tag = 'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium'
    return (
      <article key={p.id} aria-label={text} className={cn('pop rounded-2xl border bg-card p-4 shadow-soft', st === 'bin' && 'opacity-55', st === 'keep' ? 'border-primary/40' : 'border-border')}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={cn(tag, 'border border-border text-muted-foreground')}>{sit.label}</span>
          {general && <span className={cn(tag, 'border border-border text-muted-foreground')}>General</span>}
          {p.emotion && <span className={cn(tag, 'bg-accent text-accent-foreground')}>For {EMOTIONS.find((e) => e.id === p.emotion)?.label.toLowerCase()}</span>}
          {study
            ? <span className={cn(tag, 'bg-[oklch(0.94_0.05_150)] text-[oklch(0.36_0.08_150)]')}>Backed by research</span>
            : <span className={cn(tag, 'bg-secondary text-secondary-foreground')}>{coachView ? 'Coach\u2019s view' : 'Coach\u2019s tip'}</span>}
          {ONLY_IF_TRUE.has(p.id) && <span className={cn(tag, 'border border-[oklch(0.8_0.07_70)] bg-[oklch(0.97_0.03_80)] text-[oklch(0.42_0.08_60)]')}>Only if true</span>}
          {st === 'draft' && <span className={cn(tag, 'border border-dashed border-border text-muted-foreground')}>Draft</span>}
          {st === 'keep' && <span className={cn(tag, 'bg-primary text-primary-foreground')}>Kept</span>}
          {st === 'bin' && <span className={cn(tag, 'bg-destructive/10 text-destructive')}>Binned</span>}
          {(review[p.id]?.text || p.editedText) && <span className={cn(tag, 'border border-border')}>Edited</span>}
        </div>
        {!isEditing && (
          <button type="button" onClick={() => onCopy(p)} className="group -mx-1.5 block w-[calc(100%+0.75rem)] rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-accent/40 active:bg-accent/70">
            <span className="sr-only">Copy: </span>
            <span className="block text-[1.08rem] leading-relaxed font-medium text-foreground">{text}</span>
            <span aria-hidden className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Copy className="size-3" /> Tap to copy</span>
          </button>
        )}
        {!isEditing && p.ctx && <p className="mt-1 text-[0.8rem] text-muted-foreground">{p.ctx}{STORY_TYPES.has(p.id) && ' (Vanessa\u2019s story type: how they see their life right now, not who they are.)'}</p>}
        {!isEditing && MIXED[p.id] && <p className="mt-1 text-[0.8rem] text-muted-foreground">{MIXED[p.id]}</p>}
        {isEditing && (
          <div>
            <label htmlFor={`edit-${p.id}`} className="sr-only">Edit phrase</label>
            <textarea id={`edit-${p.id}`} value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={3}
              className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus:ring-3 focus:ring-ring/40" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="min-h-8" onClick={() => { setReview((r) => ({ ...r, [p.id]: { ...r[p.id], text: draftText.trim() === baseText(p) ? undefined : draftText.trim(), status: r[p.id]?.status && r[p.id]?.status !== 'draft' ? r[p.id]!.status : 'keep' } })); setEditing(null) }}><Check /> Save</Button>
              <Button size="sm" className="min-h-8" variant="ghost" onClick={() => setEditing(null)}><X /> Cancel</Button>
            </div>
          </div>
        )}
        <div className="mt-3 rounded-xl bg-accent/55 p-3 text-sm text-accent-foreground">
          <span className="font-semibold">How to say it: </span>{tipText}
          <span className="mt-1 block text-xs opacity-75">{tipResearch ? 'Falling pitch: backed by research. The rest is a coach\u2019s tip.' : 'Stagecraft (coach\u2019s tip): try it and keep what feels natural.'}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{example ? `${example}. Source:` : 'Source:'}</span>
          {srcGroups(p.sources)}
          {study && <span className="inline-flex flex-wrap items-center gap-1.5">Why this works: {study.url ? <a href={study.url} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center underline decoration-border underline-offset-2 hover:text-foreground">{study.label}</a> : <span>{study.label}</span>}</span>}
          {!p.delivery && srcGroups([tip.source], 'Tip: ')}
        </div>
        {reviewMode && !isEditing && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button size="sm" className="min-h-8" variant={st === 'keep' ? 'default' : 'outline'} aria-pressed={st === 'keep'} onClick={() => setStatus(p.id, st === 'keep' ? 'draft' : 'keep')}><Check /> Keep</Button>
            <Button size="sm" className="min-h-8" variant="outline" onClick={() => { setEditing(p.id); setDraftText(rawTextOf(p)) }}><Pencil /> Edit</Button>
            {st === 'bin'
              ? <Button size="sm" className="min-h-8" variant="outline" onClick={() => setStatus(p.id, 'draft')}><Undo2 /> Restore</Button>
              : <Button size="sm" className="min-h-8" variant="outline" onClick={() => setStatus(p.id, 'bin')}><Trash2 /> Bin</Button>}
          </div>
        )}
      </article>
    )
  }

  const feelSummary = emotionObj
    ? <>They feel {emotionObj.label.toLowerCase()}{feelingObj && <> &rarr; {feelingObj.label}</>}</>
    : feelingObj ? <><span aria-hidden className="mr-1">{feelingObj.emoji}</span>{feelingObj.label}</> : null

  return (
    <div className="mx-auto min-h-svh max-w-2xl px-4 pb-32">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 shadow-[0_6px_16px_-14px_rgba(60,40,20,0.35)]">
        <header className="flex items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="size-9 rounded-xl" />
          <div className="min-w-0 leading-tight">
            <h1 className="text-lg font-bold tracking-tight">Say it</h1>
            <p className="truncate text-xs text-muted-foreground">Listen first, then find the words</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant={reviewMode ? 'default' : 'outline'} className="min-h-9 rounded-full px-3" aria-pressed={reviewMode} onClick={() => setReviewMode((v) => !v)}><Eye /> Review</Button>
            <Button size="icon" variant="outline" className="size-9 rounded-full" onClick={() => setAbout(true)} aria-label="About Say it"><Info /></Button>
          </div>
        </header>
        {hasResults && (
          <div className="mt-2.5 space-y-2" aria-label="Your picks and filter" role="group">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <button type="button" onClick={() => goTop('need')} className="inline-flex min-h-8 max-w-[48%] items-center rounded-full border border-border bg-card px-3 font-medium">
                <span className="truncate">{needLabel ?? ANYONE.label}</span>
              </button>
              <span aria-hidden className="text-muted-foreground">&rarr;</span>
              <button type="button" onClick={() => goTop('feel')} className="inline-flex min-h-8 max-w-[44%] items-center rounded-full border border-border bg-card px-3 font-medium">
                <span className="truncate">{feelingObj?.label ?? emotionObj?.label}</span>
              </button>
            </div>
            <div role="group" aria-label="Where in the conversation" className="grid grid-cols-5 gap-1 rounded-full bg-secondary p-1">
              {([['all', 'All'], ...SITUATIONS.map((s) => [s.id, s.label])] as [Situation | 'all', string][]).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={situation === id} onClick={() => setSituation(id === situation ? 'all' : id)}
                  className={cn('min-h-8 rounded-full px-1 text-[0.78rem] font-medium transition-colors', situation === id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="pt-4">
        <section aria-labelledby="who">
          {need && !needOpen ? (
            <>
              <h2 id="who" className="sr-only">What are you hearing?</h2>
              <Summary n={1} title="What you're hearing" value={needLabel} onChange={() => setNeedOpen(true)} />
            </>
          ) : (
            <>
              <Step n={1} id="who" title="What are you hearing from them?" />
              <div className="flex flex-wrap gap-2">
                <Chip active={need === 'any'} onClick={() => pickNeed('any')} title={ANYONE.hint}>{ANYONE.label}</Chip>
                {NEEDS.map((n) => <Chip key={n.id} active={need === n.id} onClick={() => pickNeed(n.id)} title={n.hint}>{n.label}</Chip>)}
              </div>
              <p className="mt-2.5 rounded-xl border border-dashed border-border bg-card/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                <span className="mr-1.5 inline-flex h-5 items-center rounded-full bg-secondary px-2 font-semibold text-foreground/75">Coach&rsquo;s view, untested</span>
                {COACH_NOTE.replace(/^Coach\u2019s view, untested\. /, '')}
              </p>
            </>
          )}
          {needObj && (
            <div className="mt-2">
              <button type="button" aria-expanded={spotOpen} onClick={() => setSpotOpen((v) => !v)} className="inline-flex min-h-8 items-center gap-1 text-sm font-medium text-primary">
                What to listen for <ChevronDown className={cn('size-4 transition-transform', spotOpen && 'rotate-180')} />
              </button>
              {spotOpen && (
                <div className="pop mt-1.5 rounded-2xl border border-primary/15 bg-accent/50 p-4 text-sm">
                  {needObj.question && <p className="mb-2 italic text-accent-foreground">The quiet question underneath: &ldquo;{needObj.question}&rdquo;</p>}
                  <p className="mb-1 font-semibold">You might notice</p>
                  <ul className="mb-2 list-disc space-y-0.5 pl-5">{needObj.listenFor.map((l) => <li key={l}>{l}</li>)}</ul>
                  <p className="mb-1 font-semibold">They might say</p>
                  <ul className="mb-2 list-disc space-y-0.5 pl-5">{needObj.mightSay.map((l) => <li key={l}>{l}</li>)}</ul>
                  <p className="mb-2"><span className="font-semibold">Speaking to it: </span>{needObj.speakTo}</p>
                  <p className="mb-2 text-xs text-muted-foreground">Hear Chase describe this: <a className="inline-flex min-h-6 items-center underline" href={sourceHref(CHASE_SPOT[needObj.id][0], CHASE_SPOT[needObj.id][1])} target="_blank" rel="noreferrer">YouTube at {CHASE_SPOT[needObj.id][1]}</a></p>
                  <p className="rounded-xl bg-card p-2.5 text-xs text-muted-foreground">{COACH_NOTE}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="feel" className="mt-5">
          {hasResults && !feelOpen ? (
            <>
              <h2 id="feel" className="sr-only">How do you want them to feel?</h2>
              <Summary n={2} title="How you want them to feel" value={feelSummary} onChange={() => setFeelOpen(true)} />
            </>
          ) : (
            <>
              <Step n={2} id="feel" title="How do you want them to feel?" />
              <div role="tablist" aria-label="Choose by" className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1 text-sm font-medium">
                {MODES.map(([id, label], i) => (
                  <button key={id} ref={(el) => { tabRefs.current[i] = el }} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={mode === id}
                    tabIndex={mode === id ? 0 : -1} type="button" onClick={() => setMode(id)} onKeyDown={(e) => onTabKey(e, i)}
                    className={cn('min-h-9 rounded-full px-2 transition-colors', mode === id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>
                ))}
              </div>
              <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
                {mode === 'feel' && (
                  <div className="flex flex-wrap gap-2">
                    {FEELINGS.map((f) => <Chip key={f.id} active={feeling === f.id} onClick={() => pickFeeling(f.id)}><span aria-hidden className="mr-1.5">{f.emoji}</span>{f.label}</Chip>)}
                  </div>
                )}
                {mode === 'now' && (
                  <>
                    <p className="mb-2.5 inline-flex min-h-6 items-center rounded-full bg-[oklch(0.96_0.035_80)] px-2.5 text-xs font-medium text-[oklch(0.42_0.08_60)]">{EMOTION_BADGE}</p>
                    <p className="mb-2 text-sm text-muted-foreground">What are they feeling right now? We&rsquo;ll suggest what to aim for.</p>
                    <div className="flex flex-wrap gap-2">
                      {EMOTIONS.map((e) => <Chip key={e.id} active={emotion === e.id} onClick={() => pickEmotion(e.id)}><span aria-hidden className="mr-1.5">{e.emoji}</span>{e.label}</Chip>)}
                    </div>
                    {emotionObj && renderEmotionDetail(emotionObj)}
                  </>
                )}
                {mode === 'map' && (
                  <div>
                    <p className="mb-2.5 inline-flex min-h-6 items-center rounded-full bg-[oklch(0.96_0.035_80)] px-2.5 text-xs font-medium text-[oklch(0.42_0.08_60)]">{EMOTION_BADGE}</p>
                    <div aria-hidden className="mb-1.5 grid grid-cols-[6.6rem_1fr] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>They feel</span><span>Aim for</span>
                    </div>
                    <div className="space-y-2">
                      {EMOTIONS.map((e) => (
                        <div key={e.id} className={cn('rounded-2xl border bg-card p-2 shadow-soft', emotion === e.id ? 'border-primary/50' : 'border-border')}>
                          <div className="grid grid-cols-[6.6rem_1fr] items-center gap-2">
                            <button type="button" aria-pressed={emotion === e.id} onClick={() => pickEmotion(e.id)}
                              className={cn('min-h-10 rounded-xl px-2.5 text-left text-sm font-medium transition-colors active:scale-[0.97]', emotion === e.id ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                              <span aria-hidden className="mr-1">{e.emoji}</span>{e.label}
                            </button>
                            <div className="flex flex-wrap gap-1.5">
                              {e.targets.map((t) => {
                                const f = FEELINGS.find((x) => x.id === t)!
                                const on = feeling === t && emotion === e.id
                                return <button key={t} type="button" aria-pressed={on} aria-label={`${e.label}: aim for ${f.label}`} onClick={() => pickPair(e.id, t)}
                                  className={cn('min-h-8 rounded-full border px-2.5 text-xs font-medium transition-colors active:scale-[0.97]', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-accent')}>{f.label}</button>
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
                          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-2">
                            <div className="grid grid-cols-[6.6rem_1fr] items-center gap-2">
                              <span className="px-2.5 text-sm text-muted-foreground">Any mood</span>
                              <div className="flex flex-wrap gap-1.5">
                                {rest.map((f) => <button key={f.id} type="button" aria-pressed={feeling === f.id && !emotion} onClick={() => { setEmotion(null); setFeeling(f.id); setFeelOpen(false) }} className={cn('min-h-8 rounded-full border px-2.5 text-xs font-medium', feeling === f.id && !emotion ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')}>{f.label}</button>)}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section aria-labelledby="results" className="mt-6">
          {hasResults ? (
            <>
              <h2 id="results" className="text-base font-bold">
                Words for <span className="text-primary">{needLabel ?? 'anyone'}</span> &rarr; <span className="text-primary">{feelingObj?.label ?? emotionObj?.label}</span>
              </h2>
              {!need && <p className="mt-0.5 text-xs text-muted-foreground">Showing general phrases. Pick what you&rsquo;re hearing to tailor them.</p>}
              {emotionObj && !feelOpen && <p className="mt-2 rounded-xl bg-accent/50 p-2.5 text-sm"><span className="font-semibold">They seem to feel {emotionObj.label.toLowerCase()}. </span>{emotionObj.respond}</p>}
              {keptOnly && <p className="mt-2 text-xs text-muted-foreground">Showing kept phrases only. <button type="button" className="inline-flex min-h-6 items-center font-medium text-primary underline" onClick={() => setKeptOnly(false)}>Show all</button></p>}
              {best.length === 0 && more.length === 0 && <p className="mt-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nothing here for this mix yet. Try &ldquo;All&rdquo; in the bar above, or another feeling.</p>}
              <div className="mt-3 space-y-3">{shown.map((p) => renderCard(p, !!need && need !== 'any' && p.need === 'any'))}</div>
              {!showAll && best.length > LIMIT && <Button variant="outline" className="mt-3 min-h-10 w-full rounded-full" onClick={() => setShowAllKey(listKey)}>Show {best.length - LIMIT} more</Button>}
              {more.length > 0 && (
                <>
                  <h3 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">More for {needLabel} (other feelings)</h3>
                  <div className="space-y-3">{more.map((p) => renderCard(p))}</div>
                </>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
              <h2 id="results" className="text-base font-semibold text-foreground">Pick a feeling to see phrases</h2>
              <p className="mt-1">Step 1 is optional. Tap any card to copy it.</p>
            </div>
          )}
        </section>
      </main>

      {reviewMode && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(60,40,20,0.25)]">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm"><b>Review</b> · Kept {counts.keep} · Binned {counts.bin} · Edited {counts.edited}</span>
            <label className="flex min-h-8 items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={keptOnly} onChange={(e) => setKeptOnly(e.target.checked)} /> Kept only</label>
            <label className="flex min-h-8 items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={showBinned} onChange={(e) => setShowBinned(e.target.checked)} /> Show binned</label>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" className="min-h-8" variant="outline" onClick={() => fileRef.current?.click()}><Upload /> Import</Button>
              <Button size="sm" className="min-h-8" onClick={exportData}><Download /> Export</Button>
              <Button size="sm" className="min-h-8" variant="ghost" onClick={() => { if (confirm('Clear all your keep / edit / bin choices on this device?')) setReview({}) }}>Reset</Button>
            </div>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-hidden tabIndex={-1}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = '' }} />
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
        {toast && <span className="pop rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast}</span>}
      </div>

      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>About Say it</DialogTitle>
            <DialogDescription>A phrase helper built from personal notes plus public writing from Vanessa Van Edwards, Vinh Giang and Chase Hughes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><b>How it works.</b> Step 1 uses Chase Hughes&rsquo;s six social needs as things to listen for. That&rsquo;s a coach&rsquo;s view and untested, so it&rsquo;s optional. Phrases are original drafts, and each cites where the idea came from. The &ldquo;How to say it&rdquo; tips are delivery ideas, mainly Vinh Giang&rsquo;s.</p>
            <p>The 14 feelings in step 2 are goals from personal notes, not a research list.</p>
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1.5 font-semibold">Evidence key</p>
              <dl className="space-y-1 text-xs">{EVIDENCE_KEY.map(([k, v]) => <div key={k}><dt className="inline font-semibold">{k}: </dt><dd className="inline text-muted-foreground">{v}</dd></div>)}</dl>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="mb-1.5 font-semibold">About the sources</p>
              <dl className="space-y-1 text-xs">{COACH_FACTS.map(([k, v]) => <div key={k}><dt className="inline font-semibold">{k}: </dt><dd className="inline text-muted-foreground">{v}</dd></div>)}</dl>
            </div>
            <p><b>Please use it kindly.</b> These are things you might hear, never labels for a person. The aim is that the other person feels heard, respected or at ease, never pressured. No hidden tricks are included, and every phrase leaves them free to say no.</p>
            <p><b>Review mode.</b> Tap Review to keep, edit or bin phrases. Choices live on this device. Export saves them as a file; Import loads a file back (for example on another phone).</p>
            <p><b>Add to your home screen.</b> iPhone: Safari &rarr; Share &rarr; Add to Home Screen. Android: Chrome menu &rarr; Install app. It then works offline.</p>
            <div className="rounded-xl bg-secondary/70 p-3 text-xs">
              <p className="mb-1 font-semibold text-foreground">Follow the coaches (official accounts)</p>
              {PROFILES.map((p) => (
                <p key={p.who} className="text-muted-foreground">{p.who}: {p.links.map(([n, u], i) => <span key={n}>{i > 0 && ' · '}<a className="inline-flex min-h-6 items-center underline" href={u} target="_blank" rel="noreferrer">{n}</a></span>)}</p>
              ))}
            </div>
            {installEvt && <Button onClick={() => { installEvt.prompt(); setInstallEvt(null) }}>Install on this device</Button>}
            <p className="text-xs text-muted-foreground">Phrases: {PHRASES.length} (all drafts until you keep them). Source links are on each card.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
