import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getHotspotsForTargets, getTargetLists } from "../services/api";

export default function FindTargetsPage() {
  const { listId } = useParams();
  const [list, setList] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysBack, setDaysBack] = useState(14);

  useEffect(() => {
    getTargetLists().then((lists) => {
      const found = lists.find((l) => l.id === listId);
      setList(found || null);
    });
  }, [listId]);

  useEffect(() => {
    loadData();
  }, [listId, daysBack]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await getHotspotsForTargets(listId, daysBack);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load hotspots");
    } finally {
      setLoading(false);
    }
  }

  function getTierClass(index, total) {
    if (total === 0) return "";
    const ratio = index / total;
    if (ratio < 0.1) return "border-l-4 border-l-red-500 bg-red-50";
    if (ratio < 0.3) return "border-l-4 border-l-orange-400 bg-orange-50";
    if (ratio < 0.6) return "border-l-4 border-l-yellow-400 bg-yellow-50";
    return "border-l-4 border-l-gray-200 bg-white";
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/lists/${listId}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to list
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Where to Find Your Targets
        </h1>
        {list && (
          <p className="text-sm text-gray-500 mt-1">
            {list.name} &middot; {list.region_name || list.region_code}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm text-gray-600">
          Days back:
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-center text-gray-500 py-12">
          Scanning eBird for your targets...
        </div>
      )}

      {data && data.hotspots.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12 text-sm">
          No recent sightings of your target species in the last {daysBack}{" "}
          days.
        </div>
      )}

      {data && data.hotspots.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            {data.hotspots.length} hotspots with your targets (
            {data.targetCount} active targets)
          </p>

          {data.hotspots.map((hotspot, index) => (
            <div
              key={hotspot.locId}
              className={`rounded-md border border-gray-200 p-4 ${getTierClass(index, data.hotspots.length)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {hotspot.name}
                  </h3>
                  <p className="text-sm font-medium text-blue-700 mt-0.5">
                    {hotspot.targetCount} of your target
                    {hotspot.targetCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2 text-xs shrink-0 ml-4">
                  <a
                    href={hotspot.ebirdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    eBird
                  </a>
                  {hotspot.mapsUrl && (
                    <a
                      href={hotspot.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Maps
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-1">
                {hotspot.species.map((sp) => (
                  <div
                    key={sp.speciesCode}
                    className="flex items-center justify-between text-sm"
                  >
                    <Link
                      to={`/lists/${listId}/species/${sp.speciesCode}/find`}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {sp.name}
                    </Link>
                    <span className="text-xs text-gray-400 ml-2">
                      {sp.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
