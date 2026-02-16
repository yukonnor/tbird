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
