import { el, escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format.js";
import { citationChip } from "../utils/citation.js";

const SIDE_LABEL = {
  plaintiff: "Musk-side",
  defendant: "OpenAI-side",
  judicial: "Court",
  microsoft: "Microsoft",
  neutral: "Neutral / dual-side"
};

export function renderTimeline(data, _m, root) {
  const { timeline } = data;
  const eras = (data.analysis.eras || []).slice();
  // Sort timeline by date.
  const sorted = [...timeline].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const sideOptions = ["all", ...new Set(sorted.map(e => e.side).filter(Boolean))];
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "From founding emails to trial"),
    el("h1", {}, "Timeline"),
    el("p", { class: "deck" }, `${sorted.length} dated events. Each links back to the underlying filing or contemporaneous communication. Filter by who acted.`)
  ]);
  const filterBar = el("div", { class: "filter-bar shell" }, [
    el("div", { class: "field" }, [
      el("label", { for: "tl-search" }, "Search"),
      el("input", { type: "search", id: "tl-search", placeholder: "filter events", autocomplete: "off" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "tl-side" }, "Side"),
      el("select", { id: "tl-side" }, sideOptions.map(s => el("option", { value: s }, s === "all" ? "All sides" : SIDE_LABEL[s] || s)))
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "tl-major" }, "Importance"),
      el("select", { id: "tl-major" }, [
        el("option", { value: "all" }, "All events"),
        el("option", { value: "major" }, "Inflection points only")
      ])
    ]),
    el("span", { class: "filter-count", id: "tl-count" }, sorted.length + " events")
  ]);
  const legend = el("div", { class: "shell timeline-legend" }, [
    legendItem("plaintiff", "Musk side"),
    legendItem("defendant", "OpenAI side"),
    legendItem("microsoft", "Microsoft"),
    legendItem("judicial", "Court"),
    legendItem("neutral", "Neutral / dual")
  ]);
  const listShell = el("div", { class: "shell timeline-shell" });
  const listEl = el("div", { class: "timeline-list", id: "timeline-list" });
  listShell.appendChild(listEl);

  root.append(head, filterBar, legend, listShell);

  const eventEls = sorted.map(evt => makeEvent(evt, data));
  function paint() {
    const q = document.getElementById("tl-search").value.trim().toLowerCase();
    const sideF = document.getElementById("tl-side").value;
    const majorF = document.getElementById("tl-major").value;
    listEl.innerHTML = "";
    let lastEra = null;
    let visible = 0;
    sorted.forEach((evt, i) => {
      const matches = (
        (sideF === "all" || evt.side === sideF) &&
        (majorF === "all" || evt.major) &&
        (!q || (evt.title + " " + (evt.description || "")).toLowerCase().includes(q))
      );
      if (!matches) return;
      visible++;
      // Era cluster label change.
      const era = pickEra(evt.date, eras);
      if (era && era.label !== lastEra) {
        listEl.appendChild(el("div", { class: "timeline-cluster-label" }, era.label));
        lastEra = era.label;
      }
      listEl.appendChild(eventEls[i]);
    });
    document.getElementById("tl-count").textContent = visible + " events";
    if (!visible) listEl.appendChild(el("div", { class: "empty-state" }, "No events match your filters."));
  }
  filterBar.addEventListener("input", paint);
  paint();
}

function legendItem(side, label) {
  return el("span", { class: "item" }, [
    el("span", { class: "dot " + side }),
    el("span", {}, label)
  ]);
}

function pickEra(d, eras) {
  if (!d) return null;
  for (const era of eras) {
    if (d >= era.start && (!era.end || d <= era.end)) return era;
  }
  return null;
}

function makeEvent(evt, data) {
  const node = el("div", { class: "timeline-event", id: evt.id, data: { side: evt.side || "neutral", major: evt.major ? "true" : "false" } }, [
    el("div", { class: "timeline-date" }, [evt.date_label || formatDate(evt.date), evt.major ? " · inflection" : ""]),
    el("div", { class: "timeline-title" }, evt.title),
    evt.description ? el("p", { class: "timeline-desc" }, evt.description) : null,
    el("div", { class: "timeline-meta" }, [
      ...(evt.actors || []).slice(0, 6).map(name => actorPill(name, data)),
      ...(evt.citations || []).map(c => citationChip(c))
    ])
  ]);
  return node;
}

function actorPill(name, data) {
  // Resolve a display name to its actor id via the canonical index, with honorific
  // stripping and a slug fallback. Unknown names render as static pills (no link).
  const idx = data && data.indexes && data.indexes.actorByName;
  const resolved = idx && (idx[name] || idx[name.replace(/^Hon\.\s+/, "")]);
  if (resolved) {
    return el("a", { class: "pill", href: `#/actors/${resolved.id}` }, name);
  }
  // Fallback: try kebab-slug; if the actor index says it exists, link it.
  const fallback = String(name).toLowerCase().replace(/^hon\.\s+/, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
  if (data && data.indexes && data.indexes.actor && data.indexes.actor[fallback]) {
    return el("a", { class: "pill", href: `#/actors/${fallback}` }, name);
  }
  return el("span", { class: "pill" }, name);
}
