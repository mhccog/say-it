# Say it

A small phone-friendly app. Optionally pick what you're hearing from them (Chase Hughes's six social needs, a coach's view, untested), pick how you want them to feel, and get phrase cards you can copy with one tap. "Not sure / anyone" or a feeling on its own is enough. Each card has a delivery tip, a situation tag and a source note.

- All phrases are **original drafts**, written from personal notes plus public writing by Vanessa Van Edwards, Vinh Giang and Chase Hughes (paraphrased, never copied). 
- Types are things to *listen for*, not labels. No covert or manipulative techniques are included.
- **Quick mode** (default) shows one best line per pick: research-backed first, then lines kept in review, then the rest. "Show more" reveals the list.
- **My lines**: star a card to save it. Saved lines appear at the top, only when you have some. Your last picks are remembered too (all in `localStorage`).
- **One "More" control** holds Quick mode, the situation filter, card details (sources, research, situation tags), bigger text, Review mode, the Prep card and About.
- **Prep card**: pick what you hear and the feeling, and get three glanceable lines and one delivery tip, with Copy all and Share.
- **Practice out loud** (in each card's "…" menu): pitch (does the sentence end lower?) and pace are measured on the device with Web Audio. Word and filler checks use Web Speech only when the browser can recognise speech on the device, or when you tick the opt-in that uses the browser's speech service. Nothing is recorded or uploaded by Say it.
- **Share** a line with the system share sheet (copy fallback). The home-screen icon has shortcuts to My lines (`?view=favourites`) and Prep (`?view=prep`).
- **Review mode** (under More) lets you keep, edit or bin each phrase (saved on your device), export the result as JSON, import it on another device, and show kept phrases only.
- Installable (PWA) and works offline.

## Develop

```
npm install
npm run dev      # local
npm run build    # production build into dist/
```

Phrases live in `data/phrases.psv` (`need|feeling|situation|sources|text|delivery|basis|context|emotion|replaces`). `npm run phrases` (also run by the build) turns that into `src/data/phrases.json`.

- **Append only.** A phrase's ID is its line number. To fix a phrase, append a new row and put the old ID in the last field (`replaces`); the old row stays but is hidden.
- Blanks are written `___`.
- **Evidence labels** (`src/data/content.ts`): `RESEARCH` maps phrase IDs to a published study (badge "Backed by research" plus a link); everything else is a "Coach's tip". `ONLY_IF_TRUE` and `MIXED` add an "Only if true" badge or a mixed-evidence note.
- **Baking review choices:** `npm run bake -- say-it-review.json` writes `data/review.json` (kept / binned / edited by ID) and rebuilds. Commit both files.

Built with Vite, React, Tailwind and shadcn/ui. Deployed to GitHub Pages by `.github/workflows/deploy.yml`; the Vite base path is `/say-it/`.

## "Say it differently" (optional AI rewording)

`worker/` is a tiny Cloudflare Worker that rewords one phrase with **Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct-fp8`, through the `AI` binding; the plain 8b model was retired by Cloudflare), so there is no separate AI provider key. Its prompt keeps suggestions honest and kind: same meaning, no new claims or compliments, no pressure or persuasion tricks. Only the GitHub Pages origin (and localhost) may call it, and each visitor is limited to 20 rewrites a minute.

- Deploy (needs Node 22 and a Cloudflare API token in `CLOUDFLARE_API_TOKEN`): `cd worker && npm ci && npx wrangler deploy`.
- Switch the button on by setting the repo Actions variable `VITE_REWORD_URL` to the Worker's URL, then re-run the Pages deploy. While it is empty the button doesn't appear.
- Live Worker: https://say-it-reword.carplay.workers.dev (POST only, from the Say it site). Notes that ask for guilt, pressure or deception are dropped before they reach the model, and `___` blanks are kept.
