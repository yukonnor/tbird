const axios = require("axios");

const EBIRD_BASE = "https://api.ebird.org/v2";

const client = axios.create({
  baseURL: EBIRD_BASE,
  headers: { "X-eBirdApiToken": process.env.EBIRD_API_KEY },
});

async function getRecentObservations(regionCode, back = 14) {
  const { data } = await client.get(`/data/obs/${regionCode}/recent`, {
    params: { back },
  });
  return data;
}

async function getHotspots(regionCode) {
  const { data } = await client.get(`/ref/hotspot/${regionCode}`, {
    params: { fmt: "json" },
  });
  return data;
}

async function getRecentObservationsAtHotspot(locId, back = 14) {
  const { data } = await client.get(`/data/obs/${locId}/recent`, {
    params: { back },
  });
  return data;
}

async function searchSpecies(query) {
  const { data } = await client.get("/ref/taxonomy/ebird", {
    params: { fmt: "json", cat: "species" },
  });
  const q = query.toLowerCase();
  return data.filter(
    (s) =>
      s.comName.toLowerCase().includes(q) ||
      s.sciName.toLowerCase().includes(q)
  );
}

module.exports = {
  getRecentObservations,
  getHotspots,
  getRecentObservationsAtHotspot,
  searchSpecies,
};
