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
  function setOpen(open) {
    nav.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("modal-open", open);
  }
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  backdrop.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}
