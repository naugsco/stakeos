CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lcr_member_id TEXT NOT NULL UNIQUE,
  unit_id INTEGER,
  unit_number TEXT NOT NULL,
  unit_name TEXT,
  unit_abbreviation TEXT,
  preferred_name TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  birthdate TEXT,
  age INTEGER,
  member_status TEXT,
  baptism_date TEXT,
  temple_endowed INTEGER,
  temple_recommend_status TEXT,
  temple_recommend_expiration_date TEXT,
  mission_status TEXT,
  mission_country TEXT,
  is_returned_missionary INTEGER,
  is_attending_seminary INTEGER,
  is_attending_institute INTEGER,
  has_ministering_brothers INTEGER,
  has_ministering_sisters INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_members_unit_id ON members(unit_id);
CREATE INDEX IF NOT EXISTS idx_members_baptism_date ON members(baptism_date);
CREATE INDEX IF NOT EXISTS idx_members_recommend_expiration ON members(temple_recommend_expiration_date);

CREATE TABLE IF NOT EXISTS callings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lcr_calling_id TEXT NOT NULL UNIQUE,
  unit_number TEXT NOT NULL,
  unit_name TEXT,
  lcr_member_id TEXT,
  title TEXT NOT NULL,
  is_current INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_callings_unit_number ON callings(unit_number);
CREATE INDEX IF NOT EXISTS idx_callings_is_current ON callings(is_current);

CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  records_processed INTEGER,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
