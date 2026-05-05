/* Floating back-to-top button. Visible after scrolling past one viewport. */

export function initBackToTop() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.title = "Back to top";
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5l-7 7m7-7 7 7M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`;
  document.body.appendChild(btn);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  let ticking = false;
  function update() {
    ticking = false;
    btn.classList.toggle("visible", window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}
