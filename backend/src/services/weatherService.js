const axios = require("axios");

const client = axios.create({ baseURL: "https://api.openweathermap.org/data/2.5" });

const cache = new Map();
const TTL_1H = 60 * 60 * 1000;

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

async function getCurrentWeather(lat, lng) {
  // Round to 2 decimal places (~1km) so nearby hotspots share cache entries
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;

  return cached(`weather:${rLat}:${rLng}`, TTL_1H, async () => {
    const { data } = await client.get("/weather", {
      params: {
        lat,
        lon: lng,
        appid: process.env.OPENWEATHER_API_KEY,
        units: "imperial",
      },
    });

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      windSpeed: Math.round(data.wind.speed),
      windDeg: data.wind.deg ?? null,
      windGust: data.wind.gust != null ? Math.round(data.wind.gust) : null,
      precipitation: data.rain?.["1h"] ?? data.snow?.["1h"] ?? null,
    };
  });
}

module.exports = { getCurrentWeather };
