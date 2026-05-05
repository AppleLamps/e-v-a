import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";
import { prose } from "../utils/prose.js";

export function renderEntities(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "Corporate web"),
    el("h1", {}, "Entities"),
    el("p", { class: "deck" }, `${data.entities.length} legal entities — the nonprofit, the capped-profit LP, the holding and SPV layers, Aestas, Microsoft's investment vehicle, x.AI Corp, and Tesla.`)
  ]);
  // Group by tier.
  const order = ["nonprofit","operating","holding","fund","spv","aestas","plaintiff","microsoft","other"];
  const groups = {};
  for (const e of data.entities) {
    const t = e.tier || "other";
    (groups[t] = groups[t] || []).push(e);
  }
  const shell = el("div", { class: "shell" });
  order.filter(o => groups[o]).forEach((tier, idx) => {
    const items = groups[tier];
    const group = el("section", { class: "entity-tier-group" }, [
      el("div", { class: "entity-tier-head" }, [
        el("div", {}, [
          el("p", { class: "eyebrow" }, tierLabel(tier)),
          el("h3", {}, tierTitle(tier)),
          el("p", { class: "muted" }, tierDesc(tier))
        ]),
        el("span", { class: "entity-tier-count" }, `${items.length} ${items.length === 1 ? "entity" : "entities"}`)
      ]),
      el("div", { class: "grid-cards" }, items.map(makeCard))
    ]);
    shell.appendChild(group);
  });
  root.append(head, shell);
}

function tierLabel(t) {
  return ({
    nonprofit: "501(c)(3) layer",
    operating: "Operating for-profit layer",
    holding: "Holding & management layer",
    fund: "Investment fund layer",
    spv: "Special-purpose-vehicle layer",
    aestas: "Aestas / Musk-controlled",
    plaintiff: "Plaintiff entity",
    microsoft: "Microsoft",
    other: "Other"
  })[t] || t;
}
function tierTitle(t) {
  return ({
    nonprofit: "OpenAI's nonprofit foundation",
    operating: "OpenAI's commercial operating entities",
    holding: "Holdings, GPs, and management",
    fund: "Startup-fund vehicles",
    spv: "Downstream SPV deal vehicles",
    aestas: "Aestas — Musk-side LLCs",
    plaintiff: "Plaintiff entity",
    microsoft: "Microsoft Corp.",
    other: "Other entities"
  })[t] || t;
}
function tierDesc(t) {
  return ({
    nonprofit: "The original 501(c)(3). Plaintiffs allege its assets, IP, and personnel were transferred into the for-profit layers.",
    operating: "Where the products are built and sold. Plaintiffs allege exclusive licensing here strips the nonprofit of its assets.",
    holding: "Intermediate corporations and limited liability companies that channel ownership and management rights.",
    fund: "OpenAI's startup investment program — the 'fund-no-competitors' allegation centers here.",
    spv: "Special-purpose vehicles for downstream deals. Plaintiffs say beneficial ownership is obscured at this layer.",
    aestas: "Aestas Management Company, LLC and Aestas, LLC — defendants on the SAC; alleged to hold for-profit interests for insiders.",
    plaintiff: "Musk's competing AI corporation, added as plaintiff in the FAC.",
    microsoft: "Investor, exclusive cloud provider, and licensee. Remaining claim: aiding and abetting breach of fiduciary duty.",
    other: ""
  })[t] || "";
}

function makeCard(e) {
  return el("article", { class: "card entity-card", id: "ent-" + e.id }, [
    el("a", { class: "card-link", href: "#/entities/" + e.id, "aria-label": "View " + e.name }),
    el("div", { class: "ent-tier" }, e.kind || ""),
    el("div", { class: "ent-name" }, e.name),
    e.jurisdiction ? el("div", { class: "ent-juris" }, [e.jurisdiction, " · ", e.formed || ""]) : null,
    e.short ? el("p", { class: "ent-desc" }, e.short) : null
  ]);
}

export function renderEntity(data, id, root) {
  const e = data.indexes.entity[id];
  if (!e) {
    root.innerHTML = `<div class="shell"><div class="empty-state">No such entity: ${id}.</div><p><a href="#/entities">← Back to all entities</a></p></div>`;
    return;
  }
  const main = el("div", {}, [
    el("a", { class: "profile-back", href: "#/entities" }, "← All entities"),
    el("div", { class: "profile-header" }, [
      el("p", { class: "eyebrow" }, e.kind || ""),
      el("h1", { class: "profile-name" }, e.name),
      el("p", { class: "profile-role" }, [e.jurisdiction || "", e.formed ? " · formed " + e.formed : ""])
    ]),
    e.description ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Role in the alleged scheme"),
      prose(e.description)
    ]) : null,
    (e.flows || []).length ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Flows of capital, IP, or control"),
      el("ul", {}, e.flows.map(f => el("li", {}, [
        el("strong", {}, f.kind + ": "),
        f.from + " → " + f.to,
        f.detail ? " — " + f.detail : "",
        " ",
        ...((f.citations || []).map(c => citationChip(c)))
      ])))
    ]) : null,
    (e.officers || []).length ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Officers / signatories named in the record"),
      el("ul", {}, e.officers.map(o => el("li", {}, [
        el("a", { href: "#/actors/" + (o.actor_id || "") }, o.actor_name || o.actor_id),
        " — ", o.title
      ])))
    ]) : null
  ]);
  const aside = el("aside", { class: "profile-aside" }, [
    el("h3", { style: "font-family:var(--font-sans);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:.4rem" }, "At a glance"),
    el("dl", {}, [
      ...(e.attributes || []).flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])
    ])
  ]);
  root.innerHTML = "";
  root.append(el("div", { class: "shell" }, [
    el("div", { class: "profile-grid" }, [main, aside])
  ]));
}
