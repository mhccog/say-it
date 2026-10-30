export type NeedId = 'significance' | 'approval' | 'acceptance' | 'intelligence' | 'pity' | 'power'
export type Situation = 'opener' | 'rapport' | 'disagree' | 'close'

export interface Need {
  id: NeedId
  /** Short name shown first, e.g. "Significance". Chase's term, except Pity, shown as Hardship. */
  name: string
  /** What you're hearing, e.g. "Wants to belong". Never a label for the person. */
  label: string
  tier: 'Primary' | 'Secondary'
  hint: string
  /** The quiet question underneath, from the notes. Left out where the notes give none. */
  question?: string
  listenFor: string[]
  mightSay: string[]
  speakTo: string
}

// From personal notes (Needs-Map, Chase Hughes). Coach's view, untested: framed as things to LISTEN FOR, never labels.
export const NEEDS: Need[] = [
  {
    id: 'significance', name: 'Significance', label: 'Wants to matter', tier: 'Primary', hint: 'Talks about impact and what they have built',
    question: 'Do others see me as important, as making an impact?',
    listenFor: ['Talks about what they have achieved or built', 'Wants to stand out; status or standout style', 'Mentions their reach or how many people rely on them'],
    mightSay: ['"I built that from scratch."', '"People still call me for advice."'],
    speakTo: 'Acknowledge their specific impact, not just a general compliment.',
  },
  {
    id: 'approval', name: 'Approval', label: 'Wants to get it right', tier: 'Primary', hint: 'Checks in and looks for reassurance',
    question: 'Am I doing this right?',
    listenFor: ['Checks in a lot', 'Seeks reassurance or permission', 'Plays themselves down before they start'],
    mightSay: ['"Is that okay?"', '"I\'m sure I\'ll mess it up."'],
    speakTo: 'Give clear, explicit validation. Say what is good and why.',
  },
  {
    id: 'acceptance', name: 'Acceptance', label: 'Wants to belong', tier: 'Primary', hint: 'Says "we" and talks about the group',
    question: 'Do I belong?',
    listenFor: ['"We", "us", "our" language', 'Talks about teams, groups and shared outings', 'Notices who is in and out of the group'],
    mightSay: ['"We all get on really well."', '"Everyone goes out on Thursdays."'],
    speakTo: 'Use shared group language, such as "people like you".',
  },
  {
    id: 'intelligence', name: 'Intelligence', label: 'Wants to be seen as smart', tier: 'Secondary', hint: 'Mentions expertise and explains how things work',
    question: 'Do others see me as smart?',
    listenFor: ['Mentions education, research or expertise', 'Uses deliberately rich vocabulary', 'Tests whether you know what they know'],
    mightSay: ['"When I was at university..."', '"I wrote a paper on that."'],
    speakTo: 'Ask for their expert opinion, and mean it.',
  },
  {
    id: 'pity', name: 'Hardship', label: 'Wants it known it\'s been hard', tier: 'Secondary', hint: 'Talks about what they have been through',
    question: 'Do others realise how bad I have had it?',
    listenFor: ['Talks about tragedy, misfortune or everyday annoyances', 'Seeks sympathy', 'Sometimes tired posture or look'],
    mightSay: ['"You wouldn\'t believe my week."', '"Nobody sees what I deal with."'],
    speakTo: 'Briefly confirm how hard it was, pause so they feel heard, THEN gently move on. Do not say "it\'s not that bad".',
  },
  {
    id: 'power', name: 'Power', label: 'Wants to steer', tier: 'Secondary', hint: 'Directs the conversation and wants the final say',
    listenFor: ['Directs the conversation', 'Wants the final say', 'Leadership or decision language'],
    mightSay: ['"Here\'s how we\'re doing it."', '"Just give me the headline."'],
    speakTo: 'Let them make the call, and keep it clear and short.',
  },
]

/** The "Not sure / anyone" choice: general phrases that suit anyone. */
/** "Significance – wants to matter": the name with its meaning beside it. */
export const needText = (n: Need) => `${n.name} \u2013 ${n.label.charAt(0).toLowerCase()}${n.label.slice(1)}`

export const ANYONE = { id: 'any' as const, label: 'Not sure / anyone', hint: 'General phrases that suit anyone' }
export const COACH_NOTE = "Coach\u2019s view, untested. Listening prompts from Chase Hughes\u2019s six needs, not a tested model and never a label. Most people show a mix. If unsure, pick \u201cNot sure\u201d or just ask."

export interface Feeling { id: string; label: string; emoji: string }
export const FEELINGS: Feeling[] = [
  { id: 'heard', label: 'Heard', emoji: '👂' },
  { id: 'understood', label: 'Understood', emoji: '🤝' },
  { id: 'liked', label: 'Liked', emoji: '😊' },
  { id: 'trusted', label: 'Trusted', emoji: '🔒' },
  { id: 'respected', label: 'Respected', emoji: '🙌' },
  { id: 'comfortable', label: 'Comfortable', emoji: '☕' },
  { id: 'reassured', label: 'Reassured', emoji: '🌤️' },
  { id: 'included', label: 'Included', emoji: '🫂' },
  { id: 'important', label: 'Important', emoji: '⭐' },
  { id: 'smart', label: 'Smart', emoji: '💡' },
  { id: 'control', label: 'In control', emoji: '🧭' },
  { id: 'reconciled', label: 'Reconciled', emoji: '🕊️' },
  { id: 'appreciated', label: 'Appreciated', emoji: '🙏' },
  { id: 'curious', label: 'Curious', emoji: '🔍' },
]

export const SITUATIONS: { id: Situation; label: string }[] = [
  { id: 'opener', label: 'Opener' },
  { id: 'rapport', label: 'Rapport' },
  { id: 'disagree', label: 'Disagree' },
  { id: 'close', label: 'Close' },
]

export interface Tip { id: string; text: string; source: string }
export const TIPS: Record<string, Tip> = {
  computer: { id: 'computer', text: 'Hand to chin or a slight head tilt while they talk. It shows you are taking it in.', source: 'VGB' },
  slownod: { id: 'slownod', text: 'A slow nod at their emotional moments encourages them to keep going.', source: 'VVEA' },
  pause: { id: 'pause', text: 'Pause just before and after the key words. A pause gives them weight.', source: 'NG' },
  highlight: { id: 'highlight', text: 'Briefly show their feeling on your face and voice, then relax your face.', source: 'VVEA' },
  soft: { id: 'soft', text: 'Drop your volume a touch. People relax when you do.', source: 'VGR' },
  smile: { id: 'smile', text: 'A relaxed, slight smile and a little melody keep it warm.', source: 'VGP' },
  triangle: { id: 'triangle', text: 'Eye contact: left eye, right eye, nose, shifting every few seconds.', source: 'VGB' },
  melody: { id: 'melody', text: 'Add melody, then end the sentence on a lower note. A falling pitch sounds more sure of itself.', source: 'VGP' },
  slowdown: { id: 'slowdown', text: 'Slow right down on the one line that matters most.', source: 'NG' },
  palmsdown: { id: 'palmsdown', text: 'Palms down for a firm point; palms up to welcome.', source: 'NG' },
  match: { id: 'match', text: 'Start near their pace and volume, subtly (obvious copying can backfire), then lift a notch at a time.', source: 'VGR' },
  warm: { id: 'warm', text: 'Keep the same warm tone all the way through, including the hard part.', source: 'VGF' },
  lean: { id: 'lean', text: 'Lean in a little when they say something that matters.', source: 'VVEA' },
  congruent: { id: 'congruent', text: 'Make your face match the message: serious when serious, bright for good news.', source: 'VGB' },
  askstop: { id: 'askstop', text: 'Ask, then stop talking. Let the silence do some of the work.', source: 'NG' },
  palmsup: { id: 'palmsup', text: 'Open palms, hands visible, to invite them in.', source: 'NG' },
}

export const FEELING_TIPS: Record<string, string[]> = {
  heard: ['computer', 'slownod', 'pause'],
  understood: ['highlight', 'slownod', 'soft'],
  liked: ['smile', 'triangle', 'match'],
  trusted: ['melody', 'slowdown', 'pause'],
  respected: ['melody', 'triangle', 'palmsdown'],
  comfortable: ['soft', 'match', 'palmsup'],
  reassured: ['warm', 'slowdown', 'soft'],
  included: ['palmsup', 'smile', 'lean'],
  important: ['pause', 'triangle', 'melody'],
  smart: ['askstop', 'lean', 'computer'],
  control: ['palmsup', 'askstop', 'melody'],
  reconciled: ['warm', 'congruent', 'match'],
  appreciated: ['pause', 'warm', 'triangle'],
  curious: ['melody', 'lean', 'askstop'],
}

export interface Source { label: string; url?: string; video?: string; platform?: 'Instagram' | 'TikTok' | 'X' } // Notion notes are private, so they have no link
export const SOURCES: Record<string, Source> = {
  NM: { label: 'Notion: Needs-Map (Chase Hughes)' },
  NG: { label: 'Notion: Who I\u2019m Becoming' },
  NP: { label: 'Notion: Persuasion & relatability notes' },
  NS: { label: 'Notion: Sensory-Preference (Chase Hughes)' },
  VVEC: { label: 'Vanessa: conversation starters', url: 'https://www.scienceofpeople.com/conversation-starters-topics/' },
  VVEL: { label: 'Vanessa: how to be likable', url: 'https://www.scienceofpeople.com/likable/' },
  VVEA: { label: 'Vanessa: listening cues', url: 'https://www.scienceofpeople.com/listening-skills/' },
  VVER: { label: 'Vanessa: how to read people', url: 'https://www.scienceofpeople.com/how-to-read-people/' },
  VGR: { label: 'Vinh: build rapport', url: 'https://vinhgiang.com/blog/how-to-build-rapport-with-absolutely-anyone' },
  VGS: { label: 'Vinh: small talk', url: 'https://vinhgiang.com/blog/how-to-make-small-talk' },
  VGB: { label: 'Vinh: body language for charisma', url: 'https://vinhgiang.com/blog/5-body-language-tips-to-become-more-charismatic' },
  VGF: { label: 'Vinh: constructive feedback', url: 'https://vinhgiang.com/blog/how-to-give-constructive-feedback-without-destroying-confidence' },
  VGA: { label: 'Vinh: sincere apology', url: 'https://vinhgiang.com/blog/the-art-of-the-apology-how-to-apologize-sincerely-to-anyone' },
  VGP: { label: 'Vinh: projecting without sounding angry', url: 'https://vinhgiang.com/blog/how-to-project-your-voice-without-shouting-or-sounding-angry' },
  // Saturday's research: YouTube videos. A key like V26@0:17:51 links to that second.
  V24: { label: 'Vanessa on The Diary of a CEO (2024)', video: 'VHUrdELKjDw' },
  V26: { label: 'Vanessa on The Diary of a CEO (2026)', video: 'q2cg1gEYWJQ' },
  VG: { label: 'Vinh on The Diary of a CEO (2025)', video: 'oIiv_335yus' },
  C24: { label: 'Chase on The Diary of a CEO (2024)', video: 'RvjR9GM2kX8' },
  C26: { label: 'Chase on The Diary of a CEO (2026)', video: '9uSXOr-AdAU' },
  CS: { label: 'Chase: YouTube Short on the six needs', video: 'YzJI8GTHteQ' },
  VGQ: { label: 'Vinh: how to enter conversations', video: '-X13GINFYOY' },
  VVC: { label: 'Vanessa: memorable compliments', video: 'MOre3dRqHlA' },
  EK: { label: 'Paul Ekman Group: the seven universal emotions', url: 'https://www.paulekman.com/universal-emotions/' },
  NCI: { label: 'NCI University: six social needs (secondary, not Chase\u2019s own words)', url: 'https://merlinobrecht.com/behavior-profiling/the-six-social-needs/' },
  // Social posts (Saturday section 8). Read from captions only; summarised, no timestamps.
  VIG1: { platform: 'Instagram', label: 'Vanessa, Instagram reel: a better opener than "nice to meet you"', url: 'https://www.instagram.com/vvanedwards/reel/DSvJHzLDula/' },
  VTK1: { platform: 'TikTok', label: 'Vanessa, TikTok: likable makes you more credible', url: 'https://www.tiktok.com/@vvanedwards/video/7699563694350421279' },
  VTK2: { platform: 'TikTok', label: 'Vanessa, TikTok: leave a conversation gracefully', url: 'https://www.tiktok.com/@vvanedwards/video/7696611449283611935' },
  VTK4: { platform: 'TikTok', label: 'Vanessa, TikTok: curious before critical', url: 'https://www.tiktok.com/@vvanedwards/video/7698857415135071518' },
  VTK5: { platform: 'TikTok', label: 'Vanessa, TikTok: people watch you less than you think', url: 'https://www.tiktok.com/@vvanedwards/video/7697376668339555614' },
  VTK6: { platform: 'TikTok', label: 'Vanessa, TikTok: change your energy first', url: 'https://www.tiktok.com/@vvanedwards/video/7699181704648461599' },
  VX2: { platform: 'X', label: 'Vanessa, X: learn one new thing about the person', url: 'https://x.com/vvanedwards/status/2095555287851913413' },
  VX3: { platform: 'X', label: 'Vanessa, X: send the thank-you you have been putting off', url: 'https://x.com/vvanedwards/status/2113352794451120522' },
  GIG1: { platform: 'Instagram', label: 'Vinh, Instagram: "Yes, and", "tell me more", "the one thing is"', url: 'https://www.instagram.com/askvinh/p/DLC7Ae2xYFn/' },
  GIG2: { platform: 'Instagram', label: 'Vinh, Instagram: listening is a superpower', url: 'https://www.instagram.com/askvinh/p/De8pSzdDNLd/' },
  GTK1: { platform: 'TikTok', label: 'Vinh, TikTok: end on a downward pitch', url: 'https://www.tiktok.com/@askvinh/video/7258996715020094728' },
  GTK2: { platform: 'TikTok', label: 'Vinh, TikTok: follow the threads', url: 'https://www.tiktok.com/@askvinh/video/7699530755352923413' },
  GTK3: { platform: 'TikTok', label: 'Vinh, TikTok: playfulness connects', url: 'https://www.tiktok.com/@askvinh/video/7700263406732872978' },
  GTK4: { platform: 'TikTok', label: 'Vinh, TikTok: reframe a painful story', url: 'https://www.tiktok.com/@askvinh/video/7700073827564277010' },
}

/** Turn "h:mm:ss" or "m:ss" into seconds. */
export function toSeconds(ts: string): number {
  return ts.split(':').map(Number).reduce((a, n) => a * 60 + n, 0)
}

/** Link for a source key, with an optional timestamp. */
export function sourceHref(key: string, ts?: string): string | undefined {
  const s = SOURCES[key]
  if (!s) return undefined
  if (s.video) return `https://www.youtube.com/watch?v=${s.video}` + (ts ? `&t=${toSeconds(ts)}s` : '')
  return s.url
}

/** Where Chase explains how to spot each need, so people can hear it in his own words: [source key, timestamp].
 *  Hardship uses his YouTube Short (0:00:42) because the DOAC 2024 timestamp was shared with Intelligence. */
export const CHASE_SPOT: Record<NeedId, [string, string]> = {
  significance: ['C24', '0:41:13'], approval: ['C24', '0:41:43'], acceptance: ['C24', '0:42:17'], intelligence: ['C24', '0:42:48'], pity: ['CS', '0:00:42'], power: ['C24', '0:43:18'],
}


/** Official profiles Saturday confirmed (Chase: Instagram only). */
export const PROFILES = [
  { who: 'Vanessa Van Edwards', links: [['Instagram', 'https://www.instagram.com/vvanedwards/'], ['TikTok', 'https://www.tiktok.com/@vvanedwards'], ['X', 'https://x.com/vvanedwards']] },
  { who: 'Vinh Giang', links: [['Instagram', 'https://www.instagram.com/askvinh/'], ['TikTok', 'https://www.tiktok.com/@askvinh'], ['X', 'https://x.com/AskVinh']] },
  { who: 'Chase Hughes', links: [['Instagram', 'https://www.instagram.com/chasehughesofficial/']] },
] as const

// ---- Universal emotions (Paul Ekman's seven) ----
// "They are feeling X right now" -> which target feelings to aim for. The first target is the suggestion.
export interface Emotion {
  id: string; label: string; emoji: string
  targets: string[]
  face: string; voice: string; words: string; respond: string
}
export const EMOTIONS: Emotion[] = [
  { id: 'joy', label: 'Joy', emoji: '😄', targets: ['liked', 'appreciated', 'included'],
    face: 'A real smile that reaches the eyes, with crinkles at the corners and lifted cheeks.',
    voice: 'Higher, faster and more musical.',
    words: 'Good news, "finally", "you won\u2019t believe it".',
    respond: 'Share it with them. Match their lift, ask for the story, and let them have the moment.' },
  { id: 'sadness', label: 'Sadness', emoji: '😢', targets: ['heard', 'reassured', 'comfortable'],
    face: 'Inner eyebrows pulled up, mouth corners down, eyes lowered or glassy.',
    voice: 'Slow, quiet and flat, with long pauses.',
    words: '"I\u2019m tired", "what\u2019s the point", trailing-off sentences.',
    respond: 'Slow down and lower your voice. Acknowledge before you try to fix, and let silence be okay.' },
  { id: 'fear', label: 'Fear', emoji: '😨', targets: ['reassured', 'comfortable', 'control'],
    face: 'Wide eyes, raised eyebrows drawn together, lips stretched back.',
    voice: 'Higher, quicker, maybe shaky.',
    words: '"What if\u2026", "I\u2019m worried", lots of "are you sure?"',
    respond: 'Stay calm and steady. Give one clear next step and let them set the pace. Never wave the worry away.' },
  { id: 'anger', label: 'Anger', emoji: '😠', targets: ['heard', 'understood', 'reconciled'],
    face: 'Eyebrows down and together, hard stare, tight lips or clenched jaw.',
    voice: 'Louder, or tight and clipped.',
    words: '"Always" and "never", blame, "you should have\u2026"',
    respond: 'Lower your voice, don\u2019t match their energy, and let them finish. Name what matters to them before you answer.' },
  { id: 'surprise', label: 'Surprise', emoji: '😮', targets: ['curious', 'comfortable'],
    face: 'Eyebrows up, eyes wide, jaw dropped. It lasts only a second or so.',
    voice: 'A sharp breath in, "oh!" or "wow".',
    words: '"I didn\u2019t expect that", "wait, what?"',
    respond: 'Give them a beat. Surprise fades fast and turns into something else, so what comes next is the real signal.' },
  { id: 'disgust', label: 'Disgust', emoji: '🤢', targets: ['respected', 'trusted'],
    face: 'Wrinkled nose, raised upper lip, head pulled back.',
    voice: '"Ugh", flat or clipped, a drawn-out "eww".',
    words: '"That\u2019s not right", "I can\u2019t stand\u2026", "gross".',
    respond: 'Don\u2019t push the thing they are recoiling from. Ask what bothers them, and show you take their standards seriously.' },
  { id: 'contempt', label: 'Contempt', emoji: '😏', targets: ['respected', 'trusted', 'important'],
    face: 'One corner of the mouth tightened or raised, sometimes an eye-roll.',
    voice: 'Dry, sarcastic or dismissive.',
    words: '"Whatever", "obviously", put-downs.',
    respond: 'Stay level and skip the sarcasm. Ask what they would need to see, and show quiet competence.' },
]
export const EMOTION_NOTE = 'Faces and voices are clues, not proof. They vary by person, culture and context, and contempt is the least certain of the seven. When unsure, ask how they are.'
export const EMOTION_BADGE = 'Mixed evidence: Faces are clues, not proof. When unsure, ask.'

// ---- Evidence (from the sources review, 28 Oct 2026) ----
export type Evidence = 'research' | 'coach'
/** Published studies behind the research-backed phrases. Studies are public, so they can be linked. */
export const STUDIES: Record<string, { label: string; url?: string }> = {
  LG: { label: 'Liking gap: Boothby et al. 2018', url: 'https://doi.org/10.1177/0956797618783714' },
  FU: { label: 'Follow-up questions: Huang et al. 2017', url: 'https://doi.org/10.1037/pspi0000097' },
  AD: { label: 'Asking for advice: Brooks, Gino & Schweitzer 2015', url: 'https://doi.org/10.1287/mnsc.2014.2054' },
  GR: { label: 'Thank-yous land better than we expect: Kumar & Epley 2018', url: 'https://doi.org/10.1177/0956797618772506' },
  FP: { label: 'Falling pitch sounds confident: Guyer et al. 2019', url: 'https://doi.org/10.1177/0146167218787805' },
  RE: { label: 'Choice lowers resistance: Brehm\u2019s reactance theory (1966)' },
  AP: { label: 'Responsibility + repair in apologies: Lewicki et al. 2016', url: 'https://doi.org/10.1111/ncmr.12073' },
  CU: { label: 'Curiosity from information gaps: Loewenstein 1994', url: 'https://doi.org/10.1037/0033-2909.116.1.75' },
  EX: { label: 'Conversations rarely end on time: Mastroianni et al. 2021', url: 'https://doi.org/10.1073/pnas.2011809118' },
  AL: { label: 'Naming a feeling helps: Lieberman et al. 2007', url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x' },
  SP: { label: 'Spotlight effect: Gilovich et al. 2000', url: 'https://doi.org/10.1037/0022-3514.78.2.211' },
  EC: { label: 'Moods spread: Hatfield et al. 1993', url: 'https://doi.org/10.1111/1467-8721.ep10770953' },
}
const group = (key: string, ids: string) => ids.split(' ').map((id) => [id, key] as const)
/** Phrase ID -> study. Everything else is a coach's tip. */
export const RESEARCH: Record<string, string> = Object.fromEntries([
  ...group('LG', 'p005 p029 p030 p053 p077 p078 p147 p173'),
  ...group('FU', 'p325 p326 p327 p245 p347'),
  ...group('AD', 'p019 p020 p081 p082 p215 p320'),
  ...group('GR', 'p247 p248 p185 p186 p153'),
  ...group('FP', 'p267 p268 p269 p270'),
  ...group('RE', 'p117 p155 p311'),
  ...group('AP', 'p167 p292'),
  ...group('CU', 'p190 p191'),
  ...group('EX', 'p164 p192 p242 p243'),
  ...group('AL', 'p333 p341'),
  ...group('SP', 'p253'),
  ...group('EC', 'p254 p286'),
])
/** Lines that state something you can't know is true in the moment. */
export const ONLY_IF_TRUE = new Set('p039 p044 p086 p100 p106 p213 p274 p281 p308 p310 p317 p320 p362 p363'.split(' '))
/** Coach's view: Vanessa's story types (p218-p235) and lines from social posts. */
export const STORY_TYPES = new Set([...Array.from({ length: 18 }, (_, i) => 'p' + String(218 + i).padStart(3, '0')), 'p361'])
/** Claims with mixed research: shown softly on the card. */
export const MIXED: Record<string, string> = {
  p169: 'Mixed evidence: this \u201cwise feedback\u201d framing helped in school studies but not in a later replication. Say it only if it is true.',
  p229: 'Mixed evidence: this \u201cwise feedback\u201d framing helped in school studies but not in a later replication. Say it only if it is true.',
  p349: 'Mixed evidence: reframing nerves helps some people, not everyone.',
  p271: 'Mixed evidence: warmth and know-how both matter, but warmth alone doesn\u2019t make you credible.',
  p177: 'Mixed evidence: smiling and leaning in have some support; the open-palm advice is untested.',
  p178: 'Mixed evidence: smiling and leaning in have some support; the open-palm advice is untested.',
  p351: 'Mixed evidence: smiling and leaning in have some support; the open-palm advice is untested.',
}
/** Delivery tips are stagecraft, except ending on a falling pitch. */
export const isResearchTip = (text: string) => /lower note|falling pitch|downward pitch|end on a lower/i.test(text)

export const EVIDENCE_KEY = [
  ['Backed by research', 'Published, peer-reviewed findings. Each card links the study.'],
  ['Mixed evidence', 'Real research, but disputed or weaker than the claim. Shown as a note.'],
  ['Coach\u2019s tip', 'Practitioner advice or stagecraft. May work well, but untested.'],
  ['Only if true', 'Says something about them or \u201cmost people\u201d that you need to believe first.'],
] as const

/** One neutral, factual line per source. */
export const COACH_FACTS = [
  ['Vanessa Van Edwards', 'Founder of Science of People (B.A., Emory). Curates published research and runs her own studies, which are not peer-reviewed. Sells courses.'],
  ['Vinh Giang', 'Former professional magician, now a speaking coach. No research background; his tips are stagecraft. Sells courses.'],
  ['Chase Hughes', 'Retired US Navy chief and author of self-published books. His profiling methods have not been tested in peer-reviewed research, and some of his background claims have been publicly questioned. Sells courses.'],
  ['Paul Ekman', 'Psychologist with decades of peer-reviewed work on emotion. How universal and readable facial expressions are is now debated. His group sells training.'],
] as const
