/* Floating citation popover. Listens for citation:show events. */

import { lookupSource } from "../data/loader.js";
import { escapeHtml } from "../utils/dom.js";

let dataRef = null;
let pop = null;
let currentAnchor = null;

export function initCitationPopover(data) {
  dataRef = data;
  pop = document.getElementById("citation-popover");
  if (!pop) return;
  document.addEventListener("citation:show", onShow);
  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
  // Reposition while the anchor is still on screen; hide only when it leaves.
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
}

function onShow(e) {
  const { ref, anchor } = e.detail;
  if (!ref) return;
  const html = renderRef(ref);
  pop.innerHTML = html;
  pop.hidden = false;
  currentAnchor = anchor;
  position(anchor);
}

function onScrollOrResize() {
  if (pop.hidden || !currentAnchor) return;
  const r = currentAnchor.getBoundingClientRect();
  const visible = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  if (!visible) { hide(); return; }
  position(currentAnchor);
}

function position(anchor) {
  const r = anchor.getBoundingClientRect();
  const pw = Math.min(360, window.innerWidth * 0.9);
  pop.style.maxWidth = pw + "px";
  // Default place below.
  let left = r.left + r.width / 2 - pw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  let top = r.bottom + 8;
  pop.style.left = left + "px";
  pop.style.top = top + "px";
  // If overflow bottom, place above.
  const ph = pop.offsetHeight;
  if (top + ph > window.innerHeight - 8) {
    top = Math.max(8, r.top - ph - 8);
    pop.style.top = top + "px";
  }
}

function onDocClick(e) {
  if (pop.hidden) return;
  if (pop.contains(e.target)) return;
  if (e.target.closest && e.target.closest(".cite")) return;
  hide();
}

function hide() {
  if (pop) pop.hidden = true;
  currentAnchor = null;
}

function renderRef(ref) {
  if (ref.kind === "trial") {
    return `
      <h6>Trial Transcript</h6>
      <div class="cp-title">${escapeHtml(ref.trial)}</div>
      <div class="cp-meta">Line ${escapeHtml(String(ref.line))}</div>
      ${ref.snippet ? `<div class="cp-snippet">${escapeHtml(ref.snippet)}</div>` : ""}
      <div class="cp-meta" style="margin-top:.4rem">Trial-wiki commentary (case-files/trial.mts.now). Treated as secondary observation, not primary docket evidence.</div>
    `;
  }
  if (ref.kind === "raw") {
    return `<h6>Reference</h6><div class="cp-title">${escapeHtml(ref.label)}</div>`;
  }
  // court
  const src = dataRef && lookupSource(dataRef, "#" + ref.docket);
  const title = ref.title || (src && src.title) || (src && src.label) || `Docket #${ref.docket}`;
  const filename = ref.filename || (src && src.filename) || null;
  const date = src && src.date ? src.date : "";
  const pages = src && src.pages ? src.pages : null;
  return `
    <h6>Court filing</h6>
    <div class="cp-title">${escapeHtml(title)}</div>
    <div class="cp-meta">Dkt #${escapeHtml(ref.docket)}${ref.page ? " · p." + ref.page : ""} ${date ? "· " + escapeHtml(date) : ""} ${pages ? "· " + pages + "p" : ""}</div>
    ${filename ? `<div class="cp-meta" style="margin-top:.25rem;word-break:break-all">${escapeHtml(filename)}</div>` : ""}
    ${ref.snippet ? `<div class="cp-snippet">${escapeHtml(ref.snippet)}</div>` : ""}
  `;
}
