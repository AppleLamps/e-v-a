/* Date and string formatting helpers. */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function formatDate(value) {
  if (!value) return "";
  // Accept "YYYY-MM-DD", "YYYY-MM", "YYYY".
  const m = String(value).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!m) return String(value);
  const [, y, mo, d] = m;
  if (!mo) return y;
  if (!d) return `${MONTHS[+mo - 1]} ${y}`;
  return `${MONTHS[+mo - 1]} ${parseInt(d, 10)}, ${y}`;
}

export function formatDateRange(start, end) {
  if (!start && !end) return "";
  if (!end) return formatDate(start);
  if (!start) return formatDate(end);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function pluralize(n, one, many = one + "s") {
  return n === 1 ? `${n} ${one}` : `${n} ${many}`;
}

export function truncate(s, n = 160) {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

export function highlight(text, query) {
  if (!query || !text) return escapeHtml(text);
  const safe = escapeHtml(text);
  const parts = query.toLowerCase().split(/\s+/).filter(Boolean).map(escapeRegex);
  if (!parts.length) return safe;
  return safe.replace(new RegExp("(" + parts.join("|") + ")", "ig"), "<mark>$1</mark>");
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
