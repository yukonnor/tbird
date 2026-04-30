import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getIgnoredHotspots, unignoreHotspot } from "../services/api";

export default function IgnoredHotspotsPage() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingLocId, setRemovingLocId] = useState(null);

  useEffect(() => {
    getIgnoredHotspots()
      .then(setHotspots)
      .finally(() => setLoading(false));
  }, []);

  async function handleUnignore(locId) {
    setRemovingLocId(locId);
    try {
      await unignoreHotspot(locId);
      setHotspots((prev) => prev.filter((h) => h.loc_id !== locId));
    } finally {
      setRemovingLocId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/lists" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; My Lists
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hidden Hotspots</h1>
        <p className="text-sm text-gray-500 mt-1">
          These hotspots are excluded from your target finder results.
        </p>
      </div>

      {loading && (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      )}

      {!loading && hotspots.length === 0 && (
        <div className="text-center text-gray-400 py-12 text-sm">
          No hidden hotspots.
        </div>
      )}

      {!loading && hotspots.length > 0 && (
        <div className="space-y-2">
          {hotspots.map((h) => (
            <div
              key={h.loc_id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {h.loc_name || h.loc_id}
                </p>
                <p className="text-xs text-gray-400">{h.loc_id}</p>
              </div>
              <button
                onClick={() => handleUnignore(h.loc_id)}
                disabled={removingLocId === h.loc_id}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {removingLocId === h.loc_id ? "Restoring..." : "Restore"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
