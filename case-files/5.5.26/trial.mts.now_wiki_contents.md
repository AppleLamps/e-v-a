---
url: "https://trial.mts.now/wiki/contents"
title: "Wiki Info — MTS Trial Wiki"
---

# Wiki Info

A working wiki built from the daily court transcripts of _Elon Musk et al. v. Samuel Altman et al._, **case 4:24-CV-04722 YGR**, U.S. District Court for the Northern District of California, Oakland Division, Hon. **Yvonne Gonzalez Rogers** presiding. Trial began the week of April 27, 2026 and is expected to run through mid-May.

This wiki is built from primary-source transcripts the trial court released on a daily basis. Every quote is cited as `(filenameTT.txt:LINE)` so you can verify against the underlying transcript in `wiki/extracted/`.

## Search the wiki

A standalone in-browser search app lives in `wiki/search-app/` — full-text search across every page and digest, with section-aware ranking, filter chips, and an inline markdown viewer that scrolls to the matching section.

\`\``bash cd wiki/search-app pnpm install        # one-time pnpm dev            # http://localhost:4242 pnpm build          # → dist/, fully self-contained, content inlined`\`\`

Quick syntax: multiple words are AND-ed across body + section headings. Wrap `"phrases in quotes"` for exact matches.

* * *

## Pages

| Page | What's in it |
| --- | --- |
| [Case overview](https://trial.mts.now/wiki/case-overview) | The lawsuit, the surviving claims, the court, what's at stake |
| [Timeline](https://trial.mts.now/wiki/timeline) | Day-by-day index of trial proceedings with brief summaries |
| [Key themes](https://trial.mts.now/wiki/key-themes) | The recurring fights — "stole a charity," AGI safety, $1B vs $38M, phase three, xAI parallel, Microsoft |
| [Quotes](https://trial.mts.now/wiki/quotes) | The greatest hits — viral lines, heated exchanges, bench one-liners, organized by topic |

## Daily transcript digests

| Day | Date | Volume | Witness | Digest |
| --- | --- | --- | --- | --- |
| 2 | Apr 28, 2026 | Vol. 2 (pp. 198–385) | Openings; Musk direct begins | day2\_2026-04-28.md |
| 3 | Apr 29, 2026 | Vol. 3 (pp. 386–644) | Musk direct (cont'd); cross | day3\_2026-04-29.md |
| 4 | Apr 30, 2026 | Vol. 4 (pp. 645–892) | Musk cross/redirect/recross; Birchall direct/cross | day4\_2026-04-30.md |
| 5 | May 1, 2026 | Vol. 5 (pp. 893–953) | Half-day, no jury — motion to strike, jury-instruction conference | day5\_2026-05-01.md |

Day 1 (April 27 — jury selection) is not in the source materials.

## Source materials

- `042826TT.pdf` / `042826TT.txt` — April 28
- `042926TT.pdf` / `042926TT.txt` — April 29
- `043026TT.pdf` / `043026TT.txt` — April 30
- `050126TT.pdf` / `050126TT.txt` — May 1

Last updated: **May 1, 2026** (end of week 1).