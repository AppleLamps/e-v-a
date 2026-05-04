// Two-pass PDF extraction for court-case-pdf/ → court-case-md/.
//
// Pass 1: pdftotext (poppler) on every PDF classified as text or sparse — fast, free.
// Pass 2: OCR on PDFs classified as scanned. Backend is selectable.
//
// Each output .md file carries YAML frontmatter from manifest.json plus a
// human-readable header (doc label + full docket-text paragraph), then the
// extracted body. Already-extracted files are skipped on rerun.
//
// Usage:
//   node extract-pdfs.mjs                     # both passes, OCR=auto (mistral if key set, else skip)
//   node extract-pdfs.mjs --pass=1            # text only
//   node extract-pdfs.mjs --pass=2            # OCR only
//   node extract-pdfs.mjs --ocr=mistral       # Mistral OCR API   (needs MISTRAL_API_KEY)
//   node extract-pdfs.mjs --ocr=tesseract     # local tesseract   (needs tesseract.exe on PATH)
//   node extract-pdfs.mjs --ocr=skip          # write a placeholder; do OCR later
//   node extract-pdfs.mjs --force             # re-extract even if .md already exists

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, 'court-case-pdf');
const OUT_DIR = path.join(ROOT, 'court-case-md');
const MANIFEST_PATH = path.join(PDF_DIR, 'manifest.json');

const args = process.argv.slice(2);
const argVal = (k, d) => {
  const a = args.find(x => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const PASS = argVal('pass', 'all');                // '1' | '2' | 'all'
const OCR_ARG = argVal('ocr', 'auto');             // 'auto' | 'mistral' | 'tesseract' | 'skip'
const FORCE = args.includes('--force');

// ---- locate tools ------------------------------------------------------
const POPPLER_DIR = 'E:/my-skills/tools/poppler/poppler-25.12.0/Library/bin';
const PDFTOTEXT = fs.existsSync(`${POPPLER_DIR}/pdftotext.exe`) ? `${POPPLER_DIR}/pdftotext.exe` : 'pdftotext';
const PDFTOPPM  = fs.existsSync(`${POPPLER_DIR}/pdftoppm.exe`)  ? `${POPPLER_DIR}/pdftoppm.exe`  : 'pdftoppm';

function which(cmd) {
  try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: ['ignore','pipe','ignore'] }); return true; }
  catch { return false; }
}

const HAVE_TESSERACT = which('tesseract');
const HAVE_MISTRAL_KEY = !!process.env.MISTRAL_API_KEY;

let OCR;
if (OCR_ARG === 'auto') OCR = HAVE_MISTRAL_KEY ? 'mistral' : (HAVE_TESSERACT ? 'tesseract' : 'skip');
else OCR = OCR_ARG;

if (OCR === 'mistral' && !HAVE_MISTRAL_KEY) {
  console.error('--ocr=mistral requires the MISTRAL_API_KEY environment variable.');
  process.exit(2);
}
if (OCR === 'tesseract' && !HAVE_TESSERACT) {
  console.error('--ocr=tesseract requires tesseract.exe on PATH (https://github.com/UB-Mannheim/tesseract/wiki).');
  process.exit(2);
}

// ---- load manifest -----------------------------------------------------
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`Missing ${MANIFEST_PATH}. Run build-manifest.mjs first.`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---- helpers -----------------------------------------------------------
function yamlEscape(s) {
  if (s == null) return 'null';
  const str = String(s);
  if (/[:\n#"'\\]/.test(str) || str !== str.trim()) {
    return JSON.stringify(str);
  }
  return str;
}

function frontmatter(meta, extractionStatus) {
  const fields = {
    filename: meta.filename,
    docket_entry: meta.docket_entry,
    attachment: meta.attachment,
    doc_label: meta.doc_label,
    filing_date: meta.filing_date,
    pages: meta.pages,
    extraction: extractionStatus,             // 'pdftotext' | 'mistral-ocr' | 'tesseract-ocr' | 'placeholder'
    source_url: meta.source_url,
  };
  let s = '---\n';
  for (const [k, v] of Object.entries(fields)) s += `${k}: ${yamlEscape(v)}\n`;
  s += '---\n\n';
  return s;
}

function header(meta) {
  let h = '';
  if (meta.doc_label) h += `# ${meta.doc_label}\n\n`;
  if (meta.full_text) h += `**Docket entry ${meta.docket_entry}** · Filed ${meta.filing_date_short || meta.filing_date}\n\n> ${meta.full_text}\n\n---\n\n`;
  return h;
}

function destFor(filename) {
  return path.join(OUT_DIR, filename.replace(/\.pdf$/i, '.md'));
}

function writeMd(meta, body, status) {
  const dest = destFor(meta.filename);
  fs.writeFileSync(dest, frontmatter(meta, status) + header(meta) + body.trimEnd() + '\n');
  return dest;
}

// ---- Pass 1: pdftotext -------------------------------------------------
function extractText(pdfPath) {
  return execFileSync(PDFTOTEXT, ['-q', '-layout', '-enc', 'UTF-8', pdfPath, '-'], {
    encoding: 'utf8', maxBuffer: 100 * 1024 * 1024, timeout: 60_000,
  });
}

// ---- Pass 2: OCR backends ---------------------------------------------
async function ocrMistral(pdfPath, meta) {
  // Mistral OCR API: upload file → call /ocr → returns markdown per page.
  // Verify endpoints in current Mistral docs; this matches the public spec as of writing.
  const apiKey = process.env.MISTRAL_API_KEY;
  const fileBuf = fs.readFileSync(pdfPath);

  // Upload
  const fd = new FormData();
  fd.append('purpose', 'ocr');
  fd.append('file', new Blob([fileBuf], { type: 'application/pdf' }), meta.filename);
  let r = await fetch('https://api.mistral.ai/v1/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: fd,
  });
  if (!r.ok) throw new Error(`Mistral upload HTTP ${r.status}: ${await r.text()}`);
  const fileId = (await r.json()).id;

  // Get a signed URL (Mistral OCR takes a document_url)
  r = await fetch(`https://api.mistral.ai/v1/files/${fileId}/url?expiry=24`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!r.ok) throw new Error(`Mistral signed-url HTTP ${r.status}: ${await r.text()}`);
  const signedUrl = (await r.json()).url;

  // OCR
  r = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: { type: 'document_url', document_url: signedUrl },
    }),
  });
  if (!r.ok) throw new Error(`Mistral OCR HTTP ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const pages = j.pages || [];
  return pages.map((p, i) => `\n\n<!-- page ${p.index ?? i + 1} -->\n\n${p.markdown ?? ''}`).join('');
}

function ocrTesseract(pdfPath, meta, tmpDir) {
  // Render each page to PNG (200 dpi grayscale), then OCR.
  fs.mkdirSync(tmpDir, { recursive: true });
  const prefix = path.join(tmpDir, 'page');
  execFileSync(PDFTOPPM, ['-r', '200', '-gray', pdfPath, prefix], { timeout: 120_000 });
  const pngs = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
  let out = '';
  for (let i = 0; i < pngs.length; i++) {
    const png = path.join(tmpDir, pngs[i]);
    const txt = execFileSync('tesseract', [png, '-', '-l', 'eng'], { encoding: 'utf8', timeout: 120_000, maxBuffer: 30 * 1024 * 1024 });
    out += `\n\n<!-- page ${i + 1} -->\n\n${txt.trim()}`;
  }
  // cleanup
  for (const f of pngs) try { fs.unlinkSync(path.join(tmpDir, f)); } catch {}
  try { fs.rmdirSync(tmpDir); } catch {}
  return out;
}

// ---- run --------------------------------------------------------------
const allFiles = Object.values(manifest.files).sort((a, b) =>
  a.docket_entry - b.docket_entry || a.attachment - b.attachment
);

const stats = { pass1_done: 0, pass1_skip: 0, pass1_fail: 0,
                pass2_done: 0, pass2_skip: 0, pass2_fail: 0,
                placeholder: 0 };
const failures = [];

console.log(`Manifest: ${allFiles.length} files`);
console.log(`Tools:    pdftotext=${PDFTOTEXT.includes('poppler') ? 'poppler-bundled' : 'PATH'}`);
console.log(`OCR:      ${OCR}${OCR === 'mistral' ? ' (key set)' : ''}${OCR === 'tesseract' ? ' (binary on PATH)' : ''}`);
console.log(`Output:   ${OUT_DIR}`);
console.log(`Force:    ${FORCE}\n`);

// Pass 1
if (PASS === 'all' || PASS === '1') {
  console.log('=== Pass 1: pdftotext ===');
  const targets = allFiles.filter(f => f.extraction !== 'scanned');
  for (let i = 0; i < targets.length; i++) {
    const meta = targets[i];
    const dest = destFor(meta.filename);
    if (!FORCE && fs.existsSync(dest)) { stats.pass1_skip++; continue; }
    const pdfPath = path.join(PDF_DIR, meta.filename);
    try {
      const body = extractText(pdfPath);
      writeMd(meta, body, 'pdftotext');
      stats.pass1_done++;
      if ((i + 1) % 50 === 0 || i === targets.length - 1) {
        console.log(`  [${i + 1}/${targets.length}] ${meta.filename}`);
      }
    } catch (e) {
      stats.pass1_fail++;
      failures.push({ phase: 1, file: meta.filename, error: e.message.split('\n')[0] });
      console.log(`  FAIL  ${meta.filename}  ${e.message.split('\n')[0]}`);
    }
  }
}

// Pass 2
if (PASS === 'all' || PASS === '2') {
  console.log('\n=== Pass 2: OCR (' + OCR + ') ===');
  const targets = allFiles.filter(f => f.extraction === 'scanned');
  console.log(`${targets.length} scanned PDFs`);

  for (let i = 0; i < targets.length; i++) {
    const meta = targets[i];
    const dest = destFor(meta.filename);
    if (!FORCE && fs.existsSync(dest)) {
      // Honor force only — leave existing extractions in place
      const existing = fs.readFileSync(dest, 'utf8');
      if (!/extraction:\s*placeholder/.test(existing)) { stats.pass2_skip++; continue; }
      // existing is a placeholder, fall through to re-do
    }
    const pdfPath = path.join(PDF_DIR, meta.filename);
    try {
      let body, status;
      if (OCR === 'skip') {
        body = `_Scanned PDF — OCR pending. ${meta.pages} page(s). Source: ${meta.source_url}_\n`;
        status = 'placeholder';
        stats.placeholder++;
      } else if (OCR === 'mistral') {
        body = await ocrMistral(pdfPath, meta);
        status = 'mistral-ocr';
        stats.pass2_done++;
        // Be polite to the API
        await sleep(400);
      } else if (OCR === 'tesseract') {
        const tmp = path.join(OUT_DIR, '.tmp_' + meta.filename.replace(/\W+/g, '_'));
        body = ocrTesseract(pdfPath, meta, tmp);
        status = 'tesseract-ocr';
        stats.pass2_done++;
      }
      writeMd(meta, body, status);
      console.log(`  [${i + 1}/${targets.length}] ${status.padEnd(12)} ${meta.filename}`);
    } catch (e) {
      stats.pass2_fail++;
      failures.push({ phase: 2, file: meta.filename, error: e.message.split('\n')[0] });
      console.log(`  [${i + 1}/${targets.length}] FAIL          ${meta.filename}  ${e.message.split('\n')[0]}`);
    }
  }
}

// ---- summary ----------------------------------------------------------
console.log('\n=== Summary ===');
console.log(`Pass 1:  ok=${stats.pass1_done}  skip=${stats.pass1_skip}  fail=${stats.pass1_fail}`);
console.log(`Pass 2:  ok=${stats.pass2_done}  skip=${stats.pass2_skip}  fail=${stats.pass2_fail}  placeholder=${stats.placeholder}`);
const onDisk = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.md')).length;
console.log(`Output:  ${onDisk} .md files in ${path.relative(ROOT, OUT_DIR)}/`);

if (failures.length) {
  const log = path.join(ROOT, 'extract-failures.log');
  fs.writeFileSync(log, failures.map(f => `pass${f.phase}\t${f.file}\t${f.error}`).join('\n') + '\n');
  console.log(`\nFailures written to ${path.relative(ROOT, log)} — re-run to retry (existing files skipped unless --force).`);
}

if (OCR === 'skip' && stats.placeholder > 0) {
  console.log(`\nNext: install Tesseract OR set MISTRAL_API_KEY, then run:`);
  console.log(`  node extract-pdfs.mjs --pass=2 --ocr=tesseract   # or --ocr=mistral`);
  console.log(`Existing placeholders will be overwritten automatically.`);
}
