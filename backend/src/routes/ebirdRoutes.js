const express = require("express");
const ebirdService = require("../services/ebirdService");

const router = express.Router();

const REGION_CODE_RE = /^[A-Z]{2}(-[A-Z0-9]{1,3}){0,2}$/;

function validateRegionCode(code) {
  return REGION_CODE_RE.test(code);
}

router.get("/observations/:regionCode", async (req, res, next) => {
  try {
    const { regionCode } = req.params;
    if (!validateRegionCode(regionCode)) {
      return res.status(400).json({ error: "Invalid region code" });
    }
    const back = parseInt(req.query.back, 10) || 14;
    const data = await ebirdService.getRecentObservations(regionCode, back);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/hotspots/:regionCode", async (req, res, next) => {
  try {
    const { regionCode } = req.params;
    if (!validateRegionCode(regionCode)) {
      return res.status(400).json({ error: "Invalid region code" });
    }
    const data = await ebirdService.getHotspots(regionCode);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/hotspot/:locId/observations", async (req, res, next) => {
  try {
    const { locId } = req.params;
    const back = parseInt(req.query.back, 10) || 14;
    const data = await ebirdService.getRecentObservationsAtHotspot(locId, back);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/species/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters" });
    }
    const data = await ebirdService.searchSpecies(q.trim());
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
