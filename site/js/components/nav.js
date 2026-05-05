/* Mobile nav toggle. */

export function initNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.querySelector(".primary-nav");
  if (!toggle || !nav) return;
  let lastFocused = null;
  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
  }
  function setOpen(open) {
    if (open) lastFocused = document.activeElement;
    nav.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("modal-open", open);
    if (open) {
      requestAnimationFrame(() => nav.querySelector("a")?.focus());
    } else if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
      lastFocused = null;
    }
  }
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  backdrop.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (!nav.classList.contains("open")) return;
    if (e.key === "Escape") {
      setOpen(false);
      toggle.focus();
      return;
    }
    if (e.key === "Tab") {
      const focusables = [toggle, ...nav.querySelectorAll("a[href]")].filter(el => !el.hidden);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        focusables[1]?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
