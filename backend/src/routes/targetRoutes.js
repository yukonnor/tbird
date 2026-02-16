const express = require("express");
const pool = require("../../db/pool");
const { auth } = require("../middleware/auth");

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

module.exports = router;
