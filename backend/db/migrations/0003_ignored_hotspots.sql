-- UP

CREATE TABLE ignored_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loc_id TEXT NOT NULL,
  loc_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, loc_id)
);

CREATE INDEX idx_ignored_hotspots_user_id ON ignored_hotspots(user_id);

-- DOWN

DROP TABLE IF EXISTS ignored_hotspots;
