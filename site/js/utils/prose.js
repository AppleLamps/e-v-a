import { el } from "./dom.js";

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9"'(])/g;
const MARK_RE = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function prose(text, options = {}) {
  const value = String(text || "").trim();
  if (!value) return null;
  const classes = ["prose-flow"];
  if (options.compact) classes.push("prose-compact");
  if (options.className) classes.push(options.className);
  return el("div", { class: classes.join(" ") }, proseBlocks(value).map(renderBlock));
}

export function inlineProse(text) {
  const value = String(text || "");
  const out = [];
  let last = 0;
  for (const match of value.matchAll(MARK_RE)) {
    if (match.index > last) out.push(document.createTextNode(value.slice(last, match.index)));
    const raw = match[0];
    const strong = raw.startsWith("**");
    out.push(el(strong ? "strong" : "em", {}, raw.slice(strong ? 2 : 1, strong ? -2 : -1)));
    last = match.index + raw.length;
  }
  if (last < value.length) out.push(document.createTextNode(value.slice(last)));
  return out;
}

function proseBlocks(text) {
  return text
    .split(/\n{2,}/)
    .flatMap(p => splitParagraph(p.replace(/\s+/g, " ").trim()))
    .filter(Boolean);
}

function splitParagraph(paragraph) {
  if (!paragraph) return [];
  if (paragraph.length < 340) return [{ type: "p", text: paragraph }];
  const semicolons = (paragraph.match(/;/g) || []).length;
  if (semicolons >= 3) return splitSemicolonParagraph(paragraph);

  const sentences = splitSentences(paragraph);
  const blocks = [];
  let group = [];
  let size = 0;
  for (const sentence of sentences) {
    if (group.length && (size + sentence.length > 300 || group.length >= 2)) {
      blocks.push({ type: "p", text: group.join(" ") });
      group = [];
      size = 0;
    }
    group.push(sentence);
    size += sentence.length;
  }
  if (group.length) blocks.push({ type: "p", text: group.join(" ") });
  return blocks;
}

function splitSemicolonParagraph(paragraph) {
  const sentences = splitSentences(paragraph);
  const blocks = [];
  let pending = [];
  for (const sentence of sentences) {
    if ((sentence.match(/;/g) || []).length >= 2) {
      flushPending();
      blocks.push({
        type: "list",
        items: splitSemicolonItems(sentence).map(cleanListItem).filter(Boolean)
      });
    } else {
      pending.push(sentence);
      if (pending.join(" ").length > 300) flushPending();
    }
  }
  flushPending();
  return blocks;

  function flushPending() {
    if (!pending.length) return;
    blocks.push({ type: "p", text: pending.join(" ") });
    pending = [];
  }
}

function splitSentences(text) {
  return text.split(SENTENCE_SPLIT).map(s => s.trim()).filter(Boolean);
}

function cleanListItem(item) {
  return item.trim().replace(/^[,–—-]\s*/, "").replace(/\s+$/, "");
}

function splitSemicolonItems(text) {
  const items = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "(" || char === "[" || char === "{") depth++;
    else if (char === ")" || char === "]" || char === "}") depth = Math.max(0, depth - 1);
    else if (char === ";" && depth === 0) {
      items.push(text.slice(start, i));
      start = i + 1;
    }
  }
  items.push(text.slice(start));
  return items;
}

function renderBlock(block) {
  if (block.type === "list") {
    return el("ul", { class: "prose-points" }, block.items.map(item => el("li", {}, richItem(item))));
  }
  return el("p", {}, richItem(block.text));
}

function richItem(text) {
  const label = String(text).match(/^([^:]{3,42}):\s+(.+)$/);
  if (!label || /https?|Dkt|No\.|U\.S\.|N\.D\./.test(label[1])) return inlineProse(text);
  return [el("strong", {}, label[1] + ": "), ...inlineProse(label[2])];
}
