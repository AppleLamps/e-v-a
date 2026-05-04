// Extracts CourtListener PDF URLs from saved docket HTML pages and downloads
// them to court-case-pdf/. Polite: low concurrency, jittered delay, retries
// with exponential backoff, skips files already on disk.
//
// Usage:
//   node download-pdfs.mjs           # download
//   node download-pdfs.mjs --dry     # list URLs only, no downloads

import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const DRY = process.argv.includes('--dry');
const ROOT = process.cwd();
const PAGES = ['page1.html', 'page2.html', 'page3.html']
  .map(p => path.join(ROOT, 'sources', p))
  .filter(p => fs.existsSync(p));
const OUT = path.join(ROOT, 'court-case-pdf');
fs.mkdirSync(OUT, { recursive: true });

// ---- Tunables ----------------------------------------------------------
const CONCURRENCY = 1;          // serial — server is rate-limiting at 2/sec
const MIN_DELAY_MS = 1500;      // base spacing between request starts
const JITTER_MS = 500;          // random extra delay
const MAX_RETRIES = 6;          // per file
const TIMEOUT_MS = 90_000;      // per request
const RATE_LIMIT_COOLDOWN_MS = 60_000; // global pause after a 429
const UA = 'Mozilla/5.0 (compatible; mts-archive/1.0; personal research)';
// ------------------------------------------------------------------------

// 1. Extract unique CourtListener storage PDF URLs from the saved pages.
const RE = /https:\/\/storage\.courtlistener\.com\/recap\/[^"' )<>]+?\.pdf/gi;
const urls = new Set();
for (const p of PAGES) {
  const html = fs.readFileSync(p, 'utf8');
  let m;
  while ((m = RE.exec(html)) !== null) urls.add(m[0]);
  console.error(`scanned ${path.basename(p)}: total unique so far = ${urls.size}`);
}
const list = Array.from(urls).sort();
console.error(`\nUnique PDF URLs: ${list.length}`);

if (DRY) {
  for (const u of list) console.log(u);
  process.exit(0);
}

// 2. Download with concurrency + retries.
function fnameFor(url) {
  return path.basename(new URL(url).pathname);
}

async function fetchWithTimeout(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/pdf,*/*' },
      redirect: 'follow',
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

async function downloadOne(url) {
  const dest = path.join(OUT, fnameFor(url));
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return { url, status: 'skip', size: fs.statSync(dest).size };
  }
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(15_000, 1000 * 2 ** attempt) + Math.random() * 500;
      await sleep(backoff);
    }
    try {
      const res = await fetchWithTimeout(url);
      if (res.status === 429 || res.status === 503) {
        const ra = parseInt(res.headers.get('retry-after') || '0', 10);
        const wait = Math.max(ra * 1000, RATE_LIMIT_COOLDOWN_MS);
        console.error(`  rate-limited (HTTP ${res.status}); cooling down ${Math.round(wait/1000)}s`);
        await sleep(wait);
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      // Validate it actually looks like a PDF
      if (buf.length < 200 || buf.subarray(0, 5).toString() !== '%PDF-') {
        throw new Error(`not a PDF (got ${buf.length} bytes, head=${buf.subarray(0, 8).toString('hex')})`);
      }
      const tmp = dest + '.part';
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, dest);
      return { url, status: 'ok', size: buf.length };
    } catch (e) {
      lastErr = e;
    }
  }
  return { url, status: 'fail', error: lastErr?.message || String(lastErr) };
}

// Worker pool with paced starts.
let cursor = 0;
let lastStart = 0;
const results = { ok: 0, skip: 0, fail: 0, totalBytes: 0, failures: [] };

async function worker(id) {
  while (cursor < list.length) {
    const idx = cursor++;
    const url = list[idx];

    // Fast path: skip pacing if the file is already on disk.
    const dest = path.join(OUT, fnameFor(url));
    const willSkip = fs.existsSync(dest) && fs.statSync(dest).size > 0;
    if (!willSkip) {
      // Pace request starts globally.
      const wait = MIN_DELAY_MS + Math.random() * JITTER_MS;
      const now = Date.now();
      const due = lastStart + wait;
      if (now < due) await sleep(due - now);
      lastStart = Date.now();
    }

    const r = await downloadOne(url);
    if (r.status === 'ok') {
      results.ok++; results.totalBytes += r.size;
      console.log(`[${idx + 1}/${list.length}] ok    ${(r.size/1024).toFixed(0)}KB  ${fnameFor(url)}`);
    } else if (r.status === 'skip') {
      results.skip++;
      console.log(`[${idx + 1}/${list.length}] skip  exists  ${fnameFor(url)}`);
    } else {
      results.fail++; results.failures.push({ url, error: r.error });
      console.log(`[${idx + 1}/${list.length}] FAIL  ${fnameFor(url)}  — ${r.error}`);
    }
  }
}

const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
const secs = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`\n=== Summary ===`);
console.log(`ok:    ${results.ok}`);
console.log(`skip:  ${results.skip}`);
console.log(`fail:  ${results.fail}`);
console.log(`bytes: ${(results.totalBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`time:  ${secs}s`);

if (results.failures.length) {
  const failLog = path.join(ROOT, 'download-failures.log');
  fs.writeFileSync(failLog, results.failures.map(f => `${f.url}\t${f.error}`).join('\n') + '\n');
  console.log(`\nFailures written to ${failLog} — re-run the script to retry (existing files are skipped).`);
}
