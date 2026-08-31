import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTargetLists, getTargetSpecies, getNotableObservations } from "../services/api";

const INITIAL_CHECKLIST_LIMIT = 10;

function groupBySpecies(observations) {
  const groups = new Map();
  for (const obs of observations) {
    const key = obs.speciesCode;
    if (!groups.has(key)) {
      groups.set(key, { comName: obs.comName, sciName: obs.sciName, obs: [] });
    }
    groups.get(key).obs.push(obs);
  }
  for (const group of groups.values()) {
    group.obs.sort((a, b) => (a.obsDt < b.obsDt ? 1 : -1));
    group.mostRecent = group.obs[0].obsDt;
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.mostRecent < b.mostRecent ? 1 : -1
  );
}

function formatDate(dt) {
  const d = new Date(dt.replace(" ", "T"));
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function allAboutBirdsUrl(comName) {
  const slug = comName.replace(/['']/g, "").replace(/\s+/g, "_");
  return `https://www.allaboutbirds.org/guide/${slug}/id`;
}

function SpeciesGroup({ group, isTarget }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? group.obs : group.obs.slice(0, INITIAL_CHECKLIST_LIMIT);
  const hiddenCount = group.obs.length - shown.length;

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <a
            href={allAboutBirdsUrl(group.comName)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          >
            {group.comName}
          </a>
          <p className="text-xs text-gray-400 italic">{group.sciName}</p>
        </div>
        {isTarget && (
          <span className="text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5 shrink-0">
            Target
          </span>
        )}
      </div>
      <div className="space-y-1">
        {shown.map((o, i) => {
          const row = (
            <>
              <span className="text-gray-500 tabular-nums">{formatDate(o.obsDt)}</span>
              <span className="text-gray-400">&middot;</span>
              <span>{o.locName}</span>
              {o.howMany > 1 && <span className="text-gray-500">({o.howMany})</span>}
              {o.obsReviewed === false && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  unconfirmed
                </span>
              )}
            </>
          );
          const key = `${o.subId || i}-${o.locId}-${o.obsDt}`;
          return o.subId ? (
            <a
              key={key}
              href={`https://ebird.org/checklist/${o.subId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-gray-700 hover:bg-gray-50 rounded px-1 -mx-1 flex flex-wrap items-baseline gap-x-2"
            >
              {row}
            </a>
          ) : (
            <div
              key={key}
              className="text-sm text-gray-700 flex flex-wrap items-baseline gap-x-2 px-1 -mx-1"
            >
              {row}
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Show {hiddenCount} more checklist{hiddenCount === 1 ? "" : "s"}
        </button>
      )}
      {expanded && group.obs.length > INITIAL_CHECKLIST_LIMIT && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}

export default function NotableObservationsPage() {
  const { listId } = useParams();
  const [list, setList] = useState(null);
  const [back, setBack] = useState(7);
  const [obs, setObs] = useState([]);
  const [targetCodes, setTargetCodes] = useState(new Set());
  const [onlyTargets, setOnlyTargets] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [lists, species] = await Promise.all([
          getTargetLists(),
          getTargetSpecies(listId, true),
        ]);
        setList(lists.find((l) => l.id === listId) || null);
        setTargetCodes(new Set(species.map((s) => s.species_code)));
      } catch {
        // handled silently
      }
    })();
  }, [listId]);

  useEffect(() => {
    if (!list) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNotableObservations(list.region_code, back)
      .then((data) => {
        if (!cancelled) setObs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [list, back]);

  if (!list && loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }
  if (!list) {
    return <div className="p-8 text-center text-gray-500">List not found.</div>;
  }

  const allGroups = groupBySpecies(obs);
  const groups = onlyTargets
    ? allGroups.filter((g) => targetCodes.has(g.obs[0].speciesCode))
    : allGroups;
  const targetMatchCount = allGroups.filter((g) => targetCodes.has(g.obs[0].speciesCode)).length;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={`/lists/${listId}`} className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to list
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recent Notable Observations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {list.name} &middot; {list.region_name || list.region_code}
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="back" className="text-sm text-gray-700">
            Days back:
          </label>
          <input
            id="back"
            type="number"
            min={1}
            max={30}
            value={back}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 30) setBack(v);
            }}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyTargets}
            onChange={(e) => setOnlyTargets(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Only show targets{" "}
          <span className="text-xs text-gray-400">({targetMatchCount})</span>
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading observations...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && groups.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">
          {onlyTargets && allGroups.length > 0
            ? "No target species in recent notable observations."
            : `No notable observations reported in this region in the last ${back} day${back === 1 ? "" : "s"}.`}
        </p>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map((group) => (
            <SpeciesGroup
              key={group.obs[0].speciesCode}
              group={group}
              isTarget={targetCodes.has(group.obs[0].speciesCode)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
