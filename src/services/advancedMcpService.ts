import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/src/config/env";
import { query } from "@/src/db/pool";
import { ensureMailer } from "@/src/email/mailer";
import {
  getCallingMembers,
  getCommitteeContactList,
  getEndowmentReadinessContactList,
  getLeadershipContactList,
  getLeadershipTenureReport,
  getMissionReadinessContactList,
  getMissingContactDataList,
  getNewMemberContactList,
  getOrganizationContactList,
  getYouthHouseholdContactList,
  getVacancies
} from "@/src/services/intelligenceService";

const fullNameExpr = `TRIM(CONCAT(m.first_name, ' ', m.last_name))`;
const cohortsFilePath = path.join(process.cwd(), ".run", "saved-cohorts.json");
const approvalGatesFilePath = path.join(process.cwd(), ".run", "approval-gates.json");

type SortDirection = "asc" | "desc";

export interface PeopleContactQueryInput {
  unit?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  calling?: string;
  organization?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  isConvert?: boolean;
  isReturnedMissionary?: boolean;
  templeRecommendStatus?: string;
  isAttendingSeminary?: boolean;
  isAttendingInstitute?: boolean;
  search?: string;
  sortBy?: "unit" | "age" | "name" | "calling";
  sortDirection?: SortDirection;
  limit?: number;
}

export interface PeopleContactQueryRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  gender: string | null;
  phoneNumber: string | null;
  email: string | null;
  currentCalling: string | null;
  organizationName: string | null;
  missionStatus: string | null;
  templeRecommendStatus: string | null;
  isAttendingSeminary: boolean | null;
  isAttendingInstitute: boolean | null;
  isConvert: boolean | null;
  isReturnedMissionary: boolean | null;
  moveInDate: string | null;
}

export interface SavedCohort {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  query: PeopleContactQueryInput;
  createdAt: string;
  updatedAt: string;
}

interface CampaignResolvedRecipients {
  emails: string[];
  phones: string[];
  lcrMemberIds: string[];
}

interface ApprovalGateRecord {
  id: string;
  actionType: string;
  payloadHash: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  metadata?: Record<string, unknown>;
}

const dedupeStrings = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map((value) => (value ?? "").trim()).filter(Boolean)));

const cleanCallingTitle = (value: string | null) => {
  if (!value) {
    return null;
  }
  return value
    .replace(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g, " ")
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\/\s*(yes|no)(?=[A-Z]|\b|$)/gi, " ")
    .replace(/\b(set\s*apart|sustain(?:ed)?)\b/gi, " ")
    .replace(/\bwith\s+date\b/gi, " ")
    .replace(/[^A-Za-z0-9 '&,.\-()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const ensureCohortStore = async () => {
  await fs.mkdir(path.dirname(cohortsFilePath), { recursive: true });
  try {
    await fs.access(cohortsFilePath);
  } catch {
    await fs.writeFile(cohortsFilePath, JSON.stringify({ cohorts: [] }, null, 2), "utf8");
  }
};

const ensureApprovalStore = async () => {
  await fs.mkdir(path.dirname(approvalGatesFilePath), { recursive: true });
  try {
    await fs.access(approvalGatesFilePath);
  } catch {
    await fs.writeFile(approvalGatesFilePath, JSON.stringify({ approvals: [] }, null, 2), "utf8");
  }
};

const loadApprovalGates = async (): Promise<ApprovalGateRecord[]> => {
  await ensureApprovalStore();
  const raw = await fs.readFile(approvalGatesFilePath, "utf8");
  const parsed = JSON.parse(raw) as { approvals?: ApprovalGateRecord[] };
  return Array.isArray(parsed.approvals) ? parsed.approvals : [];
};

const saveApprovalGates = async (approvals: ApprovalGateRecord[]) => {
  await ensureApprovalStore();
  await fs.writeFile(approvalGatesFilePath, JSON.stringify({ approvals }, null, 2), "utf8");
};

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
};

const approvalHash = (actionType: string, payload: unknown) =>
  createHash("sha256").update(`${actionType}:${stableStringify(payload)}`).digest("hex");

const loadCohorts = async (): Promise<SavedCohort[]> => {
  await ensureCohortStore();
  const raw = await fs.readFile(cohortsFilePath, "utf8");
  const parsed = JSON.parse(raw) as { cohorts?: SavedCohort[] };
  return Array.isArray(parsed.cohorts) ? parsed.cohorts : [];
};

const saveCohorts = async (cohorts: SavedCohort[]) => {
  await ensureCohortStore();
  await fs.writeFile(cohortsFilePath, JSON.stringify({ cohorts }, null, 2), "utf8");
};

const parseBool = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "0"].includes(normalized)) {
    return false;
  }
  return undefined;
};

export const peopleContactQuery = async (input: PeopleContactQueryInput = {}): Promise<PeopleContactQueryRow[]> => {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (input.unit?.trim()) {
    const p = addParam(`%${input.unit.trim()}%`);
    conditions.push(`COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE ${p}`);
  }
  if (typeof input.ageMin === "number") {
    const p = addParam(input.ageMin);
    conditions.push(`COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) >= ${p}`);
  }
  if (typeof input.ageMax === "number") {
    const p = addParam(input.ageMax);
    conditions.push(`COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) <= ${p}`);
  }
  if (input.gender?.trim()) {
    const p = addParam(`%${input.gender.trim()}%`);
    conditions.push(`COALESCE(m.gender, '') ILIKE ${p}`);
  }
  if (input.calling?.trim()) {
    const p = addParam(`%${input.calling.trim()}%`);
    conditions.push(`COALESCE(c.title, '') ILIKE ${p}`);
  }
  if (input.organization?.trim()) {
    const p = addParam(`%${input.organization.trim()}%`);
    conditions.push(`COALESCE(o.name, '') ILIKE ${p}`);
  }

  const hasPhone = parseBool(input.hasPhone);
  const hasEmail = parseBool(input.hasEmail);
  const isConvert = parseBool(input.isConvert);
  const isReturnedMissionary = parseBool(input.isReturnedMissionary);
  const seminary = parseBool(input.isAttendingSeminary);
  const institute = parseBool(input.isAttendingInstitute);

  if (hasPhone === true) {
    conditions.push("p.phone_number IS NOT NULL");
  } else if (hasPhone === false) {
    conditions.push("p.phone_number IS NULL");
  }

  if (hasEmail === true) {
    conditions.push("e.email IS NOT NULL");
  } else if (hasEmail === false) {
    conditions.push("e.email IS NULL");
  }

  if (typeof isConvert === "boolean") {
    const p = addParam(isConvert);
    conditions.push(`COALESCE(m.is_convert, false) = ${p}`);
  }

  if (typeof isReturnedMissionary === "boolean") {
    const p = addParam(isReturnedMissionary);
    conditions.push(`COALESCE(m.is_returned_missionary, false) = ${p}`);
  }

  if (typeof seminary === "boolean") {
    const p = addParam(seminary);
    conditions.push(`COALESCE(m.is_attending_seminary, false) = ${p}`);
  }

  if (typeof institute === "boolean") {
    const p = addParam(institute);
    conditions.push(`COALESCE(m.is_attending_institute, false) = ${p}`);
  }

  if (input.templeRecommendStatus?.trim()) {
    const p = addParam(`%${input.templeRecommendStatus.trim()}%`);
    conditions.push(`COALESCE(m.temple_recommend_status, '') ILIKE ${p}`);
  }

  if (input.search?.trim()) {
    const p = addParam(`%${input.search.trim()}%`);
    conditions.push(
      `(` +
        `${fullNameExpr} ILIKE ${p} ` +
        `OR COALESCE(c.title, '') ILIKE ${p} ` +
        `OR COALESCE(o.name, '') ILIKE ${p} ` +
        `OR COALESCE(e.email, '') ILIKE ${p} ` +
        `OR COALESCE(p.phone_number, '') ILIKE ${p}` +
        `)`
    );
  }

  const direction: SortDirection = input.sortDirection === "desc" ? "desc" : "asc";
  const sqlDirection = direction.toUpperCase();
  const sortBy = input.sortBy ?? "unit";
  const orderBy =
    sortBy === "age"
      ? `COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) ${sqlDirection} NULLS LAST, COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`
      : sortBy === "name"
        ? `m.last_name ${sqlDirection}, m.first_name ${sqlDirection}`
        : sortBy === "calling"
          ? `COALESCE(c.title, '') ${sqlDirection}, COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`
          : `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ${sqlDirection}, COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) DESC NULLS LAST, m.last_name ASC, m.first_name ASC`;

  const safeLimit = Math.max(1, Math.min(input.limit ?? 500, 5000));

  const result = await query<PeopleContactQueryRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.gender,
      p.phone_number AS "phoneNumber",
      e.email,
      c.title AS "currentCalling",
      o.name AS "organizationName",
      m.mission_status AS "missionStatus",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.is_attending_seminary AS "isAttendingSeminary",
      m.is_attending_institute AS "isAttendingInstitute",
      m.is_convert AS "isConvert",
      m.is_returned_missionary AS "isReturnedMissionary",
      m.move_in_date::text AS "moveInDate"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT
        cc.title,
        cc.organization_id
      FROM current_callings_dedup cc
      WHERE cc.member_id = m.id
      ORDER BY cc.sustained_on DESC NULLS LAST, cc.updated_at DESC
      LIMIT 1
    ) c ON TRUE
    LEFT JOIN organizations o ON c.organization_id = o.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE ${conditions.join("\n      AND ")}
    ORDER BY ${orderBy}
    LIMIT ${safeLimit}
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    currentCalling: cleanCallingTitle(row.currentCalling)
  }));
};

export const createSavedCohort = async (input: {
  name: string;
  description?: string;
  tags?: string[];
  query: PeopleContactQueryInput;
}) => {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Cohort name is required.");
  }

  const cohorts = await loadCohorts();
  const now = new Date().toISOString();
  const existing = cohorts.find((cohort) => cohort.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.description = input.description?.trim() || undefined;
    existing.tags = dedupeStrings(input.tags ?? []);
    existing.query = input.query;
    existing.updatedAt = now;
    await saveCohorts(cohorts);
    return existing;
  }

  const cohort: SavedCohort = {
    id: randomUUID(),
    name,
    description: input.description?.trim() || undefined,
    tags: dedupeStrings(input.tags ?? []),
    query: input.query,
    createdAt: now,
    updatedAt: now
  };

  cohorts.push(cohort);
  await saveCohorts(cohorts);
  return cohort;
};

export const listSavedCohorts = async () => {
  const cohorts = await loadCohorts();
  return cohorts.sort((left, right) => left.name.localeCompare(right.name));
};

export const runSavedCohort = async (idOrName: string) => {
  const cohorts = await loadCohorts();
  const key = idOrName.trim().toLowerCase();
  const cohort = cohorts.find((item) => item.id === idOrName || item.name.toLowerCase() === key);
  if (!cohort) {
    throw new Error(`Saved cohort not found: ${idOrName}`);
  }

  const rows = await peopleContactQuery(cohort.query);
  return { cohort, count: rows.length, rows };
};

export const createActionApprovalGate = async (input: {
  actionType: "send_calling_email" | "communication_campaign_send";
  payload: Record<string, unknown>;
  ttlMinutes?: number;
  metadata?: Record<string, unknown>;
}) => {
  const ttlMinutes = Math.max(1, Math.min(input.ttlMinutes ?? 30, 240));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const payloadHash = approvalHash(input.actionType, input.payload);
  const token = createHash("sha256")
    .update(`${randomUUID()}:${payloadHash}:${now.toISOString()}`)
    .digest("hex")
    .slice(0, 20);

  const approvals = await loadApprovalGates();
  const active = approvals
    .filter((row) => row.usedAt === null && new Date(row.expiresAt).getTime() > now.getTime())
    .slice(-2000);

  const record: ApprovalGateRecord = {
    id: randomUUID(),
    actionType: input.actionType,
    payloadHash,
    token,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
    metadata: input.metadata
  };

  active.push(record);
  await saveApprovalGates(active);

  return {
    actionType: input.actionType,
    approvalToken: token,
    payloadHash,
    expiresAt: record.expiresAt,
    note: "Pass approvalToken with the exact same send payload."
  };
};

export const consumeActionApprovalGate = async (input: {
  actionType: "send_calling_email" | "communication_campaign_send";
  payload: Record<string, unknown>;
  approvalToken: string;
}) => {
  const token = input.approvalToken.trim();
  if (!token) {
    throw new Error("approvalToken is required for this action.");
  }

  const now = new Date();
  const payloadHash = approvalHash(input.actionType, input.payload);
  const approvals = await loadApprovalGates();
  const match = approvals.find(
    (row) =>
      row.token === token &&
      row.actionType === input.actionType &&
      row.payloadHash === payloadHash &&
      row.usedAt === null &&
      new Date(row.expiresAt).getTime() > now.getTime()
  );

  if (!match) {
    throw new Error("Invalid or expired approvalToken for this action payload.");
  }

  match.usedAt = now.toISOString();
  await saveApprovalGates(approvals);

  return {
    approved: true,
    approvalId: match.id,
    approvedAt: match.usedAt
  };
};

export const resolveMember = async (input: {
  query: string;
  unit?: string;
  limit?: number;
}) => {
  const queryText = input.query.trim();
  if (!queryText) {
    throw new Error("resolve_member requires a non-empty query.");
  }

  const unitFilter = input.unit?.trim() ? `%${input.unit.trim()}%` : null;
  const searchLike = `%${queryText}%`;
  const safeLimit = Math.max(1, Math.min(input.limit ?? 25, 200));

  const result = await query<{
    lcrMemberId: string;
    fullName: string;
    unitName: string;
    age: number | null;
    gender: string | null;
    phoneNumber: string | null;
    email: string | null;
    householdName: string | null;
    score: number;
  }>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.gender,
      p.phone_number AS "phoneNumber",
      e.email,
      h.household_name AS "householdName",
      (
        CASE
          WHEN m.lcr_member_id = $1 THEN 120
          WHEN LOWER(${fullNameExpr}) = LOWER($1) THEN 100
          WHEN LOWER(${fullNameExpr}) LIKE LOWER($2) THEN 60
          ELSE 0
        END
        + CASE WHEN COALESCE(p.phone_number, '') ILIKE $2 THEN 30 ELSE 0 END
        + CASE WHEN COALESCE(e.email, '') ILIKE $2 THEN 30 ELSE 0 END
        + CASE WHEN $3::text IS NOT NULL AND COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $3 THEN 10 ELSE 0 END
      )::int AS score
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN households h ON m.household_id = h.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE (
      m.lcr_member_id = $1
      OR ${fullNameExpr} ILIKE $2
      OR COALESCE(e.email, '') ILIKE $2
      OR COALESCE(p.phone_number, '') ILIKE $2
    )
      AND ($3::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $3)
    ORDER BY score DESC, "fullName" ASC
    LIMIT ${safeLimit}
    `,
    [queryText, searchLike, unitFilter]
  );

  return {
    query: queryText,
    unit: input.unit ?? null,
    count: result.rows.length,
    candidates: result.rows
  };
};

export const queryPlanner = async (input: {
  goal: string;
  constraints?: string;
  desiredOutput?: string;
}) => {
  const goal = input.goal.trim();
  if (!goal) {
    throw new Error("query_planner requires a goal.");
  }

  const lcGoal = goal.toLowerCase();
  const steps: Array<{
    step: number;
    tool: string;
    rationale: string;
    arguments: Record<string, unknown>;
  }> = [];

  if (/mission|youth/.test(lcGoal)) {
    steps.push({
      step: steps.length + 1,
      tool: "mission_eligible_contact_list",
      rationale: "Mission/youth requests usually need age-scoped contact details.",
      arguments: { ageMin: 16, ageMax: 25, sortBy: "unit_age", sortDirection: "asc", limit: 500 }
    });
  }

  if (/committee|council|stake presidency|bishop/.test(lcGoal)) {
    steps.push({
      step: steps.length + 1,
      tool: "committee_contact_list",
      rationale: "Meeting and committee requests align with handbook-mapped committees.",
      arguments: { sortBy: "committee", sortDirection: "asc", limit: 500 }
    });
  }

  if (/change|since last sync|sync/.test(lcGoal)) {
    steps.push({
      step: steps.length + 1,
      tool: "sync_diff_report",
      rationale: "The request mentions changes over time; sync diff report is source of truth.",
      arguments: { limit: 30 }
    });
  }

  if (/email|message|send/.test(lcGoal)) {
    steps.push({
      step: steps.length + 1,
      tool: "communication_campaign_prepare",
      rationale: "Preview recipients before any outbound campaign.",
      arguments: { targetType: "people_query" }
    });
    steps.push({
      step: steps.length + 1,
      tool: "approval_gate_request",
      rationale: "Send actions require an approval token gate.",
      arguments: { actionType: "communication_campaign_send" }
    });
    steps.push({
      step: steps.length + 1,
      tool: "communication_campaign_send",
      rationale: "Execute send only after approval gate token is issued.",
      arguments: { approvalToken: "<from approval_gate_request>", targetType: "people_query" }
    });
  }

  if (steps.length === 0) {
    steps.push({
      step: 1,
      tool: "people_contact_query",
      rationale: "Default path: run a unified filtered people query.",
      arguments: { sortBy: "unit", sortDirection: "asc", limit: 500 }
    });
  }

  return {
    goal,
    constraints: input.constraints ?? null,
    desiredOutput: input.desiredOutput ?? null,
    plan: steps
  };
};

export const explainQuery = async (input: {
  toolName: string;
  arguments?: Record<string, unknown>;
}) => {
  const toolName = input.toolName.trim();
  if (!toolName) {
    throw new Error("explain_query requires toolName.");
  }

  const args = input.arguments ?? {};
  const tableByTool: Record<string, string[]> = {
    people_contact_query: ["members", "units", "current_callings_dedup", "organizations", "emails", "phone_numbers"],
    mission_eligible_contact_list: ["members", "units", "current_callings_dedup", "emails", "phone_numbers"],
    sync_diff_report: ["sync_logs", "members", "callings", "organizations", "units", "emails", "phone_numbers"],
    leadership_contact_list: ["current_callings_dedup", "members", "organizations", "emails", "phone_numbers"],
    resolve_member: ["members", "units", "households", "emails", "phone_numbers"]
  };

  const expectedColumnsByTool: Record<string, string[]> = {
    people_contact_query: [
      "lcrMemberId",
      "fullName",
      "unitName",
      "age",
      "gender",
      "phoneNumber",
      "email",
      "currentCalling",
      "organizationName"
    ],
    mission_eligible_contact_list: [
      "lcrMemberId",
      "fullName",
      "unitName",
      "age",
      "phoneNumber",
      "email",
      "missionStatus",
      "templeRecommendStatus"
    ],
    sync_diff_report: ["windowStart", "windowEnd", "counts", "members", "callings"],
    leadership_contact_list: [
      "fullName",
      "unitName",
      "callingTitle",
      "organizationName",
      "sustainedOn",
      "phoneNumber",
      "email",
      "spouseName"
    ],
    resolve_member: ["query", "count", "candidates"]
  };

  const notesByTool: Record<string, string[]> = {
    people_contact_query: [
      "Supports multi-filter search with contact joins in one call.",
      "Sort and limit are applied server-side.",
      "Name/calling values are matched with ILIKE contains logic."
    ],
    mission_eligible_contact_list: [
      "Age filter defaults to 18-25 if not provided.",
      "Can enforce phone presence with requirePhone=true.",
      "Current calling is cleaned for duplicate artifacts."
    ],
    sync_diff_report: [
      "Compares latest successful sync to previous successful sync.",
      "If there is no previous sync, falls back to a 24-hour window."
    ],
    leadership_contact_list: [
      "Leadership scope is title/org regex based (president/bishop/high councilor families).",
      "Spouse columns are only populated when includeSpouses=true."
    ],
    resolve_member: [
      "Ranks candidates by exact ID/name matches first, then partial/contact matches.",
      "Useful before timeline or send operations to avoid wrong-person actions."
    ]
  };

  return {
    toolName,
    arguments: args,
    touchesTables: tableByTool[toolName] ?? ["unknown"],
    expectedOutputColumns: expectedColumnsByTool[toolName] ?? [],
    notes: notesByTool[toolName] ?? ["No specialized explanation registered for this tool."]
  };
};

export const getLeadershipGapAlerts = async (options: { tenureYears?: number; limit?: number } = {}) => {
  const tenureYears = Math.max(1, Math.min(options.tenureYears ?? 4, 20));
  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));

  const [vacancies, tenureRows, leaderContacts, duplicateLeaders, expiringRecommends, newMemberFollowUp] = await Promise.all([
    getVacancies(),
    getLeadershipTenureReport(),
    getLeadershipContactList({ includeSpouses: false, limit: 2000 }),
    query<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      leadershipCallingCount: string;
      callings: string;
    }>(
      `
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        COUNT(*)::text AS "leadershipCallingCount",
        STRING_AGG(c.title, ' | ' ORDER BY c.title) AS callings
      FROM current_callings_dedup c
      JOIN members m ON c.member_id = m.id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE c.title ~* '(president|bishop|high councilor)'
      GROUP BY m.lcr_member_id, ${fullNameExpr}, COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown')
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, "fullName"
      LIMIT ${limit}
      `
    ),
    query<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      templeRecommendStatus: string | null;
      callingTitle: string;
    }>(
      `
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        m.temple_recommend_status AS "templeRecommendStatus",
        c.title AS "callingTitle"
      FROM current_callings_dedup c
      JOIN members m ON c.member_id = m.id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE c.title ~* '(president|bishop|high councilor)'
        AND COALESCE(m.temple_recommend_status, '') !~* '^active'
      ORDER BY "unitName", "fullName"
      LIMIT ${limit}
      `
    ),
    getNewMemberContactList({ includeConverts: true, includeMoveIns: true, monthsBack: 6, limit: 1000 })
  ]);

  const leadershipVacancies = vacancies
    .filter((row) => /(president|bishop|high councilor)/i.test(row.callingTitle))
    .slice(0, limit);

  const overTenure = tenureRows.filter((row) => row.yearsInCalling >= tenureYears).slice(0, limit);
  const noContactLeaders = leaderContacts
    .filter((row) => !row.email && !row.phoneNumber)
    .slice(0, limit);

  const unassignedNewMembers = newMemberFollowUp
    .filter((row) => !row.ministeringAssigned)
    .slice(0, limit);

  return {
    generatedAt: new Date().toISOString(),
    thresholds: { tenureYears, limit },
    summary: {
      leadershipVacancyCount: leadershipVacancies.length,
      overTenureCount: overTenure.length,
      noContactLeaderCount: noContactLeaders.length,
      duplicateLeadershipAssignments: duplicateLeaders.rows.length,
      leadershipRecommendAttention: expiringRecommends.rows.length,
      unassignedNewMembers: unassignedNewMembers.length
    },
    details: {
      leadershipVacancies,
      overTenure,
      noContactLeaders,
      duplicateLeaders: duplicateLeaders.rows.map((row) => ({
        ...row,
        leadershipCallingCount: Number.parseInt(row.leadershipCallingCount, 10)
      })),
      recommendAttention: expiringRecommends.rows.map((row) => ({
        ...row,
        callingTitle: cleanCallingTitle(row.callingTitle)
      })),
      unassignedNewMembers
    }
  };
};

type SnapshotLogRow = {
  id: number;
  syncType: string;
  startedAt: string;
  completedAt: string | null;
};

type MemberSnapshotRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  moveInDate: string | null;
  rowHash: string;
  snapshotData: Record<string, unknown>;
};

type CallingSnapshotRow = {
  lcrCallingId: string;
  unitName: string | null;
  memberLcrMemberId: string | null;
  memberName: string | null;
  callingTitle: string;
  isCurrent: boolean;
  sustainedOn: string | null;
  releasedOn: string | null;
  rowHash: string;
  snapshotData: Record<string, unknown>;
};

type ContactSnapshotRow = {
  memberLcrMemberId: string;
  fullName: string;
  unitName: string | null;
  value: string;
  rowHash: string;
  snapshotData: Record<string, unknown>;
};

const buildSnapshotCoverage = (latestSnapshotLogId: number | null, previousSnapshotLogId: number | null) => ({
  latestSnapshotLogId,
  previousSnapshotLogId,
  ready: Boolean(latestSnapshotLogId && previousSnapshotLogId),
  status: latestSnapshotLogId
    ? previousSnapshotLogId
      ? "ready"
      : "baseline-established"
    : "not-seeded"
});

const humanizeField = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());

const diffSnapshotFields = (
  current: Record<string, unknown>,
  previous: Record<string, unknown>,
  ignoredKeys: string[] = []
) => {
  const ignored = new Set(ignoredKeys);
  const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(previous)]));

  return keys
    .filter((key) => !ignored.has(key))
    .filter((key) => JSON.stringify(current[key] ?? null) !== JSON.stringify(previous[key] ?? null))
    .map(humanizeField);
};

const getLatestSuccessLogs = async (limit: number) =>
  query<SnapshotLogRow>(
    `
    SELECT
      id,
      sync_type AS "syncType",
      started_at::text AS "startedAt",
      completed_at::text AS "completedAt"
    FROM sync_logs
    WHERE status = 'success'
    ORDER BY completed_at DESC NULLS LAST, started_at DESC
    LIMIT $1
    `,
    [limit]
  );

const loadSnapshotLog = async (syncLogId: number) => {
  const result = await query<SnapshotLogRow>(
    `
    SELECT
      id,
      sync_type AS "syncType",
      started_at::text AS "startedAt",
      completed_at::text AS "completedAt"
    FROM sync_logs
    WHERE id = $1
    LIMIT 1
    `,
    [syncLogId]
  );

  return result.rows[0] ?? null;
};

const latestSnapshotLog = async (tableName: string) => {
  const result = await query<{ syncLogId: number }>(
    `
    SELECT t.sync_log_id AS "syncLogId"
    FROM ${tableName} t
    JOIN sync_logs s ON s.id = t.sync_log_id
    WHERE s.status = 'success'
      AND s.completed_at IS NOT NULL
    GROUP BY t.sync_log_id
    ORDER BY MAX(s.completed_at) DESC, t.sync_log_id DESC
    LIMIT 1
    `
  );

  return result.rows[0]?.syncLogId ?? null;
};

const previousSnapshotLog = async (tableName: string, latestSyncId: number) => {
  const result = await query<{ syncLogId: number }>(
    `
    SELECT DISTINCT t.sync_log_id AS "syncLogId"
    FROM ${tableName} t
    JOIN sync_logs s ON s.id = t.sync_log_id
    WHERE s.status = 'success'
      AND t.sync_log_id < $1
    ORDER BY t.sync_log_id DESC
    LIMIT 1
    `,
    [latestSyncId]
  );

  return result.rows[0]?.syncLogId ?? null;
};

const loadMemberSnapshots = async (syncLogId: number) =>
  query<MemberSnapshotRow>(
    `
    SELECT
      lcr_member_id AS "lcrMemberId",
      full_name AS "fullName",
      unit_name AS "unitName",
      move_in_date::text AS "moveInDate",
      row_hash AS "rowHash",
      snapshot_data AS "snapshotData"
    FROM sync_member_snapshots
    WHERE sync_log_id = $1
    `,
    [syncLogId]
  );

const loadCallingSnapshots = async (syncLogId: number) =>
  query<CallingSnapshotRow>(
    `
    SELECT
      lcr_calling_id AS "lcrCallingId",
      unit_name AS "unitName",
      member_lcr_member_id AS "memberLcrMemberId",
      member_name AS "memberName",
      calling_title AS "callingTitle",
      is_current AS "isCurrent",
      sustained_on::text AS "sustainedOn",
      released_on::text AS "releasedOn",
      row_hash AS "rowHash",
      snapshot_data AS "snapshotData"
    FROM sync_calling_snapshots
    WHERE sync_log_id = $1
    `,
    [syncLogId]
  );

const loadEmailSnapshots = async (syncLogId: number) =>
  query<ContactSnapshotRow>(
    `
    SELECT
      member_lcr_member_id AS "memberLcrMemberId",
      full_name AS "fullName",
      unit_name AS "unitName",
      email AS value,
      row_hash AS "rowHash",
      snapshot_data AS "snapshotData"
    FROM sync_email_snapshots
    WHERE sync_log_id = $1
    `,
    [syncLogId]
  );

const loadPhoneSnapshots = async (syncLogId: number) =>
  query<ContactSnapshotRow>(
    `
    SELECT
      member_lcr_member_id AS "memberLcrMemberId",
      full_name AS "fullName",
      unit_name AS "unitName",
      phone_number AS value,
      row_hash AS "rowHash",
      snapshot_data AS "snapshotData"
    FROM sync_phone_snapshots
    WHERE sync_log_id = $1
    `,
    [syncLogId]
  );

export const getSyncDiffReport = async (options: { limit?: number } = {}) => {
  const safeLimit = Math.max(1, Math.min(options.limit ?? 30, 200));
  const logs = await getLatestSuccessLogs(10);

  const latest = logs.rows[0] ?? null;
  const previous = logs.rows[1] ?? null;
  if (!latest?.completedAt) {
    return {
      latestSync: latest,
      previousSync: previous,
      windowStart: null,
      windowEnd: null,
      coverage: {
        members: buildSnapshotCoverage(null, null),
        callings: buildSnapshotCoverage(null, null),
        emails: buildSnapshotCoverage(null, null),
        phones: buildSnapshotCoverage(null, null)
      },
      comparisonWindows: {
        members: { start: null, end: null },
        callings: { start: null, end: null },
        emails: { start: null, end: null },
        phones: { start: null, end: null }
      },
      counts: {
        membersChanged: 0,
        membersAdded: 0,
        membersRemoved: 0,
        membersUpdated: 0,
        callingsChanged: 0,
        callingsAdded: 0,
        callingsRemoved: 0,
        callingsUpdated: 0,
        organizationChanged: 0,
        unitChanged: 0,
        emailChanged: 0,
        emailAdded: 0,
        emailRemoved: 0,
        emailUpdated: 0,
        phoneChanged: 0,
        phoneAdded: 0,
        phoneRemoved: 0,
        phoneUpdated: 0
      },
      members: [],
      callings: [],
      contacts: []
    };
  }

  const windowEnd = latest.completedAt;
  const windowStart = previous?.completedAt ?? null;

  const [
    latestMemberSnapshotLogId,
    latestCallingSnapshotLogId,
    latestEmailSnapshotLogId,
    latestPhoneSnapshotLogId
  ] = await Promise.all([
    latestSnapshotLog("sync_member_snapshots"),
    latestSnapshotLog("sync_calling_snapshots"),
    latestSnapshotLog("sync_email_snapshots"),
    latestSnapshotLog("sync_phone_snapshots")
  ]);

  const [
    previousMemberSnapshotLogId,
    previousCallingSnapshotLogId,
    previousEmailSnapshotLogId,
    previousPhoneSnapshotLogId
  ] = await Promise.all([
    latestMemberSnapshotLogId ? previousSnapshotLog("sync_member_snapshots", latestMemberSnapshotLogId) : Promise.resolve(null),
    latestCallingSnapshotLogId ? previousSnapshotLog("sync_calling_snapshots", latestCallingSnapshotLogId) : Promise.resolve(null),
    latestEmailSnapshotLogId ? previousSnapshotLog("sync_email_snapshots", latestEmailSnapshotLogId) : Promise.resolve(null),
    latestPhoneSnapshotLogId ? previousSnapshotLog("sync_phone_snapshots", latestPhoneSnapshotLogId) : Promise.resolve(null)
  ]);

  const emptyMembers = { rows: [] as MemberSnapshotRow[] };
  const emptyCallings = { rows: [] as CallingSnapshotRow[] };
  const emptyContacts = { rows: [] as ContactSnapshotRow[] };

  const memberCoverage = buildSnapshotCoverage(latestMemberSnapshotLogId, previousMemberSnapshotLogId);
  const callingCoverage = buildSnapshotCoverage(latestCallingSnapshotLogId, previousCallingSnapshotLogId);
  const emailCoverage = buildSnapshotCoverage(latestEmailSnapshotLogId, previousEmailSnapshotLogId);
  const phoneCoverage = buildSnapshotCoverage(latestPhoneSnapshotLogId, previousPhoneSnapshotLogId);

  const [
    latestMemberSnapshotLog,
    previousMemberSnapshotLog,
    latestCallingSnapshotLog,
    previousCallingSnapshotLog,
    latestEmailSnapshotLog,
    previousEmailSnapshotLog,
    latestPhoneSnapshotLog,
    previousPhoneSnapshotLog
  ] = await Promise.all([
    latestMemberSnapshotLogId ? loadSnapshotLog(latestMemberSnapshotLogId) : Promise.resolve(null),
    previousMemberSnapshotLogId ? loadSnapshotLog(previousMemberSnapshotLogId) : Promise.resolve(null),
    latestCallingSnapshotLogId ? loadSnapshotLog(latestCallingSnapshotLogId) : Promise.resolve(null),
    previousCallingSnapshotLogId ? loadSnapshotLog(previousCallingSnapshotLogId) : Promise.resolve(null),
    latestEmailSnapshotLogId ? loadSnapshotLog(latestEmailSnapshotLogId) : Promise.resolve(null),
    previousEmailSnapshotLogId ? loadSnapshotLog(previousEmailSnapshotLogId) : Promise.resolve(null),
    latestPhoneSnapshotLogId ? loadSnapshotLog(latestPhoneSnapshotLogId) : Promise.resolve(null),
    previousPhoneSnapshotLogId ? loadSnapshotLog(previousPhoneSnapshotLogId) : Promise.resolve(null)
  ]);

  const memberWindowEnd = latestMemberSnapshotLog?.completedAt ?? windowEnd;
  const callingWindowEnd = latestCallingSnapshotLog?.completedAt ?? windowEnd;
  const emailWindowEnd = latestEmailSnapshotLog?.completedAt ?? windowEnd;
  const phoneWindowEnd = latestPhoneSnapshotLog?.completedAt ?? windowEnd;

  const [
    latestMemberSnapshots,
    previousMemberSnapshots,
    latestCallingSnapshots,
    previousCallingSnapshots,
    latestEmailSnapshots,
    previousEmailSnapshots,
    latestPhoneSnapshots,
    previousPhoneSnapshots
  ] = await Promise.all([
    latestMemberSnapshotLogId && previousMemberSnapshotLogId ? loadMemberSnapshots(latestMemberSnapshotLogId) : Promise.resolve(emptyMembers),
    previousMemberSnapshotLogId ? loadMemberSnapshots(previousMemberSnapshotLogId) : Promise.resolve(emptyMembers),
    latestCallingSnapshotLogId && previousCallingSnapshotLogId ? loadCallingSnapshots(latestCallingSnapshotLogId) : Promise.resolve(emptyCallings),
    previousCallingSnapshotLogId ? loadCallingSnapshots(previousCallingSnapshotLogId) : Promise.resolve(emptyCallings),
    latestEmailSnapshotLogId && previousEmailSnapshotLogId ? loadEmailSnapshots(latestEmailSnapshotLogId) : Promise.resolve(emptyContacts),
    previousEmailSnapshotLogId ? loadEmailSnapshots(previousEmailSnapshotLogId) : Promise.resolve(emptyContacts),
    latestPhoneSnapshotLogId && previousPhoneSnapshotLogId ? loadPhoneSnapshots(latestPhoneSnapshotLogId) : Promise.resolve(emptyContacts),
    previousPhoneSnapshotLogId ? loadPhoneSnapshots(previousPhoneSnapshotLogId) : Promise.resolve(emptyContacts)
  ]);

  const memberChanges: Array<{
    lcrMemberId: string;
    fullName: string;
    unitName: string;
    moveInDate: string | null;
    changeType: "Added" | "Removed" | "Changed";
    changedFields: string[];
    updatedAt: string;
  }> = [];
  let membersAdded = 0;
  let membersRemoved = 0;
  let membersUpdated = 0;

  if (latestMemberSnapshotLogId && previousMemberSnapshotLogId) {
    const previousById = new Map(previousMemberSnapshots.rows.map((row) => [row.lcrMemberId, row]));

    for (const row of latestMemberSnapshots.rows) {
      const previousRow = previousById.get(row.lcrMemberId);
      if (!previousRow) {
        membersAdded += 1;
        memberChanges.push({
          lcrMemberId: row.lcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName ?? "Unknown",
          moveInDate: row.moveInDate,
          changeType: "Added",
          changedFields: [],
          updatedAt: memberWindowEnd
        });
        continue;
      }

      if (row.rowHash !== previousRow.rowHash) {
        membersUpdated += 1;
        memberChanges.push({
          lcrMemberId: row.lcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName ?? "Unknown",
          moveInDate: row.moveInDate,
          changeType: "Changed",
          changedFields: diffSnapshotFields(row.snapshotData, previousRow.snapshotData, ["unit_id", "household_id"]),
          updatedAt: memberWindowEnd
        });
      }

      previousById.delete(row.lcrMemberId);
    }

    for (const row of previousById.values()) {
      membersRemoved += 1;
      memberChanges.push({
        lcrMemberId: row.lcrMemberId,
        fullName: row.fullName,
        unitName: row.unitName ?? "Unknown",
        moveInDate: row.moveInDate,
        changeType: "Removed",
        changedFields: [],
        updatedAt: memberWindowEnd
      });
    }
  }

  const callingChanges: Array<{
    lcrCallingId: string;
    unitName: string;
    callingTitle: string;
    isCurrent: boolean;
    sustainedOn: string | null;
    releasedOn: string | null;
    changeType: "Added" | "Released" | "Removed" | "Updated";
    changedFields: string[];
    updatedAt: string;
  }> = [];
  let callingsAdded = 0;
  let callingsRemoved = 0;
  let callingsUpdated = 0;

  if (latestCallingSnapshotLogId && previousCallingSnapshotLogId) {
    const previousById = new Map(previousCallingSnapshots.rows.map((row) => [row.lcrCallingId, row]));

    for (const row of latestCallingSnapshots.rows) {
      const previousRow = previousById.get(row.lcrCallingId);
      if (!previousRow) {
        callingsAdded += 1;
        callingChanges.push({
          lcrCallingId: row.lcrCallingId,
          unitName: row.unitName ?? "Unknown",
          callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle,
          isCurrent: row.isCurrent,
          sustainedOn: row.sustainedOn,
          releasedOn: row.releasedOn,
          changeType: "Added",
          changedFields: [],
          updatedAt: callingWindowEnd
        });
        continue;
      }

      if (row.rowHash !== previousRow.rowHash) {
        callingsUpdated += 1;
        callingChanges.push({
          lcrCallingId: row.lcrCallingId,
          unitName: row.unitName ?? previousRow.unitName ?? "Unknown",
          callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle,
          isCurrent: row.isCurrent,
          sustainedOn: row.sustainedOn,
          releasedOn: row.releasedOn,
          changeType: previousRow.isCurrent && !row.isCurrent ? "Released" : "Updated",
          changedFields: diffSnapshotFields(row.snapshotData, previousRow.snapshotData, ["unit_id", "member_id", "organization_id"]),
          updatedAt: callingWindowEnd
        });
      }

      previousById.delete(row.lcrCallingId);
    }

    for (const row of previousById.values()) {
      callingsRemoved += 1;
      callingChanges.push({
        lcrCallingId: row.lcrCallingId,
        unitName: row.unitName ?? "Unknown",
        callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle,
        isCurrent: row.isCurrent,
        sustainedOn: row.sustainedOn,
        releasedOn: row.releasedOn,
        changeType: "Removed",
        changedFields: [],
        updatedAt: callingWindowEnd
      });
    }
  }

  const contactChanges: Array<{
    contactType: "Email" | "Phone";
    memberLcrMemberId: string;
    fullName: string;
    unitName: string;
    value: string;
    changeType: "Added" | "Removed" | "Changed";
    changedFields: string[];
    updatedAt: string;
  }> = [];
  let emailAdded = 0;
  let emailRemoved = 0;
  let emailUpdated = 0;
  let phoneAdded = 0;
  let phoneRemoved = 0;
  let phoneUpdated = 0;

  const diffContacts = (
    contactType: "Email" | "Phone",
    currentRows: ContactSnapshotRow[],
    previousRows: ContactSnapshotRow[]
  ) => {
    const previousByKey = new Map(previousRows.map((row) => [`${row.memberLcrMemberId}|${row.value}`, row]));

    for (const row of currentRows) {
      const key = `${row.memberLcrMemberId}|${row.value}`;
      const previousRow = previousByKey.get(key);
      if (!previousRow) {
        if (contactType === "Email") {
          emailAdded += 1;
        } else {
          phoneAdded += 1;
        }
        contactChanges.push({
          contactType,
          memberLcrMemberId: row.memberLcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName ?? "Unknown",
          value: row.value,
          changeType: "Added",
          changedFields: [],
          updatedAt: contactType === "Email" ? emailWindowEnd : phoneWindowEnd
        });
        continue;
      }

      if (row.rowHash !== previousRow.rowHash) {
        if (contactType === "Email") {
          emailUpdated += 1;
        } else {
          phoneUpdated += 1;
        }
        contactChanges.push({
          contactType,
          memberLcrMemberId: row.memberLcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName ?? "Unknown",
          value: row.value,
          changeType: "Changed",
          changedFields: diffSnapshotFields(row.snapshotData, previousRow.snapshotData),
          updatedAt: contactType === "Email" ? emailWindowEnd : phoneWindowEnd
        });
      }

      previousByKey.delete(key);
    }

    for (const row of previousByKey.values()) {
      if (contactType === "Email") {
        emailRemoved += 1;
      } else {
        phoneRemoved += 1;
      }
      contactChanges.push({
        contactType,
        memberLcrMemberId: row.memberLcrMemberId,
        fullName: row.fullName,
        unitName: row.unitName ?? "Unknown",
        value: row.value,
        changeType: "Removed",
        changedFields: [],
        updatedAt: contactType === "Email" ? emailWindowEnd : phoneWindowEnd
      });
    }
  };

  if (latestEmailSnapshotLogId && previousEmailSnapshotLogId) {
    diffContacts("Email", latestEmailSnapshots.rows, previousEmailSnapshots.rows);
  }
  if (latestPhoneSnapshotLogId && previousPhoneSnapshotLogId) {
    diffContacts("Phone", latestPhoneSnapshots.rows, previousPhoneSnapshots.rows);
  }

  return {
    latestSync: latest,
    previousSync: previous,
    windowStart,
    windowEnd,
    coverage: {
      members: memberCoverage,
      callings: callingCoverage,
      emails: emailCoverage,
      phones: phoneCoverage
    },
    comparisonWindows: {
      members: {
        start: previousMemberSnapshotLog?.completedAt ?? null,
        end: latestMemberSnapshotLog?.completedAt ?? null
      },
      callings: {
        start: previousCallingSnapshotLog?.completedAt ?? null,
        end: latestCallingSnapshotLog?.completedAt ?? null
      },
      emails: {
        start: previousEmailSnapshotLog?.completedAt ?? null,
        end: latestEmailSnapshotLog?.completedAt ?? null
      },
      phones: {
        start: previousPhoneSnapshotLog?.completedAt ?? null,
        end: latestPhoneSnapshotLog?.completedAt ?? null
      }
    },
    counts: {
      membersChanged: membersAdded + membersRemoved + membersUpdated,
      membersAdded,
      membersRemoved,
      membersUpdated,
      callingsChanged: callingsAdded + callingsRemoved + callingsUpdated,
      callingsAdded,
      callingsRemoved,
      callingsUpdated,
      organizationChanged: 0,
      unitChanged: 0,
      emailChanged: emailAdded + emailRemoved + emailUpdated,
      emailAdded,
      emailRemoved,
      emailUpdated,
      phoneChanged: phoneAdded + phoneRemoved + phoneUpdated,
      phoneAdded,
      phoneRemoved,
      phoneUpdated
    },
    members: memberChanges
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.fullName.localeCompare(right.fullName))
      .slice(0, safeLimit),
    callings: callingChanges
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.callingTitle.localeCompare(right.callingTitle))
      .slice(0, safeLimit),
    contacts: contactChanges
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.fullName.localeCompare(right.fullName))
      .slice(0, safeLimit)
  };
};

export const generateActionPacket = async (meetingType: string) => {
  const normalized = meetingType.trim().toLowerCase();
  const [alerts, syncDiff] = await Promise.all([
    getLeadershipGapAlerts({ limit: 20 }),
    getSyncDiffReport({ limit: 20 })
  ]);

  if (normalized === "stake_council") {
    const [leaders, missionReady, newMembers] = await Promise.all([
      getLeadershipContactList({ includeSpouses: true, limit: 80 }),
      getMissionReadinessContactList({ ageMin: 16, ageMax: 25, limit: 80 }),
      getNewMemberContactList({ monthsBack: 3, limit: 80 })
    ]);

    return {
      meetingType: "stake_council",
      generatedAt: new Date().toISOString(),
      summary: {
        leaders: leaders.length,
        missionReady: missionReady.length,
        newMembers: newMembers.length
      },
      sections: {
        leadershipContacts: leaders,
        missionReadiness: missionReady,
        newMemberFollowUp: newMembers,
        alerts,
        syncDiff
      }
    };
  }

  if (normalized === "bishops_council" || normalized === "bishops' council") {
    const [bishops, moveIns, dataQuality] = await Promise.all([
      getLeadershipContactList({ calling: "bishop", includeSpouses: true, limit: 80 }),
      getNewMemberContactList({ includeMoveIns: true, includeConverts: false, monthsBack: 6, limit: 80 }),
      getMissingContactDataList({ youthOnly: true, includeAdults: false, limit: 80 })
    ]);

    return {
      meetingType: "bishops_council",
      generatedAt: new Date().toISOString(),
      summary: {
        bishops: bishops.length,
        moveIns: moveIns.length,
        youthMissingData: dataQuality.length
      },
      sections: {
        bishopContacts: bishops,
        recentMoveIns: moveIns,
        youthDataGaps: dataQuality,
        alerts,
        syncDiff
      }
    };
  }

  if (normalized === "youth_committee" || normalized === "stake_youth_leadership_committee") {
    const [youthHouseholds, missionReady, endowmentReady] = await Promise.all([
      getYouthHouseholdContactList({ ageMin: 12, ageMax: 18, requireGuardianContact: true, limit: 120 }),
      getMissionReadinessContactList({ ageMin: 16, ageMax: 25, limit: 120 }),
      getEndowmentReadinessContactList({ minAge: 18, limit: 120 })
    ]);

    return {
      meetingType: "youth_committee",
      generatedAt: new Date().toISOString(),
      summary: {
        youthHouseholds: youthHouseholds.length,
        missionReady: missionReady.length,
        endowmentReady: endowmentReady.length
      },
      sections: {
        youthHouseholds,
        missionReadiness: missionReady,
        endowmentReadiness: endowmentReady,
        alerts,
        syncDiff
      }
    };
  }

  return {
    meetingType: normalized || "general",
    generatedAt: new Date().toISOString(),
    summary: {
      leadershipAlertItems:
        alerts.summary.leadershipVacancyCount +
        alerts.summary.overTenureCount +
        alerts.summary.noContactLeaderCount
    },
    sections: {
      alerts,
      syncDiff
    }
  };
};

const resolveSpouseRecipients = async (lcrMemberIds: string[]) => {
  if (lcrMemberIds.length === 0) {
    return { emails: [], phones: [] };
  }

  const result = await query<{ email: string | null; phoneNumber: string | null }>(
    `
    SELECT DISTINCT
      e.email,
      p.phone_number AS "phoneNumber"
    FROM members m
    JOIN members sm ON sm.household_id = m.household_id AND sm.id <> m.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = sm.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = sm.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE m.lcr_member_id = ANY($1::text[])
    `,
    [lcrMemberIds]
  );

  return {
    emails: dedupeStrings(result.rows.map((row) => row.email)),
    phones: dedupeStrings(result.rows.map((row) => row.phoneNumber))
  };
};

export const prepareCommunicationCampaign = async (input: {
  targetType: "calling" | "organization" | "committee" | "cohort" | "custom" | "people_query";
  targetValue?: string;
  includeSpouses?: boolean;
  peopleQuery?: PeopleContactQueryInput;
}) => {
  const includeSpouses = input.includeSpouses ?? false;
  let recipients: CampaignResolvedRecipients = { emails: [], phones: [], lcrMemberIds: [] };

  if (input.targetType === "calling") {
    const rows = await getCallingMembers(input.targetValue ?? "");
    recipients = {
      emails: dedupeStrings(rows.map((row) => row.email)),
      phones: dedupeStrings(rows.map((row) => row.phoneNumber)),
      lcrMemberIds: dedupeStrings(rows.map((row) => row.lcrMemberId))
    };
  } else if (input.targetType === "organization") {
    const rows = await getOrganizationContactList({ organization: input.targetValue, limit: 5000 });
    recipients = {
      emails: dedupeStrings(rows.map((row) => row.email)),
      phones: dedupeStrings(rows.map((row) => row.phoneNumber)),
      lcrMemberIds: dedupeStrings(rows.map((row) => row.lcrMemberId))
    };
  } else if (input.targetType === "committee") {
    const rows = await getCommitteeContactList({ committee: input.targetValue, limit: 5000 });
    recipients = {
      emails: dedupeStrings(rows.map((row) => row.email)),
      phones: dedupeStrings(rows.map((row) => row.phoneNumber)),
      lcrMemberIds: []
    };
  } else if (input.targetType === "cohort") {
    const result = await runSavedCohort(input.targetValue ?? "");
    recipients = {
      emails: dedupeStrings(result.rows.map((row) => row.email)),
      phones: dedupeStrings(result.rows.map((row) => row.phoneNumber)),
      lcrMemberIds: dedupeStrings(result.rows.map((row) => row.lcrMemberId))
    };
  } else if (input.targetType === "people_query") {
    const rows = await peopleContactQuery(input.peopleQuery ?? {});
    recipients = {
      emails: dedupeStrings(rows.map((row) => row.email)),
      phones: dedupeStrings(rows.map((row) => row.phoneNumber)),
      lcrMemberIds: dedupeStrings(rows.map((row) => row.lcrMemberId))
    };
  } else {
    recipients = {
      emails: dedupeStrings((input.targetValue ?? "").split(",")),
      phones: [],
      lcrMemberIds: []
    };
  }

  if (includeSpouses && recipients.lcrMemberIds.length > 0) {
    const spouseRecipients = await resolveSpouseRecipients(recipients.lcrMemberIds);
    recipients = {
      emails: dedupeStrings([...recipients.emails, ...spouseRecipients.emails]),
      phones: dedupeStrings([...recipients.phones, ...spouseRecipients.phones]),
      lcrMemberIds: recipients.lcrMemberIds
    };
  }

  return {
    targetType: input.targetType,
    targetValue: input.targetValue ?? null,
    includeSpouses,
    totals: {
      emailRecipients: recipients.emails.length,
      phoneRecipients: recipients.phones.length
    },
    recipients: {
      emails: recipients.emails,
      phones: recipients.phones
    }
  };
};

export const sendCommunicationCampaign = async (input: {
  targetType: "calling" | "organization" | "committee" | "cohort" | "custom" | "people_query";
  targetValue?: string;
  includeSpouses?: boolean;
  peopleQuery?: PeopleContactQueryInput;
  subject: string;
  body: string;
}) => {
  const prepared = await prepareCommunicationCampaign(input);
  const recipients = prepared.recipients.emails;
  if (!input.subject.trim()) {
    throw new Error("Email subject is required.");
  }
  if (!input.body.trim()) {
    throw new Error("Email body is required.");
  }

  if (recipients.length === 0) {
    return {
      sent: 0,
      rejected: 0,
      messageId: null as string | null,
      recipients
    };
  }

  const transporter = ensureMailer();
  const result = await transporter.sendMail({
    from: env.SMTP_FROM,
    to: recipients,
    subject: input.subject,
    text: input.body
  });

  return {
    sent: result.accepted.length,
    rejected: result.rejected.length,
    messageId: result.messageId,
    recipients
  };
};

export const getMemberTimeline = async (memberRef: string) => {
  const memberResult = await query<{
    id: number;
    lcrMemberId: string;
    fullName: string;
    unitName: string;
    birthdate: string | null;
    moveInDate: string | null;
    baptismDate: string | null;
    confirmationDate: string | null;
    templeRecommendStatus: string | null;
  }>(
    `
    SELECT
      m.id,
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      m.birthdate::text AS birthdate,
      m.move_in_date::text AS "moveInDate",
      m.baptism_date::text AS "baptismDate",
      m.confirmation_date::text AS "confirmationDate",
      m.temple_recommend_status AS "templeRecommendStatus"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    WHERE m.lcr_member_id = $1
       OR ${fullNameExpr} ILIKE $2
    ORDER BY CASE WHEN m.lcr_member_id = $1 THEN 0 ELSE 1 END
    LIMIT 1
    `,
    [memberRef, `%${memberRef}%`]
  );

  const member = memberResult.rows[0];
  if (!member) {
    return null;
  }

  const callings = await query<{
    callingTitle: string;
    sustainedOn: string | null;
    setApartOn: string | null;
    releasedOn: string | null;
    isCurrent: boolean;
    updatedAt: string;
  }>(
    `
    SELECT
      c.title AS "callingTitle",
      c.sustained_on::text AS "sustainedOn",
      c.set_apart_on::text AS "setApartOn",
      c.released_on::text AS "releasedOn",
      c.is_current AS "isCurrent",
      c.updated_at::text AS "updatedAt"
    FROM callings c
    WHERE c.member_id = $1
    ORDER BY c.updated_at DESC
    LIMIT 200
    `,
    [member.id]
  );

  const events: Array<{ date: string | null; type: string; title: string; details?: string }> = [];
  if (member.birthdate) {
    events.push({ date: member.birthdate, type: "birthdate", title: "Birthdate recorded" });
  }
  if (member.moveInDate) {
    events.push({ date: member.moveInDate, type: "move_in", title: "Moved into unit" });
  }
  if (member.baptismDate) {
    events.push({ date: member.baptismDate, type: "baptism", title: "Baptism date recorded" });
  }
  if (member.confirmationDate) {
    events.push({ date: member.confirmationDate, type: "confirmation", title: "Confirmation date recorded" });
  }
  if (member.templeRecommendStatus) {
    events.push({
      date: null,
      type: "recommend_status",
      title: "Temple recommend status",
      details: member.templeRecommendStatus
    });
  }

  for (const row of callings.rows) {
    const callingTitle = cleanCallingTitle(row.callingTitle) ?? row.callingTitle;
    if (row.sustainedOn) {
      events.push({
        date: row.sustainedOn,
        type: "calling_sustained",
        title: `${callingTitle} sustained`,
        details: row.isCurrent ? "Current" : "Historical"
      });
    }
    if (row.setApartOn) {
      events.push({
        date: row.setApartOn,
        type: "calling_set_apart",
        title: `${callingTitle} set apart`,
        details: row.isCurrent ? "Current" : "Historical"
      });
    }
    if (row.releasedOn) {
      events.push({
        date: row.releasedOn,
        type: "calling_released",
        title: `${callingTitle} released`
      });
    }
  }

  const sorted = events.sort((left, right) => {
    if (!left.date && !right.date) {
      return left.type.localeCompare(right.type);
    }
    if (!left.date) {
      return 1;
    }
    if (!right.date) {
      return -1;
    }
    return right.date.localeCompare(left.date);
  });

  return {
    member: {
      lcrMemberId: member.lcrMemberId,
      fullName: member.fullName,
      unitName: member.unitName
    },
    timeline: sorted
  };
};

export const getDataQualityWorkbench = async () => {
  const [counts, duplicatesByIdentity, duplicateCallings, missingContacts] = await Promise.all([
    query<{
      missingPhone: string;
      missingEmail: string;
      missingAddress: string;
      totalMembers: string;
    }>(
      `
      SELECT
        COUNT(*) FILTER (WHERE p.phone_number IS NULL)::text AS "missingPhone",
        COUNT(*) FILTER (WHERE e.email IS NULL)::text AS "missingEmail",
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(m.address_line1, ''), NULLIF(h.address_line1, '')) IS NULL
             OR COALESCE(NULLIF(m.address_city, ''), NULLIF(h.city, '')) IS NULL
             OR COALESCE(NULLIF(m.address_postal_code, ''), NULLIF(h.postal_code, '')) IS NULL
        )::text AS "missingAddress",
        COUNT(*)::text AS "totalMembers"
      FROM members m
      LEFT JOIN households h ON m.household_id = h.id
      LEFT JOIN LATERAL (
        SELECT phone_number
        FROM phone_numbers
        WHERE member_id = m.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) p ON TRUE
      LEFT JOIN LATERAL (
        SELECT email
        FROM emails
        WHERE member_id = m.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) e ON TRUE
      `
    ),
    query<{
      identityKey: string;
      duplicateCount: string;
      members: string;
    }>(
      `
      WITH keyed AS (
        SELECT
          LOWER(REGEXP_REPLACE(${fullNameExpr}, '[^a-z0-9]+', ' ', 'g')) || '|' || COALESCE(m.birthdate::text, 'unknown') AS identity_key,
          ${fullNameExpr} AS full_name
        FROM members m
      )
      SELECT
        identity_key AS "identityKey",
        COUNT(*)::text AS "duplicateCount",
        STRING_AGG(full_name, ' | ' ORDER BY full_name) AS members
      FROM keyed
      GROUP BY identity_key
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, identity_key
      LIMIT 50
      `
    ),
    query<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      callingTitle: string;
      duplicateCount: string;
    }>(
      `
      WITH normalized AS (
        SELECT
          m.lcr_member_id AS lcr_member_id,
          ${fullNameExpr} AS full_name,
          COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unit_name,
          BTRIM(REGEXP_REPLACE(LOWER(c.title), '[^a-z0-9]+', ' ', 'g')) AS title_key
        FROM current_callings_dedup c
        JOIN members m ON c.member_id = m.id
        LEFT JOIN units u ON m.unit_id = u.id
      )
      SELECT
        lcr_member_id AS "lcrMemberId",
        full_name AS "fullName",
        unit_name AS "unitName",
        title_key AS "callingTitle",
        COUNT(*)::text AS "duplicateCount"
      FROM normalized
      GROUP BY lcr_member_id, full_name, unit_name, title_key
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, full_name
      LIMIT 50
      `
    ),
    getMissingContactDataList({ limit: 100 })
  ]);

  const summary = counts.rows[0];
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMembers: Number.parseInt(summary.totalMembers, 10),
      missingPhone: Number.parseInt(summary.missingPhone, 10),
      missingEmail: Number.parseInt(summary.missingEmail, 10),
      missingAddress: Number.parseInt(summary.missingAddress, 10),
      duplicateIdentityGroups: duplicatesByIdentity.rows.length,
      duplicateCallingGroups: duplicateCallings.rows.length
    },
    details: {
      duplicateIdentities: duplicatesByIdentity.rows.map((row) => ({
        ...row,
        duplicateCount: Number.parseInt(row.duplicateCount, 10)
      })),
      duplicateCallings: duplicateCallings.rows.map((row) => ({
        ...row,
        duplicateCount: Number.parseInt(row.duplicateCount, 10),
        callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle
      })),
      missingContactSample: missingContacts
    }
  };
};

const allowedDocExtensions = new Set([".txt", ".md", ".csv", ".tsv", ".json", ".log"]);

const collectFiles = async (root: string, maxFiles: number) => {
  const queue: string[] = [root];
  const files: string[] = [];

  while (queue.length > 0 && files.length < maxFiles) {
    const current = queue.shift()!;
    let entries: Array<import("node:fs").Dirent> = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".")) {
          queue.push(fullPath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const extension = path.extname(entry.name).toLowerCase();
      if (!allowedDocExtensions.has(extension)) {
        continue;
      }
      files.push(fullPath);
      if (files.length >= maxFiles) {
        break;
      }
    }
  }

  return files;
};

export const documentCrossReference = async (input: {
  folderPath?: string;
  query?: string;
  maxFiles?: number;
  maxMatches?: number;
}) => {
  const root = input.folderPath?.trim() || process.env.GOOGLE_DRIVE_PATH?.trim();
  if (!root) {
    throw new Error("No folder path provided. Pass folderPath or set GOOGLE_DRIVE_PATH.");
  }

  const maxFiles = Math.max(1, Math.min(input.maxFiles ?? 80, 500));
  const maxMatches = Math.max(1, Math.min(input.maxMatches ?? 200, 2000));
  const search = input.query?.trim().toLowerCase() || null;

  const memberRows = await query<{ fullName: string; unitName: string }>(
    `
    SELECT
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    ORDER BY m.last_name, m.first_name
    LIMIT 2000
    `
  );

  const memberTokens = memberRows.rows
    .map((row) => ({ fullName: row.fullName, unitName: row.unitName, token: row.fullName.toLowerCase() }))
    .filter((row) => row.token.length >= 6);

  const files = await collectFiles(root, maxFiles);
  const matches: Array<{
    filePath: string;
    queryMatched: boolean;
    memberHits: Array<{ fullName: string; unitName: string }>;
    hitCount: number;
  }> = [];

  for (const filePath of files) {
    if (matches.length >= maxMatches) {
      break;
    }

    let content = "";
    try {
      content = (await fs.readFile(filePath, "utf8")).slice(0, 250000);
    } catch {
      continue;
    }

    const normalized = content.toLowerCase();
    const queryMatched = search ? normalized.includes(search) || filePath.toLowerCase().includes(search) : false;
    const memberHits: Array<{ fullName: string; unitName: string }> = [];

    for (const member of memberTokens) {
      if (memberHits.length >= 8) {
        break;
      }
      if (normalized.includes(member.token)) {
        memberHits.push({ fullName: member.fullName, unitName: member.unitName });
      }
    }

    if (!queryMatched && memberHits.length === 0) {
      continue;
    }

    matches.push({
      filePath,
      queryMatched,
      memberHits,
      hitCount: memberHits.length + (queryMatched ? 1 : 0)
    });
  }

  return {
    folderPath: root,
    filesScanned: files.length,
    matches: matches
      .sort((left, right) => right.hitCount - left.hitCount)
      .slice(0, maxMatches)
  };
};

export const getTaskRecommendations = async () => {
  const [alerts, quality, syncDiff, missionReadiness] = await Promise.all([
    getLeadershipGapAlerts({ limit: 20 }),
    getDataQualityWorkbench(),
    getSyncDiffReport({ limit: 20 }),
    getMissionReadinessContactList({ ageMin: 16, ageMax: 25, requireTempleRecommendActive: false, limit: 300 })
  ]);

  const recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    reason: string;
    action: string;
    suggestedTool: string;
  }> = [];

  if (alerts.summary.noContactLeaderCount > 0) {
    recommendations.push({
      priority: "high",
      title: "Fill missing leadership contacts",
      reason: `${alerts.summary.noContactLeaderCount} leaders currently have no phone or email.`,
      action: "Run missing contact follow-up for leadership callings and update records.",
      suggestedTool: "leadership_contact_list + missing_contact_data_list"
    });
  }

  if (alerts.summary.leadershipVacancyCount > 0) {
    recommendations.push({
      priority: "high",
      title: "Address leadership vacancies",
      reason: `${alerts.summary.leadershipVacancyCount} leadership calling vacancies detected.`,
      action: "Review vacancies and prioritize filling by unit.",
      suggestedTool: "leadership_gap_alerts"
    });
  }

  if (quality.summary.missingPhone + quality.summary.missingEmail > 0) {
    recommendations.push({
      priority: "medium",
      title: "Improve contact-data completeness",
      reason: `${quality.summary.missingPhone} missing phone and ${quality.summary.missingEmail} missing email entries remain.`,
      action: "Assign unit clerks to resolve top missing-contact records this week.",
      suggestedTool: "data_quality_workbench"
    });
  }

  const missionNoRecommend = missionReadiness.filter(
    (row) => !(row.templeRecommendStatus ?? "").toLowerCase().startsWith("active")
  ).length;
  if (missionNoRecommend > 0) {
    recommendations.push({
      priority: "medium",
      title: "Mission-readiness follow-up",
      reason: `${missionNoRecommend} mission-age members do not show an active temple recommend status.`,
      action: "Coordinate bishopric interviews and temple prep outreach by unit.",
      suggestedTool: "mission_readiness_contact_list"
    });
  }

  if (syncDiff.counts.membersChanged + syncDiff.counts.callingsChanged > 0) {
    recommendations.push({
      priority: "low",
      title: "Review latest sync deltas",
      reason: `${syncDiff.counts.membersChanged} member and ${syncDiff.counts.callingsChanged} calling updates since the previous sync.`,
      action: "Review recent changes in presidency/stake council context before meetings.",
      suggestedTool: "sync_diff_report"
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    recommendations
  };
};
