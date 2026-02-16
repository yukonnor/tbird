-- UP

ALTER TABLE users ADD COLUMN password_hash TEXT;

ALTER TABLE target_lists ADD COLUMN region_name TEXT NOT NULL DEFAULT '';

ALTER TABLE target_species RENAME COLUMN species_name TO species_common_name;
ALTER TABLE target_species DROP COLUMN spotted;
ALTER TABLE target_species DROP COLUMN spotted_at;
ALTER TABLE target_species DROP COLUMN taxonomic_order;
ALTER TABLE target_species ADD COLUMN marked_seen_at TIMESTAMPTZ;

-- DOWN

ALTER TABLE target_species DROP COLUMN marked_seen_at;
ALTER TABLE target_species ADD COLUMN taxonomic_order INTEGER;
ALTER TABLE target_species ADD COLUMN spotted_at TIMESTAMPTZ;
ALTER TABLE target_species ADD COLUMN spotted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE target_species RENAME COLUMN species_common_name TO species_name;

ALTER TABLE target_lists DROP COLUMN region_name;

ALTER TABLE users DROP COLUMN password_hash;
