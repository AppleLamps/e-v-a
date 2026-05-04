// One-shot smoke test of the Mistral OCR API against a single scanned PDF.
// Verifies API surface + shows the extracted markdown before committing to a batch.

import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.MISTRAL_API_KEY;
if (!API_KEY) { console.error('MISTRAL_API_KEY not set'); process.exit(1); }

const TARGET = process.argv[2] || 'court-case-pdf/gov.uscourts.cand.433688.330.11_1.pdf';
if (!fs.existsSync(TARGET)) { console.error(`Missing: ${TARGET}`); process.exit(1); }

console.log(`Testing Mistral OCR on: ${TARGET}`);
console.log(`Size: ${(fs.statSync(TARGET).size / 1024).toFixed(1)} KB\n`);

// 1. Upload file
console.log('[1/3] Uploading…');
const fileBuf = fs.readFileSync(TARGET);
const fd = new FormData();
fd.append('purpose', 'ocr');
fd.append('file', new Blob([fileBuf], { type: 'application/pdf' }), path.basename(TARGET));

let r = await fetch('https://api.mistral.ai/v1/files', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: fd,
});
const uploadText = await r.text();
if (!r.ok) {
  console.error(`Upload failed: HTTP ${r.status}`);
  console.error(uploadText);
  process.exit(2);
}
const uploaded = JSON.parse(uploadText);
console.log(`     file_id: ${uploaded.id}`);

// 2. Get signed URL
console.log('[2/3] Getting signed URL…');
r = await fetch(`https://api.mistral.ai/v1/files/${uploaded.id}/url?expiry=24`, {
  headers: { 'Authorization': `Bearer ${API_KEY}` },
});
const urlText = await r.text();
if (!r.ok) {
  console.error(`Signed-URL failed: HTTP ${r.status}`);
  console.error(urlText);
  process.exit(2);
}
const signed = JSON.parse(urlText);
console.log(`     signed URL acquired (expires in 24h)`);

// 3. Run OCR
console.log('[3/3] Running OCR…');
r = await fetch('https://api.mistral.ai/v1/ocr', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'mistral-ocr-latest',
    document: { type: 'document_url', document_url: signed.url },
  }),
});
const ocrText = await r.text();
if (!r.ok) {
  console.error(`OCR failed: HTTP ${r.status}`);
  console.error(ocrText);
  process.exit(2);
}
const ocr = JSON.parse(ocrText);

console.log(`\n=== Response shape ===`);
console.log(`Top-level keys: ${Object.keys(ocr).join(', ')}`);
if (ocr.pages) {
  console.log(`Pages: ${ocr.pages.length}`);
  if (ocr.pages[0]) console.log(`First page keys: ${Object.keys(ocr.pages[0]).join(', ')}`);
}
if (ocr.usage_info) console.log(`Usage: ${JSON.stringify(ocr.usage_info)}`);

console.log(`\n=== Extracted markdown (first 1500 chars) ===\n`);
const md = (ocr.pages || []).map(p => p.markdown || '').join('\n\n---\n\n');
console.log(md.slice(0, 1500));
if (md.length > 1500) console.log(`\n…[+${md.length - 1500} chars]`);

console.log(`\n=== OK — API works ===`);
