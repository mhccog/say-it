# Say it

A small phone-friendly app. Optionally pick what you're hearing from them (Chase Hughes's six social needs, a coach's view, untested), pick how you want them to feel, and get phrase cards you can copy with one tap. "Not sure / anyone" or a feeling on its own is enough. Each card has a delivery tip, a situation tag and a source note.

- All phrases are **original drafts**, written from personal notes plus public writing by Vanessa Van Edwards, Vinh Giang and Chase Hughes (paraphrased, never copied). 
- Types are things to *listen for*, not labels. No covert or manipulative techniques are included.
- **Review mode** lets you keep, edit or bin each phrase (saved on your device), export the result as JSON, import it on another device, and show kept phrases only.
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

`worker/` is a tiny Cloudflare Worker that rewords one phrase with **Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`, through the `AI` binding), so there is no separate AI provider key. Its prompt keeps suggestions honest and kind: same meaning, no new claims or compliments, no pressure or persuasion tricks. Only the GitHub Pages origin (and localhost) may call it, and each visitor is limited to 20 rewrites a minute.

- Deploy (needs Node 22 and a Cloudflare API token in `CLOUDFLARE_API_TOKEN`): `cd worker && npm ci && npx wrangler deploy`.
- Switch the button on by setting the repo Actions variable `VITE_REWORD_URL` to the Worker's URL, then re-run the Pages deploy. While it is empty the button doesn't appear.
