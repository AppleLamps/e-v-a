# Musk v. Altman — Site

A static, vanilla HTML/CSS/JS site that presents a forensic reading of *Elon Musk et al. v. Samuel Altman et al.* (4:24-cv-04722-YGR, N.D. Cal., Hon. Yvonne Gonzalez Rogers).

The site is a thin renderer over a small set of JSON data files. Every claim on the site is keyed to a docket entry in the surrounding archive (`../court-case-md/`) so the analytical product can be re-checked against primary evidence.

## Stack

- Vanilla HTML, CSS, and ES modules. No build step.
- Native browser features only — `fetch`, hash routing, IntersectionObserver, `prefers-color-scheme`, `prefers-reduced-motion`.
- No npm dependencies at runtime. No bundler, no transpiler.
- Runs as a static directory; deploy unmodified to Vercel, GitHub Pages, Netlify, S3+CloudFront, etc.

## File layout

```
site/
├── index.html            single entry; mounts all views
├── vercel.json           cache headers + clean URLs (Vercel-only)
├── css/
│   ├── styles.css        @imports the partials
│   ├── base/             tokens, reset, typography, layout, utilities, states
│   ├── components/       header, footer, cards, citations, buttons, search, ...
│   └── views/            home, timeline, actors, entities, disputed, ...
├── js/
│   ├── main.js           boot
│   ├── router.js         hash routing
│   ├── search.js         global search
│   ├── theme.js          dark/light toggle
│   ├── data/loader.js    fetch + index
│   ├── components/       nav, citation popover
│   ├── utils/            DOM helpers, formatters, citation chip renderer
│   └── views/            one file per top-level route
└── data/
    ├── meta.json         case-level metadata; archive scope; counts
    ├── actors.json       people
    ├── entities.json     legal entities
    ├── timeline.json     dated events
    ├── quotes.json       quoted statements with citations
    ├── claims.json       causes of action + procedural history
    ├── disputed-facts.json   side-by-side disputed-facts cards
    ├── sources.json      docket entries with editorial notes
    └── analysis.json     hero, executive summary, eras, connection edges, long-form sections
```

## Running locally

Any static-file server will do.

```sh
# from the site/ directory
python3 -m http.server 4757
# then open http://localhost:4757
```

The site does not need any node tooling, build step, or environment variables to render.

## Deploying to Vercel

Two routes:

1. **Drag-and-drop on vercel.com.** Choose this directory (`site/`) when importing. Vercel detects the static layout and serves it.
2. **CLI.** From this directory:

   ```sh
   npx vercel deploy --prod
   ```

   `vercel.json` configures clean URLs and per-folder cache headers. Notably, `/data/*.json` is cached for 120 seconds with `must-revalidate`, so updates to the JSON appear within ~2 minutes of deploy without users needing a hard refresh.

The site has no runtime environment variables. There is no server-side code, no API route, no database.

## Source-of-truth chain

```
court-case-md/   ←  primary evidence (588 court filings as markdown + YAML frontmatter)
case-files/      ←  secondary trial-wiki commentary (treated as observation, not primary)
                ↓
analyst notes (forensic reading)
                ↓
data/*.json      ←  this site reads from here
                ↓
HTML rendered by the JS modules in js/views/
```

When the docket is updated:

1. Add new entries to `../court-case-md/` (existing scripts handle PDF → markdown).
2. Adjust `data/sources.json` to include any newly significant filings, with a short editorial note.
3. Update affected views (`data/timeline.json`, `data/quotes.json`, etc.).
4. Bump `data/meta.json:last_analyzed` and (if archive scope changed) `archive_through`/`archive_through_iso`.

## Update workflow — adding content

All content lives in nine JSON files under `data/`. None of them require editing the JS or HTML.

### Add a new actor

Append to `data/actors.json`:

```json
{
  "id": "kebab-case-id",
  "name": "Full Name",
  "role": "Short role line",
  "side": "plaintiff | defendant | microsoft | judicial | counsel | witness | third_party | neutral",
  "roles": ["Witness", "Director"],
  "tags": ["Defendant", "Board member"],
  "summary": "Card summary, ~3 sentences.",
  "bio": "Longer dossier.",
  "role_in_case": "Why this person matters to the litigation.",
  "position_shifts": [
    { "when": "Sep 2017", "text": "What they said.", "citations": [{ "docket": "32", "filename": "gov.uscourts.cand.433688.32.13.md" }] }
  ],
  "attributes": [["Title", "value"], ["Trial role", "value"]],
  "connections": [{ "actor_id": "elon-musk", "actor_name": "Elon Musk", "relation": "Co-founder" }]
}
```

### Add a new entity

Append to `data/entities.json` with `tier` set to one of: `nonprofit`, `operating`, `holding`, `fund`, `spv`, `aestas`, `plaintiff`, `microsoft`, `other`.

### Add a new timeline event

Append to `data/timeline.json`:

```json
{
  "id": "evt-2026-04-27",
  "date": "2026-04-27",
  "date_label": "Apr 27, 2026",
  "title": "Trial begins",
  "description": "What happened.",
  "side": "plaintiff | defendant | judicial | microsoft | neutral",
  "actors": ["Display Name 1", "Display Name 2"],
  "major": true,
  "citations": [
    { "docket": "350", "page": 0, "filename": "gov.uscourts.cand.433688.350.0_2.md", "title": "Filing title" }
  ]
}
```

For trial citations, use:

```json
{ "trial": "042826TT.txt", "line": 4186, "snippet": "verbatim quote" }
```

### Add a new quote

Append to `data/quotes.json`:

```json
{
  "id": "q-some-id",
  "speaker_name": "Sam Altman",
  "speaker_id": "sam-altman",
  "recipient_name": "Elon Musk",
  "year": 2017,
  "context_label": "Email reply (Sept 21, 2017)",
  "venue": "private | public | court | deposition | trial",
  "under_oath": false,
  "themes": ["nonprofit purpose"],
  "side": "plaintiff | defendant | judicial | neutral",
  "contradicts": false,
  "text": "verbatim text",
  "citations": [{ "docket": "32", "filename": "gov.uscourts.cand.433688.32.13.md", "title": "FAC Ex. 13" }]
}
```

### Add or amend a cause of action

Append to `data/claims.json`. Use `status`: `live | trial | dismissed | partially_dismissed | counterclaim | superseded`.

### Add a disputed fact

Append to `data/disputed-facts.json`. Use `status`: `disputed | conflicting | unresolved | supported`.

### Update the executive summary or analysis sections

Edit `data/analysis.json`. The `sections[]` array is rendered as long-form analysis on `/analysis`. Inline `**bold**` is supported in `text` for blocks of `type: "p"`.

### Update the connection map

Edit `data/analysis.json`'s `connections` array. Each entry needs a `from` and `to` of the form `"a:<actor-id>"` or `"e:<entity-id>"`, plus a `kind` and `label`.

### Bump the "last analyzed" timestamp

Edit `data/meta.json`:

```json
{ "last_analyzed": "2026-05-04", "archive_through": "Nov 7, 2025", "archive_through_iso": "2025-11-07" }
```

## Citation conventions

- Court citations: `{ docket: "163", filename: "gov.uscourts.cand.433688.163.0.md", page: 7, title: "...", snippet: "..." }`. The chip renders as `§Dkt #163 p.7`.
- Trial citations: `{ trial: "042826TT.txt", line: 4186, snippet: "..." }`. The chip renders as `T 0428:4186` and is flagged in the popover as secondary trial-wiki commentary.
- Citations may also be passed as shorthand strings — `"#163"` or `"Trial 042826TT.txt:1284"` — and the JS will normalize them.

## Performance notes

- All view modules are imported eagerly via the router; data fetches are parallel. Total cold-load JS payload is small (~30 KB, no minification).
- `prefers-reduced-motion` zeroes out transitions in `css/base/tokens.css`.
- Headings and body use a `clamp()` fluid type scale so type does not jump between breakpoints.
- The connection map computes its layout in-browser with a deterministic relax loop — no D3, no external graph library, no large vendor bundle.

## Accessibility

- Every interactive control is keyboard reachable. Press `/` from anywhere to open search.
- All citations are real `<a>` elements with `aria-label`s.
- Color contrast meets WCAG AA in both themes; both dark and light modes are tested.
- Skip link, semantic landmarks (`<header>`, `<main>`, `<footer>`, `<nav>`).
- Screen-reader-friendly: ARIA used only where semantic HTML cannot do the job (e.g., the search dialog, the citation popover, the connection-map application role).

## Source-of-truth integrity

A small Node integrity check is included by convention in the parent project. From this directory:

```sh
node --input-type=module -e '
import { readFileSync } from "fs";
const f = (n) => JSON.parse(readFileSync("./data/"+n+".json","utf8"));
const data = { actors: f("actors"), entities: f("entities"), quotes: f("quotes"), analysis: f("analysis"), disputed: f("disputed-facts") };
const A = new Set(data.actors.map(a => a.id));
const E = new Set(data.entities.map(e => e.id));
const probs = [];
data.quotes.forEach(q => { if (q.speaker_id && !A.has(q.speaker_id)) probs.push("quote "+q.id+" → unknown speaker "+q.speaker_id); });
data.analysis.connections.forEach(c => {
  const ok = (id) => id.startsWith("a:") ? A.has(id.slice(2)) : E.has(id.slice(2));
  if (!ok(c.from) || !ok(c.to)) probs.push("connection "+c.from+" → "+c.to);
});
data.disputed.forEach(d => (d.actors||[]).forEach(a => { if (!A.has(a)) probs.push("dispute "+d.id+" → unknown actor "+a); }));
console.log(probs.length ? probs.join("\n") : "OK");
'
```

This catches every kind of cross-reference drift before a deploy.
