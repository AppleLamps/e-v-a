# Musk v. Altman — Case Archive

A self-contained archive of the federal lawsuit **Elon Musk et al. v. Samuel Altman et al.** (4:24-cv-04722-YGR, N.D. Cal., Hon. Yvonne Gonzalez Rogers), prepared for LLM consumption.

## The case in brief

In August 2024, Elon Musk sued Sam Altman, Greg Brockman, Microsoft, Reid Hoffman, and a long list of OpenAI corporate entities, alleging that OpenAI's pivot from a 501(c)(3) nonprofit to a capped-profit / for-profit structure breached the founding promise to develop AGI for the public benefit. Musk contributed roughly $44M to OpenAI between 2015 and 2020 on the understanding it was a charity. He claims Altman and Brockman effectively "stole the charity" by transferring its assets and personnel into for-profit vehicles in which they hold equity. Co-plaintiffs Shivon Zilis and X.AI Corp were added in the November 2024 First Amended Complaint. Microsoft is named as an alleged accomplice and beneficiary of the diverted assets. Causes of action include breach of contract, breach of fiduciary duty, civil RICO, false advertising, and unfair competition. The case proceeded through a contested preliminary-injunction motion (denied Mar 2025), a motion to dismiss (largely denied), summary-judgment briefing (Oct 2025), and a jury trial that began **April 27, 2026**. The verdict and any post-trial motions are reflected in the latest docket entries.

## How to use this archive (for the LLM)

**Primary data lives in `court-case-md/`.** Every court filing has been extracted to a markdown file with YAML frontmatter (filename, docket entry, attachment number, doc label, filing date, source URL) followed by the docket-text paragraph and then the document body.

**Start with `court-case-md/INDEX.md`.** It is a single ~127 KB index of the entire docket — chronological by entry, with major filings (complaints, MSJ, preliminary injunction, key orders) called out at the top and direct links to every individual `.md` file. Read the index first to orient, then pull the specific files relevant to your task.

For machine-readable metadata, see `court-case-pdf/manifest.json` — keyed by filename, with the same fields as the frontmatter plus extraction stats (`pages`, `chars_per_page`, `extraction` method).

## Folder layout

```
court-case-md/         588 filings extracted to markdown (USE THESE)
└── INDEX.md           Chronological master index — start here

court-case-pdf/        Original PDFs (588 files) + manifest.json
case-files/            Trial-wiki summaries from trial.mts.now (parallel commentary, 36 pages)
case-files-backup/     Original wiki scrapes before boilerplate stripping

sources/               Raw HTML pulled from CourtListener (input to download/manifest scripts)
scripts/               Tooling (re-runnable; see below)
logs/                  Run logs from past extractions
```

## Extraction notes

- **541 / 588 PDFs** had selectable text — extracted with `pdftotext -layout` (poppler).
- **47 / 588 PDFs** were scans (~267 pages) — extracted with **Mistral OCR**.
- The `extraction` field in each markdown frontmatter records which method was used (`pdftotext` / `mistral-ocr`). If a model spots low-quality text in an OCR'd file, that field flags it for re-checking against the original PDF.

## Scripts (run from project root)

```
node scripts/download-pdfs.mjs       # Re-download missing PDFs from sources/page*.html
node scripts/build-manifest.mjs      # Rebuild court-case-pdf/manifest.json
node scripts/sample-pdfs.mjs --all   # Re-classify text vs scanned (writes nothing)
node scripts/extract-pdfs.mjs        # Two-pass extraction: pdftotext + Mistral OCR
node scripts/build-index.mjs         # Rebuild court-case-md/INDEX.md
node scripts/strip-boilerplate.mjs   # Clean wiki scrapes in case-files/
```

All scripts are idempotent — they skip work that's already done unless `--force` is passed.
