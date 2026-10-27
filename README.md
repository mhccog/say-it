# Say it

A small phone-friendly app. Pick the kind of person you are talking to (Chase Hughes's six social needs), pick how you want them to feel, and get phrase cards you can copy with one tap. Each card has a delivery tip, a situation tag and a source note.

- All phrases are **original drafts**, written from personal notes plus public writing by Vanessa Van Edwards, Vinh Giang and Chase Hughes (paraphrased, never copied). 
- Types are things to *listen for*, not labels. No covert or manipulative techniques are included.
- **Review mode** lets you keep, edit or bin each phrase (saved on your device) and export the result as JSON.
- Installable (PWA) and works offline.

## Develop

```
npm install
npm run dev      # local
npm run build    # production build into dist/
```

Phrases live in `data/phrases.psv` (`need|feeling|situation|sources|text`). `npm run phrases` (also run by the build) turns that into `src/data/phrases.json`.

Built with Vite, React, Tailwind and shadcn/ui. Deployed to GitHub Pages by `.github/workflows/deploy.yml`; the Vite base path is `/say-it/`.
