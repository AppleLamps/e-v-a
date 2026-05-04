/* Mobile nav toggle. */

export function initNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.querySelector(".primary-nav");
  if (!toggle || !nav) return;
  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
  }
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    backdrop.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      const first = nav.querySelector("a");
      if (first) first.focus();
    }
  });
  backdrop.addEventListener("click", () => {
    nav.classList.remove("open");
    backdrop.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (!nav.classList.contains("open")) return;
    if (e.key === "Escape") {
      nav.classList.remove("open");
      backdrop.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
      return;
    }
    if (e.key === "Tab") {
      // Trap focus within the open mobile drawer.
      const focusable = nav.querySelectorAll("a, button, [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}
