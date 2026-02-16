import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTargetLists, getTargetSpecies, deleteTargetList } from "../services/api";

export default function TargetListsPage() {
  const [lists, setLists] = useState([]);
  const [speciesCounts, setSpeciesCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    setLoading(true);
    try {
      const data = await getTargetLists();
      setLists(data);
      // Load species counts for each list
      const counts = {};
      await Promise.all(
        data.map(async (list) => {
          const species = await getTargetSpecies(list.id);
          const active = species.filter((s) => !s.marked_seen_at).length;
          const seen = species.filter((s) => s.marked_seen_at).length;
          counts[list.id] = { active, seen };
        })
      );
      setSpeciesCounts(counts);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(listId, listName) {
    if (!confirm(`Delete "${listName}" and all its species?`)) return;
    try {
      await deleteTargetList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
    } catch {
      // handled silently
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading lists...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Target Lists</h1>
        <Link
          to="/lists/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          New List
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No target lists yet.</p>
          <Link
            to="/lists/new"
            className="text-blue-600 hover:underline text-sm"
          >
            Create your first list
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const counts = speciesCounts[list.id];
            return (
              <div
                key={list.id}
                className="bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{list.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {list.region_name || list.region_code}
                  </p>
                  {counts && (
                    <p className="text-xs text-gray-400 mt-1">
                      {counts.active} targets &middot; {counts.seen} seen
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/lists/${list.id}`}
                    className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(list.id, list.name)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
