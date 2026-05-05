import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";

export function renderQuotes(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "What was said, and when"),
    el("h1", {}, "Quote database"),
    el("p", { class: "deck" }, `${data.quotes.length} quoted statements — founding emails, depositions, public tweets, court filings, trial testimony. Filter by speaker, theme, year, venue, and whether the statement contradicts another.`)
  ]);
  // Sort the values first, then prepend "all" — otherwise lowercase 'a' in "all"
  // sorts after capital letters and "all" no longer ends up at index 0 (i.e., the
  // default selection silently becomes whichever speaker/theme is alphabetically first).
  const speakers = ["all", ...[...new Set(data.quotes.map(q => q.speaker_name).filter(Boolean))].sort()];
  const themes = ["all", ...[...new Set(data.quotes.flatMap(q => q.themes || []))].sort()];
  const years = ["all", ...[...new Set(data.quotes.map(q => q.year).filter(Boolean))].sort((a, b) => a - b)];
  const filterBar = el("div", { class: "filter-bar shell" }, [
    el("div", { class: "field" }, [
      el("label", { for: "qt-search" }, "Search"),
      el("input", { type: "search", id: "qt-search", placeholder: "search quote text" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "qt-speaker" }, "Speaker"),
      el("select", { id: "qt-speaker" }, speakers.map(s => el("option", { value: s }, s === "all" ? "All speakers" : s)))
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "qt-theme" }, "Theme"),
      el("select", { id: "qt-theme" }, themes.map(t => el("option", { value: t }, t === "all" ? "All themes" : t)))
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "qt-year" }, "Year"),
      el("select", { id: "qt-year" }, years.map(y => el("option", { value: y }, y === "all" ? "All years" : y)))
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "qt-venue" }, "Venue"),
      el("select", { id: "qt-venue" }, [
        el("option", { value: "all" }, "All venues"),
        el("option", { value: "private" }, "Private (email/text)"),
        el("option", { value: "public" }, "Public (tweet/blog)"),
        el("option", { value: "court" }, "Court filing"),
        el("option", { value: "deposition" }, "Deposition"),
        el("option", { value: "trial" }, "Trial testimony")
      ])
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "qt-flag" }, "Flags"),
      el("select", { id: "qt-flag" }, [
        el("option", { value: "all" }, "All"),
        el("option", { value: "under_oath" }, "Under oath"),
        el("option", { value: "contradicts" }, "Contradicts another quote")
      ])
    ]),
    el("span", { class: "filter-count", id: "qt-count" })
  ]);
  const shell = el("div", { class: "shell quotes-list", id: "quotes-list" });
  root.append(head, filterBar, shell);
  const all = data.quotes.map(makeQuote);
  function paint() {
    const q = document.getElementById("qt-search").value.trim().toLowerCase();
    const sf = document.getElementById("qt-speaker").value;
    const tf = document.getElementById("qt-theme").value;
    const yf = document.getElementById("qt-year").value;
    const vf = document.getElementById("qt-venue").value;
    const ff = document.getElementById("qt-flag").value;
    shell.innerHTML = "";
    let n = 0;
    data.quotes.forEach((qt, i) => {
      const hay = (qt.text + " " + qt.speaker_name + " " + (qt.context_label || "")).toLowerCase();
      const passQ = !q || hay.includes(q);
      const passS = sf === "all" || qt.speaker_name === sf;
      const passT = tf === "all" || (qt.themes || []).includes(tf);
      const passY = yf === "all" || String(qt.year) === yf;
      const passV = vf === "all" || qt.venue === vf;
      const passF = ff === "all" || (ff === "under_oath" && qt.under_oath) || (ff === "contradicts" && qt.contradicts);
      if (passQ && passS && passT && passY && passV && passF) { shell.appendChild(all[i]); n++; }
    });
    document.getElementById("qt-count").textContent = `${n} of ${data.quotes.length}`;
    if (!n) shell.appendChild(el("div", { class: "empty-state" }, "No quotes match."));
  }
  filterBar.addEventListener("input", paint);
  paint();
}

function makeQuote(q) {
  const sideClass = q.side || "neutral";
  return el("article", { class: "quote-card " + sideClass, id: q.id }, [
    el("blockquote", { class: "quote-text" }, q.text),
    el("div", { class: "quote-attr" }, [
      el("a", { class: "speaker", href: q.speaker_id ? "#/actors/" + q.speaker_id : "#" }, q.speaker_name),
      q.recipient_name ? el("span", { class: "ctx" }, " → " + q.recipient_name) : null,
      el("span", { class: "quote-when" }, q.context_label || q.year || ""),
      ...((q.citations || []).map(c => citationChip(c)))
    ]),
    (q.under_oath || q.venue === "private" || q.contradicts) ? el("div", { class: "quote-meta-row" }, [
      q.under_oath ? el("span", { class: "quote-pill under-oath" }, "Under oath") : null,
      q.venue === "private" ? el("span", { class: "quote-pill private" }, "Private comm.") : null,
      q.contradicts ? el("span", { class: "quote-pill contradicts" }, "Contradicts another quote") : null
    ]) : null
  ]);
}
