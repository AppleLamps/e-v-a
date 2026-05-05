import { el } from "../utils/dom.js";
import { citationChip } from "../utils/citation.js";
import { prose } from "../utils/prose.js";

const SIDE_LABEL = {
  plaintiff: "Plaintiff side",
  defendant: "Defendant side",
  microsoft: "Microsoft",
  judicial: "Court",
  counsel: "Counsel",
  witness: "Witness",
  third_party: "Third party",
  neutral: "Neutral / dual"
};

export function renderActors(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "Cast of actors"),
    el("h1", {}, "Who is in the record"),
    el("p", { class: "deck" }, `${data.actors.length} named individuals — founders, board members, executives, attorneys, witnesses. Click for the dossier.`)
  ]);
  const sides = ["all", ...new Set(data.actors.map(a => a.side).filter(Boolean))];
  const roles = ["all", ...new Set(data.actors.flatMap(a => a.roles || []))];
  const filterBar = el("div", { class: "filter-bar shell" }, [
    el("div", { class: "field" }, [
      el("label", { for: "ac-search" }, "Search"),
      el("input", { type: "search", id: "ac-search", placeholder: "name or affiliation", autocomplete: "off" })
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "ac-side" }, "Side"),
      el("select", { id: "ac-side" }, sides.map(s => el("option", { value: s }, s === "all" ? "All" : SIDE_LABEL[s] || s)))
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "ac-role" }, "Role"),
      el("select", { id: "ac-role" }, roles.map(r => el("option", { value: r }, r === "all" ? "All roles" : r)))
    ]),
    el("span", { class: "filter-count", id: "ac-count" })
  ]);
  const grid = el("div", { class: "shell" }, [
    el("div", { class: "grid-cards", id: "actor-grid" })
  ]);
  root.append(head, filterBar, grid);
  const allCards = data.actors.map(makeCard);
  const allMatching = data.actors;
  function paint() {
    const q = document.getElementById("ac-search").value.trim().toLowerCase();
    const sideF = document.getElementById("ac-side").value;
    const roleF = document.getElementById("ac-role").value;
    const out = document.getElementById("actor-grid");
    out.innerHTML = "";
    let n = 0;
    data.actors.forEach((a, i) => {
      const hay = (a.name + " " + (a.role || "") + " " + (a.affiliations || []).join(" ") + " " + (a.bio || "")).toLowerCase();
      const passSide = sideF === "all" || a.side === sideF;
      const passRole = roleF === "all" || (a.roles || []).includes(roleF);
      const passQ = !q || hay.includes(q);
      if (passSide && passRole && passQ) { out.appendChild(allCards[i]); n++; }
    });
    document.getElementById("ac-count").textContent = `${n} of ${data.actors.length}`;
    if (!n) out.appendChild(el("div", { class: "empty-state" }, "No actors match your filters."));
  }
  filterBar.addEventListener("input", paint);
  paint();
}

function makeCard(a) {
  const sideClass = a.side ? "card-side " + a.side : "card-side neutral";
  const card = el("article", { class: "card actor-card " + sideClass, "data-id": a.id }, [
    el("a", { class: "card-link", href: "#/actors/" + a.id, "aria-label": "View " + a.name }),
    el("div", { class: "name" }, a.name),
    a.role ? el("div", { class: "role" }, a.role) : null,
    a.summary ? prose(a.summary, { className: "summary", compact: true }) : null,
    el("div", { class: "meta-row" }, [
      a.side ? el("span", { class: "badge role-" + a.side }, SIDE_LABEL[a.side] || a.side) : null,
      ...(a.tags || []).map(t => el("span", { class: "badge" }, t))
    ])
  ]);
  return card;
}

export function renderActor(data, id, root) {
  const a = data.indexes.actor[id];
  if (!a) {
    root.innerHTML = `<div class="shell"><div class="empty-state">No such actor: ${id}.</div><p><a href="#/actors">← Back to all actors</a></p></div>`;
    return;
  }
  const relatedQuotes = data.quotes.filter(q => q.speaker_id === a.id);
  const relatedEvents = data.timeline.filter(t => (t.actors || []).includes(a.name));
  const relatedDisputes = data.disputed.filter(d => (d.actors || []).includes(a.id));

  const main = el("div", {}, [
    el("a", { class: "profile-back", href: "#/actors" }, "← All actors"),
    el("div", { class: "profile-header" }, [
      el("div", { class: "profile-affiliation" }, [
        a.side ? el("span", { class: "badge role-" + a.side }, SIDE_LABEL[a.side] || a.side) : null,
        ...(a.tags || []).map(t => el("span", { class: "badge" }, t))
      ]),
      el("h1", { class: "profile-name" }, a.name),
      a.role ? el("p", { class: "profile-role" }, a.role) : null
    ]),
    a.bio ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Background"),
      prose(a.bio)
    ]) : null,
    a.role_in_case ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Role in the case"),
      prose(a.role_in_case)
    ]) : null,
    (a.position_shifts || []).length ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Shifts in stated position"),
      el("ul", {}, a.position_shifts.map(p => el("li", {}, [
        el("strong", {}, p.when + " — "),
        p.text + " ",
        ...((p.citations || []).map(c => citationChip(c)))
      ])))
    ]) : null,
    relatedQuotes.length ? el("section", { class: "profile-section" }, [
      el("h3", {}, `Quotes (${relatedQuotes.length})`),
      el("ul", {}, relatedQuotes.slice(0, 12).map(q => el("li", {}, [
        el("blockquote", {}, q.text),
        el("div", { class: "muted text-small" }, [
          q.context_label || q.year || "",
          " ",
          ...((q.citations || []).map(c => citationChip(c)))
        ])
      ])))
    ]) : null,
    relatedEvents.length ? el("section", { class: "profile-section" }, [
      el("h3", {}, `Timeline involvement (${relatedEvents.length})`),
      el("ul", {}, relatedEvents.slice(0, 18).map(t => el("li", {}, [
        el("strong", {}, (t.date_label || t.date || "") + " — "),
        el("a", { href: "#/timeline" }, t.title)
      ])))
    ]) : null,
    relatedDisputes.length ? el("section", { class: "profile-section" }, [
      el("h3", {}, "Disputed facts where this actor is named"),
      el("ul", {}, relatedDisputes.map(d => el("li", {}, [
        el("a", { href: "#/disputed" }, d.question)
      ])))
    ]) : null
  ]);
  const aside = el("aside", { class: "profile-aside" }, [
    el("h3", { style: "font-family:var(--font-sans);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:.4rem" }, "At a glance"),
    el("dl", {}, [
      ...(a.attributes || []).flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])
    ]),
    a.connections && a.connections.length ? el("div", {}, [
      el("h3", { style: "margin-top:1rem" }, "Key connections"),
      el("ul", {}, a.connections.map(c => el("li", {}, [
        el("a", { href: "#/actors/" + (c.actor_id || "") }, c.actor_name || c.actor_id),
        " — ",
        el("span", { class: "muted" }, c.relation)
      ])))
    ]) : null
  ]);

  root.innerHTML = "";
  root.append(el("div", { class: "shell" }, [
    el("div", { class: "profile-grid" }, [main, aside])
  ]));
}
