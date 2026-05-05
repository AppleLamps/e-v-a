import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";

export function renderDisputed(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "Where the parties disagree"),
    el("h1", {}, "Disputed facts"),
    el("p", { class: "deck" }, `Side-by-side comparisons. For each contested claim, this page lays out what each side asserts, what the underlying documents actually show, and where the record is silent or contradictory.`)
  ]);
  const list = el("div", { class: "shell dispute-list" });
  (data.disputed || []).forEach(d => {
    const card = el("section", { class: "dispute-card", id: d.id }, [
      el("div", { class: "between", style: "flex-wrap:wrap;gap:.4rem" }, [
        el("h3", {}, d.question),
        el("span", { class: "dispute-status " + (d.status || "disputed") }, (d.status || "disputed").replace("_", " "))
      ]),
      d.summary ? el("p", { class: "muted" }, d.summary) : null,
      el("div", { class: "dispute-grid" }, [
        d.plaintiff_position ? el("div", { class: "dispute-side plaintiff" }, [
          el("h5", { class: "plaintiff" }, "Plaintiff position"),
          el("p", {}, d.plaintiff_position),
          ...(((d.plaintiff_citations) || []).length ? [el("div", { class: "muted text-small", style: "margin-top:.4rem" }, d.plaintiff_citations.map(c => citationChip(c)))] : [])
        ]) : null,
        d.defense_position ? el("div", { class: "dispute-side defendant" }, [
          el("h5", { class: "defendant" }, "Defense position"),
          el("p", {}, d.defense_position),
          ...(((d.defense_citations) || []).length ? [el("div", { class: "muted text-small", style: "margin-top:.4rem" }, d.defense_citations.map(c => citationChip(c)))] : [])
        ]) : null
      ]),
      d.record ? el("div", { class: "dispute-record" }, [
        el("strong", {}, "What the record shows"), el("br"), d.record,
        " ",
        ...((d.record_citations || []).map(c => citationChip(c)))
      ]) : null
    ]);
    list.appendChild(card);
  });
  root.append(head, list);
}
