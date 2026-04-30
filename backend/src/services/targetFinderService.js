const pool = require("../../db/pool");
const { getRecentObservations, getHotspots, getRecentObservationsAtHotspot } = require("./ebirdService");

async function findTargetsAtHotspots(targetListId, userId, daysBack = 14) {
  // Get active target species for this list
  const { rows: targets } = await pool.query(
    "SELECT species_code, species_common_name FROM target_species WHERE target_list_id = $1 AND marked_seen_at IS NULL",
    [targetListId]
  );

  if (targets.length === 0) {
    return { hotspots: [], targetCount: 0 };
  }

  // Get the region code from the target list
  const { rows: listRows } = await pool.query(
    "SELECT region_code FROM target_lists WHERE id = $1",
    [targetListId]
  );

  if (listRows.length === 0) {
    throw new Error("Target list not found");
  }

  const regionCode = listRows[0].region_code;

  const { rows: ignoredRows } = await pool.query(
    "SELECT loc_id FROM ignored_hotspots WHERE user_id = $1",
    [userId]
  );
  const ignoredLocIds = new Set(ignoredRows.map((r) => r.loc_id));

  const targetCodes = new Set(targets.map((t) => t.species_code));
  const targetNameMap = Object.fromEntries(
    targets.map((t) => [t.species_code, t.species_common_name])
  );

  // Fetch recent observations and hotspots in parallel
  const [observations, hotspotList] = await Promise.all([
    getRecentObservations(regionCode, daysBack),
    getHotspots(regionCode),
  ]);

  // Build hotspot lookup
  const hotspotMap = Object.fromEntries(
    hotspotList.map((h) => [h.locId, h])
  );

  // For each observation, if it's a target species at a hotspot, track it
  const hotspotTargets = {}; // locId -> { species: { code -> { name, date } } }

  for (const obs of observations) {
    if (!targetCodes.has(obs.speciesCode)) continue;
    if (!obs.locId) continue;

    if (!hotspotTargets[obs.locId]) {
      hotspotTargets[obs.locId] = {};
    }

    const existing = hotspotTargets[obs.locId][obs.speciesCode];
    const obsDate = obs.obsDt;

    // Keep the most recent observation date
    if (!existing || obsDate > existing.date) {
      hotspotTargets[obs.locId][obs.speciesCode] = {
        name: targetNameMap[obs.speciesCode] || obs.comName,
        date: obsDate,
      };
    }
  }

  // Enrich each hotspot that appeared in results with a per-hotspot call,
  // which catches additional target species the regional API may have omitted.
  const relevantLocIds = Object.keys(hotspotTargets);
  if (relevantLocIds.length > 0) {
    const perHotspotResults = await Promise.all(
      relevantLocIds.map((locId) =>
        getRecentObservationsAtHotspot(locId, daysBack)
          .then((obs) => ({ locId, obs }))
          .catch(() => ({ locId, obs: [] }))
      )
    );

    for (const { locId, obs } of perHotspotResults) {
      for (const observation of obs) {
        if (!targetCodes.has(observation.speciesCode)) continue;
        const existing = hotspotTargets[locId][observation.speciesCode];
        const obsDate = observation.obsDt;
        if (!existing || obsDate > existing.date) {
          hotspotTargets[locId][observation.speciesCode] = {
            name: targetNameMap[observation.speciesCode] || observation.comName,
            date: obsDate,
          };
        }
      }
    }
  }

  // Build ranked hotspot list
  const rankedHotspots = Object.entries(hotspotTargets)
    .map(([locId, speciesMap]) => {
      const hotspot = hotspotMap[locId];
      const speciesList = Object.entries(speciesMap).map(
        ([code, { name, date }]) => ({
          speciesCode: code,
          name,
          date,
        })
      );

      // Sort species by most recent date
      speciesList.sort((a, b) => b.date.localeCompare(a.date));

      const mostRecentDate = speciesList[0]?.date || null;

      return {
        locId,
        name: hotspot?.locName || locId,
        lat: hotspot?.lat || null,
        lng: hotspot?.lng || null,
        targetCount: speciesList.length,
        mostRecentDate,
        species: speciesList,
        ebirdUrl: `https://ebird.org/hotspot/${locId}`,
        mapsUrl:
          hotspot?.lat && hotspot?.lng
            ? `https://www.google.com/maps?q=${hotspot.lat},${hotspot.lng}`
            : null,
      };
    })
    // Rank by target count desc, then most recent date desc
    .sort((a, b) => {
      if (b.targetCount !== a.targetCount)
        return b.targetCount - a.targetCount;
      return (b.mostRecentDate || "").localeCompare(a.mostRecentDate || "");
    });

  const visibleHotspots = rankedHotspots.filter((h) => !ignoredLocIds.has(h.locId));

  return {
    hotspots: visibleHotspots,
    targetCount: targets.length,
    hiddenCount: rankedHotspots.length - visibleHotspots.length,
  };
}

module.exports = { findTargetsAtHotspots };
