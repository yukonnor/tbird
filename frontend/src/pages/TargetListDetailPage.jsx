import { useState, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  bulkImportSpecies,
  addTargetSpecies,
  searchSpecies,
  markSpeciesSeen,
  markSpeciesUnseen,
  deleteTargetSpecies,
} from "../services/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function TargetListDetailPage() {
  const { list, species, reloadSpecies } = useOutletContext();
  const listId = list.id;
  const [tab, setTab] = useState("active");
  useDocumentTitle(list.name);

  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const result = await bulkImportSpecies(listId, bulkText);
      setBulkResult(result);
      setBulkText("");
      await reloadSpecies();
    } catch (err) {
      setBulkResult({ error: err.response?.data?.error || "Import failed" });
    } finally {
      setBulkLoading(false);
    }
  }

  function handleSearchInput(value) {
    setSearchQuery(value);
    clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchSpecies(value.trim());
        setSearchResults(results.slice(0, 10));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function handleAddSingle(speciesCode, comName) {
    try {
      await addTargetSpecies(listId, {
        species_code: speciesCode,
        species_common_name: comName,
      });
      setSearchQuery("");
      setSearchResults([]);
      await reloadSpecies();
    } catch {
      // handled silently — likely duplicate
    }
  }

  async function handleMarkSeen(speciesId) {
    await markSpeciesSeen(speciesId);
    await reloadSpecies();
  }

  async function handleMarkUnseen(speciesId) {
    await markSpeciesUnseen(speciesId);
    await reloadSpecies();
  }

  async function handleRemove(speciesId) {
    await deleteTargetSpecies(speciesId);
    await reloadSpecies();
  }

  const active = species.filter((s) => !s.marked_seen_at);
  const seen = species.filter((s) => s.marked_seen_at);

  return (
    <div>
      {/* Sub-tabs within Targets */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "active"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab("seen")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "seen"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Seen ({seen.length})
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "add"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Add
        </button>
      </div>

      {tab === "active" && (
        <div>
          {active.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              {species.length === 0
                ? "No targets yet. Add some from the Add tab."
                : "No active targets. Add more from the Add tab."}
            </p>
          ) : (
            <div className="space-y-1">
              {active.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded"
                >
                  <span className="text-sm text-gray-800">
                    {s.species_common_name}
                  </span>
                  <div className="flex gap-2 items-center">
                    <Link
                      to={`/lists/${listId}/species/${s.species_code}/find`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Find
                    </Link>
                    <button
                      onClick={() => handleMarkSeen(s.id)}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      Mark Seen
                    </button>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "add" && (
        <AddSpeciesForms
          bulkText={bulkText}
          setBulkText={setBulkText}
          bulkLoading={bulkLoading}
          bulkResult={bulkResult}
          handleBulkImport={handleBulkImport}
          searchQuery={searchQuery}
          handleSearchInput={handleSearchInput}
          searchResults={searchResults}
          searching={searching}
          handleAddSingle={handleAddSingle}
        />
      )}

      {tab === "seen" && (
        <div>
          {seen.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              No species marked as seen yet.
            </p>
          ) : (
            <div className="space-y-1">
              {seen.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded"
                >
                  <div>
                    <span className="text-sm text-gray-800">
                      {s.species_common_name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(s.marked_seen_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkUnseen(s.id)}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                  >
                    Mark as Target Again
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddSpeciesForms({
  bulkText,
  setBulkText,
  bulkLoading,
  bulkResult,
  handleBulkImport,
  searchQuery,
  handleSearchInput,
  searchResults,
  searching,
  handleAddSingle,
}) {
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Bulk Import Species
        </h3>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Paste species names from eBird, one per line or comma-separated"
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <button
          onClick={handleBulkImport}
          disabled={bulkLoading || !bulkText.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {bulkLoading ? "Importing..." : "Import Species"}
        </button>

        {bulkResult && !bulkResult.error && (
          <div className="mt-3 text-sm space-y-1">
            {bulkResult.added.length > 0 && (
              <p className="text-green-700">
                Added {bulkResult.added.length} species
              </p>
            )}
            {bulkResult.duplicates.length > 0 && (
              <p className="text-gray-500">
                {bulkResult.duplicates.length} already in list
              </p>
            )}
            {bulkResult.not_found.length > 0 && (
              <div className="text-amber-700">
                <p>Couldn't match {bulkResult.not_found.length} names:</p>
                <p className="text-xs mt-1">
                  {bulkResult.not_found.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
        {bulkResult?.error && (
          <p className="mt-2 text-sm text-red-600">{bulkResult.error}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Add Single Species
        </h3>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search species..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(searchResults.length > 0 || searching) && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searching && (
                <div className="px-3 py-2 text-sm text-gray-400">
                  Searching...
                </div>
              )}
              {searchResults.map((s) => (
                <button
                  key={s.speciesCode}
                  onClick={() => handleAddSingle(s.speciesCode, s.comName)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-900">{s.comName}</span>
                  <span className="text-gray-400 ml-2 text-xs">
                    {s.sciName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
