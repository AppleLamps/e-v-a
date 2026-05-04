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
  const byKey = (arr, key) => Object.fromEntries(arr.map(x => [x[key], x]));
  // Slug-based actor name lookup so display-name pills (timeline event "actors")
  // resolve correctly even when the name carries an honorific or the slug rule
  // would otherwise diverge from the canonical id.
  const actorByName = {};
  for (const a of actors) {
    actorByName[a.name] = a;
    actorByName[a.name.replace(/^Hon\.\s+/, "")] = a;
  }
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
      actorByName,
      entity: byId(entities),
      claim: byId(claims),
      source: byKey(sources.entries || [], "docket"),
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
  const m = ref.match(/^#?(\d+)/);
  if (!m) return null;
  const n = m[1];
  const src = data.indexes.source[n];
  return src || { kind: "court", docket: n, label: `Dkt #${n}`, filename: null };
}
