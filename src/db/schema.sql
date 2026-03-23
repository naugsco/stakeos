CREATE TABLE IF NOT EXISTS units (
  id BIGSERIAL PRIMARY KEY,
  unit_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS households (
  id BIGSERIAL PRIMARY KEY,
  lcr_household_id TEXT UNIQUE NOT NULL,
  unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
  household_name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  lcr_member_id TEXT UNIQUE NOT NULL,
  household_id BIGINT REFERENCES households(id) ON DELETE SET NULL,
  unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
  unit_name TEXT,
  unit_abbreviation TEXT,
  preferred_name TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  address_city TEXT,
  address_state_or_province TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  gender TEXT,
  birthdate DATE,
  birth_country TEXT,
  birthplace TEXT,
  age INTEGER,
  member_status TEXT,
  move_in_date DATE,
  is_convert BOOLEAN DEFAULT FALSE,
  is_widowed BOOLEAN,
  is_returned_missionary BOOLEAN,
  is_accountable BOOLEAN,
  is_born_in_covenant BOOLEAN,
  is_divorced BOOLEAN,
  is_married BOOLEAN,
  has_children BOOLEAN,
  is_sealed_to_parents BOOLEAN,
  is_single BOOLEAN,
  is_sealed_to_spouse BOOLEAN,
  is_sealed_to_current_spouse BOOLEAN,
  is_sealed_to_prior_spouse BOOLEAN,
  baptism_date DATE,
  confirmation_date DATE,
  endowment_date DATE,
  temple_endowed BOOLEAN,
  endowment_status TEXT,
  temple_recommend_status TEXT,
  temple_recommend_expiration_date DATE,
  temple_recommend_type TEXT,
  mission_status TEXT,
  mission_language TEXT,
  mission_country TEXT,
  priesthood TEXT,
  priesthood_office TEXT,
  callings_text TEXT,
  callings_with_dates_text TEXT,
  institute_status TEXT,
  seminary_status TEXT,
  is_attending_seminary BOOLEAN,
  is_attending_institute BOOLEAN,
  potential_institute_student BOOLEAN,
  potential_seminary_student BOOLEAN,
  has_ministering_sisters BOOLEAN,
  has_ministering_brothers BOOLEAN,
  ministering_brothers TEXT,
  ministering_sisters TEXT,
  ordination_date DATE,
  marriage_date DATE,
  marriage_status TEXT,
  sealing_to_parents TEXT,
  sealing_to_spouse TEXT,
  spouse_name TEXT,
  head_of_house TEXT,
  household_position TEXT,
  profile_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  lcr_organization_id TEXT UNIQUE NOT NULL,
  unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  parent_organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS callings (
  id BIGSERIAL PRIMARY KEY,
  lcr_calling_id TEXT UNIQUE NOT NULL,
  unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  standard_name TEXT,
  sustained_on DATE,
  set_apart_on DATE,
  released_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS priesthood (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  current_office TEXT,
  office_date DATE,
  melchizedek_priesthood_date DATE,
  aaronic_priesthood_date DATE,
  ordained_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emails (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, email)
);

CREATE TABLE IF NOT EXISTS phone_numbers (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
  household_id BIGINT REFERENCES households(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_type TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  can_text BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, phone_number)
);

CREATE TABLE IF NOT EXISTS meeting_assignments (
  id BIGSERIAL PRIMARY KEY,
  assignment_key TEXT UNIQUE NOT NULL,
  unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
  meeting_name TEXT NOT NULL,
  meeting_date DATE,
  member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  calling_id BIGINT REFERENCES callings(id) ON DELETE SET NULL,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  assignment_type TEXT,
  notes TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGSERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS member_status_history (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  lcr_member_id TEXT NOT NULL,
  sync_log_id BIGINT REFERENCES sync_logs(id) ON DELETE SET NULL,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unit_name TEXT,
  temple_recommend_status TEXT,
  mission_status TEXT,
  temple_endowed BOOLEAN,
  is_attending_seminary BOOLEAN,
  is_attending_institute BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, sync_log_id)
);

CREATE TABLE IF NOT EXISTS sync_member_snapshots (
  id BIGSERIAL PRIMARY KEY,
  sync_log_id BIGINT NOT NULL REFERENCES sync_logs(id) ON DELETE CASCADE,
  lcr_member_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  unit_name TEXT,
  move_in_date DATE,
  row_hash TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sync_log_id, lcr_member_id)
);

CREATE TABLE IF NOT EXISTS sync_calling_snapshots (
  id BIGSERIAL PRIMARY KEY,
  sync_log_id BIGINT NOT NULL REFERENCES sync_logs(id) ON DELETE CASCADE,
  lcr_calling_id TEXT NOT NULL,
  unit_name TEXT,
  member_lcr_member_id TEXT,
  member_name TEXT,
  calling_title TEXT NOT NULL,
  is_current BOOLEAN NOT NULL,
  sustained_on DATE,
  released_on DATE,
  row_hash TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sync_log_id, lcr_calling_id)
);

CREATE TABLE IF NOT EXISTS sync_email_snapshots (
  id BIGSERIAL PRIMARY KEY,
  sync_log_id BIGINT NOT NULL REFERENCES sync_logs(id) ON DELETE CASCADE,
  member_lcr_member_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  unit_name TEXT,
  email TEXT NOT NULL,
  row_hash TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sync_log_id, member_lcr_member_id, email)
);

CREATE TABLE IF NOT EXISTS sync_phone_snapshots (
  id BIGSERIAL PRIMARY KEY,
  sync_log_id BIGINT NOT NULL REFERENCES sync_logs(id) ON DELETE CASCADE,
  member_lcr_member_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  unit_name TEXT,
  phone_number TEXT NOT NULL,
  row_hash TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sync_log_id, member_lcr_member_id, phone_number)
);

ALTER TABLE members ADD COLUMN IF NOT EXISTS unit_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS unit_abbreviation TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_state_or_province TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_postal_code TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address_country TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_country TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birthplace TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS move_in_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_widowed BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_returned_missionary BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_accountable BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_born_in_covenant BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_divorced BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_married BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_children BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_sealed_to_parents BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_single BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_sealed_to_spouse BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_sealed_to_current_spouse BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_sealed_to_prior_spouse BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS endowment_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS endowment_status TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS temple_recommend_status TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS temple_recommend_expiration_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS temple_recommend_type TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS mission_language TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS mission_country TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS priesthood TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS priesthood_office TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS callings_text TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS callings_with_dates_text TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS institute_status TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS seminary_status TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_attending_seminary BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_attending_institute BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS potential_institute_student BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS potential_seminary_student BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_ministering_sisters BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_ministering_brothers BOOLEAN;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ministering_brothers TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ministering_sisters TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS ordination_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS marriage_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS marriage_status TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS sealing_to_parents TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS sealing_to_spouse TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS spouse_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS head_of_house TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS household_position TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_data JSONB;

CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_birthdate ON members(birthdate);
CREATE INDEX IF NOT EXISTS idx_members_profile_data ON members USING GIN(profile_data);
CREATE INDEX IF NOT EXISTS idx_callings_member_id ON callings(member_id);
CREATE INDEX IF NOT EXISTS idx_callings_org_id ON callings(organization_id);
CREATE INDEX IF NOT EXISTS idx_callings_is_current ON callings(is_current);
CREATE INDEX IF NOT EXISTS idx_emails_member_id ON emails(member_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_member_id ON phone_numbers(member_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_member_status_history_member_id ON member_status_history(member_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_status_history_snapshot_at ON member_status_history(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_member_snapshots_log ON sync_member_snapshots(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_sync_member_snapshots_member ON sync_member_snapshots(lcr_member_id);
CREATE INDEX IF NOT EXISTS idx_sync_calling_snapshots_log ON sync_calling_snapshots(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_sync_calling_snapshots_calling ON sync_calling_snapshots(lcr_calling_id);
CREATE INDEX IF NOT EXISTS idx_sync_email_snapshots_log ON sync_email_snapshots(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_sync_email_snapshots_member ON sync_email_snapshots(member_lcr_member_id);
CREATE INDEX IF NOT EXISTS idx_sync_phone_snapshots_log ON sync_phone_snapshots(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_sync_phone_snapshots_member ON sync_phone_snapshots(member_lcr_member_id);

CREATE OR REPLACE VIEW current_callings AS
SELECT c.*
FROM callings c
WHERE c.is_current = TRUE
  AND c.released_on IS NULL;

CREATE OR REPLACE VIEW current_callings_dedup AS
WITH ranked AS (
  SELECT
    c.*,
    ROW_NUMBER() OVER (
      PARTITION BY
        COALESCE(c.member_id, -1),
        COALESCE(c.unit_id, -1),
        BTRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                LOWER(c.title),
                '(\\d{1,2}\\s+[a-z]{3,9}\\s+\\d{4}|\\d{1,2}/\\d{1,2}/\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|yes|no|sustain(?:ed)?|set\\s*apart)',
                ' ',
                'gi'
              ),
              '[^a-z0-9]+',
              ' ',
              'g'
            ),
            '\\s+',
            ' ',
            'g'
          )
        )
      ORDER BY
        (c.sustained_on IS NOT NULL) DESC,
        (c.set_apart_on IS NOT NULL) DESC,
        LENGTH(c.title) ASC,
        c.updated_at DESC,
        c.id DESC
    ) AS rank_num
  FROM current_callings c
)
SELECT
  id,
  lcr_calling_id,
  unit_id,
  member_id,
  organization_id,
  title,
  standard_name,
  sustained_on,
  set_apart_on,
  released_on,
  is_current,
  created_at,
  updated_at
FROM ranked
WHERE rank_num = 1;
