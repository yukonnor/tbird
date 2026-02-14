-- UP

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE target_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_target_lists_user_id ON target_lists (user_id);
CREATE INDEX idx_target_lists_region_code ON target_lists (region_code);

CREATE TABLE target_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_list_id UUID NOT NULL REFERENCES target_lists (id) ON DELETE CASCADE,
  species_code TEXT NOT NULL,
  species_name TEXT NOT NULL,
  taxonomic_order INTEGER,
  spotted BOOLEAN NOT NULL DEFAULT false,
  spotted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_list_id, species_code)
);

CREATE INDEX idx_target_species_target_list_id ON target_species (target_list_id);
CREATE INDEX idx_target_species_species_code ON target_species (species_code);

-- DOWN

DROP TABLE IF EXISTS target_species;
DROP TABLE IF EXISTS target_lists;
DROP TABLE IF EXISTS users;
