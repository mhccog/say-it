export type NeedId = 'significance' | 'approval' | 'acceptance' | 'intelligence' | 'pity' | 'power'
export type Situation = 'opener' | 'rapport' | 'disagree' | 'close'

export interface Need {
  id: NeedId
  label: string
  tier: 'Primary' | 'Secondary'
  hint: string
  question: string
  listenFor: string[]
  mightSay: string[]
  speakTo: string
}

// From personal notes (Needs-Map, Chase Hughes) - framed as things to LISTEN FOR, not labels.
export const NEEDS: Need[] = [
  {
    id: 'significance', label: 'Significance', tier: 'Primary', hint: 'Wants to matter',
    question: 'Do others see me as important, as making an impact?',
    listenFor: ['Talks about what they have achieved or built', 'Wants to stand out; status or standout style', 'Mentions their reach or how many people rely on them'],
    mightSay: ['"I built that from scratch."', '"People still call me for advice."'],
    speakTo: 'Acknowledge their specific impact, not just a general compliment.',
  },
  {
    id: 'approval', label: 'Approval', tier: 'Primary', hint: 'Wants to get it right',
    question: 'Am I doing this right?',
    listenFor: ['Checks in a lot', 'Seeks reassurance or permission', 'Plays themselves down before they start'],
    mightSay: ['"Is that okay?"', '"I\'m sure I\'ll mess it up."'],
    speakTo: 'Give clear, explicit validation. Say what is good and why.',
  },
  {
    id: 'acceptance', label: 'Acceptance', tier: 'Primary', hint: 'Wants to belong',
    question: 'Do I belong?',
    listenFor: ['"We", "us", "our" language', 'Talks about teams, groups and shared outings', 'Notices who is in and out of the group'],
    mightSay: ['"We all get on really well."', '"Everyone goes out on Thursdays."'],
    speakTo: 'Use shared group language, such as "people like you".',
  },
  {
    id: 'intelligence', label: 'Intelligence', tier: 'Secondary', hint: 'Wants to be seen as smart',
    question: 'Do others see me as smart?',
    listenFor: ['Mentions education, research or expertise', 'Uses deliberately rich vocabulary', 'Tests whether you know what they know'],
    mightSay: ['"When I was at university..."', '"I wrote a paper on that."'],
    speakTo: 'Ask for their expert opinion, and mean it.',
  },
  {
    id: 'pity', label: 'Pity', tier: 'Secondary', hint: 'Wants it known how hard it has been',
    question: 'Do others realise how bad I have had it?',
    listenFor: ['Talks about tragedy, misfortune or everyday annoyances', 'Seeks sympathy', 'Sometimes tired posture or look'],
    mightSay: ['"You wouldn\'t believe my week."', '"Nobody sees what I deal with."'],
    speakTo: 'Briefly confirm how hard it was, pause so they feel heard, THEN gently move on. Do not say "it\'s not that bad".',
  },
  {
    id: 'power', label: 'Power', tier: 'Secondary', hint: 'Wants control of the call',
    question: 'Am I the one in charge here?',
    listenFor: ['Directs the conversation', 'Wants the final say', 'Leadership or decision language'],
    mightSay: ['"Here\'s how we\'re doing it."', '"Just give me the headline."'],
    speakTo: 'Let them make the call, and keep it clear and short.',
  },
]

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
  { id: 'rapport', label: 'Build rapport' },
  { id: 'disagree', label: 'Disagree' },
  { id: 'close', label: 'Close' },
]

export interface Tip { id: string; text: string; source: string }
export const TIPS: Record<string, Tip> = {
  computer: { id: 'computer', text: 'Hand to chin or a slight head tilt while they talk. It shows you are taking it in.', source: 'VGB' },
  slownod: { id: 'slownod', text: 'Slow, triple nod at their emotional moments.', source: 'VVEA' },
  pause: { id: 'pause', text: 'Pause just before and after the key words. A pause gives them weight.', source: 'NG' },
  highlight: { id: 'highlight', text: 'Briefly show their feeling on your face and voice, then relax your face.', source: 'VVEA' },
  soft: { id: 'soft', text: 'Drop your volume a touch. People relax when you do.', source: 'VGR' },
  smile: { id: 'smile', text: 'A relaxed, slight smile and a little melody keep it warm.', source: 'VGP' },
  triangle: { id: 'triangle', text: 'Eye contact: left eye, right eye, nose, shifting every few seconds.', source: 'VGB' },
  melody: { id: 'melody', text: 'Add melody, then end the sentence on a lower note. Rising at the end sounds like asking permission.', source: 'VGP' },
  slowdown: { id: 'slowdown', text: 'Slow right down on the one line that matters most.', source: 'NG' },
  palmsdown: { id: 'palmsdown', text: 'Palms down for a firm point; palms up to welcome.', source: 'NG' },
  match: { id: 'match', text: 'Match their pace and volume for the first minute, then lift a notch at a time.', source: 'VGR' },
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
  VVEC: { label: 'Vanessa: conversation starters', url: 'https://www.scienceofpeople.com/conversation-starters/' },
  VVEL: { label: 'Vanessa: how to be likable', url: 'https://www.scienceofpeople.com/how-to-be-likable/' },
  VVEA: { label: 'Vanessa: listening cues', url: 'https://www.scienceofpeople.com/active-listening/' },
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

/** Where Chase explains how to spot each need (DOAC 2024), so people can hear it in his own words. */
export const CHASE_SPOT: Record<NeedId, string> = {
  significance: '0:41:13', approval: '0:41:43', acceptance: '0:42:17', intelligence: '0:42:48', pity: '0:42:48', power: '0:43:18',
}

/** Official profiles Saturday confirmed (Chase: Instagram only). */
export const PROFILES = [
  { who: 'Vanessa Van Edwards', links: [['Instagram', 'https://www.instagram.com/vvanedwards/'], ['TikTok', 'https://www.tiktok.com/@vvanedwards'], ['X', 'https://x.com/vvanedwards']] },
  { who: 'Vinh Giang', links: [['Instagram', 'https://www.instagram.com/askvinh/'], ['TikTok', 'https://www.tiktok.com/@askvinh'], ['X', 'https://x.com/AskVinh']] },
  { who: 'Chase Hughes', links: [['Instagram', 'https://www.instagram.com/chasehughesofficial/']] },
] as const
