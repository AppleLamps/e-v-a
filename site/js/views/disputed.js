import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";
import { prose } from "../utils/prose.js";

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
      d.summary ? prose(d.summary, { className: "muted", compact: true }) : null,
      el("div", { class: "dispute-grid" }, [
        d.plaintiff_position ? el("div", { class: "dispute-side plaintiff" }, [
          el("h5", { class: "plaintiff" }, "Plaintiff position"),
          prose(d.plaintiff_position, { compact: true }),
          ...(((d.plaintiff_citations) || []).length ? [el("div", { class: "muted text-small", style: "margin-top:.4rem" }, d.plaintiff_citations.map(c => citationChip(c)))] : [])
        ]) : null,
        d.defense_position ? el("div", { class: "dispute-side defendant" }, [
          el("h5", { class: "defendant" }, "Defense position"),
          prose(d.defense_position, { compact: true }),
          ...(((d.defense_citations) || []).length ? [el("div", { class: "muted text-small", style: "margin-top:.4rem" }, d.defense_citations.map(c => citationChip(c)))] : [])
        ]) : null
      ]),
      d.record ? el("div", { class: "dispute-record" }, [
        el("strong", {}, "What the record shows"), prose(d.record, { compact: true }),
        " ",
        ...((d.record_citations || []).map(c => citationChip(c)))
      ]) : null
    ]);
    list.appendChild(card);
  });
  root.append(head, list);
}
