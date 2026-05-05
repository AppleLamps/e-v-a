/* Citation rendering. Citations are objects:
   { docket: "163", filename: "gov.uscourts...163.0.md", page: 7, snippet: "..." }
   or trial citations: { trial: "042826TT.txt", line: 1284, snippet: "..." }
   or string shortcuts: "#163", "#163 p.7", "Trial 042826TT.txt:1284"
*/

import { el, escapeHtml } from "./dom.js";

export function citationChips(refs) {
  if (!refs) return null;
  if (!Array.isArray(refs)) refs = [refs];
  if (!refs.length) return null;
  const wrap = el("span", { class: "cites" });
  refs.forEach((r, i) => {
    if (i > 0) wrap.appendChild(document.createTextNode(" "));
    wrap.appendChild(citationChip(r));
  });
  return wrap;
}

export function citationChip(ref) {
  const norm = normalize(ref);
  const btn = el("button", {
    type: "button",
    class: "cite" + (norm.kind === "trial" ? " cite-trial" : " cite-court"),
    "aria-label": `Show source detail: ${norm.label}`,
    "aria-haspopup": "dialog",
    data: {
      cite: JSON.stringify(norm)
    }
  });
  btn.textContent = norm.label;
  btn.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("citation:show", {
      detail: { ref: norm, anchor: btn }
    }));
  });
  return btn;
}

export function normalize(ref) {
  if (!ref) return null;
  if (typeof ref === "string") {
    const tt = ref.match(/^Trial\s+(\d{6}TT\.txt):(\d+)/i);
    if (tt) return { kind: "trial", trial: tt[1], line: +tt[2], label: `Trial ${tt[1].slice(0,4)}:${tt[2]}` };
    const m = ref.match(/^#?(\d+)(?:\.(\d+))?(?:\s*p\.?\s*(\d+))?/i);
    if (m) return { kind: "court", docket: m[1], attachment: m[2] || "0", page: m[3] ? +m[3] : null, label: `Dkt #${m[1]}${m[3] ? " p." + m[3] : ""}` };
    return { kind: "raw", label: ref };
  }
  if (ref.trial) {
    return { kind: "trial", trial: ref.trial, line: ref.line, snippet: ref.snippet, label: `Trial ${String(ref.trial).slice(0,4)}:${ref.line}` };
  }
  return {
    kind: "court",
    docket: String(ref.docket),
    attachment: ref.attachment ? String(ref.attachment) : "0",
    page: ref.page || null,
    filename: ref.filename || null,
    snippet: ref.snippet || null,
    title: ref.title || null,
    label: `Dkt #${ref.docket}${ref.page ? " p." + ref.page : ""}`
  };
}
