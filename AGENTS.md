# AGENTS.md — Briefing for AI agents working in this repo

You are working in an archive of **Elon Musk et al. v. Samuel Altman et al.** (4:24-cv-04722-YGR, N.D. Cal.). The repo has two parallel pillars and a small ingest pipeline that connects them. Read this file before doing anything substantial — the gotchas section will save you several wrong turns.

## TL;DR — read this first, in this order

1. `README.md` — high-level orientation, current archive scope, and the case in brief.
2. `court-case-md/INDEX.md` — chronological master index of every court filing. Use this to find specific docket entries; do not grep the directory blind.
3. `site/data/meta.json` — current archive scope, posture, version, last_analyzed date.
4. `site/data/sources.json` — the curated set of "spine" filings (54 of 413 indexed). If a docket entry is in here, the site's analytical layer treats it as load-bearing.
5. The relevant `case-files/trial.mts.now_*.md` if your task touches trial-period material — those are the trial-wiki digests.

If the user asks "what's the case status" or "what's at trial" — read `meta.json` plus PTO #4 (`court-case-md/gov.uscourts.cand.433688.477.0_4.md`) plus the MSJ ruling (`court-case-md/gov.uscourts.cand.433688.390.0.md`). Do not rely on memory or the README's prose summary alone.

## The two pillars

### Pillar 1 — primary docket archive (LLM-consumable)

```
court-case-md/         1,153 markdown files (one per PDF + attachment)
court-case-pdf/        Original PDFs (gitignored — regenerable from sources/)
court-case-pdf/manifest.json   Machine-readable metadata for every PDF
```

Each `.md` file has YAML frontmatter (`filename`, `docket_entry`, `attachment`, `doc_label`, `filing_date`, `source_url`, `extraction`) followed by the docket-text paragraph as a quoted header, then the extracted body. Naming convention: `gov.uscourts.cand.433688.{N}.{M}.md` where `N` = docket entry, `M` = attachment number (0 = main filing). Some have a trailing `_K` suffix indicating multiple-PDF main documents — that's a CourtListener storage artifact.

When a docket entry has attachments, you'll see e.g. `gov.uscourts.cand.433688.32.0_1.md`, `.32.1.md`, `.32.2.md`, ..., `.32.27.md` — the `.0_1` is the main complaint, the rest are the founding-emails exhibits.

### Pillar 2 — forensic-analysis website

```
site/                  Vanilla HTML / ES-modules / CSS — no build step
├── index.html         Single-page shell; loads /js/main.js
├── css/               Design tokens (base/) + per-component + per-view
├── js/
│   ├── main.js        Entry point — boots data, theme, router, search
│   ├── router.js      Hash router with deep-link fragment support
│   ├── search.js      Global search across all data
│   ├── data/loader.js Single fetch fan-out for site/data/*.json
│   ├── views/         One file per route (home, timeline, actors, …)
│   ├── components/    Cross-view UI (nav, search, citation popover, back-to-top)
│   └── utils/         dom, format, citation helpers
├── data/              JSON files driving every view
└── vercel.json        Static-deploy config (deploys from site/ as root)
```

The site is **entirely data-driven**. Changing what's displayed almost always means editing a JSON file in `site/data/`, not the JS. The view modules are dumb renderers.

### Pillar 3 — trial-wiki digests (secondary observation)

```
case-files/            Markdown exports of pages from trial.mts.now/
                       (a third-party trial wiki). Treated as commentary,
                       not primary evidence. Per-character profiles, daily
                       transcript digests for Days 2-5, plus a timestamped
                       live-transcript snapshot for the current trial day.
case-files-backup/     Original wiki scrapes before boilerplate stripping
                       (gitignored).
```

The wiki cites trial transcripts using `(filenameTT.txt:LINE)` notation (e.g. `042826TT.txt:1234`). The underlying `TT.txt` files are NOT in the repo — citations are stable in format but not locally verifiable.

## The ingest pipeline

When the user wants to back-fill new docket entries from CourtListener, the pipeline is HTML-driven. The user (in a real browser, not via fetch — CourtListener returns 403 to bots) saves the docket pages as `sources/page1.html`, `page2.html`, etc., then runs four scripts in order. All four are idempotent — they skip work that's already done unless `--force` is passed.

```
node scripts/build-manifest.mjs    # Parse sources/page*.html → court-case-pdf/manifest.json
node scripts/download-pdfs.mjs     # Fetch any missing PDFs from CourtListener storage
node scripts/extract-pdfs.mjs      # PDF → markdown (pdftotext + OCR for scans)
node scripts/build-index.mjs       # Rebuild court-case-md/INDEX.md
```

`download-pdfs.mjs` paces requests politely (1.5s spacing, retries with backoff on 429/503) — it's safe to run repeatedly. `extract-pdfs.mjs` uses `MISTRAL_API_KEY` if set, otherwise tries Tesseract, otherwise writes placeholders for scans (text PDFs always extract).

Both `build-manifest.mjs` and `download-pdfs.mjs` use `fs.readdirSync(...)` to glob `sources/page*.html`, so adding a new HTML page automatically expands their scope — you don't need to edit the script.

After ingesting, you typically also need to update `site/data/sources.json` (curate which new entries are spine-worthy) and `site/data/meta.json` (bump `last_docket_no`, `archive_through`, `version`, etc.).

## Common tasks and how to do them

### "Add a new trial-day update to the site"
1. Read the relevant trial-wiki digest in `case-files/trial.mts.now_day_*.md` or the live transcript.
2. Add a new entry to `site/data/timeline.json` (keep the existing schema).
3. If there are quotable lines, add to `site/data/quotes.json` with `venue: "trial"` and `under_oath: true` for sworn testimony.
4. Augment relevant actor entries in `site/data/actors.json` (don't overwrite — the principals already have rich pre-trial detail).
5. Bump `meta.last_analyzed`, `meta.version`. Don't blindly bump `meta.archive_through` — it's a curatorial choice describing the *primary docket* archive, not the latest trial day. See gotchas.

### "Find what's missing from the local archive"
1. Check `meta.last_docket_no` in `site/data/meta.json`.
2. Compare against the highest docket entry in `court-case-md/INDEX.md`.
3. Compare against the actual current docket on CourtListener (use WebFetch as a fallback — it'll often 403, but you can fall back to govinfo, OpenAI's CDN, or PacerMonitor links).
4. Anything between the local high-water mark and the CourtListener high-water mark is missing. Run the pipeline to back-fill.

### "Update the site UI"
1. Find the relevant view module under `site/js/views/<name>.js`.
2. Find the matching CSS under `site/css/views/<name>.css`.
3. Cross-component CSS lives in `site/css/components/`; design tokens in `site/css/base/tokens.css`.
4. The site has no build step — your edits go live on hard refresh.

### "Verify the site renders"
You usually can't open a browser. The user can run `python -m http.server 8000` from inside `site/`. For your own validation, at minimum:
- `node --check` every modified `.js` file.
- For JSON files: `node -e "JSON.parse(require('fs').readFileSync('path', 'utf8'))"`.
- Check ID uniqueness in arrays: see the validation pattern in earlier session history.
- Don't claim the UI is "verified" if you only did syntax checks. Say what you actually did.

## Gotchas (the real meat — read this section)

### Data and citations

- **`meta.archive_through` ≠ "latest entry in archive"**. It's a curated description of the primary docket scope. The trial period is documented separately in `case-files/` and treated as secondary observation. If the user asks "is X in the archive", check `INDEX.md` directly, not this field.

- **`meta.live_claims` was wrong before May 4, 2026**. The original archive said `2` (charitable trust + restitution). After the Jan 15 2026 MSJ ruling at Dkt #390, five theories survive: charitable trust, fraud, constructive fraud, unjust enrichment (vs OpenAI), plus aiding-and-abetting fiduciary breach (vs Microsoft). If you see references to "only two surviving claims" anywhere in prose, it's stale.

- **Citation reference forms** in `site/data/`:
  - `{ "docket": "163", "page": 7 }` — court filing
  - `{ "docket": "32-1" }` or shortcut `"#32-1"` — exhibit 1 of dkt 32 (hyphen form)
  - `"#32.1"` — exhibit 1 of dkt 32 (dot form, also accepted)
  - `{ "trial": "042826TT.txt", "line": 1234 }` — trial transcript
  - `"Trial 042826TT.txt:1234"` — trial transcript (string shortcut)
  - The loader normalizes hyphen/dot forms in `site/js/data/loader.js` `lookupSource()`.

- **The trial transcript filename `050426TT.txt` is forward-cited** for today's transcripts. The actual official court-reporter file may not exist yet when you cite it. Always include a `snippet` field on those citations so the reference remains verifiable as line numbers shift between live and official versions.

- **Auto-transcription mislabels speakers** in the live trial transcript (`case-files/trial.mts.now_live.*.md`). Long stretches attribute Brockman's answers to "Stuart Russell" or to the judge. Always verify speaker attribution against the Q/A flow before pulling quotes — never trust the speaker label in isolation.

### Code

- **The brand-mark "MvA" in `site/index.html`** has three child runs (text "M", `<span class="brand-v">`, text "A"). It uses `display: inline-block` with `text-align: center` on purpose — earlier it used `display: inline-grid; place-items: center` which made each run a separate grid row, leaking "v" and "A" out below the amber square. Don't switch the display back to flex/grid unless you also wrap the contents in a single inner span (the `<span class="brand-mva">` is already there as defense-in-depth).

- **`["all", ...names].sort()` is a bug**. Lowercase 'a' has Unicode 97; uppercase letters are 65–90. Sorting after prepending pushes "all" to the end of the array, and the dropdown's first option becomes the alphabetically-first capitalized name — which then becomes the default selection. The pattern is `["all", ...[...new Set(names)].sort()]` (sort first, then prepend). Currently only quotes.js uses this pattern correctly; replicate the pattern if you add similar dropdowns.

- **Citation chips are `<button>`, not `<a>`**. They were `<a href="#" role="button">` originally — which broke middle-click and right-click "open in new tab". The CSS `appearance: none; font: inherit` reset is on `.cite` to keep the button looking like the original chip.

- **Hash router supports `#/route#fragment`**. `router.js` splits at the second `#` and scrolls the matching element into view after render with a brief amber flash. Targets need `id` attributes (timeline events, quotes, actors, etc. all set `id` on their root element). The global `[id] { scroll-margin-top: ... }` rule keeps targets from being hidden under the sticky header.

- **CourtListener returns 403 to all bot requests** — `WebFetch`, `curl`, even sometimes Python `requests`. The reliable public mirrors are:
  - `cdn.openai.com/pdf/...` for OpenAI's own filings
  - `govinfo.gov/content/pkg/USCOURTS-cand-4_24-cv-04722/pdf/USCOURTS-cand-4_24-cv-04722-{N}.pdf` for published opinions (probe N=0..21+ until 404)
  - `pacermonitor.com/public/filings/...pdf` — sometimes works, often 429s
  - `courthousenews.com/wp-content/uploads/...` for hand-uploaded copies of major filings
  - For everything else: the user must use a real browser with the RECAP extension installed; the script's existing pipeline then picks up new HTML pages from `sources/`.

### Workflow

- **Don't commit unless asked**. Per CLAUDE.md and the session-level instructions, only commit when the user explicitly says so. The user has occasionally asked to commit — when they do, follow the commit protocol in the Bash tool (parallel git status / diff / log; HEREDOC for the message; `Co-Authored-By` trailer).

- **Don't run `python -m http.server`** to "test the site" without asking. The harness blocks it as binding a port, and it's a real action with real consequences — let the user start it themselves.

- **The case-files trial-wiki snapshots are user-controlled**. They have re-exported them mid-session at least once. If the user says "I updated X" or "check the new version", check timestamps and content first; the file may differ in non-obvious ways from what's in your context.

- **PDFs in `court-case-pdf/` are gitignored**. The 562 PDFs added in the May 4 backfill aren't in the git history — they're regenerable. The markdown extractions in `court-case-md/` ARE tracked. If someone clones the repo, they get all the analyzed text but need to re-run the pipeline to recover the binary PDFs.

- **The script `scripts/build-index.mjs` reports `extraction methods used: 0 text-bearing, 0 scanned`** — that's a stale-counter bug, not a real problem. The script counts a manifest field (`f.extraction === 'scanned'`) that newer manifest entries don't always carry. Ignore the line.

## Quick reference

| What | Where |
|---|---|
| Case caption + court + judge | `site/data/meta.json` |
| Find a specific docket entry | `court-case-md/INDEX.md` (chronological) |
| Read a specific filing | `court-case-md/gov.uscourts.cand.433688.{N}.{M}.md` |
| Curated list of important filings | `site/data/sources.json` |
| Trial-day digests | `case-files/trial.mts.now_day_{2..5}.md` |
| Live trial transcript (current day) | `case-files/trial.mts.now_live.<timestamp>.md` |
| Cast of actors | `site/data/actors.json` |
| Timeline of events | `site/data/timeline.json` |
| Quote database | `site/data/quotes.json` |
| Disputed factual questions | `site/data/disputed-facts.json` |
| Causes of action / claims | `site/data/claims.json` |
| Editorial analysis | `site/data/analysis.json` |
| Corporate-entity map | `site/data/entities.json` |
| Ingest pipeline scripts | `scripts/{build-manifest,download-pdfs,extract-pdfs,build-index}.mjs` |
| Saved CourtListener HTML | `sources/page*.html` (gitignored) |
| Run logs | `logs/` (gitignored) |

## Final note

The user works fast and prefers concise responses. Lead with results, not process. When you make changes, summarize what changed, where, and how you verified — but keep it tight. If you're uncertain whether to scope-creep, surface the option as a one-sentence question rather than just doing it.
