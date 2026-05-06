# Review: 5.4.26 vs 5.5.26 case-files

## Scope Reviewed

- Project orientation: `README.md`, `court-case-md/INDEX.md`, `site/data/meta.json`, `site/data/sources.json`.
- Current website data: `site/data/timeline.json`, `quotes.json`, `actors.json`, `entities.json`, `claims.json`, `disputed-facts.json`, `analysis.json`.
- Snapshot comparison: `case-files/5.4.26` vs `case-files/5.5.26`.

## Snapshot Delta

The `5.5.26` snapshot adds five content files not present in `5.4.26`:

- `case-files/5.5.26/trial.mts.now_day_6.md`
- `case-files/5.5.26/trial.mts.now_day_7.md`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-6.md`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-7.md`
- `case-files/5.5.26/trial.mts.now_wiki_brockman-journal.md`

The rollup pages also grew materially: `wiki_case-overview.md`, `wiki_key-themes.md`, `wiki_quotes.md`, `wiki_timeline.md`, `trial.mts.now_.md`, `trial.mts.now_character_greg-brockman.md`, and `trial.mts.now_live.md`.

The site already has a May 4 / Day 6 event and several Day 6 Brockman quotes. It does not yet have a May 5 / Day 7 event or the Day 7 Microsoft economics.

## Implementation Status

Implemented into website data on May 5, 2026:

- Corrected the Day 6 Savitt/Molo attribution in `timeline.json` and `actors.json`.
- Added a May 5 / Day 7 timeline event with Brockman, Wu, Forms 990, and Zilis-next context.
- Added Day 7 Microsoft/OpenAI economics to `entities.json`, `disputed-facts.json`, `claims.json`, and `analysis.json`.
- Upgraded Robert Wu to an OpenAI 30(b)(6) deposition witness.
- Refreshed Greg Brockman, Stuart Russell, and Shivon Zilis actor entries.
- Added curated Day 6/Day 7 quotes with snippet-backed trial citations.
- Bumped `meta.version` to `1.2.2` and `meta.last_analyzed` to `2026-05-05`.

Left unchanged: `site/data/sources.json`, `archive_through`, `archive_through_iso`, and `last_docket_no`, because this update is based on secondary trial-wiki material rather than new primary docket ingest.

## Priority Findings For Website Updates

### 1. Add a new May 5, 2026 / Day 7 timeline event

Add a new `site/data/timeline.json` event for Day 7. This is the largest missing item.

Core facts to include:

- Greg Brockman's full day on the stand.
- Wachtell direct walked the 2017 negotiations chronologically.
- Molo recross attacked Brockman's Day 7 explanation of the "morally bankrupt" journal entry as an after-the-fact gloss.
- Gerrada redirect got DX 1252 admitted as a prior consistent statement: "Real decision is fire Elon" / "Fire Elon route."
- Robert Wu's OpenAI 30(b)(6) deposition put the Microsoft/OpenAI economics in evidence.
- Miss Puckett authenticated OpenAI 2018 and 2019 Forms 990.
- Shivon Zilis was anticipated as the next live witness.

Source support:

- `case-files/5.5.26/trial.mts.now_wiki_timeline.md:73-82`
- `case-files/5.5.26/trial.mts.now_day_7.md:2136-2140`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-7.md:14-16`

Recommended actors: `Greg Brockman`, `Steven Molo`, `Robert Wu`, `Hon. Yvonne Gonzalez Rogers`, `Microsoft Corp.` / `Russell Cohen` if actor wiring requires names.

Use `050526TT.txt` only as a forward citation and include `snippet` fields, since official line numbers are not locally verifiable.

### 2. Add Day 7 Microsoft economics to the site data

This is substantively more important than another Brockman color quote because it changes the site's explanation of the Microsoft/OpenAI economic structure.

Add or update these areas:

- `site/data/entities.json`
  - `openai-inc`: add that the nonprofit residual is behind large LP target redemptions and that Wu testified OpenAI Inc. has no full-time employees other than board/CEO structure.
  - `openai-lp` / `openai-opco`: add the 2019 and 2023 target-redemption math.
  - `microsoft`: update capital/licensing flows with the 2023 JDCA and Watershed MOU details.
- `site/data/disputed-facts.json`
  - "Does Microsoft exercise de facto control over OpenAI?"
  - "Did the restructuring remove the cap / AGI carveout?"
  - "Did Microsoft know about and assist a breach?"
  - Reconcile the existing restructuring entry that already mentions an "October 2025 MOU" with the Day 7 testimony identifying the non-binding `Watershed MOU` and its post-AGI product-IP terms.
- `site/data/analysis.json`
  - Update the Microsoft thread and remedy/stakes discussion.
- `site/data/claims.json`
  - For Count XIX, note that the Wu deposition gives trial evidence on Microsoft license rights, target redemption, and restructuring, without overclaiming that it proves knowledge or substantial assistance.

Facts to preserve:

- Aggregate LP target redemptions were described as roughly `$250B` before the nonprofit residual is paid.
- Microsoft's 2023 `$10B` round had a `$60B` / `6x` target redemption.
- Target redemption escalates `20%` annually starting in 2025.
- The 2023 JDCA licensed Microsoft "all IP and technology ... excluding only AGI."
- The non-binding Watershed MOU would give Microsoft access to certain product IP after a third-party AGI determination.
- OpenAI's mission strategy committee was considering inverting the LLC waterfall into uncapped corporate stock as early as April or May 2024.
- OpenAI Inc. has no full-time employees, per Wu's testimony as summarized by the trial wiki.

Source support:

- Current partial restructuring entry: `site/data/disputed-facts.json:148`
- `case-files/5.5.26/trial.mts.now_day_7.md:2360-2426`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-7.md:64-78`
- `case-files/5.5.26/trial.mts.now_wiki_key-themes.md:270-304`
- `case-files/5.5.26/trial.mts.now_wiki_case-overview.md:40-41`

### 3. Correct the current Day 6 Brockman wording

Current site issue:

- `site/data/timeline.json` says: "Friendly examination by Steven Molo begins late in the session and continues at the cutoff."
- `site/data/actors.json` has similar language in Brockman's `bio` and `attributes`.

That appears wrong under the 5.5.26 digest. The Day 6 friendly/redirect examination was by OpenAI/Wachtell counsel William Savitt, not Steven Molo. Molo appears on Day 7 for recross.

Update:

- In `site/data/timeline.json`, replace the Molo sentence with Wachtell/Savitt redirect language.
- In `site/data/actors.json`, update Brockman's bio and trial-day attribute from "friendly examination by Molo" to "Wachtell/Savitt redirect on Day 6; Molo recross on Day 7."

Source support:

- Current bad line: `site/data/timeline.json:53`
- Current bad actor text: `site/data/actors.json:69`, `site/data/actors.json:82`
- Corrected source: `case-files/5.5.26/trial.mts.now_day_6.md:943-953`
- Corrected source: `case-files/5.5.26/trial.mts.now_wiki_timeline.md:71`

### 4. Add the Brockman journal interpretive fight, not just isolated quotes

The current site has some Day 6 Brockman material, but the `5.5.26` snapshot adds the Day 7 frame: both sides are fighting over how to read the journal.

Recommended updates:

- `site/data/actors.json` for Greg Brockman:
  - Note that testimony continued through Day 7 and that he was released after redirect.
  - Add DX 1252 as the defense's corroborating journal entry.
  - Add the competing readings:
    - Plaintiffs: contemporaneous evidence of intent to push Musk out and continue the for-profit plan while maintaining the nonprofit story.
    - Defense: "morally bankrupt" referred to firing Musk from the board and then forming a B Corp without him, not to the conversion as such.
- `site/data/analysis.json` or `disputed-facts.json`:
  - Add a small "Brockman journal" evidence node/theme if the view supports it.
- `site/data/quotes.json`:
  - Add only the strongest Day 7 journal/recross quotes, not all of them.

Priority quotes to add:

- DX 1252: "Real decision is fire Elon" / "So we seem converged on the Fire Elon route."
- Molo: "after-the-fact manufactured excuse for the very honest emotion..."
- Brockman/Musk 2020 email: "our fiduciary duty should be to humanity."
- Molo: "$30 billion... Couldn't you have given the nonprofit some money..." / Brockman: "I did not donate cash to the nonprofit. No."

Source support:

- `case-files/5.5.26/trial.mts.now_wiki_brockman-journal.md:8-16`
- `case-files/5.5.26/trial.mts.now_wiki_brockman-journal.md:36-40`
- `case-files/5.5.26/trial.mts.now_wiki_brockman-journal.md:76-86`
- `case-files/5.5.26/trial.mts.now_wiki_key-themes.md:234-266`
- `case-files/5.5.26/trial.mts.now_day_7.md:2292-2348`

### 5. Upgrade Robert Wu from PI declarant to 30(b)(6) trial witness

Current site issue:

- `site/data/actors.json` still describes Robert Wu only as an OpenAI declarant from the PI record.

The 5.5 snapshot makes him more important. His OpenAI 30(b)(6) deposition was played on Day 7 and is the source for the Microsoft economics, target-redemption stack, 2023 JDCA license scope, Watershed MOU, and nonprofit staffing testimony.

Update:

- In `site/data/actors.json`, revise Robert Wu's summary/role/tags to reflect "OpenAI 30(b)(6) corporate representative; deposition played Day 7."
- Add connections or attributes only if the actors view supports them cleanly. Keep the detailed economics in `entities.json`, `disputed-facts.json`, and `analysis.json`; do not overload the actor card.

Source support:

- Current stale actor entry: `site/data/actors.json:408`
- `case-files/5.5.26/trial.mts.now_day_7.md:2360-2428`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-7.md:64-78`

### 6. Fill in missing Day 6 quotes if the site wants a fuller trial quote set

The current quote file already has:

- Brockman "morally bankrupt."
- Brockman "hard to look at yourself in the mirror."
- Brockman "moral high ground."
- Brockman equity acquired for `$0`.
- Brockman "80% of the way there."
- PX-350 Altman side-payment.
- Musk "??"
- Court "dollar value goes to motive."

Missing high-value Day 6 quotes:

- "This is the only chance we have to get out from under Elon... take me to $1,000,000,000."
- "Cannot say that we are committed to the nonprofit... if three months later we're doing a B Corp, that it was a lie."
- "His story will correctly be that we weren't honest with him..."
- "We've been thinking that maybe we should just flip to a full profit. Making money for us sounds great."
- The never-paid `$100,000` personal-donation pledge to Marissa Mayer.
- Brockman's Tesla-secrecy testimony: Musk's proposed Tesla AGI lab would be done "in secret" because shareholders would not like it.
- The court's Russell-scope line: "That's freestyling."

Source support:

- `case-files/5.5.26/trial.mts.now_day_6.md:816-850`
- `case-files/5.5.26/trial.mts.now_day_6.md:943-953`
- `case-files/5.5.26/trial.mts.now_day_6.md:1003-1035`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-6.md:24-88`

### 7. Add Russell Day 6 only as secondary context

Stuart Russell matters for the trial narrative, but the case website should not over-index on AI-risk testimony because the judge repeatedly narrowed the case to charitable trust/restitution.

Recommended use:

- Update `site/data/actors.json` for Stuart Russell with:
  - His testimony was general AI-risk taxonomy only.
  - Cross established no opinions on OpenAI's actual safety practices, governance, structure, or Microsoft partnership.
  - He had not reviewed the complaint, case documents, or witness testimony before forming his opinions.
  - His compensation was about `$235,000`, roughly 20% of annual income.
- Add one quote at most if needed:
  - Court: "That's freestyling."
  - Or Russell: "To your knowledge, is Mr. Musk an AI scientist?" / "No. He's not."

Source support:

- `case-files/5.5.26/trial.mts.now_day_6.md:712-780`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-6.md:14`
- `case-files/5.5.26/trial.mts.now_wiki_key-themes.md:325-333`

### 8. Track but do not overplay the Zilis livestream issue

Day 7 includes a sealed application about whether Shivon Zilis should be insulated from the public audio livestream because of security concerns and personal-history material. The court took the Zilis livestream application under submission and separately declined to restrict the live feed for old Isaacson-book personal-history material.

Recommended use:

- Update `site/data/actors.json` for Shivon Zilis only if you are already refreshing her witness status.
- Do not make this a major timeline event unless Day 8 testimony or a later ruling makes it consequential.
- If included, phrase it as a procedural/live-feed issue, not as merits evidence.

Source support:

- `case-files/5.5.26/trial.mts.now_day_7.md:2454-2476`
- `case-files/5.5.26/trial.mts.now_day_7.md:2535-2538`
- `case-files/5.5.26/trial.mts.now_wiki_hits-day-7.md:60-62`

### 9. Update metadata only if the site data is actually changed

If the website JSON is updated from this review:

- Bump `site/data/meta.json` `last_analyzed` to `2026-05-05`.
- Bump `version` one patch level.
- Do not change `archive_through`, `archive_through_iso`, or `last_docket_no` from this trial-wiki update. Those describe the primary docket archive, not secondary trial commentary.

No `site/data/sources.json` change is required from the case-files comparison alone. That file is for curated docket filings; Day 7 trial wiki material is secondary observation.

## Recommended Patch Order

1. Fix the incorrect Day 6 Molo/Savitt attribution in `timeline.json` and `actors.json`.
2. Add the May 5 / Day 7 timeline event.
3. Add Microsoft economics to `entities.json`, `disputed-facts.json`, and `analysis.json`.
4. Upgrade Robert Wu's actor entry from PI declarant to Day 7 30(b)(6) deposition witness.
5. Update Greg Brockman's actor profile and add 4-6 curated Day 6/Day 7 quotes.
6. Lightly update Stuart Russell and Shivon Zilis only if the site needs complete Day 6/7 narrative coverage.
7. Bump `meta.last_analyzed` and `meta.version`.

## Caution

The trial-wiki material uses live/audio-derived timing and transcript summaries. For new `050526TT.txt` citations, include `snippet` fields and treat line numbers as unstable until official court-reporter text is in the repo.
