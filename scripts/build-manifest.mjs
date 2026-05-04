// Builds court-case-pdf/manifest.json from page1.html + page2.html.
// One entry per PDF on disk, keyed by filename, with:
//   docket_entry, attachment, filing_date, doc_label, full_text, source_url
//
// Uses regex parsing (no DOM lib) — page structure is regular and well-known.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, 'court-case-pdf');
const PAGES = ['page1.html', 'page2.html']
  .map(p => path.join(ROOT, 'sources', p))
  .filter(p => fs.existsSync(p));

// Find every `id="entry-N"` marker and slice each entry from one marker to the next.
const entryMarkerRe = /id="entry-(\d+)"/gi;

// Inside an entry:
//   filing date      : <span title="...">Aug 5, 2024</span>
//   long description : first <p>...</p> after the date span
//   sub-rows         : each <div class="row recap-documents"> ... </div>
const dateRe = /<span\s+title="([^"]+)">([^<]+)<\/span>/;
// Long entry description: first <p> immediately after the date column closes.
const longDescRe = /<\/div>\s*<div class="col-xs-8[^"]*"[^>]*>\s*<p>([\s\S]*?)<\/p>/;
const subRowRe = /<div class="row recap-documents">([\s\S]*?)<\/div>\s*(?=<div class="row recap-documents"|<\/div>)/g;
const subDescRe = /<div class="col-xs-6[^"]*"[^>]*>\s*<p>([\s\S]*?)<\/p>/;
const subPdfRe = /href="(https:\/\/storage\.courtlistener\.com\/recap\/[^"]+?\.pdf)"/;
const subDocLinkRe = /<a href="(\/docket\/\d+\/(\d+(?:\/\d+)?)\/[^"]+\/)"/;

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&shy;/g, '').replace(/\s+/g, ' ').trim();
}

const manifest = {};
let entriesParsed = 0;

for (const p of PAGES) {
  const html = fs.readFileSync(p, 'utf8');
  // Collect all entry-N marker positions
  const markers = [];
  let mm;
  entryMarkerRe.lastIndex = 0;
  while ((mm = entryMarkerRe.exec(html)) !== null) {
    markers.push({ entry: parseInt(mm[1], 10), pos: mm.index });
  }
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].pos;
    const end = i + 1 < markers.length ? markers[i + 1].pos : html.length;
    const block = html.slice(start, end);
    const docketEntry = markers[i].entry;
    entriesParsed++;

    const dateMatch = block.match(dateRe);
    const longDescMatch = block.match(longDescRe);
    const fullText = longDescMatch ? stripTags(longDescMatch[1]) : null;

    let sm;
    subRowRe.lastIndex = 0;
    while ((sm = subRowRe.exec(block)) !== null) {
      const sub = sm[1];
      const pdfMatch = sub.match(subPdfRe);
      if (!pdfMatch) continue;
      const url = pdfMatch[1];
      const filename = path.basename(new URL(url).pathname);
      const subDescMatch = sub.match(subDescRe);
      const subLinkMatch = sub.match(subDocLinkRe);

      // Attachment index: present in the docket sub-URL like /docket/.../1/3/ -> 3
      let attachment = 0;
      if (subLinkMatch) {
        const segs = subLinkMatch[2].split('/');
        if (segs.length === 2) attachment = parseInt(segs[1], 10);
      }

      manifest[filename] = {
        filename,
        docket_entry: docketEntry,
        attachment,                        // 0 = main document, 1+ = attachment index
        filing_date: dateMatch ? dateMatch[1] : null,
        filing_date_short: dateMatch ? dateMatch[2] : null,
        doc_label: subDescMatch ? stripTags(subDescMatch[1]) : null,   // "Complaint", "Civil Cover Sheet", "Exhibit A", etc.
        full_text: fullText,                // the long docket-text paragraph
        source_url: url,
      };
    }
  }
}

// Cross-check against PDFs on disk.
const onDisk = new Set(fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf')));
const inManifest = new Set(Object.keys(manifest));
const missingFromManifest = [...onDisk].filter(f => !inManifest.has(f)).sort();
const inManifestNotOnDisk = [...inManifest].filter(f => !onDisk.has(f)).sort();

const out = {
  generated_at: new Date().toISOString(),
  source_pages: PAGES.map(p => path.basename(p)),
  entry_count: entriesParsed,
  pdf_count: Object.keys(manifest).length,
  files: manifest,
};

const outPath = path.join(PDF_DIR, 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

console.log(`Parsed ${entriesParsed} docket entries.`);
console.log(`Manifest entries: ${Object.keys(manifest).length}`);
console.log(`PDFs on disk:     ${onDisk.size}`);
if (missingFromManifest.length) {
  console.log(`\nPDFs on disk but missing from manifest (${missingFromManifest.length}):`);
  missingFromManifest.slice(0, 10).forEach(f => console.log('  ' + f));
  if (missingFromManifest.length > 10) console.log(`  ... +${missingFromManifest.length - 10} more`);
}
if (inManifestNotOnDisk.length) {
  console.log(`\nIn manifest but not on disk (${inManifestNotOnDisk.length}):`);
  inManifestNotOnDisk.slice(0, 10).forEach(f => console.log('  ' + f));
}
console.log(`\nWrote ${outPath}`);
