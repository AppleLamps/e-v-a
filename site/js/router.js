/* Hash-based router. Owns view registration and lifecycle. */
import { renderHome } from "./views/home.js";
import { renderTimeline } from "./views/timeline.js";
import { renderActors, renderActor } from "./views/actors.js";
import { renderEntities, renderEntity } from "./views/entities.js";
import { renderDisputed } from "./views/disputed.js";
import { renderClaims } from "./views/claims.js";
import { renderQuotes } from "./views/quotes.js";
import { renderMap } from "./views/map.js";
import { renderAnalysis } from "./views/analysis.js";
import { renderSources } from "./views/sources.js";

const routes = [
  { match: /^\/?$/, name: "home", render: renderHome },
  { match: /^\/timeline\/?$/, name: "timeline", render: renderTimeline },
  { match: /^\/actors\/?$/, name: "actors", render: renderActors },
  { match: /^\/actors\/([^/]+)\/?$/, name: "actor", render: (data, m, root) => renderActor(data, m[1], root) },
  { match: /^\/entities\/?$/, name: "entities", render: renderEntities },
  { match: /^\/entities\/([^/]+)\/?$/, name: "entity", render: (data, m, root) => renderEntity(data, m[1], root) },
  { match: /^\/disputed\/?$/, name: "disputed", render: renderDisputed },
  { match: /^\/claims\/?$/, name: "claims", render: renderClaims },
  { match: /^\/quotes\/?$/, name: "quotes", render: renderQuotes },
  { match: /^\/map\/?$/, name: "map", render: renderMap },
  { match: /^\/analysis\/?$/, name: "analysis", render: renderAnalysis },
  { match: /^\/sources\/?$/, name: "sources", render: renderSources }
];

export function initRouter(data) {
  const root = document.getElementById("view-root");
  function go() {
    const hash = (location.hash || "#/").replace(/^#/, "") || "/";
    const path = hash.startsWith("/") ? hash : "/" + hash;
    let matched = null;
    for (const r of routes) {
      const m = path.match(r.match);
      if (m) { matched = { route: r, m }; break; }
    }
    if (!matched) matched = { route: routes[0], m: ["/"] };
    root.classList.add("fade-in");
    root.innerHTML = "";
    try {
      matched.route.render(data, matched.m, root);
    } catch (err) {
      console.error("Render failed:", err);
      root.innerHTML = `<div class="shell"><div class="error-state"><h3>Render error.</h3><p>${err.message}</p></div></div>`;
    }
    setTimeout(() => root.classList.remove("fade-in"), 220);
    document.querySelectorAll(".primary-nav a").forEach(a => {
      const route = a.dataset.route;
      a.classList.toggle("active", route === matched.route.name);
    });
    document.getElementById("main").focus({ preventScroll: true });
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    else window.scrollTo({ top: 0 });
    // Close mobile nav on navigation.
    document.querySelector(".primary-nav.open")?.classList.remove("open");
    document.querySelector(".nav-backdrop.open")?.classList.remove("open");
    document.getElementById("menu-toggle")?.setAttribute("aria-expanded", "false");
  }
  window.addEventListener("hashchange", go);
  go();
}

export function navigate(path) {
  if (!path.startsWith("#")) path = "#" + path;
  if (location.hash === path) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    location.hash = path;
  }
}
