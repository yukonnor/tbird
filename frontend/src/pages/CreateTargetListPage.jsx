import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createTargetList, searchRegions, getSubregions } from "../services/api";

export default function CreateTargetListPage() {
  const [name, setName] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [regionName, setRegionName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [subregions, setSubregions] = useState([]);
  const [parentName, setParentName] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegionSearch() {
    if (regionQuery.trim().length < 2) return;
    setSearching(true);
    setRegionCode("");
    setRegionName("");
    setSearchResults([]);
    setSubregions([]);
    setParentName("");
    try {
      const results = await searchRegions(regionQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectRegion(region) {
    setRegionCode(region.code);
    setRegionName(region.name);
    setRegionQuery(region.name);
    setSearchResults([]);
    setSubregions([]);
  }

  async function drillDown(region) {
    setLoadingSub(true);
    setParentName(region.name);
    setSearchResults([]);
    try {
      const subs = await getSubregions(region.code);
      setSubregions(subs);
    } catch {
      setSubregions([]);
    } finally {
      setLoadingSub(false);
    }
  }

  function clearSelection() {
    setRegionCode("");
    setRegionName("");
    setRegionQuery("");
    setSearchResults([]);
    setSubregions([]);
    setParentName("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!regionCode) {
      setError("Please search for and select a region");
      return;
    }
    setLoading(true);
    try {
      const list = await createTargetList({
        name,
        region_code: regionCode,
        region_name: regionName,
      });
      navigate(`/lists/${list.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create list");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/lists" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to lists
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">
        Create Target List
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            List name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My 2026 SF County Targets"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>

          {regionCode ? (
            <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-md">
              <div>
                <span className="text-sm text-green-800 font-medium">
                  {regionName}
                </span>
                <span className="text-xs text-green-600 ml-2">
                  ({regionCode})
                </span>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regionQuery}
                  onChange={(e) => setRegionQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRegionSearch();
                    }
                  }}
                  placeholder="Search by country or state, then drill into subregions"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleRegionSearch}
                  disabled={searching || regionQuery.trim().length < 2}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto">
                  {searchResults.map((r) => (
                    <div
                      key={r.code}
                      className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <div>
                        <span className="text-sm text-gray-900">{r.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {r.code}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => selectRegion(r)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() => drillDown(r)}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Subregions &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loadingSub && (
                <p className="mt-2 text-sm text-gray-400">
                  Loading subregions...
                </p>
              )}

              {subregions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Subregions of {parentName}:
                  </p>
                  <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto">
                    {subregions.map((r) => (
                      <div
                        key={r.code}
                        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <div>
                          <span className="text-sm text-gray-900">
                            {r.name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {r.code}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => selectRegion(r)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Select
                          </button>
                          {r.code.split("-").length < 3 && (
                            <button
                              type="button"
                              onClick={() => drillDown(r)}
                              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                              Subregions &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !regionCode}
          className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create List"}
        </button>
      </form>
    </div>
  );
}
