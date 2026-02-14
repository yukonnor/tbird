require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./pool");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

function parseMigration(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const upMatch = content.indexOf("-- UP");
  const downMatch = content.indexOf("-- DOWN");

  if (upMatch === -1 || downMatch === -1) {
    throw new Error(`Migration ${filePath} missing -- UP or -- DOWN delimiter`);
  }

  const up = content.slice(upMatch + "-- UP".length, downMatch).trim();
  const down = content.slice(downMatch + "-- DOWN".length).trim();
  return { up, down };
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function getAppliedVersions() {
  const { rows } = await pool.query(
    "SELECT version FROM schema_migrations ORDER BY version"
  );
  return rows.map((r) => r.version);
}

async function up() {
  await ensureMigrationsTable();
  const applied = await getAppliedVersions();
  const files = getMigrationFiles();
  const pending = files.filter((f) => !applied.includes(f));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const file of pending) {
    const { up: sql } = parseMigration(path.join(MIGRATIONS_DIR, file));
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`Applied: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed: ${file}`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }
}

async function down() {
  await ensureMigrationsTable();
  const applied = await getAppliedVersions();

  if (applied.length === 0) {
    console.log("No migrations to roll back.");
    return;
  }

  const last = applied[applied.length - 1];
  const { down: sql } = parseMigration(path.join(MIGRATIONS_DIR, last));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("DELETE FROM schema_migrations WHERE version = $1", [
      last,
    ]);
    await client.query("COMMIT");
    console.log(`Rolled back: ${last}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`Rollback failed: ${last}`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function reset() {
  await ensureMigrationsTable();
  const applied = await getAppliedVersions();

  for (let i = applied.length - 1; i >= 0; i--) {
    const file = applied[i];
    const { down: sql } = parseMigration(path.join(MIGRATIONS_DIR, file));
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("DELETE FROM schema_migrations WHERE version = $1", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`Rolled back: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Rollback failed: ${file}`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  await up();
}

const command = process.argv[2];

(async () => {
  try {
    switch (command) {
      case "up":
        await up();
        break;
      case "down":
        await down();
        break;
      case "reset":
        await reset();
        break;
      default:
        console.log("Usage: node db/setup.js up|down|reset");
        process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
