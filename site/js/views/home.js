import { el, escapeHtml } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";
import { formatDate } from "../utils/format.js";

export function renderHome(data, _m, root) {
  const meta = data.meta;
  const a = data.analysis;
  const h = a.hero || {};
  const hero = el("section", { class: "home-hero" }, [
    el("div", { class: "shell" }, [
      el("p", { class: "eyebrow" }, "Forensic case file · " + meta.archive_through),
      el("h1", {}, h.headline || "What this case is actually about."),
      el("p", { class: "deck" }, h.deck || ""),
      el("div", { class: "meta-row" }, [
        el("span", {}, [el("strong", {}, "Case "), meta.case_caption || "Musk v. Altman"]),
        el("span", {}, [el("strong", {}, "Court "), meta.court]),
        el("span", {}, [el("strong", {}, "Judge "), meta.judge]),
        el("span", {}, [el("strong", {}, "Filed "), formatDate(meta.filed)]),
        el("span", {}, [el("strong", {}, "Docket "), meta.docket_no]),
        el("span", {}, [el("strong", {}, "Posture "), meta.posture])
      ])
    ])
  ]);

  const hyp = a.executive_summary || {};
  const components = (hyp.components || []).map((c, i) =>
    el("div", { class: "component" }, [
      el("span", { class: "component-rank" }, String(i + 1)),
      el("div", {}, [
        el("h4", {}, c.title),
        el("p", {}, c.description),
        c.weight ? el("p", { class: "muted text-small" }, "Weight in record: " + c.weight) : null
      ])
    ])
  );
  const conf = hyp.confidence || {};
  const confEl = el("div", { class: "confidence-bar", "aria-label": `Confidence: ${conf.label || "moderate"}` }, [
    el("span", { class: "muted text-small" }, [
      "Confidence: ",
      el("strong", {}, (conf.label || "Moderate"))
    ]),
    el("span", { class: "confidence-track" }, [
      el("span", { class: "confidence-fill", style: `width:${(conf.value || 0.6) * 100}%` })
    ])
  ]);

  const hypothesisCard = el("section", { class: "shell" }, [
    el("div", { class: "home-hypothesis" }, [
      el("p", { class: "eyebrow" }, "The strongest evidence-backed hypothesis"),
      el("h2", {}, hyp.title || ""),
      el("p", { class: "lead-claim" }, hyp.thesis || ""),
      confEl,
      components.length ? el("div", { class: "components" }, components) : null,
      el("p", { class: "muted text-small" }, [
        "This page is the analytical product, not the docket. Every assertion below traces back to a primary filing — open the chips to see exact docket entries. The site does not paper over genuine ambiguity; the disputed-facts and sources views surface where the record itself is silent or contradictory."
      ])
    ])
  ]);

  const posture = el("section", { class: "shell" }, [
    el("h2", {}, "Where the case stands"),
    el("p", { class: "muted" }, "By the numbers, drawn from the docket itself."),
    el("div", { class: "posture-grid" }, [
      stat(meta.docket_entries, "Docket entries", "From the filed complaint through the most recent entry in the archive."),
      stat(meta.filings_extracted, "Filings extracted", "Court PDFs converted to markdown for line-level citation."),
      stat(meta.live_claims, "Live claims at trial", "Of 26 originally pleaded; only the charitable-trust theory and restitution survive."),
      stat(meta.counterclaims, "Live counterclaims", "OpenAI's UCL and tortious-interference theories tied to the February 2025 LOI."),
      stat(meta.named_defendants, "Named defendants", "Including a layered web of nonprofit, capped-profit, holding, and SPV entities."),
      stat(meta.named_actors, "Named actors", "Founders, board members, executives, attorneys, and witnesses on the record.")
    ])
  ]);

  const callout = el("section", { class: "shell" }, [
    el("div", { class: "archive-callout" }, [
      el("h5", {}, "Archive scope"),
      el("p", {}, [
        "The primary docket archive ends ",
        el("strong", {}, formatDate(meta.archive_through_iso)),
        " (entry #", meta.last_docket_no || "350",
        " — Plaintiffs' opposition to the OpenAI MSJ). Trial began ",
        el("strong", {}, formatDate(meta.trial_start_iso)),
        " and proceedings are tracked separately in ",
        el("code", {}, "case-files/"),
        " trial-wiki commentary; that material is treated as secondary observation, not primary evidence. Where the site cites a transcript line (e.g., ",
        el("span", { class: "mono" }, "Trial 042826TT.txt:1284"),
        "), the citation chip flags it as a trial-wiki source."
      ])
    ])
  ]);

  const jump = el("section", { class: "shell" }, [
    el("h2", {}, "Read the case"),
    el("div", { class: "home-quick-jump" }, [
      jumpLink("/timeline", "Timeline", "From the May 2015 founding emails through the November 2023 board episode and into trial."),
      jumpLink("/actors", "Cast of actors", "Founders, board, counsel, witnesses — with quotes and procedural history attached."),
      jumpLink("/entities", "Corporate entity map", "The nonprofit, the capped-profit LP, OpenAI Global, OAI Corp, Aestas, Microsoft, x.AI."),
      jumpLink("/disputed", "Disputed facts", "Side-by-side: what plaintiffs assert, what defendants assert, what the documents actually show."),
      jumpLink("/claims", "Causes of action", "26 claims pleaded; the seven that cleared MTD; the two that went to the jury."),
      jumpLink("/quotes", "Quote database", "Founding emails, depositions, public tweets, and trial testimony — clustered and contradictable."),
      jumpLink("/map", "Connection map", "An interactive graph of who answers to whom and which way the money and IP move."),
      jumpLink("/analysis", "Long-form analysis", "Rhetorical strategy of each side, omissions, evolution of the dispute, and the real fight."),
      jumpLink("/sources", "Source index", "Every docket entry analyzed, with filing date, page count, and analytical notes.")
    ])
  ]);

  root.append(hero, hypothesisCard, posture, callout, jump);
}

function stat(value, label, desc) {
  return el("div", { class: "posture-card" }, [
    el("h4", {}, label),
    el("div", { class: "stat numeric" }, value != null ? String(value) : "—"),
    el("p", { class: "desc" }, desc)
  ]);
}

function jumpLink(href, title, desc) {
  return el("a", { href: "#" + href }, [
    el("h5", {}, title),
    el("p", {}, desc)
  ]);
}
