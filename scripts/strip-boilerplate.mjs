// Strips repeated nav/footer boilerplate from MTS Trial Wiki scrapes.
// - Preserves YAML frontmatter
// - Removes everything between frontmatter and the first "# " H1 heading
//   (the nav menu and the page-type label like "Character" / "Wiki page" / "Main Page" / "Daily transcript — Day N")
// - Removes the trailing "MTS Trial Wiki ·" attribution and "Built by [MTS]" footer lines
// - Fixes the "No free imageavailable" concatenation
// - Backs up originals to case-files-backup/ on first run

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('case-files');
const BACKUP = path.resolve('case-files-backup');

if (!fs.existsSync(ROOT)) {
  console.error(`Missing folder: ${ROOT}`);
  process.exit(1);
}
if (!fs.existsSync(BACKUP)) fs.mkdirSync(BACKUP, { recursive: true });

const FOOTER_RE_1 = /^\s*MTS Trial Wiki · Content derived from the official daily transcripts of _Musk v\. Altman_.*$/;
const FOOTER_RE_2 = /^\s*Built by \[MTS\]\(https:\/\/www\.mts\.now\/\).*$/;

function clean(text) {
  const lines = text.split(/\r?\n/);

  // 1. Frontmatter pass-through
  let i = 0;
  const out = [];
  if (lines[0]?.trim() === '---') {
    out.push(lines[i++]);
    while (i < lines.length && lines[i].trim() !== '---') out.push(lines[i++]);
    if (i < lines.length) out.push(lines[i++]); // closing ---
  }

  // 2. Skip everything until the first H1
  let firstH1 = -1;
  for (let j = i; j < lines.length; j++) {
    if (/^#\s+\S/.test(lines[j])) { firstH1 = j; break; }
  }
  if (firstH1 === -1) {
    // No H1 found — keep original body untouched
    return lines.join('\n');
  }
  // Ensure single blank line between frontmatter and H1
  out.push('');

  // 3. Body from first H1 onward, with trailing footer lines stripped
  const body = lines.slice(firstH1);

  // Trim trailing blank lines + footer lines (and the blank lines around them)
  let end = body.length;
  while (end > 0) {
    const ln = body[end - 1];
    if (ln.trim() === '' || FOOTER_RE_1.test(ln) || FOOTER_RE_2.test(ln)) {
      end--;
      continue;
    }
    break;
  }
  const trimmedBody = body.slice(0, end);

  out.push(...trimmedBody);

  // 4. Cosmetic fixes
  let result = out.join('\n');
  result = result.replace(/No free imageavailable/g, 'No free image available');

  // Ensure trailing newline
  if (!result.endsWith('\n')) result += '\n';
  return result;
}

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.md'));
let changed = 0, unchanged = 0, backedUp = 0;

for (const name of files) {
  const src = path.join(ROOT, name);
  const bak = path.join(BACKUP, name);
  const original = fs.readFileSync(src, 'utf8');

  // Back up first run only (don't overwrite existing backups)
  if (!fs.existsSync(bak)) {
    fs.writeFileSync(bak, original, 'utf8');
    backedUp++;
  }

  const cleaned = clean(original);
  if (cleaned !== original) {
    fs.writeFileSync(src, cleaned, 'utf8');
    const before = original.length, after = cleaned.length;
    console.log(`cleaned  ${name}  (${before} → ${after} bytes, -${before - after})`);
    changed++;
  } else {
    unchanged++;
  }
}

console.log(`\nDone. ${changed} cleaned, ${unchanged} unchanged, ${backedUp} backed up to ${path.relative(process.cwd(), BACKUP)}/`);
