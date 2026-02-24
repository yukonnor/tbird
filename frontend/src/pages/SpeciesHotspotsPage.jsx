import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getHotspotsForSpecies, getTargetLists } from "../services/api";

export default function SpeciesHotspotsPage() {
  const { listId, speciesCode } = useParams();
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
  }, [listId, speciesCode, daysBack]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await getHotspotsForSpecies(listId, speciesCode, daysBack);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load hotspots");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-3 text-sm text-gray-500">
        <Link to={`/lists/${listId}`} className="hover:text-gray-700">
          &larr; Back to list
        </Link>
        <Link to={`/lists/${listId}/find`} className="hover:text-gray-700">
          All targets
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {data?.speciesName || speciesCode}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Where to find this species
          {list && (
            <span>
              {" "}
              &middot; {list.region_name || list.region_code}
            </span>
          )}
        </p>
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
          Searching for sightings...
        </div>
      )}

      {data && data.hotspots.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12 text-sm">
          No sightings of {data.speciesName} in the last {daysBack} days.
        </div>
      )}

      {data && data.hotspots.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            Seen at {data.hotspots.length} hotspot
            {data.hotspots.length === 1 ? "" : "s"} recently
          </p>

          {data.hotspots.map((hotspot, index) => (
            <div
              key={hotspot.locId}
              className={`rounded-md border border-gray-200 p-4 ${
                index === 0
                  ? "border-l-4 border-l-green-500 bg-green-50"
                  : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {hotspot.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Last seen: {hotspot.mostRecentDate}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
