import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown, ClipboardList, Copy, Download, Info, Loader2, Mic, MoreHorizontal, Pencil, Share2, SlidersHorizontal, Star, Trash2, Undo2, Upload, Wand2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Practice } from '@/components/Practice'
import {
  ANYONE, CHASE_SPOT, COACH_FACTS, COACH_NOTE, EMOTIONS, EMOTION_BADGE, EMOTION_NOTE, EVIDENCE_KEY, FEELINGS, MIXED, ONLY_IF_TRUE, PROFILES,
  FEELING_TIPS, NEEDS, needText, RESEARCH, SITUATIONS, SOURCES, STORY_TYPES, STUDIES, TIPS, isResearchTip, sourceHref, type NeedId, type Situation,
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
const FAV_KEY = 'say-it:favourites:v1'
const PICKS_KEY = 'say-it:picks:v1'
const SETTINGS_KEY = 'say-it:settings:v1'
interface Settings { quick: boolean; details: boolean; bigText: boolean; situation: Situation | 'all' }
const DEFAULT_SETTINGS: Settings = { quick: true, details: false, bigText: false, situation: 'all' }
function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? { ...fallback, ...JSON.parse(v) } : fallback } catch { return fallback }
}
function loadList(key: string): string[] {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [] } catch { return [] }
}
/** One gentle reminder under the results, rotating with each pick. */
const REMINDERS = [
  'Ask, don\u2019t assume: if you\u2019re not sure how they feel, ask.',
  'Ask, don\u2019t assume: what you hear is a clue, not a verdict.',
  'Ask, don\u2019t assume: let them correct you, and thank them when they do.',
  'Ask, don\u2019t assume: a short pause often tells you more than a guess.',
  'Ask, don\u2019t assume: say it only if it\u2019s true for you.',
]
interface Picks { need: NeedChoice | null; feeling: string | null; emotion: string | null; mode: Mode }
const LIMIT = 8
/** "Say it differently" is switched on only when the Pages build sets VITE_REWORD_URL (the Cloudflare Worker's address). */
const REWORD_URL = (import.meta.env.VITE_REWORD_URL as string | undefined)?.trim() || ''
type Reword = { id: string; note: string; loading: boolean; options: string[]; error?: string }
type NeedChoice = NeedId | 'any'
type Mode = 'feel' | 'now' | 'map'
const MODES: [Mode, string][] = [['feel', 'Aim for'], ['now', 'They feel now'], ['map', 'Side by side']]

function loadReview(): Review {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
const nowIso = () => new Date().toISOString()
let toastSeq = 0
const nextToast = () => ++toastSeq
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

function Switch({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-accent/40">
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span>{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</span>
      <span aria-hidden className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-input')}>
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-card shadow transition-[left]', on ? 'left-[1.125rem]' : 'left-0.5')} />
      </span>
    </button>
  )
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
        <p className="line-clamp-2 text-[0.95rem] font-semibold leading-snug">{value}</p>
      </div>
      <Button variant="outline" size="sm" className="min-h-8 rounded-full px-3" onClick={onChange} aria-label={`Change: ${title}`}>Change</Button>
    </div>
  )
}

export default function App() {
  const [saved] = useState(() => load<Picks>(PICKS_KEY, { need: null, feeling: null, emotion: null, mode: 'feel' }))
  const [need, setNeed] = useState<NeedChoice | null>(saved.need)
  const [feeling, setFeeling] = useState<string | null>(saved.feeling)
  const [emotion, setEmotion] = useState<string | null>(saved.emotion)
  const [mode, setMode] = useState<Mode>(saved.mode)
  const [settings, setSettings] = useState<Settings>(() => load(SETTINGS_KEY, DEFAULT_SETTINGS))
  const situation = settings.situation
  const setSituation = (v: Situation | 'all') => setSettings((x) => ({ ...x, situation: v }))
  const [needOpen, setNeedOpen] = useState(!saved.need && !(saved.feeling || saved.emotion))
  const [feelOpen, setFeelOpen] = useState(!(saved.feeling || saved.emotion))
  const [favs, setFavs] = useState<string[]>(() => loadList(FAV_KEY))
  const [favsAll, setFavsAll] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [practiceFor, setPracticeFor] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [prepOpen, setPrepOpen] = useState(false)
  const [prepNeed, setPrepNeed] = useState<NeedChoice>('any')
  const [prepFeeling, setPrepFeeling] = useState<string>('heard')
  const [spotOpen, setSpotOpen] = useState(false)
  const [showAllKey, setShowAllKey] = useState('')
  const [reviewMode, setReviewMode] = useState(false)
  const [showBinned, setShowBinned] = useState(false)
  const [keptOnly, setKeptOnly] = useState(() => localStorage.getItem(KEPT_KEY) === '1')
  const [review, setReview] = useState<Review>(loadReview)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [toast, setToast] = useState<{ m: string; n: number } | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), toast.m.length > 40 ? 3200 : 1800)
    return () => window.clearTimeout(t)
  }, [toast])
  const [reword, setReword] = useState<Reword | null>(null)
  const [about, setAbout] = useState(false)
  const [installEvt, setInstallEvt] = useState<(Event & { prompt: () => void }) | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(review)) }, [review])
  useEffect(() => { localStorage.setItem(KEPT_KEY, keptOnly ? '1' : '0') }, [keptOnly])
  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favs)) }, [favs])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem(PICKS_KEY, JSON.stringify({ need, feeling, emotion, mode })) }, [need, feeling, emotion, mode])
  useEffect(() => { document.documentElement.style.fontSize = settings.bigText ? '18px' : '' }, [settings.bigText])
  // Close a card's "…" menu on outside tap or Escape.
  useEffect(() => {
    if (!menuFor) return
    const close = (e: Event) => { if (!(e.target as HTMLElement).closest?.('[data-menu]')) setMenuFor(null) }
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setMenuFor(null) }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [menuFor])
  // Home-screen shortcuts: ?view=favourites or ?view=prep
  useEffect(() => {
    const url = new URL(window.location.href)
    const view = url.searchParams.get('view')
    if (!view) return
    url.searchParams.delete('view'); window.history.replaceState(null, '', url)
    const t = window.setTimeout(() => {
      if (view === 'prep') { setPrepNeed(saved.need ?? 'any'); setPrepFeeling(saved.feeling ?? 'heard'); setPrepOpen(true) }
      if (view === 'favourites') {
        const el = document.getElementById('my-lines')
        if (el) el.scrollIntoView({ block: 'start' }); else { setToast({ m: 'No saved lines yet. Tap the star on a line to keep it here.', n: nextToast() }) }
      }
    }, 50)
    return () => window.clearTimeout(t)
  }, [saved])
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as Event & { prompt: () => void }) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const say = (m: string) => setToast({ m, n: nextToast() })
  const baseText = (p: Phrase) => p.editedText ?? p.text
  const rawTextOf = (p: Phrase) => review[p.id]?.text ?? baseText(p)
  const textOf = (p: Phrase) => rawTextOf(p)
  const statusOf = (p: Phrase): Status => review[p.id]?.status ?? p.status ?? 'draft'
  const setStatus = (id: string, status: Status) => setReview((r) => ({ ...r, [id]: { ...r[id], status } }))

  const needObj = NEEDS.find((n) => n.id === need) ?? null
  const needLabel = need === 'any' ? ANYONE.label : needObj ? needText(needObj) : undefined
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
    // Best first: research-backed, then kept in review, then the rest.
    const tier = (p: Phrase) => (RESEARCH[p.id] ? 0 : st(p) === 'keep' ? 1 : 2)
    list.sort((a, b) => tier(a) - tier(b) || rank(a) - rank(b))
    const moreList = specific && list.length < 3 ? pool.filter((p) => p.need === specific && !matchesMood(p)) : []
    return { best: list, more: moreList }
  }, [need, feeling, emotion, situation, review, showBinned, keptOnly])

  const listKey = [need, feeling, emotion, situation, keptOnly].join('|') // "show more" resets when the picks change
  const showAll = showAllKey === listKey + '#all'
  const quickOnly = settings.quick && !showAllKey.startsWith(listKey + '#')
  const shown = quickOnly ? best.slice(0, 1) : showAll ? best : best.slice(0, LIMIT)
  const reminder = REMINDERS[hash(listKey) % REMINDERS.length]
  const favPhrases = favs.map((id) => ALL_PHRASES.find((p) => p.id === id)).filter((p): p is Phrase => !!p)

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

  async function runReword(p: Phrase, note: string) {
    if (!navigator.onLine) { setReword({ id: p.id, note, loading: false, options: [], error: 'You are offline. Try again when you have signal.' }); return }
    setReword({ id: p.id, note, loading: true, options: [] })
    try {
      const r = await fetch(REWORD_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textOf(p), note }) })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !Array.isArray(data.options)) throw new Error(data.error || 'No suggestion this time. Try again.')
      setReword({ id: p.id, note, loading: false, options: data.options.slice(0, 3) })
    } catch (e) {
      setReword({ id: p.id, note, loading: false, options: [], error: e instanceof Error ? e.message : 'Something went wrong. Try again.' })
    }
  }

  async function onCopy(p: Phrase) {
    const ok = await copyText(textOf(p))
    say(ok ? 'Copied. Paste it anywhere.' : 'Could not copy')
  }

  function toggleFav(id: string) {
    const on = favs.includes(id)
    setFavs((f) => (on ? f.filter((x) => x !== id) : [id, ...f]))
    say(on ? 'Removed from My lines' : 'Saved to My lines')
  }
  async function shareLine(t: string) {
    setMenuFor(null)
    if (navigator.share) {
      try { await navigator.share({ text: t }); return } catch (e) { if ((e as Error).name === 'AbortError') return }
    }
    say((await copyText(t)) ? 'Copied. Paste it to share.' : 'Could not copy')
  }
  function menuItem(icon: ReactNode, label: string, run: () => void) {
    return (
      <button type="button" role="menuitem" onClick={() => { setMenuFor(null); run() }}
        className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none [&_svg]:size-4 [&_svg]:text-muted-foreground">
        {icon}{label}
      </button>
    )
  }
  /** Three glanceable lines for the prep card: an opener, something in the middle and a close where possible. */
  function prepLines(n: NeedChoice, f: string) {
    const st = (p: Phrase) => review[p.id]?.status ?? p.status ?? 'draft'
    const pool = PHRASES.filter((p) => st(p) !== 'bin' && p.feeling === f)
    const fit = pool.filter((p) => (n === 'any' ? p.need === 'any' : p.need === n || p.need === 'any'))
    const list = (fit.length >= 3 ? fit : pool).slice().sort((a, b) =>
      (n !== 'any' && a.need === n ? 0 : 1) - (n !== 'any' && b.need === n ? 0 : 1) ||
      (RESEARCH[a.id] ? 0 : st(a) === 'keep' ? 1 : 2) - (RESEARCH[b.id] ? 0 : st(b) === 'keep' ? 1 : 2))
    const out: Phrase[] = []
    for (const sit of ['opener', 'rapport', 'disagree', 'close'] as Situation[]) {
      const hit = list.find((p) => p.situation === sit && !out.includes(p))
      if (hit && out.length < 3) out.push(hit)
    }
    for (const p of list) if (out.length < 3 && !out.includes(p)) out.push(p)
    const order = ['opener', 'rapport', 'disagree', 'close']
    return out.sort((a, b) => order.indexOf(a.situation) - order.indexOf(b.situation))
  }
  function openPrep() {
    setPrepNeed(need ?? 'any'); setPrepFeeling(feeling ?? 'heard'); setMoreOpen(false); setPrepOpen(true)
  }

  function pickNeed(id: NeedChoice) {
    if (id === need) { setNeed(null); return }
    setNeed(id); setNeedOpen(false); setSpotOpen(false)
  }
  function pickFeeling(id: string) {
    if (id === feeling) { setFeeling(null); return }
    setFeeling(id); setNeedOpen(false); setSpotOpen(false)
    if (emotionObj && !emotionObj.targets.includes(id)) setEmotion(null)
    setFeelOpen(false)
  }
  function pickEmotion(id: string) {
    if (id === emotion) { setEmotion(null); return }
    const e = EMOTIONS.find((x) => x.id === id)!
    setEmotion(id)
    if (!feeling || !e.targets.includes(feeling)) setFeeling(e.targets[0]) // suggest the first target
  }
  function pickPair(e: string, f: string) { setEmotion(e); setFeeling(f); setFeelOpen(false); setNeedOpen(false) }

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
    const details = settings.details
    const fav = favs.includes(p.id)
    return (
      <article key={p.id} aria-label={text} className={cn('pop rounded-2xl border bg-card p-4 shadow-soft', st === 'bin' && 'opacity-55', st === 'keep' ? 'border-primary/40' : 'border-border')}>
        <div className="mb-2 flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {study
              ? <span className={cn(tag, 'bg-[oklch(0.94_0.05_150)] text-[oklch(0.36_0.08_150)]')}>Backed by research</span>
              : <span className={cn(tag, 'bg-secondary text-secondary-foreground')}>{coachView ? 'Coach\u2019s view' : 'Coach\u2019s tip'}</span>}
            {ONLY_IF_TRUE.has(p.id) && <span className={cn(tag, 'border border-[oklch(0.8_0.07_70)] bg-[oklch(0.97_0.03_80)] text-[oklch(0.42_0.08_60)]')}>Only if true</span>}
            {MIXED[p.id] && <span className={cn(tag, 'border border-border text-muted-foreground')}>Mixed evidence</span>}
            {(details || reviewMode) && <>
              <span className={cn(tag, 'border border-border text-muted-foreground')}>{sit.label}</span>
              {general && <span className={cn(tag, 'border border-border text-muted-foreground')}>General</span>}
              {p.emotion && <span className={cn(tag, 'bg-accent text-accent-foreground')}>For {EMOTIONS.find((e) => e.id === p.emotion)?.label.toLowerCase()}</span>}
              {st === 'draft' && <span className={cn(tag, 'border border-dashed border-border text-muted-foreground')}>Draft</span>}
            </>}
            {st === 'keep' && reviewMode && <span className={cn(tag, 'bg-primary text-primary-foreground')}>Kept</span>}
            {st === 'bin' && <span className={cn(tag, 'bg-destructive/10 text-destructive')}>Binned</span>}
            {reviewMode && (review[p.id]?.text || p.editedText) && <span className={cn(tag, 'border border-border')}>Edited</span>}
          </div>
          <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
            <button type="button" aria-pressed={fav} aria-label={fav ? 'Remove from My lines' : 'Save to My lines'} onClick={() => toggleFav(p.id)}
              className={cn('inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent/60', fav ? 'text-primary' : 'text-muted-foreground')}>
              <Star className={cn('size-[1.15rem]', fav && 'fill-current')} />
            </button>
            <div className="relative" data-menu>
              <button type="button" aria-haspopup="menu" aria-expanded={menuFor === p.id} aria-label="More for this line" onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60">
                <MoreHorizontal className="size-[1.15rem]" />
              </button>
              {menuFor === p.id && (
                <div role="menu" aria-label="Line actions" className="pop absolute right-0 top-10 z-30 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-lg"
                  onKeyDown={(e) => {
                    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]')]
                    const i = items.indexOf(document.activeElement as HTMLButtonElement)
                    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
                    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
                  }}>
                  {menuItem(<Share2 />, 'Share', () => shareLine(text))}
                  {menuItem(<Mic />, 'Practice out loud', () => { setPracticeFor(p.id); setReword(null) })}
                  {REWORD_URL && menuItem(<Wand2 />, 'Say it differently', () => { setPracticeFor(null); setReword({ id: p.id, note: '', loading: false, options: [] }); runReword(p, '') })}
                  {menuItem(<Copy />, 'Copy', () => onCopy(p))}
                </div>
              )}
            </div>
          </div>
        </div>
        {!isEditing && (
          <button type="button" onClick={() => onCopy(p)} className="group -mx-1.5 block w-[calc(100%+0.75rem)] rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-accent/40 active:bg-accent/70">
            <span className="sr-only">Copy: </span>
            <span className="block text-[1.08rem] leading-relaxed font-medium text-foreground">{text}</span>
            <span aria-hidden className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Copy className="size-3" /> Tap to copy</span>
          </button>
        )}
        {!isEditing && p.ctx && <p className="mt-1 text-[0.8rem] text-muted-foreground">{p.ctx}{details && STORY_TYPES.has(p.id) && ' (Vanessa\u2019s story type: how they see their life right now, not who they are.)'}</p>}
        {!isEditing && details && MIXED[p.id] && <p className="mt-1 text-[0.8rem] text-muted-foreground">{MIXED[p.id]}</p>}
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
          {details && <span className="mt-1 block text-xs opacity-75">{tipResearch ? 'Falling pitch: backed by research. The rest is a coach\u2019s tip.' : 'Stagecraft (coach\u2019s tip): try it and keep what feels natural.'}</span>}
        </div>
        {details && <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{example ? `${example}. Source:` : 'Source:'}</span>
          {srcGroups(p.sources)}
          {study && <span className="inline-flex flex-wrap items-center gap-1.5">Why this works: {study.url ? <a href={study.url} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center underline decoration-border underline-offset-2 hover:text-foreground">{study.label}</a> : <span>{study.label}</span>}</span>}
          {!p.delivery && srcGroups([tip.source], 'Tip: ')}
        </div>}
        {!details && <button type="button" onClick={() => setSettings((x) => ({ ...x, details: true }))} className="mt-1.5 inline-flex min-h-6 items-center text-xs text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground">Sources{study ? ' and research' : ''}</button>}
        {practiceFor === p.id && !isEditing && <div className="pop mt-3 rounded-xl border border-border bg-background p-3"><Practice text={text.replace(/___/g, 'this')} onClose={() => setPracticeFor(null)} /></div>}
        {REWORD_URL && !isEditing && (
          reword?.id === p.id ? (
            <div className="pop mt-3 rounded-xl border border-border bg-background p-3 text-sm">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); runReword(p, reword.note.trim()) }}>
                <label htmlFor={`rw-${p.id}`} className="sr-only">Who or how (optional)</label>
                <input id={`rw-${p.id}`} value={reword.note} maxLength={120} onChange={(e) => setReword({ ...reword, note: e.target.value })}
                  placeholder="Who or how? e.g. my landlord, short" className="min-h-9 min-w-0 flex-1 rounded-full border border-input bg-card px-3 text-base outline-none focus:ring-3 focus:ring-ring/40" />
                <Button type="submit" className="min-h-9 rounded-full px-3" disabled={reword.loading}>{reword.loading ? <Loader2 className="animate-spin" /> : <Wand2 />} Reword</Button>
              </form>
              {reword.error && <p className="mt-2 text-destructive">{reword.error}</p>}
              {reword.options.length > 0 && (
                <ul className="mt-2 space-y-1.5" aria-label="Suggestions">
                  {reword.options.map((o) => (
                    <li key={o}><button type="button" onClick={async () => say((await copyText(o)) ? 'Copied. Paste it anywhere.' : 'Could not copy')}
                      className="w-full rounded-lg bg-card px-3 py-2 text-left shadow-soft hover:bg-accent/50"><span className="sr-only">Copy: </span>{o}</button></li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted-foreground">AI suggestions (Cloudflare Workers AI). Check each one sounds like you and is true. Your phrase and note are sent to the service, so leave out private details.</p>
              <button type="button" className="mt-1 inline-flex min-h-6 items-center text-xs font-medium text-primary" onClick={() => setReword(null)}>Close</button>
            </div>
          ) : null
        )}
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
            {hasResults
              ? <button type="button" onClick={() => goTop('feel')} className="block min-h-6 max-w-full truncate text-left text-xs text-muted-foreground" aria-label="Change your picks">{needObj?.name ?? ANYONE.label} &rarr; {feelingObj?.label ?? emotionObj?.label}</button>
              : <p className="truncate text-xs text-muted-foreground">Listen first, then find the words</p>}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {reviewMode && <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">Review</span>}
            <Button variant="outline" className="min-h-9 rounded-full px-3" onClick={() => setMoreOpen(true)} aria-haspopup="dialog"><SlidersHorizontal /> More</Button>
          </div>
        </header>
      </div>

      <main className="pt-4">
        {favPhrases.length > 0 && (
          <section id="my-lines" aria-labelledby="my-lines-h" className="mb-5 scroll-mt-20 rounded-2xl border border-primary/20 bg-card p-3 shadow-soft">
            <h2 id="my-lines-h" className="mb-1.5 flex items-center gap-1.5 px-1 text-sm font-semibold"><Star className="size-4 fill-current text-primary" /> My lines</h2>
            <ul className="divide-y divide-border">
              {(favsAll ? favPhrases : favPhrases.slice(0, 3)).map((p) => (
                <li key={p.id} className="flex items-center gap-1">
                  <button type="button" onClick={() => onCopy(p)} className="min-h-10 min-w-0 flex-1 rounded-lg px-1 py-1.5 text-left text-[0.95rem] hover:bg-accent/40"><span className="sr-only">Copy: </span>{textOf(p)}</button>
                  <button type="button" aria-label="Share" onClick={() => shareLine(textOf(p))} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"><Share2 className="size-4" /></button>
                  <button type="button" aria-label="Remove from My lines" onClick={() => toggleFav(p.id)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-primary hover:bg-accent/60"><Star className="size-4 fill-current" /></button>
                </li>
              ))}
            </ul>
            {favPhrases.length > 3 && <button type="button" onClick={() => setFavsAll((v) => !v)} className="mt-1 inline-flex min-h-8 items-center px-1 text-xs font-medium text-primary">{favsAll ? 'Show fewer' : `Show all ${favPhrases.length}`}</button>}
          </section>
        )}
        <section aria-labelledby="who">
          {!needOpen ? (
            <>
              <h2 id="who" className="sr-only">What are you hearing?</h2>
              <Summary n={1} title="What you're hearing" value={needLabel ?? 'Not sure (optional)'} onChange={() => setNeedOpen(true)} />
            </>
          ) : (
            <>
              <Step n={1} id="who" title="What are you hearing from them?" />
              <div className="grid grid-cols-1 gap-2 min-[340px]:grid-cols-2">
                {NEEDS.map((n) => {
                  const on = need === n.id
                  return (
                    <button key={n.id} type="button" aria-pressed={on} onClick={() => pickNeed(n.id)}
                      className={cn('flex min-h-14 flex-col items-start justify-center rounded-2xl border px-3.5 py-2 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98]',
                        on ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card hover:border-primary/40 hover:bg-accent/60')}>
                      <span className="text-[0.95rem] font-semibold leading-tight">{n.name}</span>
                      <span className={cn('mt-0.5 text-[0.8rem] leading-snug', on ? 'text-primary-foreground/85' : 'text-muted-foreground')}>{n.label.charAt(0).toLowerCase() + n.label.slice(1)}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-2">
                <Chip small active={need === 'any'} onClick={() => pickNeed('any')} title={ANYONE.hint}>{ANYONE.label}</Chip>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="mr-1.5 inline-flex h-5 items-center rounded-full bg-secondary px-2 font-semibold text-foreground/75">Coach&rsquo;s view, untested</span>
                Optional. Things you might hear, not labels.
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
              {situation !== 'all' && (
                <button type="button" onClick={() => setSituation('all')} className="mt-1.5 inline-flex min-h-7 items-center gap-1 rounded-full bg-secondary px-2.5 text-xs font-medium" aria-label={`Remove filter: ${SITUATIONS.find((x) => x.id === situation)?.label}`}>
                  Only {SITUATIONS.find((x) => x.id === situation)?.label.toLowerCase()} <X className="size-3.5" />
                </button>
              )}
              {emotionObj && !feelOpen && <p className="mt-2 rounded-xl bg-accent/50 p-2.5 text-sm"><span className="font-semibold">They seem to feel {emotionObj.label.toLowerCase()}. </span>{emotionObj.respond}</p>}
              {keptOnly && <p className="mt-2 text-xs text-muted-foreground">Showing kept phrases only. <button type="button" className="inline-flex min-h-6 items-center font-medium text-primary underline" onClick={() => setKeptOnly(false)}>Show all</button></p>}
              {best.length === 0 && more.length === 0 && <p className="mt-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nothing here for this mix yet. Try another feeling{situation !== 'all' ? ', or remove the filter' : ''}.</p>}
              <div className="mt-3 space-y-3">{shown.map((p) => renderCard(p, !!need && need !== 'any' && p.need === 'any'))}</div>
              {quickOnly && best.length > 1 && <Button variant="outline" className="mt-3 min-h-10 w-full rounded-full" onClick={() => setShowAllKey(listKey + '#more')}>Show more ({best.length - 1})</Button>}
              {!quickOnly && !showAll && best.length > LIMIT && <Button variant="outline" className="mt-3 min-h-10 w-full rounded-full" onClick={() => setShowAllKey(listKey + '#all')}>Show {best.length - LIMIT} more</Button>}
              {!quickOnly && more.length > 0 && (
                <>
                  <h3 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">More for {needLabel} (other feelings)</h3>
                  <div className="space-y-3">{more.map((p) => renderCard(p))}</div>
                </>
              )}
              <p className="mt-5 text-center text-xs text-muted-foreground">{reminder}</p>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center text-sm text-muted-foreground">
              <h2 id="results" className="text-base font-semibold text-foreground">Pick a feeling to see phrases</h2>
              <p className="mt-1">Step 1 is optional. Tap a line to copy it, or star it to keep it.</p>
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
        {toast && <span key={toast.n} className="pop rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast.m}</span>}
      </div>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
            <DialogDescription>Settings are saved on this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2 pb-2">
              <Button variant="outline" className="min-h-11 rounded-xl" onClick={openPrep}><ClipboardList /> Prep card</Button>
              <Button variant="outline" className="min-h-11 rounded-xl" onClick={() => { setMoreOpen(false); setAbout(true) }}><Info /> About</Button>
            </div>
            <Switch on={settings.quick} onChange={(v) => setSettings((x) => ({ ...x, quick: v }))} label="Quick mode" hint="One best line first, more behind one tap" />
            <Switch on={settings.details} onChange={(v) => setSettings((x) => ({ ...x, details: v }))} label="Card details" hint="Sources, research, situation and evidence notes" />
            <Switch on={settings.bigText} onChange={(v) => setSettings((x) => ({ ...x, bigText: v }))} label="Bigger text" />
            <Switch on={reviewMode} onChange={setReviewMode} label="Review mode" hint="Keep, edit or bin lines" />
            <div className="px-2 pt-2">
              <p className="mb-1.5 text-sm font-medium">Where in the conversation</p>
              <div role="group" aria-label="Where in the conversation" className="grid grid-cols-5 gap-1 rounded-full bg-secondary p-1">
                {([['all', 'All'], ...SITUATIONS.map((x) => [x.id, x.label])] as [Situation | 'all', string][]).map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={situation === id} onClick={() => setSituation(id)}
                    className={cn('min-h-8 rounded-full px-0.5 text-[0.72rem] font-medium transition-colors', situation === id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={prepOpen} onOpenChange={setPrepOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prep card</DialogTitle>
            <DialogDescription>Three lines and one tip to glance at before you go in.</DialogDescription>
          </DialogHeader>
          {(() => {
            const lines = prepLines(prepNeed, prepFeeling)
            const f = FEELINGS.find((x) => x.id === prepFeeling)!
            const tipIds = FEELING_TIPS[prepFeeling] ?? []
            const tip = (lines.find((l) => l.delivery)?.delivery ?? TIPS[tipIds[0]]?.text ?? TIPS.askstop.text).split(/(?<=[.!?])\s+/)[0] // one tip, one sentence
            const all = lines.map((l) => textOf(l)).join('\n')
            const sel = 'min-h-9 min-w-0 rounded-full border border-input bg-card px-3 text-sm'
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
                  <label className="text-xs font-medium text-muted-foreground">You&rsquo;re hearing
                    <select className={cn(sel, 'mt-1 w-full text-foreground')} value={prepNeed} onChange={(e) => setPrepNeed(e.target.value as NeedChoice)}>
                      <option value="any">{ANYONE.label}</option>
                      {NEEDS.map((n) => <option key={n.id} value={n.id}>{needText(n)}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">Help them feel
                    <select className={cn(sel, 'mt-1 w-full text-foreground')} value={prepFeeling} onChange={(e) => setPrepFeeling(e.target.value)}>
                      {FEELINGS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="rounded-2xl border border-primary/25 bg-accent/40 p-4" aria-live="polite">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-foreground"><span aria-hidden className="mr-1">{f.emoji}</span>{f.label}</p>
                  {lines.length === 0 ? <p className="text-sm text-muted-foreground">No lines for this mix yet.</p> : (
                    <ol className="space-y-2.5">
                      {lines.map((l, i) => (
                        <li key={l.id} className="flex gap-2.5 text-[1.05rem] font-medium leading-snug">
                          <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">{i + 1}</span>
                          <span>{textOf(l)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className="mt-3 rounded-xl bg-card p-2.5 text-sm"><span className="font-semibold">Tip: </span>{tip}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="min-h-10 flex-1 rounded-full" onClick={async () => say((await copyText(all)) ? 'Copied all three' : 'Could not copy')}><Copy /> Copy all</Button>
                  <Button variant="outline" className="min-h-10 flex-1 rounded-full" onClick={() => shareLine(all + '\n\nTip: ' + tip)}><Share2 /> Share</Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

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
            <p><b>Review mode.</b> Turn it on under More to keep, edit or bin phrases. Choices live on this device. Export saves them as a file; Import loads a file back (for example on another phone).</p>
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
