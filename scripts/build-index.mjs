// Builds court-case-md/INDEX.md — a compact LLM-oriented index of the corpus.
// One section per docket entry, chronological. Each attachment links to its .md file.
// Includes a header with corpus stats and a quick-jump section to major filings.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, 'court-case-pdf');
const MD_DIR = path.join(ROOT, 'court-case-md');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(PDF_DIR, 'manifest.json'), 'utf8'));

const files = Object.values(MANIFEST.files);

// Group by docket entry
const byEntry = new Map();
for (const f of files) {
  if (!byEntry.has(f.docket_entry)) byEntry.set(f.docket_entry, []);
  byEntry.get(f.docket_entry).push(f);
}
for (const list of byEntry.values()) list.sort((a, b) => a.attachment - b.attachment);

const entries = Array.from(byEntry.entries()).sort((a, b) => a[0] - b[0]);

// Parse a real date out of "Aug. 5, 2024, 12:38 a.m." for sorting / grouping
function parseDate(s) {
  if (!s) return null;
  const cleaned = s.replace(/\./g, '').replace(/(\d):(\d{2})\s+(a|p)m/i, '$1:$2 $3m');
  const d = new Date(cleaned);
  return isNaN(d) ? null : d;
}

function shortSummary(text, n = 180) {
  if (!text) return '';
  // Trim to first sentence-ish OR n chars, whichever shorter
  const cut = text.indexOf('. (Attachments:');
  let s = cut > 0 ? text.slice(0, cut + 1) : text;
  if (s.length > n) s = s.slice(0, n).replace(/\s+\S*$/, '') + '…';
  return s;
}

// Detect "major" entries to surface at top
const MAJOR_RE = /\b(COMPLAINT|AMENDED COMPLAINT|MOTION FOR SUMMARY JUDGMENT|MOTION TO DISMISS|MOTION FOR PRELIMINARY INJUNCTION|ORDER GRANTING|ORDER DENYING|JUDGMENT|VERDICT|TRANSCRIPT)\b/i;
const major = entries.filter(([n, list]) => list.some(f => MAJOR_RE.test(f.full_text || '')));

// Date range
const allDates = files.map(f => parseDate(f.filing_date)).filter(Boolean).sort((a, b) => a - b);
const firstDate = allDates[0]?.toISOString().slice(0, 10) ?? '?';
const lastDate = allDates[allDates.length - 1]?.toISOString().slice(0, 10) ?? '?';

// Count doc_labels
const labelCount = {};
for (const f of files) { const k = f.doc_label || '(none)'; labelCount[k] = (labelCount[k] || 0) + 1; }
const topLabels = Object.entries(labelCount).sort((a, b) => b[1] - a[1]).slice(0, 12);

// ---- write -----------------------------------------------------------
let out = '';
out += `# Musk v. Altman — Docket Index\n\n`;
out += `_Northern District of California, 4:24-CV-04722-YGR. Hon. Yvonne Gonzalez Rogers._\n\n`;
out += `- **Docket entries indexed:** ${entries.length}\n`;
out += `- **PDFs / extracted markdown files:** ${files.length}\n`;
out += `- **Date range:** ${firstDate} → ${lastDate}\n`;
out += `- **Source:** \`court-case-pdf/manifest.json\` (full metadata) · raw PDFs in \`court-case-pdf/\` · markdown in \`court-case-md/\`\n\n`;

out += `## Reading this index\n\n`;
out += `Each docket entry shows: **[#N — Date] doc-summary** followed by a bulleted list of its main document and any attachments. Each item links to the markdown file. The markdown files carry full YAML frontmatter (filename, date, doc_label, source_url) plus the docket-text paragraph as a quoted header, then the extracted body.\n\n`;
out += `Extraction methods used: \`pdftotext\` for ${files.filter(f => f.extraction === 'text' || f.extraction === 'sparse').length} text-bearing PDFs, \`mistral-ocr\` for ${files.filter(f => f.extraction === 'scanned').length} scanned PDFs.\n\n`;

out += `## Top document types\n\n`;
for (const [k, v] of topLabels) out += `- ${v.toString().padStart(3)} — ${k}\n`;
out += `\n`;

out += `## Major filings (quick jump)\n\n`;
for (const [n, list] of major) {
  const main = list.find(f => f.attachment === 0) || list[0];
  out += `- **#${n}** — ${main.filing_date_short || ''} — ${shortSummary(main.full_text, 140)} → [#${n}](#entry-${n})\n`;
}
out += `\n---\n\n`;

out += `## Full chronological docket\n\n`;
let currentMonth = null;
for (const [n, list] of entries) {
  const main = list.find(f => f.attachment === 0) || list[0];
  const d = parseDate(main.filing_date);
  if (d) {
    const m = d.toISOString().slice(0, 7);
    if (m !== currentMonth) {
      currentMonth = m;
      out += `### ${d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}\n\n`;
    }
  }
  out += `<a id="entry-${n}"></a>\n`;
  out += `**#${n}** · ${main.filing_date_short || '?'} · ${shortSummary(main.full_text, 220)}\n\n`;
  for (const f of list) {
    const mdName = f.filename.replace(/\.pdf$/i, '.md');
    const tag = f.attachment === 0 ? 'Main' : `Att ${f.attachment}`;
    const ocr = f.extraction === 'scanned' ? ' _[OCR]_' : '';
    out += `- ${tag}: [${f.doc_label || mdName}](./${mdName}) · ${f.pages || '?'}p${ocr}\n`;
  }
  out += `\n`;
}

const outPath = path.join(MD_DIR, 'INDEX.md');
fs.writeFileSync(outPath, out);
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Wrote ${outPath} (${sizeKB} KB, ${entries.length} entries, ${files.length} attachments)`);
