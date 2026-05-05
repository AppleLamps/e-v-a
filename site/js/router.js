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
  let lastPath = null;
  function go() {
    // Hash form: #/route or #/route#fragment. Split at the *second* '#'.
    const raw = (location.hash || "#/").replace(/^#/, "") || "/";
    const hashIdx = raw.indexOf("#");
    const hash = hashIdx === -1 ? raw : raw.slice(0, hashIdx);
    const fragment = hashIdx === -1 ? "" : raw.slice(hashIdx + 1);
    const path = hash.startsWith("/") ? hash : "/" + hash;
    let matched = null;
    for (const r of routes) {
      const m = path.match(r.match);
      if (m) { matched = { route: r, m }; break; }
    }
    if (!matched) matched = { route: routes[0], m: ["/"] };
    const samePath = lastPath === path;
    if (!samePath) {
      root.classList.add("fade-in");
      root.innerHTML = "";
      try {
        matched.route.render(data, matched.m, root);
      } catch (err) {
        console.error("Render failed:", err);
        root.innerHTML = `<div class="shell"><div class="error-state"><h3>Render error.</h3><p>${err.message}</p></div></div>`;
      }
      setTimeout(() => root.classList.remove("fade-in"), 220);
    }
    lastPath = path;
    document.querySelectorAll(".primary-nav a").forEach(a => {
      const route = a.dataset.route;
      a.classList.toggle("active", route === matched.route.name);
    });
    document.getElementById("main").focus({ preventScroll: true });
    // Scroll: to the deep anchor if any, otherwise to the top.
    if (fragment) {
      // Defer one frame so the just-rendered DOM is laid out.
      requestAnimationFrame(() => {
        const target = document.getElementById(fragment);
        if (target) {
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
          target.classList.add("flash-target");
          setTimeout(() => target.classList.remove("flash-target"), 1800);
        } else if (!samePath) {
          window.scrollTo({ top: 0 });
        }
      });
    } else if (!samePath) {
      window.scrollTo({ top: 0 });
    }
    // Close mobile nav on navigation.
    const drawer = document.querySelector(".primary-nav.open");
    if (drawer) {
      drawer.classList.remove("open");
      document.querySelector(".nav-backdrop.open")?.classList.remove("open");
      document.getElementById("menu-toggle")?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("modal-open");
    }
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
