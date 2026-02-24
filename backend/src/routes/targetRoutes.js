const express = require("express");
const pool = require("../../db/pool");
const { auth } = require("../middleware/auth");
const { matchSpeciesName } = require("../services/ebirdService");
const {
  findTargetsAtHotspots,
  findHotspotsForSpecies,
} = require("../services/targetFinderService");

const router = express.Router();

router.use(auth);

// GET /api/targets/lists
router.get("/lists", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, region_code, region_name, created_at, updated_at FROM target_lists WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/targets/lists
router.post("/lists", async (req, res, next) => {
  try {
    const { name, region_code, region_name } = req.body;
    if (!name || !region_code) {
      return res.status(400).json({ error: "name and region_code are required" });
    }
    const { rows } = await pool.query(
      "INSERT INTO target_lists (user_id, name, region_code, region_name) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.id, name, region_code, region_name || ""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/targets/lists/:listId
router.delete("/lists/:listId", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM target_lists WHERE id = $1 AND user_id = $2",
      [req.params.listId, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "List not found" });
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/targets/lists/:listId/species
router.get("/lists/:listId/species", async (req, res, next) => {
  try {
    // Verify list belongs to user
    const list = await pool.query(
      "SELECT id FROM target_lists WHERE id = $1 AND user_id = $2",
      [req.params.listId, req.user.id]
    );
    if (list.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    let query =
      "SELECT id, species_code, species_common_name, marked_seen_at, created_at FROM target_species WHERE target_list_id = $1";
    const params = [req.params.listId];

    if (req.query.active_only === "true") {
      query += " AND marked_seen_at IS NULL";
    }

    query += " ORDER BY created_at";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/targets/lists/:listId/species
router.post("/lists/:listId/species", async (req, res, next) => {
  try {
    const { species_code, species_common_name } = req.body;
    if (!species_code || !species_common_name) {
      return res
        .status(400)
        .json({ error: "species_code and species_common_name are required" });
    }

    // Verify list belongs to user
    const list = await pool.query(
      "SELECT id FROM target_lists WHERE id = $1 AND user_id = $2",
      [req.params.listId, req.user.id]
    );
    if (list.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const { rows } = await pool.query(
      "INSERT INTO target_species (target_list_id, species_code, species_common_name) VALUES ($1, $2, $3) RETURNING *",
      [req.params.listId, species_code, species_common_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Species already in list" });
    }
    next(err);
  }
});

// POST /api/targets/lists/:listId/species/bulk
router.post("/lists/:listId/species/bulk", async (req, res, next) => {
  try {
    const { species_names } = req.body;
    if (!species_names || typeof species_names !== "string") {
      return res.status(400).json({ error: "species_names string is required" });
    }

    // Verify list belongs to user
    const list = await pool.query(
      "SELECT id FROM target_lists WHERE id = $1 AND user_id = $2",
      [req.params.listId, req.user.id]
    );
    if (list.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    // Parse and clean names
    const raw = species_names
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "")) // "1. Barn Swallow" or "1) Barn Swallow"
      .map((s) => s.replace(/\d+(\.\d+)?%/g, "")) // percentages
      .map((s) => s.replace(/\b(Map|frequency|Frequency)\b/gi, ""))
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    const added = [];
    const not_found = [];
    const duplicates = [];

    for (const name of raw) {
      const match = await matchSpeciesName(name);
      if (!match) {
        not_found.push(name);
        continue;
      }
      try {
        await pool.query(
          "INSERT INTO target_species (target_list_id, species_code, species_common_name) VALUES ($1, $2, $3)",
          [req.params.listId, match.speciesCode, match.comName]
        );
        added.push(match.comName);
      } catch (err) {
        if (err.code === "23505") {
          duplicates.push(match.comName);
        } else {
          throw err;
        }
      }
    }

    res.json({ added, not_found, duplicates });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/targets/species/:speciesId
router.delete("/species/:speciesId", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM target_species
       WHERE id = $1 AND target_list_id IN (SELECT id FROM target_lists WHERE user_id = $2)`,
      [req.params.speciesId, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Species not found" });
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/targets/species/:speciesId/seen
router.patch("/species/:speciesId/seen", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE target_species SET marked_seen_at = now()
       WHERE id = $1 AND target_list_id IN (SELECT id FROM target_lists WHERE user_id = $2)
       RETURNING *`,
      [req.params.speciesId, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Species not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/targets/species/:speciesId/unseen
router.patch("/species/:speciesId/unseen", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE target_species SET marked_seen_at = NULL
       WHERE id = $1 AND target_list_id IN (SELECT id FROM target_lists WHERE user_id = $2)
       RETURNING *`,
      [req.params.speciesId, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Species not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/targets/lists/:listId/hotspots
router.get("/lists/:listId/hotspots", async (req, res, next) => {
  try {
    // Verify list belongs to user
    const list = await pool.query(
      "SELECT id FROM target_lists WHERE id = $1 AND user_id = $2",
      [req.params.listId, req.user.id]
    );
    if (list.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const daysBack = parseInt(req.query.days_back) || 14;
    const result = await findTargetsAtHotspots(req.params.listId, daysBack);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/targets/lists/:listId/species/:speciesCode/hotspots
router.get(
  "/lists/:listId/species/:speciesCode/hotspots",
  async (req, res, next) => {
    try {
      // Verify list belongs to user
      const list = await pool.query(
        "SELECT id FROM target_lists WHERE id = $1 AND user_id = $2",
        [req.params.listId, req.user.id]
      );
      if (list.rows.length === 0) {
        return res.status(404).json({ error: "List not found" });
      }

      const daysBack = parseInt(req.query.days_back) || 14;
      const result = await findHotspotsForSpecies(
        req.params.listId,
        req.params.speciesCode,
        daysBack
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
