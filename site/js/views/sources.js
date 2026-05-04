import { el } from "../utils/dom.js";

export function renderSources(data, _m, root) {
  const entries = data.sources.entries || [];
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "What we read"),
    el("h1", {}, "Sources"),
    el("p", { class: "deck" }, "Every docket entry analyzed, with filing date, page count, doc label, and analytical notes where relevant. Pulled from the project manifest and enriched with editorial commentary on the spine documents.")
  ]);
  const summary = el("div", { class: "shell sources-summary" }, [
    el("span", {}, `${entries.length} entries`),
    el("span", {}, `${data.sources.docket_entries || ""} docket entries indexed`),
    el("span", {}, `range: ${data.sources.range || ""}`),
    el("span", {}, `archive through ${data.sources.archive_through || ""}`)
  ]);
  const filterBar = el("div", { class: "filter-bar shell source-controls" }, [
    el("div", { class: "field" }, [
      el("label", { for: "src-search" }, "Search"),
      el("input", { type: "search", id: "src-search", placeholder: "search filings, parties, labels" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "src-flag" }, "Filter"),
      el("select", { id: "src-flag" }, [
        el("option", { value: "all" }, "All filings"),
        el("option", { value: "spine" }, "Spine documents only"),
        el("option", { value: "ocr" }, "OCR-extracted only"),
        el("option", { value: "noted" }, "With editorial notes")
      ])
    ]),
    el("span", { class: "filter-count", id: "src-count" })
  ]);
  const tableShell = el("div", { class: "shell" });
  const table = el("table", { class: "sources-table" }, [
    el("thead", {}, el("tr", {}, [
      el("th", {}, "Dkt"),
      el("th", {}, "Date"),
      el("th", {}, "Doc label"),
      el("th", {}, "Title / what it contributes"),
      el("th", {}, "Pages")
    ])),
    el("tbody", { id: "src-body" })
  ]);
  tableShell.appendChild(table);
  root.append(head, summary, filterBar, tableShell);
  const allRows = entries.map(makeRow);
  function paint() {
    const q = document.getElementById("src-search").value.trim().toLowerCase();
    const ff = document.getElementById("src-flag").value;
    const tbody = document.getElementById("src-body");
    tbody.innerHTML = "";
    let n = 0;
    entries.forEach((s, i) => {
      const hay = ((s.title || "") + " " + (s.label || "") + " " + (s.full_text || "") + " " + (s.notes || "")).toLowerCase();
      const passQ = !q || hay.includes(q);
      const passF =
        ff === "all" ||
        (ff === "spine" && s.spine) ||
        (ff === "ocr" && s.ocr) ||
        (ff === "noted" && s.notes);
      if (passQ && passF) { tbody.appendChild(allRows[i]); n++; }
    });
    document.getElementById("src-count").textContent = `${n} of ${entries.length}`;
    if (!n) tbody.appendChild(el("tr", {}, el("td", { colspan: 5 }, el("div", { class: "empty-state" }, "No filings match."))));
  }
  filterBar.addEventListener("input", paint);
  paint();
}

function makeRow(s) {
  return el("tr", { id: "dkt-" + s.docket }, [
    el("td", { class: "col-num" }, "#" + s.docket),
    el("td", { class: "col-date" }, s.date || ""),
    el("td", { class: "col-label" }, s.label || ""),
    el("td", { class: "col-title" }, [
      el("strong", {}, s.title || s.label || ("Docket #" + s.docket)),
      s.notes ? el("div", { class: "muted text-small", style: "margin-top:.2rem" }, s.notes) : null,
      s.filename ? el("div", { class: "mono", style: "color:var(--ink-faint);font-size:.74rem;margin-top:.2rem;word-break:break-all" }, s.filename) : null
    ]),
    el("td", { class: "col-pages" }, s.pages ? s.pages + "p" : "")
  ]);
}
