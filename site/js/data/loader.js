/* Centralized data loader. Single fetch fan-out, with helpful error context. */

const FILES = [
  "meta", "actors", "entities", "timeline", "quotes",
  "claims", "disputed-facts", "analysis", "sources"
];

async function fetchJson(name) {
  const res = await fetch(`/data/${name}.json`, { cache: "default" });
  if (!res.ok) throw new Error(`Failed to load /data/${name}.json (${res.status})`);
  return res.json();
}

export async function loadAll() {
  const [meta, actors, entities, timeline, quotes, claims, disputed, analysis, sources] =
    await Promise.all(FILES.map(fetchJson));
  // Build O(1) indexes used across views.
  const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));
  const byDocket = (arr) => Object.fromEntries(arr.map(x => [String(x.docket), x]));
  return {
    meta,
    actors,
    entities,
    timeline,
    quotes,
    claims,
    disputed: disputed,
    disputed_facts: disputed,
    analysis,
    sources,
    indexes: {
      actor: byId(actors),
      entity: byId(entities),
      claim: byId(claims),
      source: byDocket(sources.entries),
      timeline: byId(timeline)
    }
  };
}

export function lookupSource(data, ref) {
  if (!ref) return null;
  // ref forms: "#163" | "#163-Page-7" | "163" | "163.0" | "Trial 042826TT.txt:1284"
  if (typeof ref !== "string") return ref;
  const trial = ref.match(/^Trial\s+(\d{6}TT\.txt):(\d+)/i);
  if (trial) {
    return {
      kind: "trial",
      transcript: trial[1],
      line: trial[2],
      label: `Trial transcript ${trial[1]} :${trial[2]}`,
      filename: null
    };
  }
  // Capture exhibit-style ids in either hyphen ("32-1") or dot ("32.1") form, plus
  // bare dockets ("163"). A trailing "-Page-7" / ".0" form falls back to the bare docket
  // because the exhibit key won't match.
  const m = ref.match(/^#?(\d+)(?:[-.](\d+))?/);
  if (!m) return null;
  const base = m[1];
  const exhibit = m[2];
  const key = exhibit ? `${base}-${exhibit}` : base;
  let src = data.indexes.source[key];
  if (!src && exhibit) src = data.indexes.source[base];
  return src || { kind: "court", docket: key, label: `Dkt #${key}`, filename: null };
}
