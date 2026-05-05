import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";
import { prose, inlineProse } from "../utils/prose.js";

export function renderAnalysis(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "Synthesis"),
    el("h1", {}, "Analysis"),
    el("p", { class: "deck" }, "What each side is actually fighting over, what each side claims to be fighting over, and what the documentary record says — read across the entire docket and the trial-wiki commentary.")
  ]);
  root.append(head);
  const sections = data.analysis.sections || [];
  const main = el("article", { class: "shell" }, [
    el("div", { class: "split" }, [
      el("div", {}, sections.map(renderSection)),
      el("nav", { class: "toc", "aria-label": "On this page" }, [
        el("h6", {}, "On this page"),
        ...sections.map(s => el("a", { href: "#" + s.id }, s.title))
      ])
    ])
  ]);
  root.append(main);
}

function renderSection(s) {
  const blocks = (s.blocks || []).map(b => {
    if (b.type === "h3") return el("h3", { id: b.id || undefined }, b.text);
    if (b.type === "p") return el("div", { class: "analysis-prose" }, [
      prose(b.text),
      ...((b.citations || []).map(c => citationChip(c)))
    ]);
    if (b.type === "blockquote") return el("blockquote", {}, [
      el("p", { style: "margin:0" }, b.text),
      el("footer", { class: "muted text-small", style: "margin-top:.4rem" }, [
        b.attribution || "",
        " ",
        ...((b.citations || []).map(c => citationChip(c)))
      ])
    ]);
    if (b.type === "list") return el("ul", {}, (b.items || []).map(it => el("li", {}, [
      ...inlineProse(it.text),
      ...((it.citations || []).map(c => citationChip(c)))
    ])));
    return null;
  });
  return el("section", { class: "analysis-section", id: s.id }, [
    s.eyebrow ? el("p", { class: "eyebrow" }, s.eyebrow) : null,
    el("h2", {}, s.title),
    s.deck ? el("p", { class: "deck" }, s.deck) : null,
    ...blocks
  ]);
}
