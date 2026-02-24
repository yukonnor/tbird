const pool = require("../../db/pool");
const { getRecentObservations, getHotspots } = require("./ebirdService");

async function findTargetsAtHotspots(targetListId, daysBack = 14) {
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

  return {
    hotspots: rankedHotspots,
    targetCount: targets.length,
  };
}

async function findHotspotsForSpecies(
  targetListId,
  speciesCode,
  daysBack = 14
) {
  // Verify species is in the list and get its name
  const { rows: speciesRows } = await pool.query(
    "SELECT species_code, species_common_name FROM target_species WHERE target_list_id = $1 AND species_code = $2",
    [targetListId, speciesCode]
  );

  if (speciesRows.length === 0) {
    throw new Error("Species not found in this list");
  }

  const speciesName = speciesRows[0].species_common_name;

  // Get the region code
  const { rows: listRows } = await pool.query(
    "SELECT region_code FROM target_lists WHERE id = $1",
    [targetListId]
  );

  if (listRows.length === 0) {
    throw new Error("Target list not found");
  }

  const regionCode = listRows[0].region_code;

  const [observations, hotspotList] = await Promise.all([
    getRecentObservations(regionCode, daysBack),
    getHotspots(regionCode),
  ]);

  const hotspotMap = Object.fromEntries(
    hotspotList.map((h) => [h.locId, h])
  );

  // Filter observations to just this species
  const hotspotDates = {}; // locId -> most recent date

  for (const obs of observations) {
    if (obs.speciesCode !== speciesCode) continue;
    if (!obs.locId) continue;

    if (!hotspotDates[obs.locId] || obs.obsDt > hotspotDates[obs.locId]) {
      hotspotDates[obs.locId] = obs.obsDt;
    }
  }

  const rankedHotspots = Object.entries(hotspotDates)
    .map(([locId, date]) => {
      const hotspot = hotspotMap[locId];
      return {
        locId,
        name: hotspot?.locName || locId,
        lat: hotspot?.lat || null,
        lng: hotspot?.lng || null,
        mostRecentDate: date,
        ebirdUrl: `https://ebird.org/hotspot/${locId}`,
        mapsUrl:
          hotspot?.lat && hotspot?.lng
            ? `https://www.google.com/maps?q=${hotspot.lat},${hotspot.lng}`
            : null,
      };
    })
    .sort((a, b) =>
      (b.mostRecentDate || "").localeCompare(a.mostRecentDate || "")
    );

  return {
    speciesCode,
    speciesName,
    hotspots: rankedHotspots,
  };
}

module.exports = { findTargetsAtHotspots, findHotspotsForSpecies };
