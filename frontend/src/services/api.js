import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export function loginUser(email, password) {
  return api.post("/api/auth/login", { email, password }).then((r) => r.data);
}

export function registerUser(email, password) {
  return api.post("/api/auth/register", { email, password }).then((r) => r.data);
}

export function getCurrentUser() {
  return api.get("/api/auth/me").then((r) => r.data);
}

// eBird
export function getObservations(regionCode, back = 14) {
  return api.get(`/api/ebird/observations/${regionCode}`, { params: { back } }).then((r) => r.data);
}

export function getHotspots(regionCode) {
  return api.get(`/api/ebird/hotspots/${regionCode}`).then((r) => r.data);
}

export function getHotspotObservations(locId, back = 14) {
  return api.get(`/api/ebird/hotspot/${locId}/observations`, { params: { back } }).then((r) => r.data);
}

export function searchSpecies(query) {
  return api.get("/api/ebird/species/search", { params: { q: query } }).then((r) => r.data);
}

export function searchRegions(query) {
  return api.get("/api/ebird/regions/search", { params: { q: query } }).then((r) => r.data);
}

export function getSubregions(regionCode) {
  return api.get(`/api/ebird/regions/${regionCode}/subregions`).then((r) => r.data);
}

// Target Lists
export function getTargetLists() {
  return api.get("/api/targets/lists").then((r) => r.data);
}

export function createTargetList(data) {
  return api.post("/api/targets/lists", data).then((r) => r.data);
}

export function deleteTargetList(listId) {
  return api.delete(`/api/targets/lists/${listId}`).then((r) => r.data);
}

// Target Species
export function getTargetSpecies(listId, activeOnly = false) {
  return api
    .get(`/api/targets/lists/${listId}/species`, {
      params: activeOnly ? { active_only: "true" } : {},
    })
    .then((r) => r.data);
}

export function addTargetSpecies(listId, data) {
  return api.post(`/api/targets/lists/${listId}/species`, data).then((r) => r.data);
}

export function bulkImportSpecies(listId, speciesNames) {
  return api
    .post(`/api/targets/lists/${listId}/species/bulk`, { species_names: speciesNames })
    .then((r) => r.data);
}

export function markSpeciesSeen(speciesId) {
  return api.patch(`/api/targets/species/${speciesId}/seen`).then((r) => r.data);
}

export function markSpeciesUnseen(speciesId) {
  return api.patch(`/api/targets/species/${speciesId}/unseen`).then((r) => r.data);
}

export function deleteTargetSpecies(speciesId) {
  return api.delete(`/api/targets/species/${speciesId}`).then((r) => r.data);
}

// Target Finder
export function getHotspotsForTargets(listId, daysBack = 14) {
  return api
    .get(`/api/targets/lists/${listId}/hotspots`, {
      params: { days_back: daysBack },
    })
    .then((r) => r.data);
}

export function getHotspotsForSpecies(listId, speciesCode, daysBack = 14) {
  return api
    .get(`/api/targets/lists/${listId}/species/${speciesCode}/hotspots`, {
      params: { days_back: daysBack },
    })
    .then((r) => r.data);
}
