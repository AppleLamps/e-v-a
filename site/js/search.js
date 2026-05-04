/* Global search across actors, entities, timeline, quotes, claims, disputed facts, sources. */

import { debounce, escapeHtml } from "./utils/dom.js";
import { highlight } from "./utils/format.js";
import { navigate } from "./router.js";

let allDocs = [];
let panel, input, list, prompt;
let active = -1;

export function initSearch(data) {
  allDocs = buildIndex(data);
  panel = document.getElementById("search-panel");
  input = document.getElementById("search-input");
  list = document.getElementById("search-results");
  document.getElementById("search-toggle").addEventListener("click", open);
  document.getElementById("search-close").addEventListener("click", close);
  panel.addEventListener("click", (e) => { if (e.target === panel) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !isTyping(e.target)) { e.preventDefault(); open(); return; }
    if (panel.hidden) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { commit(); }
  });
  input.addEventListener("input", debounce(run, 60));
  // Initial empty state.
  list.innerHTML = `<div class="search-prompt">Search 13 categories: actors, entities, claims, disputed facts, quotes, timeline events, and 268 docket entries.</div>`;
}

function open() {
  panel.hidden = false;
  setTimeout(() => input.focus(), 20);
  if (input.value) run();
}
function close() {
  panel.hidden = true;
  input.value = "";
  active = -1;
  document.getElementById("search-toggle").focus();
}

function isTyping(t) {
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

function run() {
  const q = input.value.trim().toLowerCase();
  if (!q) {
    list.innerHTML = `<div class="search-prompt">Type to search.</div>`;
    return;
  }
  const tokens = q.split(/\s+/).filter(Boolean);
  const results = allDocs
    .map(d => ({ d, s: score(d, tokens) }))
    .filter(r => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 30);
  if (!results.length) {
    list.innerHTML = `<div class="search-empty">No matches for <strong>${escapeHtml(q)}</strong>.</div>`;
    return;
  }
  list.innerHTML = results.map((r, i) => {
    const d = r.d;
    return `
      <div class="search-result${i === 0 ? " focused" : ""}" data-route="${escapeHtml(d.route)}" data-i="${i}" role="option">
        <span class="search-result-kind">${escapeHtml(d.kind)}</span>
        <div>
          <span class="search-result-title">${highlight(d.title, q)}</span>
          ${d.subtitle ? `<span class="search-result-sub">${highlight(d.subtitle, q)}</span>` : ""}
        </div>
        ${d.tag ? `<span class="badge">${escapeHtml(d.tag)}</span>` : ""}
      </div>
    `;
  }).join("");
  active = 0;
  Array.from(list.children).forEach((c) => c.addEventListener("click", () => {
    navigate(c.dataset.route); close();
  }));
}

function score(doc, tokens) {
  const hay = (doc.title + " " + (doc.subtitle || "") + " " + (doc.body || "")).toLowerCase();
  let s = 0;
  for (const t of tokens) {
    if (hay.includes(t)) {
      s += 1;
      if (doc.title.toLowerCase().includes(t)) s += 3;
    } else { return 0; }
  }
  return s;
}

function move(dir) {
  const items = list.querySelectorAll(".search-result");
  if (!items.length) return;
  active = (active + dir + items.length) % items.length;
  items.forEach(i => i.classList.remove("focused"));
  items[active].classList.add("focused");
  items[active].scrollIntoView({ block: "nearest" });
}
function commit() {
  const items = list.querySelectorAll(".search-result");
  if (!items.length) return;
  if (active < 0) active = 0;
  navigate(items[active].dataset.route);
  close();
}

function buildIndex(data) {
  const out = [];
  for (const a of data.actors) {
    out.push({ kind: "Actor", title: a.name, subtitle: a.role || "", body: (a.bio || "") + " " + (a.affiliations || []).join(" "), route: `/actors/${a.id}`, tag: a.side || "" });
  }
  for (const e of data.entities) {
    out.push({ kind: "Entity", title: e.name, subtitle: e.kind || "", body: (e.description || "") + " " + (e.jurisdiction || ""), route: `/entities/${e.id}`, tag: e.tier || "" });
  }
  for (const c of data.claims) {
    out.push({ kind: "Claim", title: c.title, subtitle: c.legal_theory || "", body: (c.elements || []).join(" ") + " " + (c.summary || ""), route: `/claims#${c.id}`, tag: c.status || "" });
  }
  for (const t of data.timeline) {
    out.push({ kind: "Event", title: t.title, subtitle: t.date_label || t.date || "", body: t.description || "", route: `/timeline#${t.id}` });
  }
  for (const q of data.quotes) {
    out.push({ kind: "Quote", title: q.text.slice(0, 88) + (q.text.length > 88 ? "…" : ""), subtitle: `${q.speaker_name} · ${q.context_label || q.year || ""}`, body: q.text, route: `/quotes#${q.id}` });
  }
  for (const d of data.disputed) {
    out.push({ kind: "Dispute", title: d.question, subtitle: d.status || "", body: (d.plaintiff_position || "") + " " + (d.defense_position || "") + " " + (d.record || ""), route: `/disputed#${d.id}` });
  }
  for (const s of (data.sources.entries || [])) {
    out.push({ kind: "Source", title: `Dkt #${s.docket} — ${s.title || s.label}`, subtitle: s.date || "", body: s.full_text || s.notes || "", route: `/sources#dkt-${s.docket}` });
  }
  return out;
}
