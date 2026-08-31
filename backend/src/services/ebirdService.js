const axios = require("axios");

const EBIRD_BASE = "https://api.ebird.org/v2";

const client = axios.create({
  baseURL: EBIRD_BASE,
  headers: { "X-eBirdApiToken": process.env.EBIRD_API_KEY },
});

// In-memory cache with per-key TTL
const cache = new Map();

function cached(key, ttlMs, fetchFn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < ttlMs) {
    return Promise.resolve(entry.data);
  }
  return fetchFn().then((data) => {
    cache.set(key, { data, time: Date.now() });
    return data;
  });
}

const TTL_24H = 24 * 60 * 60 * 1000;
const TTL_15M = 15 * 60 * 1000;

async function getTaxonomy() {
  return cached("taxonomy", TTL_24H, async () => {
    const { data } = await client.get("/ref/taxonomy/ebird", {
      params: { fmt: "json", cat: "species" },
    });
    return data;
  });
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getRecentObservations(regionCode, back = 14) {
  return cached(`obs:${regionCode}:${back}`, TTL_15M, async () => {
    const { data } = await client.get(`/data/obs/${regionCode}/recent`, {
      params: { back },
    });
    return data;
  });
}

async function getRecentNotableObservations(regionCode, back = 7) {
  return cached(`notable:${regionCode}:${back}`, TTL_15M, async () => {
    const { data } = await client.get(`/data/obs/${regionCode}/recent/notable`, {
      params: { back, detail: "full" },
    });
    return data;
  });
}

async function getHotspots(regionCode) {
  return cached(`hotspots:${regionCode}`, TTL_15M, async () => {
    const { data } = await client.get(`/ref/hotspot/${regionCode}`, {
      params: { fmt: "json" },
    });
    return data;
  });
}

async function getRecentObservationsAtHotspot(locId, back = 14) {
  return cached(`obs:${locId}:${back}`, TTL_15M, async () => {
    const { data } = await client.get(`/data/obs/${locId}/recent`, {
      params: { back },
    });
    return data;
  });
}

async function searchSpecies(query) {
  const taxonomy = await getTaxonomy();
  const q = query.toLowerCase();
  return taxonomy.filter(
    (s) =>
      s.comName.toLowerCase().includes(q) ||
      s.sciName.toLowerCase().includes(q)
  );
}

async function matchSpeciesName(name) {
  const taxonomy = await getTaxonomy();
  const norm = normalize(name);
  if (!norm) return null;

  // Exact common name match
  const exact = taxonomy.find((s) => normalize(s.comName) === norm);
  if (exact) return { speciesCode: exact.speciesCode, comName: exact.comName };

  // Match ignoring parenthetical qualifiers:
  // "Yellow Warbler" should match "Yellow Warbler (Northern)"
  const withoutParens = taxonomy.find((s) => {
    const base = normalize(s.comName.replace(/\s*\(.*?\)/g, ""));
    return base === norm;
  });
  if (withoutParens)
    return {
      speciesCode: withoutParens.speciesCode,
      comName: withoutParens.comName,
    };

  // Input has parenthetical — match the base part
  const inputBase = normalize(name.replace(/\s*\(.*?\)/g, ""));
  if (inputBase !== norm) {
    const baseMatch = taxonomy.find(
      (s) => normalize(s.comName.replace(/\s*\(.*?\)/g, "")) === inputBase
    );
    if (baseMatch)
      return {
        speciesCode: baseMatch.speciesCode,
        comName: baseMatch.comName,
      };
  }

  // "Northern Yellow Warbler" → check if any taxonomy name contains all the same words
  const normWords = norm.split(" ");
  const wordMatch = taxonomy.find((s) => {
    const comWords = normalize(s.comName).split(" ");
    return normWords.every((w) => comWords.includes(w));
  });
  if (wordMatch)
    return { speciesCode: wordMatch.speciesCode, comName: wordMatch.comName };

  return null;
}

async function getSubregions(parentCode) {
  const { data } = await client.get(`/ref/region/list/subnational1/${parentCode}`);
  return data.map((r) => ({ code: r.code, name: r.name }));
}

async function getCounties(stateCode) {
  const { data } = await client.get(`/ref/region/list/subnational2/${stateCode}`);
  return data.map((r) => ({ code: r.code, name: r.name }));
}

async function searchRegions(query) {
  // Search across countries and US states (fast, two calls, cached by HTTP)
  const [countries, usStates] = await Promise.all([
    client.get("/ref/region/list/country/world").then((r) => r.data),
    client.get("/ref/region/list/subnational1/US").then((r) => r.data),
  ]);

  const all = [
    ...countries.map((r) => ({ code: r.code, name: r.name })),
    ...usStates.map((r) => ({ code: r.code, name: r.name })),
  ];

  const q = query.toLowerCase();
  return all.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 20);
}

module.exports = {
  getRecentObservations,
  getRecentNotableObservations,
  getHotspots,
  getRecentObservationsAtHotspot,
  searchSpecies,
  matchSpeciesName,
  searchRegions,
  getSubregions,
  getCounties,
};
