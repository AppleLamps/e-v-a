export function placeLabels(nodes, W, H) {
  const placed = [];
  const priority = { entity: 0, actor: 1 };
  const sorted = [...nodes].sort((a, b) => (priority[a.kind] || 1) - (priority[b.kind] || 1));
  for (const n of sorted) {
    const w = Math.min(178, Math.max(42, n.label.length * 6.1));
    const h = 14;
    const candidates = [
      { x: 14, y: 4, anchor: "start" },
      { x: -14, y: 4, anchor: "end" },
      { x: 14, y: -10, anchor: "start" },
      { x: -14, y: -10, anchor: "end" },
      { x: 14, y: 18, anchor: "start" },
      { x: -14, y: 18, anchor: "end" },
      { x: 0, y: -16, anchor: "middle" },
      { x: 0, y: 24, anchor: "middle" }
    ];
    let best = null;
    for (const c of candidates) {
      const rect = labelRect(n.x + c.x, n.y + c.y, w, h, c.anchor);
      let score = overflowPenalty(rect, W, H);
      for (const p of placed) score += overlapArea(rect, p) * 3;
      if ((n.x > W / 2 && c.anchor === "start") || (n.x <= W / 2 && c.anchor === "end")) score += 120;
      if (!best || score < best.score) best = { ...c, rect, score };
    }
    n.labelX = best.x;
    n.labelY = best.y;
    n.labelAnchor = best.anchor;
    placed.push(best.rect);
  }
}

function labelRect(x, y, w, h, anchor) {
  let left = x;
  if (anchor === "end") left = x - w;
  else if (anchor === "middle") left = x - w / 2;
  return { left, right: left + w, top: y - h + 3, bottom: y + 3 };
}

function overflowPenalty(r, W, H) {
  return Math.max(0, -r.left) + Math.max(0, r.right - W) + Math.max(0, -r.top) + Math.max(0, r.bottom - H);
}

function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
}
