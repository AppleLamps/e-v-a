// Samples PDFs in court-case-pdf/ and classifies each as text-based vs scanned/image
// by running pdftotext and measuring the text-density (chars per KB of file size).
//
// Usage:
//   node sample-pdfs.mjs               # 25 random + 5 smallest + 5 largest
//   node sample-pdfs.mjs --all         # check every PDF (slower)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PDF_DIR = path.join(process.cwd(), 'court-case-pdf');
const ALL = process.argv.includes('--all');

// Find pdftotext
const POPPLER = 'E:/my-skills/tools/poppler/poppler-25.12.0/Library/bin/pdftotext.exe';
const PDFTOTEXT = fs.existsSync(POPPLER) ? POPPLER : 'pdftotext';

const files = fs.readdirSync(PDF_DIR)
  .filter(f => f.endsWith('.pdf'))
  .map(f => {
    const full = path.join(PDF_DIR, f);
    return { name: f, size: fs.statSync(full).size, full };
  });

let sample;
if (ALL) {
  sample = files;
} else {
  files.sort((a, b) => a.size - b.size);
  const smallest = files.slice(0, 5);
  const largest = files.slice(-5);
  const middle = files.slice(5, -5);
  // 25 random from middle
  const rng = (n) => Math.floor(Math.random() * n);
  const pickRandom = [];
  const used = new Set();
  while (pickRandom.length < Math.min(25, middle.length)) {
    const i = rng(middle.length);
    if (!used.has(i)) { used.add(i); pickRandom.push(middle[i]); }
  }
  sample = [...smallest, ...pickRandom, ...largest];
}

console.log(`Sampling ${sample.length} PDFs of ${files.length} total\n`);

const results = [];
for (const f of sample) {
  let text = '';
  let err = null;
  try {
    text = execFileSync(PDFTOTEXT, ['-q', '-layout', f.full, '-'], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 30000 });
  } catch (e) {
    err = e.message.split('\n')[0];
  }
  // Page count via -l? Cheap heuristic: count form-feed chars (^L) which pdftotext inserts between pages.
  const pages = (text.match(/\f/g) || []).length + 1;
  const chars = text.replace(/\s+/g, '').length;
  const sizeKB = f.size / 1024;
  const density = chars / Math.max(sizeKB, 1);   // chars per KB of PDF
  const charsPerPage = chars / Math.max(pages, 1);

  // Heuristic: scanned if very low density AND low chars-per-page
  let kind;
  if (err) kind = 'ERROR';
  else if (chars < 50) kind = 'EMPTY-or-SCANNED';
  else if (density < 30 && charsPerPage < 200) kind = 'SCANNED?';
  else if (density < 80) kind = 'MIXED?';
  else kind = 'TEXT';

  results.push({ name: f.name, sizeKB: Math.round(sizeKB), pages, chars, density: Math.round(density), charsPerPage: Math.round(charsPerPage), kind, err });
}

// Print table
console.log('kind             |    KB | pages | chars/page | dens | filename');
console.log('-----------------|-------|-------|------------|------|---------');
for (const r of results) {
  console.log(`${r.kind.padEnd(16)} | ${String(r.sizeKB).padStart(5)} | ${String(r.pages).padStart(5)} | ${String(r.charsPerPage).padStart(10)} | ${String(r.density).padStart(4)} | ${r.name}${r.err ? '  [' + r.err + ']' : ''}`);
}

// Summary
const counts = {};
for (const r of results) counts[r.kind] = (counts[r.kind] || 0) + 1;
console.log('\nSummary:', counts);

// Flag the suspicious ones
const suspicious = results.filter(r => r.kind === 'SCANNED?' || r.kind === 'EMPTY-or-SCANNED' || r.kind === 'MIXED?');
if (suspicious.length) {
  console.log(`\n${suspicious.length} suspicious file(s) — recommend manual spot-check:`);
  suspicious.forEach(s => console.log(`  ${s.name}  (${s.kind}, ${s.charsPerPage} chars/page)`));
}
