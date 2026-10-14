import { useState, useEffect, useCallback } from "react";
import { useParams, Link, NavLink, Outlet } from "react-router-dom";
import { getTargetLists, getTargetSpecies } from "../services/api";

export default function ListLayout() {
  const { listId } = useParams();
  const [list, setList] = useState(null);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadSpecies = useCallback(async () => {
    const sp = await getTargetSpecies(listId);
    setSpecies(sp);
    return sp;
  }, [listId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [lists, sp] = await Promise.all([
          getTargetLists(),
          getTargetSpecies(listId),
        ]);
        if (cancelled) return;
        setList(lists.find((l) => l.id === listId) || null);
        setSpecies(sp);
      } catch {
        // handled silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listId]);

  if (loading && !list) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!list) {
    return <div className="p-8 text-center text-gray-500">List not found.</div>;
  }

  const active = species.filter((s) => !s.marked_seen_at);
  const seen = species.filter((s) => s.marked_seen_at);
  const hasTargets = active.length > 0;

  const tabClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm rounded-md border ${
      isActive
        ? "bg-gray-900 text-white border-gray-900"
        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:text-gray-900"
    }`;

  const disabledTabClass =
    "px-3 py-1.5 text-sm rounded-md border bg-white text-gray-300 border-gray-100 cursor-not-allowed";

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/lists" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Lists
      </Link>

      <div className="mt-3 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {list.region_name || list.region_code}
          <span className="text-gray-300 mx-2">·</span>
          {active.length} target{active.length === 1 ? "" : "s"}
          <span className="text-gray-300 mx-2">·</span>
          {seen.length} seen
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <NavLink to={`/lists/${listId}`} end className={tabClass}>
          Targets
        </NavLink>
        {hasTargets ? (
          <NavLink to={`/lists/${listId}/find`} className={tabClass}>
            Where to Find
          </NavLink>
        ) : (
          <span className={disabledTabClass} title="Add targets to use this view">
            Where to Find
          </span>
        )}
        {hasTargets ? (
          <NavLink to={`/lists/${listId}/target-observations`} className={tabClass}>
            Target Sightings
          </NavLink>
        ) : (
          <span className={disabledTabClass} title="Add targets to use this view">
            Target Sightings
          </span>
        )}
        <NavLink to={`/lists/${listId}/notable`} className={tabClass}>
          Notable
        </NavLink>
      </div>

      <Outlet context={{ list, species, reloadSpecies }} />
    </div>
  );
}
