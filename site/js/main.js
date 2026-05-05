/* Entry point. Boots data, theme, router, search, and citation popovers. */
import { initRouter } from "./router.js";
import { initTheme } from "./theme.js";
import { initSearch } from "./search.js";
import { initCitationPopover } from "./components/citation-popover.js";
import { loadAll } from "./data/loader.js";
import { initNav } from "./components/nav.js";
import { initBackToTop } from "./components/back-to-top.js";

function showFatal(err) {
  const root = document.getElementById("view-root");
  const loading = document.getElementById("loading-pane");
  if (loading) loading.hidden = true;
  if (root) {
    root.hidden = false;
    root.innerHTML = `
      <div class="shell">
        <div class="error-state">
          <h3>The site could not load its data.</h3>
          <p>${escapeHtml(err && err.message ? err.message : String(err))}</p>
          <p>Try a hard refresh, or check the browser console.</p>
        </div>
      </div>`;
  }
  console.error(err);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

async function boot() {
  initTheme();
  initNav();
  try {
    const data = await loadAll();
    window.__case = data;
    document.dispatchEvent(new CustomEvent("case:loaded", { detail: data }));
    document.getElementById("loading-pane").hidden = true;
    const root = document.getElementById("view-root");
    root.hidden = false;
    initRouter(data);
    initSearch(data);
    initCitationPopover(data);
    initBackToTop();
    stampMeta(data.meta);
    measureHeader();
    window.addEventListener("resize", measureHeader, { passive: true });
  } catch (err) {
    showFatal(err);
  }
}

function stampMeta(meta) {
  const archive = document.getElementById("archive-stamp");
  if (archive && meta) archive.textContent = `Archive through ${meta.archive_through}`;
  const footer = document.getElementById("footer-stamp");
  if (footer && meta) footer.textContent = `Last analyzed ${meta.last_analyzed} · v${meta.version}`;
  const last = meta && meta.last_analyzed ? meta.last_analyzed : "—";
  document.title = `Musk v. Altman — A Forensic Reading of the Docket (${last})`;
}

function measureHeader() {
  const h = document.querySelector(".site-header");
  if (!h) return;
  document.documentElement.style.setProperty("--header-h", h.offsetHeight + "px");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
