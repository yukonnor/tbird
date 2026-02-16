import { useState } from "react";
import { getHotspots, getHotspotObservations } from "../services/api";

export default function TestPage() {
  const [regionCode, setRegionCode] = useState("US-CA-075");
  const [hotspots, setHotspots] = useState([]);
  const [observations, setObservations] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingObs, setLoadingObs] = useState(null);
  const [error, setError] = useState(null);

  async function fetchHotspots() {
    setLoading(true);
    setError(null);
    setObservations({});
    try {
      const data = await getHotspots(regionCode);
      setHotspots(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchObservations(locId) {
    setLoadingObs(locId);
    try {
      const data = await getHotspotObservations(locId);
      setObservations((prev) => ({ ...prev, [locId]: data }));
    } catch (err) {
      setObservations((prev) => ({ ...prev, [locId]: [] }));
    } finally {
      setLoadingObs(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          eBird API Test
        </h1>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            placeholder="Region code (e.g. US-CA-075)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchHotspots}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Fetch Hotspots"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        {hotspots.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {hotspots.length} hotspots found
          </p>
        )}

        <div className="space-y-3">
          {hotspots.map((hs) => (
            <div
              key={hs.locId}
              className="bg-white border border-gray-200 rounded-md p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{hs.locName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{hs.locId}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <a
                      href={`https://ebird.org/hotspot/${hs.locId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      eBird
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${hs.lat},${hs.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google Maps
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => fetchObservations(hs.locId)}
                  disabled={loadingObs === hs.locId}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingObs === hs.locId
                    ? "Loading..."
                    : observations[hs.locId]
                      ? "Refresh"
                      : "View Recent Observations"}
                </button>
              </div>

              {observations[hs.locId] && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {observations[hs.locId].length === 0 ? (
                    <p className="text-xs text-gray-400">
                      No recent observations
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {observations[hs.locId].map((obs, i) => (
                        <li
                          key={`${obs.speciesCode}-${i}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-800">{obs.comName}</span>
                          <span className="text-gray-400 text-xs">
                            {obs.obsDt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
