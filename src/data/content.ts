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
}

export interface Source { label: string; url?: string } // Notion notes are private, so they have no link
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
}
