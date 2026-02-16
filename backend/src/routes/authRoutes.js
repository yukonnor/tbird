const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../../db/pool");
const { auth, signToken } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 10;

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, display_name, created_at",
      [email.toLowerCase(), passwordHash]
    );

    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { rows } = await pool.query(
      "SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, display_name, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
