/* Color theme toggle. Persists to localStorage; respects system preference on first load. */

const KEY = "mva.theme";

export function initTheme() {
  const stored = localStorage.getItem(KEY);
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = stored || (prefersLight ? "light" : "dark");
  apply(theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      apply(cur === "dark" ? "light" : "dark", true);
    });
  }
}

function apply(theme, store = false) {
  document.documentElement.setAttribute("data-theme", theme);
  if (store) localStorage.setItem(KEY, theme);
  const t = document.querySelector('meta[name="theme-color"]');
  // Theme color tags use media queries; nothing more to do here.
}
