import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";
import { prose } from "../utils/prose.js";

const STATUS_LABEL = {
  live: "Live at trial",
  trial: "Survived to jury",
  dismissed: "Dismissed",
  partially_dismissed: "Partially dismissed",
  counterclaim: "Counterclaim",
  superseded: "Superseded"
};

export function renderClaims(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "What is being argued"),
    el("h1", {}, "Causes of action"),
    el("p", { class: "deck" }, `${data.claims.length} claims have appeared in this case across the original complaint, FAC, and SAC, plus OpenAI's counterclaims. The card layout shows each one's legal theory, elements, evidence, and procedural history.`)
  ]);
  const filterBar = el("div", { class: "filter-bar shell" }, [
    el("div", { class: "field" }, [
      el("label", { for: "cl-search" }, "Search"),
      el("input", { type: "search", id: "cl-search", placeholder: "search claims" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "cl-status" }, "Status"),
      el("select", { id: "cl-status" }, [
        el("option", { value: "all" }, "All"),
        el("option", { value: "trial" }, "At trial"),
        el("option", { value: "live" }, "Live"),
        el("option", { value: "dismissed" }, "Dismissed"),
        el("option", { value: "counterclaim" }, "Counterclaim")
      ])
    ]),
    el("span", { class: "filter-count", id: "cl-count" })
  ]);
  const shell = el("div", { class: "shell stack-l", id: "claims-list" });
  root.append(head, filterBar, shell);
  const allCards = data.claims.map(makeCard);
  function paint() {
    const q = document.getElementById("cl-search").value.trim().toLowerCase();
    const sf = document.getElementById("cl-status").value;
    shell.innerHTML = "";
    let n = 0;
    data.claims.forEach((c, i) => {
      const hay = (c.title + " " + c.legal_theory + " " + (c.summary || "")).toLowerCase();
      if ((sf === "all" || c.status === sf || (sf === "trial" && c.went_to_jury)) && (!q || hay.includes(q))) {
        shell.appendChild(allCards[i]); n++;
      }
    });
    document.getElementById("cl-count").textContent = `${n} of ${data.claims.length}`;
    if (!n) shell.appendChild(el("div", { class: "empty-state" }, "No claims match."));
  }
  filterBar.addEventListener("input", paint);
  paint();
}

function makeCard(c) {
  return el("article", { class: `claim-card status-${c.status || "live"}`, id: c.id }, [
    el("div", { class: "between", style: "flex-wrap:wrap;gap:.4rem" }, [
      el("div", { class: "claim-num" }, c.label || "Count"),
      el("span", { class: "badge status-" + (c.status || "live") }, STATUS_LABEL[c.status] || c.status || "live")
    ]),
    el("h3", { class: "claim-title" }, c.title),
    c.summary ? prose(c.summary, { className: "summary", compact: true }) : null,
    el("dl", { class: "claim-meta" }, [
      c.legal_theory ? el("div", {}, [el("dt", {}, "Legal theory"), el("dd", {}, c.legal_theory)]) : null,
      c.parties ? el("div", {}, [el("dt", {}, "Parties"), el("dd", {}, c.parties)]) : null,
      c.elements ? el("div", {}, [
        el("dt", {}, "Elements"),
        el("dd", {}, el("ul", { style: "padding-left:1.2em;list-style:revert" }, c.elements.map(e => el("li", {}, e))))
      ]) : null,
      c.relief ? el("div", {}, [el("dt", {}, "Relief sought"), el("dd", {}, prose(c.relief, { compact: true }))]) : null,
      c.plaintiff_evidence ? el("div", {}, [el("dt", {}, "Plaintiff's strongest evidence"), el("dd", {}, prose(c.plaintiff_evidence, { compact: true }))]) : null,
      c.defense_response ? el("div", {}, [el("dt", {}, "Defense response"), el("dd", {}, prose(c.defense_response, { compact: true }))]) : null
    ]),
    (c.history || []).length ? el("section", {}, [
      el("h5", { style: "font-family:var(--font-sans);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:.4rem" }, "Procedural history"),
      el("div", { class: "claim-history" }, c.history.map(h => el("div", { class: `claim-step outcome-${h.outcome || "info"}` }, [
        el("span", { class: "when" }, h.when + " · "),
        el("span", { class: "what" }, h.text + " "),
        ...((h.citations || []).map(cc => citationChip(cc)))
      ])))
    ]) : null
  ]);
}
