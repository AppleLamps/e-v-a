# Musk v. Altman — Case Archive

A self-contained archive of the federal lawsuit **Elon Musk et al. v. Samuel Altman et al.** (4:24-cv-04722-YGR, N.D. Cal., Hon. Yvonne Gonzalez Rogers), prepared both for human research and for direct LLM consumption.

## The case in brief

In August 2024, Elon Musk sued Sam Altman, Greg Brockman, Microsoft, Reid Hoffman, and a long list of OpenAI corporate entities, alleging that OpenAI's pivot from a 501(c)(3) nonprofit to a capped-profit / for-profit structure breached the founding promise to develop AGI for the public benefit. Musk contributed roughly $44M to OpenAI between 2015 and 2020 on the understanding it was a charity. He claims Altman and Brockman effectively "stole the charity" by transferring its assets and personnel into for-profit vehicles in which they hold equity. Co-plaintiffs Shivon Zilis and X.AI Corp were added in the November 2024 First Amended Complaint. Microsoft is named as an alleged accomplice and beneficiary of the diverted assets. Causes of action originally pleaded: breach of contract, breach of fiduciary duty, civil RICO, false advertising, unfair competition, charitable trust, and others — 26 in total.

The case proceeded through a contested preliminary-injunction motion (denied Mar 2025, Dkt #121), a partial motion-to-dismiss ruling (May 2025, Dkt #163), summary-judgment briefing (Oct–Nov 2025), and a **summary-judgment ruling on January 15, 2026 (Dkt #390)** that left the following theories alive at trial:

- **vs OpenAI defendants:** breach of charitable trust, fraud, constructive fraud, unjust enrichment
- **vs Microsoft:** aiding and abetting breach of fiduciary duty

A nine-person jury was empaneled on **April 27, 2026**. Per Pretrial Order No. 4 (Dkt #477), trial is **bifurcated** into a liability phase (Apr 28 – ~May 15) and a remedies phase (begins ~May 18). Disgorgement is an equitable remedy decided by the Court (PTO #3, Dkt #456), so any monetary award (Musk's ask is up to ~$134B) will be sized by Judge Gonzalez Rogers, not the jury.

## How to use this archive

There are two parallel views of the record.

### 1. Primary docket archive (for LLM consumption)

`court-case-md/` contains every court filing extracted to a markdown file with YAML frontmatter (filename, docket entry, attachment number, doc label, filing date, source URL) followed by the docket-text paragraph and the extracted body.

**Start with `court-case-md/INDEX.md`** — a chronological master index of the corpus. Major filings (complaints, MSJ ruling, all four pretrial orders, key discovery orders) are linked from the top; every individual `.md` file is reachable from the per-entry sections.

For machine-readable metadata, `court-case-pdf/manifest.json` is keyed by filename with the same fields plus extraction stats.

### 2. Forensic-analysis website (for human reading)

`site/` is a vanilla HTML / ES-modules / CSS static site that presents the archive analytically: a timeline, an actor cast, a quote database, a connection map, a sources index, and long-form analysis. It loads JSON data files from `site/data/` at runtime — no build step. Configured for Vercel via `site/vercel.json`. To preview locally, serve `site/` over any static file server (e.g., `python -m http.server 8000` from inside `site/`).

## Folder layout

```
court-case-md/         1,153 filings extracted to markdown — primary archive
└── INDEX.md           Chronological master index — start here

court-case-pdf/        Original PDFs + manifest.json (PDFs gitignored — regenerable)
case-files/            Trial-wiki digests from trial.mts.now (parallel commentary,
                       per-character profiles, daily transcript summaries, plus a
                       timestamped live-transcript snapshot for the current day)
case-files-backup/     Original wiki scrapes before boilerplate stripping (gitignored)

site/                  Static analysis website (HTML/CSS/JS + data/ JSON files)

sources/               Raw HTML pulled from CourtListener (gitignored — input to scripts)
scripts/               Tooling (re-runnable; see below)
logs/                  Run logs from past extractions (gitignored)
```

## Archive scope

| Field | Value |
|---|---|
| Docket entries indexed | 413 (with PDFs) of 692 total parsed entries |
| PDF / markdown files | 1,153 each |
| Date range | 2024-08-05 → 2026-05-04 |
| Highest docket entry | #522 (May 3, 2026 trial brief) |
| Posture | Mid-trial (liability phase); remedies phase begins ~May 18, 2026 |

The 279 "manifest entries without PDFs" are docket text-only items — minute entries for status conferences, scheduling notes, etc. that don't carry attached documents.

## Extraction notes

- All text-bearing PDFs are extracted with `pdftotext -layout` (poppler).
- The `extraction` field in each markdown frontmatter records which method was used (`pdftotext`, `mistral-ocr`, or `tesseract-ocr`). The most recent ingest (Days 351–522) used pdftotext only — every PDF served by RECAP for this case in that range had selectable text. Historical OCR'd files from earlier in the docket retain their `mistral-ocr` flag.

## Scripts (run from project root)

The pipeline is HTML-driven: snapshot CourtListener docket pages into `sources/page*.html` (any number of pages — the scripts glob), then run the four scripts below in order.

```
node scripts/download-pdfs.mjs       # Fetch PDFs from sources/page*.html → court-case-pdf/
node scripts/build-manifest.mjs      # Parse HTML + court-case-pdf/ → manifest.json
node scripts/sample-pdfs.mjs --all   # Classify text vs scanned (writes nothing)
node scripts/extract-pdfs.mjs        # Two-pass extraction: pdftotext + OCR for scanned
node scripts/build-index.mjs         # Rebuild court-case-md/INDEX.md
```

All scripts are idempotent — they skip work that's already done unless `--force` is passed. `download-pdfs.mjs` paces requests politely (1.5s spacing, retries with backoff on 429/503).

To back-fill new entries from CourtListener: in a browser, open the docket and Save Page As → "Webpage, HTML Only" into `sources/page1.html`, `page2.html`, etc., overwriting whatever was there. Then re-run the four scripts above. Unreleased entries that aren't in the public RECAP archive yet require the [RECAP browser extension](https://free.law/recap/) and a free PACER account.

## Site data (`site/data/*.json`)

The website's analytical layer reads these JSON files. They are hand-curated derivative work from the primary archive, not auto-generated:

- `sources.json` — curated index of the most important filings (currently 54 of the 413 indexed entries) with editorial notes on each
- `timeline.json` — ~48 dated events from May 2015 through May 2026
- `actors.json` — cast of ~40 named actors with bios, position shifts, attribute tables, and connection lists
- `entities.json` — corporate-entity map (nonprofit, capped-profit LP, OpenAI Global, Aestas, Microsoft, xAI)
- `quotes.json` — ~62 quoted statements (founding emails, depositions, public tweets, trial testimony) with themes, venue, under-oath/contradicts flags, and citations
- `disputed-facts.json` — side-by-side disputed factual questions
- `claims.json` — the 26 originally pleaded claims with surviving status
- `analysis.json` — long-form rhetorical analysis, eras, hero/executive_summary
- `meta.json` — case caption, court, judge, archive scope notes, version stamps

When the underlying record changes (new docket entry, new trial development), the workflow is: update the relevant JSON file(s), bump `meta.version` and `meta.last_analyzed`, hard-refresh the browser.
