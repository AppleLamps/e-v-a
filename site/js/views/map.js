/* Connection Map. Vanilla SVG force-directed-ish (no D3): we precompute node positions via a
   simple force step on hover/load and allow pan/zoom. Designed to work without external libs. */

import { el, escapeHtml } from "../utils/dom.js";
import { placeLabels } from "../utils/map-labels.js";

export function renderMap(data, _m, root) {
  const head = el("section", { class: "shell" }, [
    el("p", { class: "eyebrow" }, "Who answers to whom"),
    el("h1", {}, "Connection map"),
    el("p", { class: "deck" }, "Nodes are actors and entities. Edges encode formal roles (board seat, officer), capital flow, and direct documentary contact between actors. Pan, zoom, and tap a node to see its connections.")
  ]);
  const legend = el("div", { class: "shell map-legend" }, [
    legendItem("plaintiff", "Musk side"),
    legendItem("defendant", "OpenAI side"),
    legendItem("microsoft", "Microsoft"),
    legendItem("judicial", "Court"),
    legendItem("entity", "Entity")
  ]);
  const wrap = el("div", { class: "shell" });
  const board = el("div", { class: "map-shell" });
  const detail = el("div", { class: "map-detail" }, [
    el("p", { class: "empty" }, "Tap a node to see its dossier and edges.")
  ]);
  const svg = buildSvg(data, detail);
  board.appendChild(svg);
  const pz = enablePanZoom(svg, 1200, 760);
  pz.reset();
  board.appendChild(buildControls(pz));
  wrap.append(board, detail);
  root.append(head, legend, wrap);
}

function legendItem(side, label) {
  return el("span", { class: "item" }, [
    el("span", { class: "swatch", style: "background:" + colorFor(side) }),
    el("span", {}, label)
  ]);
}

function colorFor(side) {
  return ({
    plaintiff: "var(--plaintiff)",
    defendant: "var(--defendant)",
    microsoft: "#5b9c7e",
    judicial: "var(--judicial)",
    entity: "var(--accent)",
    counsel: "var(--ink-mute)",
    witness: "var(--neutral)",
    third_party: "var(--ink-mute)",
    neutral: "var(--ink-mute)"
  })[side] || "var(--accent)";
}

function buildSvg(data, detailEl) {
  const W = 1200, H = 760;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "map-canvas");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "application");
  svg.setAttribute("aria-label", "Interactive connection map");

  // Build nodes from actors + entities (subset).
  const actorNodes = data.actors.filter(a => !a.exclude_from_map).map(a => ({
    id: "a:" + a.id, label: a.name, side: a.side || "neutral", kind: "actor", actor_id: a.id
  }));
  const entityNodes = data.entities.filter(e => !e.exclude_from_map).map(e => ({
    id: "e:" + e.id, label: e.name, side: "entity", kind: "entity", entity_id: e.id, tier: e.tier
  }));
  const nodes = [...actorNodes, ...entityNodes];
  const idIndex = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const edges = [];
  for (const link of (data.analysis.connections || [])) {
    const a = idIndex[link.from], b = idIndex[link.to];
    if (a == null || b == null) continue;
    edges.push({ source: a, target: b, kind: link.kind || "rel", label: link.label || "" });
  }
  // Layout: deterministic circle / cluster by side + force-relax a few iterations.
  const groups = ["plaintiff","defendant","microsoft","judicial","counsel","witness","third_party","neutral","entity"];
  const groupCenters = {};
  groups.forEach((g, i) => {
    const angle = (i / groups.length) * Math.PI * 2 - Math.PI / 2;
    groupCenters[g] = { x: W/2 + Math.cos(angle) * 280, y: H/2 + Math.sin(angle) * 200 };
  });
  nodes.forEach((n, i) => {
    const c = groupCenters[n.side] || { x: W/2, y: H/2 };
    const angle = (i / nodes.length) * Math.PI * 2;
    n.x = c.x + Math.cos(angle) * 60 + (Math.sin(i * 7.13) * 40);
    n.y = c.y + Math.sin(angle) * 60 + (Math.cos(i * 5.91) * 40);
  });
  // Relax: push apart, pull along edges.
  for (let it = 0; it < 220; it++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx*dx + dy*dy + 0.001;
        let f = 1800 / d2;
        let d = Math.sqrt(d2);
        const ux = dx / d, uy = dy / d;
        a.x -= ux * f; a.y -= uy * f;
        b.x += ux * f; b.y += uy * f;
      }
    }
    for (const e of edges) {
      const a = nodes[e.source], b = nodes[e.target];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx*dx + dy*dy) + 0.001;
      const target = 110;
      const f = (d - target) * 0.04;
      const ux = dx / d, uy = dy / d;
      a.x += ux * f; a.y += uy * f;
      b.x -= ux * f; b.y -= uy * f;
    }
    // Pull each node toward its group center weakly.
    for (const n of nodes) {
      const c = groupCenters[n.side] || { x: W/2, y: H/2 };
      n.x += (c.x - n.x) * 0.012;
      n.y += (c.y - n.y) * 0.012;
    }
  }
  // Clamp.
  for (const n of nodes) {
    n.x = Math.max(40, Math.min(W - 40, n.x));
    n.y = Math.max(40, Math.min(H - 40, n.y));
  }
  placeLabels(nodes, W, H);

  const gEdges = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const gNodes = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (const e of edges) {
    const a = nodes[e.source], b = nodes[e.target];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
    line.setAttribute("stroke", "var(--line-strong)");
    line.setAttribute("stroke-width", "0.8");
    line.setAttribute("stroke-opacity", "0.65");
    line.dataset.s = e.source; line.dataset.t = e.target;
    line.dataset.kind = e.kind;
    gEdges.appendChild(line);
  }
  for (const n of nodes) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${n.x},${n.y})`);
    g.style.cursor = "pointer";
    g.dataset.id = n.id;
    const r = n.kind === "entity" ? 8 : 7;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", r);
    c.setAttribute("fill", colorFor(n.side));
    c.setAttribute("stroke", "var(--bg)");
    c.setAttribute("stroke-width", "2.2");
    g.appendChild(c);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", n.labelX);
    txt.setAttribute("y", n.labelY);
    txt.setAttribute("text-anchor", n.labelAnchor);
    txt.setAttribute("font-family", "Inter, sans-serif");
    txt.setAttribute("font-size", "11");
    txt.setAttribute("fill", "var(--ink)");
    txt.setAttribute("paint-order", "stroke");
    txt.setAttribute("stroke", "var(--bg)");
    txt.setAttribute("stroke-width", "3");
    txt.textContent = n.label;
    g.appendChild(txt);
    g.addEventListener("click", () => focusNode(n, nodes, edges, gNodes, gEdges, detailEl));
    g.addEventListener("touchstart", (e) => { e.preventDefault(); focusNode(n, nodes, edges, gNodes, gEdges, detailEl); }, { passive: false });
    gNodes.appendChild(g);
  }
  svg.append(gEdges, gNodes);
  return svg;
}

function focusNode(n, nodes, edges, gNodes, gEdges, detailEl) {
  const idx = nodes.indexOf(n);
  // Highlight relevant edges & nodes.
  Array.from(gEdges.children).forEach(line => {
    const s = +line.dataset.s, t = +line.dataset.t;
    const hot = s === idx || t === idx;
    line.setAttribute("stroke", hot ? "var(--accent)" : "var(--line)");
    line.setAttribute("stroke-opacity", hot ? "0.95" : "0.25");
    line.setAttribute("stroke-width", hot ? "1.6" : "0.7");
  });
  Array.from(gNodes.children).forEach((g, i) => {
    const hot = i === idx || edges.some(e => (e.source === idx && e.target === i) || (e.target === idx && e.source === i));
    const c = g.querySelector("circle");
    c.setAttribute("opacity", hot ? "1" : "0.32");
    g.querySelector("text").setAttribute("opacity", hot ? "1" : "0.32");
  });
  // Detail.
  const connectedEdges = edges.filter(e => e.source === idx || e.target === idx);
  const route = n.kind === "actor" ? `#/actors/${n.actor_id}` : `#/entities/${n.entity_id}`;
  detailEl.innerHTML = `
    <h4><a href="${route}">${escapeHtml(n.label)}</a></h4>
    <div class="muted text-small">${escapeHtml((n.kind === "entity" ? "Entity" : "Actor") + " · " + (n.side || ""))}</div>
    <ul>
      ${connectedEdges.length ? connectedEdges.map(e => {
        const other = nodes[e.source === idx ? e.target : e.source];
        return `<li>${escapeHtml(e.label || e.kind)} — <a href="${other.kind === "actor" ? "#/actors/" + other.actor_id : "#/entities/" + other.entity_id}">${escapeHtml(other.label)}</a></li>`;
      }).join("") : "<li class='muted'>No documented edges in the current map.</li>"}
    </ul>
  `;
}

function buildControls(pz) {
  const wrap = el("div", { class: "map-controls", role: "group", "aria-label": "Map controls" }, [
    el("button", { type: "button", "aria-label": "Zoom in", title: "Zoom in" }, "+"),
    el("button", { type: "button", "aria-label": "Zoom out", title: "Zoom out" }, "−"),
    el("button", { type: "button", "aria-label": "Reset view", title: "Reset" }, "⤾")
  ]);
  const [zin, zout, reset] = wrap.children;
  zin.addEventListener("click", () => {
    pz.state.scale = Math.max(0.5, Math.min(4, pz.state.scale * 1.2));
    pz.apply();
  });
  zout.addEventListener("click", () => {
    pz.state.scale = Math.max(0.5, Math.min(4, pz.state.scale / 1.2));
    pz.apply();
  });
  reset.addEventListener("click", () => {
    pz.reset();
  });
  return wrap;
}

function enablePanZoom(svg, W, H) {
  const state = { x: 0, y: 0, scale: 1 };
  const initial = () => {
    const small = window.matchMedia("(max-width: 600px)").matches;
    const scale = small ? 1.7 : 1;
    return {
      scale,
      x: -(W - (W / scale)) / 2,
      y: -(H - (H / scale)) / 2
    };
  };
  const apply = () => {
    svg.setAttribute("viewBox", `${-state.x} ${-state.y} ${W / state.scale} ${H / state.scale}`);
  };
  const reset = () => {
    Object.assign(state, initial());
    apply();
  };
  apply();
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  function down(e) {
    dragging = true;
    const p = pointer(e, svg);
    sx = p.x; sy = p.y; ox = state.x; oy = state.y;
  }
  function move(e) {
    if (!dragging) return;
    const p = pointer(e, svg);
    state.x = ox + (p.x - sx) * (W / svg.clientWidth) / state.scale;
    state.y = oy + (p.y - sy) * (H / svg.clientHeight) / state.scale;
    apply();
  }
  function up() { dragging = false; }
  svg.addEventListener("mousedown", down);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  svg.addEventListener("touchstart", (e) => { if (e.touches.length === 1) down(e.touches[0]); }, { passive: true });
  svg.addEventListener("touchmove", (e) => { if (e.touches.length === 1) move(e.touches[0]); }, { passive: true });
  svg.addEventListener("touchend", up);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1/1.12 : 1.12;
    state.scale = Math.max(0.5, Math.min(4, state.scale * factor));
    apply();
  }, { passive: false });
  // Pinch support.
  let pinch = null;
  svg.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      pinch = { d, scale: state.scale };
    }
  }, { passive: true });
  svg.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2 && pinch) {
      const d = dist(e.touches[0], e.touches[1]);
      state.scale = Math.max(0.5, Math.min(4, pinch.scale * (d / pinch.d)));
      apply();
    }
  }, { passive: true });
  svg.addEventListener("touchend", (e) => { if (e.touches.length < 2) pinch = null; });
  return { state, apply, reset, W, H };
}
function dist(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
function pointer(e, svg) { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
