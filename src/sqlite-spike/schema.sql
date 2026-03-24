CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS households (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lcr_household_id TEXT NOT NULL UNIQUE,
  unit_number TEXT NOT NULL,
  household_name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_households_unit_number ON households(unit_number);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lcr_member_id TEXT NOT NULL UNIQUE,
  unit_id INTEGER,
  household_id INTEGER,
  lcr_household_id TEXT,
  unit_number TEXT NOT NULL,
  unit_name TEXT,
  unit_abbreviation TEXT,
  preferred_name TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_or_province TEXT,
  postal_code TEXT,
  country TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  birthdate TEXT,
  birth_country TEXT,
  birthplace TEXT,
  age INTEGER,
  member_status TEXT,
  move_in_date TEXT,
  is_convert INTEGER,
  baptism_date TEXT,
  confirmation_date TEXT,
  endowment_date TEXT,
  endowment_status TEXT,
  temple_endowed INTEGER,
  temple_recommend_status TEXT,
  temple_recommend_expiration_date TEXT,
  temple_recommend_type TEXT,
  mission_status TEXT,
  mission_language TEXT,
  mission_country TEXT,
  is_returned_missionary INTEGER,
  is_accountable INTEGER,
  is_born_in_covenant INTEGER,
  is_divorced INTEGER,
  is_married INTEGER,
  marriage_date TEXT,
  marriage_status TEXT,
  is_attending_seminary INTEGER,
  is_attending_institute INTEGER,
  potential_institute_student INTEGER,
  potential_seminary_student INTEGER,
  has_ministering_brothers INTEGER,
  has_ministering_sisters INTEGER,
  ministering_brothers TEXT,
  ministering_sisters TEXT,
  spouse_name TEXT,
  head_of_house TEXT,
  household_position TEXT,
  sealing_to_parents TEXT,
  sealing_to_spouse TEXT,
  priesthood_type TEXT,
  priesthood_office TEXT,
  ordination_date TEXT,
  institute_status TEXT,
  seminary_status TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL
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
  lcr_organization_id TEXT,
  organization_name TEXT,
  title TEXT NOT NULL,
  sustained_on TEXT,
  set_apart_on TEXT,
  released_on TEXT,
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
