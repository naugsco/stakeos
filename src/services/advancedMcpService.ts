import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/src/config/env";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { getSqliteSpikeSyncDiffReport } from "@/src/sqlite/queries";
import { ensureMailer } from "@/src/email/mailer";
import { CALLING_GROUP_DEFINITIONS, matchesCallingGroup, type CallingGroupId } from "@/src/callings/callingGroups";
import { compareStakeDates, parseStakeDate } from "@/src/utils/date";
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

const fullNameExpr = `TRIM(m.first_name || ' ' || m.last_name)`;
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

export interface CallingGroupContactRow {
  lcrMemberId: string | null;
  fullName: string | null;
  unitName: string;
  callingTitle: string;
  organizationName: string | null;
  sustainedOn: string | null;
  email: string | null;
  phoneNumber: string | null;
  groupLabels: string[];
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

const normalizeCallingTitleKey = (value: string | null | undefined) =>
  cleanCallingTitle(value ?? null)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";

const loadLatestSqliteSuccessLogs = (db: ReturnType<typeof openSqliteSpikeDb>, limit: number) =>
  db.prepare(
    `SELECT
      id,
      sync_type AS syncType,
      started_at AS startedAt,
      completed_at AS completedAt
     FROM sync_logs
     WHERE status = 'success'
     ORDER BY completed_at DESC, started_at DESC
     LIMIT ?`
  ).all(limit) as SnapshotLogRow[];

const loadCallingSnapshotLogAtOrBefore = (db: ReturnType<typeof openSqliteSpikeDb>, completedAt: string) =>
  (db.prepare(
    `SELECT
      s.id,
      s.sync_type AS syncType,
      s.started_at AS startedAt,
      s.completed_at AS completedAt
     FROM sync_logs s
     JOIN sync_calling_snapshots c ON c.sync_log_id = s.id
     WHERE s.status = 'success'
       AND s.completed_at IS NOT NULL
       AND s.completed_at <= ?
     GROUP BY s.id
     ORDER BY s.completed_at DESC, s.id DESC
     LIMIT 1`
  ).get(completedAt) as SnapshotLogRow | undefined) ?? null;

const loadLatestCallingSnapshotLog = (db: ReturnType<typeof openSqliteSpikeDb>) =>
  (db.prepare(
    `SELECT
      s.id,
      s.sync_type AS syncType,
      s.started_at AS startedAt,
      s.completed_at AS completedAt
     FROM sync_logs s
     JOIN sync_calling_snapshots c ON c.sync_log_id = s.id
     WHERE s.status = 'success'
       AND s.completed_at IS NOT NULL
     GROUP BY s.id
     ORDER BY s.completed_at DESC, s.id DESC
     LIMIT 1`
  ).get() as SnapshotLogRow | undefined) ?? null;

const parseSnapshotData = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const loadSqliteCallingSnapshots = (db: ReturnType<typeof openSqliteSpikeDb>, syncLogId: number) =>
  db.prepare(
    `SELECT
      lcr_calling_id AS lcrCallingId,
      unit_name AS unitName,
      member_lcr_member_id AS memberLcrMemberId,
      member_name AS memberName,
      calling_title AS callingTitle,
      is_current AS isCurrent,
      sustained_on AS sustainedOn,
      released_on AS releasedOn,
      row_hash AS rowHash,
      snapshot_data AS snapshotData
     FROM sync_calling_snapshots
     WHERE sync_log_id = ?`
  ).all(syncLogId).map((row) => ({
    ...(row as Omit<CallingSnapshotRow, "snapshotData" | "isCurrent"> & { snapshotData: string; isCurrent: number }),
    isCurrent: (row as { isCurrent: number }).isCurrent === 1,
    snapshotData: parseSnapshotData((row as { snapshotData: string }).snapshotData)
  })) as CallingSnapshotRow[];

const parseToolDateInput = (value: string) => {
  const parsed = parseStakeDate(value);
  if (!parsed) {
    throw new Error(`Invalid date input: ${value}`);
  }
  return parsed.toISOString();
};

const callingOrganizationName = (row: CallingSnapshotRow) => {
  const value = row.snapshotData.organizationName;
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const callingOrganizationKey = (row: CallingSnapshotRow) => {
  const orgId = row.snapshotData.lcrOrganizationId;
  if (typeof orgId === "string" && orgId.trim()) {
    return `org:${orgId.trim()}`;
  }
  const orgName = callingOrganizationName(row);
  return orgName ? `name:${orgName.toLowerCase()}` : "org:none";
};

const buildCallingSlotKey = (row: CallingSnapshotRow) =>
  `${row.unitName ?? "Unknown"}::${callingOrganizationKey(row)}::${normalizeCallingTitleKey(row.callingTitle)}`;

const buildMemberCallingKey = (row: CallingSnapshotRow) =>
  `${row.memberLcrMemberId ?? "unknown"}::${normalizeCallingTitleKey(row.callingTitle)}`;

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

const validCallingGroupIds = new Set<CallingGroupId>(CALLING_GROUP_DEFINITIONS.map((group) => group.id));

const normalizeCallingGroupIds = (value: unknown): CallingGroupId[] => {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      rawValues
        .map((entry) => String(entry).trim())
        .filter((entry): entry is CallingGroupId => validCallingGroupIds.has(entry as CallingGroupId))
    )
  );
};

export const getCallingGroupContactList = async (input: {
  groups?: unknown;
  unit?: string;
  limit?: number;
}) => {
  const groupIds = normalizeCallingGroupIds(input.groups);
  if (groupIds.length === 0 || (groupIds.length === 1 && groupIds[0] === "all_callings")) {
    throw new Error("At least one specific calling group is required.");
  }

  const db = openSqliteSpikeDb();
  try {
    const unit = input.unit?.trim();
    const rows = db.prepare(
      `
      SELECT
        c.lcr_member_id AS lcrMemberId,
        COALESCE(NULLIF(m.preferred_name, ''), TRIM(m.first_name || ' ' || m.last_name)) AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), NULLIF(m.unit_abbreviation, ''), COALESCE(NULLIF(c.unit_name, ''), 'Unknown')) AS unitName,
        c.title AS callingTitle,
        c.organization_name AS organizationName,
        c.sustained_on AS sustainedOn,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber
      FROM callings c
      LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id
      WHERE c.is_current = 1
        AND c.released_on IS NULL
        AND (? IS NULL OR COALESCE(NULLIF(m.unit_name, ''), NULLIF(m.unit_abbreviation, ''), COALESCE(NULLIF(c.unit_name, ''), 'Unknown')) = ?)
      ORDER BY unitName, c.title, m.last_name, m.first_name
      `
    ).all(unit ?? null, unit ?? null) as Array<{
      lcrMemberId: string | null;
      fullName: string | null;
      unitName: string;
      callingTitle: string;
      organizationName: string | null;
      sustainedOn: string | null;
      email: string | null;
      phoneNumber: string | null;
    }>;

    const filtered = rows
      .map((row) => {
        const matchingGroups = groupIds.filter((groupId) =>
          matchesCallingGroup(
            {
              callingTitle: row.callingTitle,
              organizationName: row.organizationName
            },
            groupId
          )
        );

        return {
          ...row,
          groupLabels: CALLING_GROUP_DEFINITIONS.filter((group) => matchingGroups.includes(group.id)).map((group) => group.label)
        };
      })
      .filter((row) => row.groupLabels.length > 0);

    const limit = typeof input.limit === "number" ? input.limit : Number(input.limit ?? 500);
    return filtered.slice(0, Math.max(1, limit));
  } finally {
    db.close();
  }
};

export const peopleContactQuery = async (input: PeopleContactQueryInput = {}): Promise<PeopleContactQueryRow[]> => {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.unit?.trim()) {
    params.push(`%${input.unit.trim()}%`);
    conditions.push(`COALESCE(NULLIF(m.unit_name, ''), u.name, '') LIKE ?`);
  }
  if (typeof input.ageMin === "number") {
    params.push(input.ageMin);
    conditions.push(`m.age >= ?`);
  }
  if (typeof input.ageMax === "number") {
    params.push(input.ageMax);
    conditions.push(`m.age <= ?`);
  }
  if (input.gender?.trim()) {
    params.push(`%${input.gender.trim()}%`);
    conditions.push(`COALESCE(m.gender, '') LIKE ?`);
  }
  if (input.calling?.trim()) {
    params.push(`%${input.calling.trim()}%`);
    conditions.push(`COALESCE(c.title, '') LIKE ?`);
  }
  if (input.organization?.trim()) {
    params.push(`%${input.organization.trim()}%`);
    conditions.push(`COALESCE(c.organization_name, '') LIKE ?`);
  }

  const hasPhone = parseBool(input.hasPhone);
  const hasEmail = parseBool(input.hasEmail);
  const isConvert = parseBool(input.isConvert);
  const isReturnedMissionary = parseBool(input.isReturnedMissionary);
  const seminary = parseBool(input.isAttendingSeminary);
  const institute = parseBool(input.isAttendingInstitute);

  if (hasPhone === true) {
    conditions.push("m.primary_phone IS NOT NULL AND m.primary_phone != ''");
  } else if (hasPhone === false) {
    conditions.push("(m.primary_phone IS NULL OR m.primary_phone = '')");
  }

  if (hasEmail === true) {
    conditions.push("m.primary_email IS NOT NULL AND m.primary_email != ''");
  } else if (hasEmail === false) {
    conditions.push("(m.primary_email IS NULL OR m.primary_email = '')");
  }

  if (typeof isConvert === "boolean") {
    params.push(isConvert ? 1 : 0);
    conditions.push(`COALESCE(m.is_convert, 0) = ?`);
  }

  if (typeof isReturnedMissionary === "boolean") {
    params.push(isReturnedMissionary ? 1 : 0);
    conditions.push(`COALESCE(m.is_returned_missionary, 0) = ?`);
  }

  if (typeof seminary === "boolean") {
    params.push(seminary ? 1 : 0);
    conditions.push(`COALESCE(m.is_attending_seminary, 0) = ?`);
  }

  if (typeof institute === "boolean") {
    params.push(institute ? 1 : 0);
    conditions.push(`COALESCE(m.is_attending_institute, 0) = ?`);
  }

  if (input.templeRecommendStatus?.trim()) {
    params.push(`%${input.templeRecommendStatus.trim()}%`);
    conditions.push(`COALESCE(m.temple_recommend_status, '') LIKE ?`);
  }

  if (input.search?.trim()) {
    const searchParam = `%${input.search.trim()}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    conditions.push(
      `(` +
        `${fullNameExpr} LIKE ? ` +
        `OR COALESCE(c.title, '') LIKE ? ` +
        `OR COALESCE(c.organization_name, '') LIKE ? ` +
        `OR COALESCE(m.primary_email, '') LIKE ? ` +
        `OR COALESCE(m.primary_phone, '') LIKE ?` +
        `)`
    );
  }

  const direction: SortDirection = input.sortDirection === "desc" ? "desc" : "asc";
  const sqlDirection = direction.toUpperCase();
  const sortBy = input.sortBy ?? "unit";
  const orderBy =
    sortBy === "age"
      ? `CASE WHEN m.age IS NULL THEN 1 ELSE 0 END, m.age ${sqlDirection}, COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`
      : sortBy === "name"
        ? `m.last_name ${sqlDirection}, m.first_name ${sqlDirection}`
        : sortBy === "calling"
          ? `COALESCE(c.title, '') ${sqlDirection}, COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`
          : `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ${sqlDirection}, CASE WHEN m.age IS NULL THEN 1 ELSE 0 END, m.age DESC, m.last_name ASC, m.first_name ASC`;

  const safeLimit = Math.max(1, Math.min(input.limit ?? 500, 5000));

  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unitName,
        m.age,
        m.gender,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email,
        c.title AS currentCalling,
        c.organization_name AS organizationName,
        m.mission_status AS missionStatus,
        m.temple_recommend_status AS templeRecommendStatus,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.is_convert AS isConvert,
        m.is_returned_missionary AS isReturnedMissionary,
        m.move_in_date AS moveInDate
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      LEFT JOIN (
        SELECT
          c2.lcr_member_id,
          c2.title,
          c2.organization_name,
          ROW_NUMBER() OVER (PARTITION BY c2.lcr_member_id ORDER BY c2.sustained_on DESC, c2.updated_at DESC) AS rn
        FROM callings c2
        WHERE c2.released_on IS NULL AND c2.is_current = 1
      ) c ON c.lcr_member_id = m.lcr_member_id AND c.rn = 1
      WHERE ${conditions.join("\n        AND ")}
      ORDER BY ${orderBy}
      LIMIT ?
      `
    ).all(...params, safeLimit) as PeopleContactQueryRow[];

    return rows.map((row) => ({
      ...row,
      isAttendingSeminary: row.isAttendingSeminary == null ? null : Boolean(row.isAttendingSeminary),
      isAttendingInstitute: row.isAttendingInstitute == null ? null : Boolean(row.isAttendingInstitute),
      isConvert: row.isConvert == null ? null : Boolean(row.isConvert),
      isReturnedMissionary: row.isReturnedMissionary == null ? null : Boolean(row.isReturnedMissionary),
      currentCalling: cleanCallingTitle(row.currentCalling)
    }));
  } finally {
    db.close();
  }
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

  const db = openSqliteSpikeDb();
  try {
    const unitCondition = unitFilter !== null
      ? `AND COALESCE(NULLIF(m.unit_name, ''), u.name, '') LIKE ?`
      : ``;
    const unitScoreClause = unitFilter !== null
      ? `+ CASE WHEN COALESCE(NULLIF(m.unit_name, ''), u.name, '') LIKE ? THEN 10 ELSE 0 END`
      : ``;

    // Positional params bind in SQL text order: SELECT score clause, then WHERE, then LIMIT.
    // score params
    const sqlParams: unknown[] = [queryText, queryText, searchLike, searchLike, searchLike];
    if (unitFilter !== null) {
      sqlParams.push(unitFilter);
    }
    // where params
    sqlParams.push(queryText, searchLike, searchLike, searchLike);
    if (unitFilter !== null) {
      sqlParams.push(unitFilter);
    }
    sqlParams.push(safeLimit);

    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unitName,
        m.age,
        m.gender,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email,
        h.household_name AS householdName,
        (
          CASE
            WHEN m.lcr_member_id = ? THEN 120
            WHEN LOWER(${fullNameExpr}) = LOWER(?) THEN 100
            WHEN LOWER(${fullNameExpr}) LIKE LOWER(?) THEN 60
            ELSE 0
          END
          + CASE WHEN COALESCE(m.primary_phone, '') LIKE ? THEN 30 ELSE 0 END
          + CASE WHEN COALESCE(m.primary_email, '') LIKE ? THEN 30 ELSE 0 END
          ${unitScoreClause}
        ) AS score
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      LEFT JOIN households h ON m.household_id = h.id
      WHERE (
        m.lcr_member_id = ?
        OR ${fullNameExpr} LIKE ?
        OR COALESCE(m.primary_email, '') LIKE ?
        OR COALESCE(m.primary_phone, '') LIKE ?
      )
        ${unitCondition}
      ORDER BY score DESC, fullName ASC
      LIMIT ?
      `
    ).all(...sqlParams) as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      age: number | null;
      gender: string | null;
      phoneNumber: string | null;
      email: string | null;
      householdName: string | null;
      score: number;
    }>;

    return {
      query: queryText,
      unit: input.unit ?? null,
      count: rows.length,
      candidates: rows
    };
  } finally {
    db.close();
  }
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
    people_contact_query: ["members", "units", "callings"],
    mission_eligible_contact_list: ["members", "units", "callings"],
    sync_diff_report: ["sync_logs", "sync_member_snapshots", "sync_calling_snapshots", "sync_email_snapshots", "sync_phone_snapshots"],
    calling_changes_since: ["sync_logs", "sync_calling_snapshots"],
    leadership_contact_list: ["callings", "members"],
    resolve_member: ["members", "units", "households"]
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
    calling_changes_since: ["requestedSince", "requestedUntil", "baselineSync", "targetSync", "counts", "changes"],
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
      "Name/calling values are matched with LIKE contains logic."
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
    calling_changes_since: [
      "Compares calling slot state at a baseline timestamp to a target timestamp or the latest successful calling snapshot.",
      "Returns only sustained, released, and transferred calling changes instead of broad metadata diffs.",
      "Calling slots are matched by unit, organization, and normalized calling title."
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

  const db = openSqliteSpikeDb();
  try {
    const [vacancies, tenureRows, leaderContacts, newMemberFollowUp] = await Promise.all([
      getVacancies(),
      getLeadershipTenureReport(),
      getLeadershipContactList({ includeSpouses: false, limit: 2000 }),
      getNewMemberContactList({ includeConverts: true, includeMoveIns: true, monthsBack: 6, limit: 1000 })
    ]);

    const duplicateLeaderRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unitName,
        CAST(COUNT(*) AS TEXT) AS leadershipCallingCount,
        GROUP_CONCAT(c.title, ' | ') AS callings
      FROM callings c
      JOIN members m ON c.lcr_member_id = m.lcr_member_id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND (LOWER(c.title) LIKE '%president%' OR LOWER(c.title) LIKE '%bishop%' OR LOWER(c.title) LIKE '%high councilor%')
      GROUP BY m.lcr_member_id, ${fullNameExpr}, COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown')
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, fullName
      LIMIT ?
      `
    ).all(limit) as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      leadershipCallingCount: string;
      callings: string;
    }>;

    const expiringRecommendRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unitName,
        m.temple_recommend_status AS templeRecommendStatus,
        c.title AS callingTitle
      FROM callings c
      JOIN members m ON c.lcr_member_id = m.lcr_member_id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND (LOWER(c.title) LIKE '%president%' OR LOWER(c.title) LIKE '%bishop%' OR LOWER(c.title) LIKE '%high councilor%')
        AND (COALESCE(m.temple_recommend_status, '') NOT LIKE 'Active%' AND COALESCE(m.temple_recommend_status, '') NOT LIKE 'active%')
      ORDER BY unitName, fullName
      LIMIT ?
      `
    ).all(limit) as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      templeRecommendStatus: string | null;
      callingTitle: string;
    }>;

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
        duplicateLeadershipAssignments: duplicateLeaderRows.length,
        leadershipRecommendAttention: expiringRecommendRows.length,
        unassignedNewMembers: unassignedNewMembers.length
      },
      details: {
        leadershipVacancies,
        overTenure,
        noContactLeaders,
        duplicateLeaders: duplicateLeaderRows.map((row) => ({
          ...row,
          leadershipCallingCount: Number.parseInt(row.leadershipCallingCount, 10)
        })),
        recommendAttention: expiringRecommendRows.map((row) => ({
          ...row,
          callingTitle: cleanCallingTitle(row.callingTitle)
        })),
        unassignedNewMembers
      }
    };
  } finally {
    db.close();
  }
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

export const getSyncDiffReport = async (options: { limit?: number } = {}) => {
  return getSqliteSpikeSyncDiffReport(options);
};

export const getCallingChangesSince = async (options: {
  since: string;
  until?: string;
  unit?: string;
  limit?: number;
}): Promise<{
  requestedSince: string;
  requestedUntil: string | null;
  baselineSync: SnapshotLogRow | null;
  targetSync: SnapshotLogRow | null;
  counts: { sustained: number; released: number; transferred: number; total: number };
  changes: Array<{
    changeType: "Sustained" | "Released" | "Transferred";
    unitName: string;
    organizationName: string | null;
    callingTitle: string;
    lcrMemberId: string | null;
    memberName: string | null;
    previousLcrMemberId: string | null;
    previousMemberName: string | null;
    sustainedOn: string | null;
    releasedOn: string | null;
    detectedAt: string | null;
  }>;
}> => {
  const requestedSince = parseToolDateInput(options.since);
  const requestedUntil = options.until ? parseToolDateInput(options.until) : null;
  const limit = Math.max(1, Math.min(options.limit ?? 200, 1000));
  const unitFilter = options.unit?.trim() || null;

  const db = openSqliteSpikeDb();
  try {
    const baselineSync = loadCallingSnapshotLogAtOrBefore(db, requestedSince);
    const targetSync = requestedUntil
      ? loadCallingSnapshotLogAtOrBefore(db, requestedUntil)
      : loadLatestCallingSnapshotLog(db);

    if (!baselineSync || !targetSync) {
      return {
        requestedSince,
        requestedUntil,
        baselineSync,
        targetSync,
        counts: { sustained: 0, released: 0, transferred: 0, total: 0 },
        changes: []
      };
    }

    const baselineRows = loadSqliteCallingSnapshots(db, baselineSync.id).filter((row) => row.isCurrent);
    const targetRows = loadSqliteCallingSnapshots(db, targetSync.id).filter((row) => row.isCurrent);

    const filteredBaselineRows = unitFilter
      ? baselineRows.filter((row) => (row.unitName ?? "Unknown") === unitFilter)
      : baselineRows;
    const filteredTargetRows = unitFilter
      ? targetRows.filter((row) => (row.unitName ?? "Unknown") === unitFilter)
      : targetRows;

    const baselineBySlot = new Map(filteredBaselineRows.map((row) => [buildCallingSlotKey(row), row]));
    const targetBySlot = new Map(filteredTargetRows.map((row) => [buildCallingSlotKey(row), row]));

    const sustained: Array<{
      changeType: "Sustained";
      row: CallingSnapshotRow;
      previous?: CallingSnapshotRow;
    }> = [];
    const released: Array<{
      changeType: "Released";
      row: CallingSnapshotRow;
      next?: CallingSnapshotRow;
    }> = [];
    const transferred: Array<{
      changeType: "Transferred";
      row: CallingSnapshotRow;
      previous: CallingSnapshotRow;
    }> = [];

    const slotKeys = new Set([...baselineBySlot.keys(), ...targetBySlot.keys()]);
    for (const slotKey of slotKeys) {
      const baselineRow = baselineBySlot.get(slotKey);
      const targetRow = targetBySlot.get(slotKey);

      if (!baselineRow && targetRow) {
        sustained.push({ changeType: "Sustained", row: targetRow });
        continue;
      }

      if (baselineRow && !targetRow) {
        released.push({ changeType: "Released", row: baselineRow });
        continue;
      }

      if (
        baselineRow &&
        targetRow &&
        (baselineRow.memberLcrMemberId !== targetRow.memberLcrMemberId || baselineRow.memberName !== targetRow.memberName)
      ) {
        transferred.push({ changeType: "Transferred", row: targetRow, previous: baselineRow });
      }
    }

    const pairedReleaseIndexes = new Set<number>();
    const pairedSustainIndexes = new Set<number>();
    for (const [releaseIndex, releaseChange] of released.entries()) {
      const releaseKey = buildMemberCallingKey(releaseChange.row);
      if (releaseKey.startsWith("unknown::")) {
        continue;
      }
      const sustainIndex = sustained.findIndex((sustainChange, index) => {
        if (pairedSustainIndexes.has(index)) {
          return false;
        }
        return buildMemberCallingKey(sustainChange.row) === releaseKey;
      });
      if (sustainIndex === -1) {
        continue;
      }

      pairedReleaseIndexes.add(releaseIndex);
      pairedSustainIndexes.add(sustainIndex);

      transferred.push({
        changeType: "Transferred",
        row: sustained[sustainIndex].row,
        previous: releaseChange.row
      });
    }

    const changes = [
      ...transferred.map((change) => ({
        changeType: change.changeType,
        unitName: change.row.unitName ?? "Unknown",
        organizationName: callingOrganizationName(change.row),
        callingTitle: cleanCallingTitle(change.row.callingTitle) ?? change.row.callingTitle,
        lcrMemberId: change.row.memberLcrMemberId,
        memberName: change.row.memberName,
        previousLcrMemberId: change.previous.memberLcrMemberId,
        previousMemberName: change.previous.memberName,
        sustainedOn: change.row.sustainedOn,
        releasedOn: change.previous.releasedOn,
        detectedAt: targetSync.completedAt
      })),
      ...sustained
        .filter((_change, index) => !pairedSustainIndexes.has(index))
        .map((change) => ({
          changeType: change.changeType,
          unitName: change.row.unitName ?? "Unknown",
          organizationName: callingOrganizationName(change.row),
          callingTitle: cleanCallingTitle(change.row.callingTitle) ?? change.row.callingTitle,
          lcrMemberId: change.row.memberLcrMemberId,
          memberName: change.row.memberName,
          previousLcrMemberId: null,
          previousMemberName: null,
          sustainedOn: change.row.sustainedOn,
          releasedOn: null,
          detectedAt: targetSync.completedAt
        })),
      ...released
        .filter((_change, index) => !pairedReleaseIndexes.has(index))
        .map((change) => ({
          changeType: change.changeType,
          unitName: change.row.unitName ?? "Unknown",
          organizationName: callingOrganizationName(change.row),
          callingTitle: cleanCallingTitle(change.row.callingTitle) ?? change.row.callingTitle,
          lcrMemberId: change.row.memberLcrMemberId,
          memberName: change.row.memberName,
          previousLcrMemberId: null,
          previousMemberName: null,
          sustainedOn: change.row.sustainedOn,
          releasedOn: change.row.releasedOn,
          detectedAt: targetSync.completedAt
        }))
    ]
      .sort((left, right) => {
        const leftDate = parseStakeDate(left.sustainedOn ?? left.releasedOn ?? left.detectedAt);
        const rightDate = parseStakeDate(right.sustainedOn ?? right.releasedOn ?? right.detectedAt);
        const leftTime = leftDate?.getTime() ?? 0;
        const rightTime = rightDate?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, limit);

    return {
      requestedSince,
      requestedUntil,
      baselineSync,
      targetSync,
      counts: {
        sustained: changes.filter((change) => change.changeType === "Sustained").length,
        released: changes.filter((change) => change.changeType === "Released").length,
        transferred: changes.filter((change) => change.changeType === "Transferred").length,
        total: changes.length
      },
      changes
    };
  } finally {
    db.close();
  }
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

  const db = openSqliteSpikeDb();
  try {
    const placeholders = lcrMemberIds.map(() => "?").join(", ");
    const rows = db.prepare(
      `
      SELECT DISTINCT
        sm.primary_email AS email,
        sm.primary_phone AS phoneNumber
      FROM members m
      JOIN members sm ON sm.household_id = m.household_id AND sm.id != m.id
      WHERE m.lcr_member_id IN (${placeholders})
      `
    ).all(...lcrMemberIds) as Array<{ email: string | null; phoneNumber: string | null }>;

    return {
      emails: dedupeStrings(rows.map((row) => row.email)),
      phones: dedupeStrings(rows.map((row) => row.phoneNumber))
    };
  } finally {
    db.close();
  }
};

export const prepareCommunicationCampaign = async (input: {
  targetType: "calling" | "calling_group" | "organization" | "committee" | "cohort" | "custom" | "people_query";
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
  } else if (input.targetType === "calling_group") {
    const rows = await getCallingGroupContactList({ groups: input.targetValue, limit: 5000 });
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
  targetType: "calling" | "calling_group" | "organization" | "committee" | "cohort" | "custom" | "people_query";
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
  const db = openSqliteSpikeDb();
  try {
    const member = db.prepare(
      `
      SELECT
        m.id,
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unitName,
        m.birthdate,
        m.move_in_date AS moveInDate,
        m.baptism_date AS baptismDate,
        m.confirmation_date AS confirmationDate,
        m.temple_recommend_status AS templeRecommendStatus
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE m.lcr_member_id = ?
         OR ${fullNameExpr} LIKE ?
      ORDER BY CASE WHEN m.lcr_member_id = ? THEN 0 ELSE 1 END
      LIMIT 1
      `
    ).get(memberRef, `%${memberRef}%`, memberRef) as {
      id: number;
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      birthdate: string | null;
      moveInDate: string | null;
      baptismDate: string | null;
      confirmationDate: string | null;
      templeRecommendStatus: string | null;
    } | undefined;

    if (!member) {
      return null;
    }

    const callingRows = db.prepare(
      `
      SELECT
        c.title AS callingTitle,
        c.sustained_on AS sustainedOn,
        c.set_apart_on AS setApartOn,
        c.released_on AS releasedOn,
        c.is_current AS isCurrent,
        c.updated_at AS updatedAt
      FROM callings c
      WHERE c.lcr_member_id = ?
      ORDER BY c.updated_at DESC
      LIMIT 200
      `
    ).all(member.lcrMemberId) as Array<{
      callingTitle: string;
      sustainedOn: string | null;
      setApartOn: string | null;
      releasedOn: string | null;
      isCurrent: number;
      updatedAt: string;
    }>;

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

    for (const row of callingRows) {
      const callingTitle = cleanCallingTitle(row.callingTitle) ?? row.callingTitle;
      const isCurrent = Boolean(row.isCurrent);
      if (row.sustainedOn) {
        events.push({
          date: row.sustainedOn,
          type: "calling_sustained",
          title: `${callingTitle} sustained`,
          details: isCurrent ? "Current" : "Historical"
        });
      }
      if (row.setApartOn) {
        events.push({
          date: row.setApartOn,
          type: "calling_set_apart",
          title: `${callingTitle} set apart`,
          details: isCurrent ? "Current" : "Historical"
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
      return compareStakeDates(left.date, right.date, "desc");
    });

    return {
      member: {
        lcrMemberId: member.lcrMemberId,
        fullName: member.fullName,
        unitName: member.unitName
      },
      timeline: sorted
    };
  } finally {
    db.close();
  }
};

export const getDataQualityWorkbench = async () => {
  const db = openSqliteSpikeDb();
  try {
    const summary = db.prepare(
      `
      SELECT
        CAST(SUM(CASE WHEN (m.primary_phone IS NULL OR m.primary_phone = '') THEN 1 ELSE 0 END) AS TEXT) AS missingPhone,
        CAST(SUM(CASE WHEN (m.primary_email IS NULL OR m.primary_email = '') THEN 1 ELSE 0 END) AS TEXT) AS missingEmail,
        CAST(SUM(CASE WHEN (
          COALESCE(NULLIF(m.address_line1, ''), NULLIF(h.address_line1, '')) IS NULL
          OR COALESCE(NULLIF(m.city, ''), NULLIF(h.city, '')) IS NULL
          OR COALESCE(NULLIF(m.postal_code, ''), NULLIF(h.postal_code, '')) IS NULL
        ) THEN 1 ELSE 0 END) AS TEXT) AS missingAddress,
        CAST(COUNT(*) AS TEXT) AS totalMembers
      FROM members m
      LEFT JOIN households h ON m.household_id = h.id
      `
    ).get() as {
      missingPhone: string;
      missingEmail: string;
      missingAddress: string;
      totalMembers: string;
    };

    const duplicatesByIdentity = db.prepare(
      `
      WITH keyed AS (
        SELECT
          LOWER(REPLACE(REPLACE(REPLACE(${fullNameExpr}, '-', ' '), '.', ' '), ',', ' ')) || '|' || COALESCE(m.birthdate, 'unknown') AS identity_key,
          ${fullNameExpr} AS full_name
        FROM members m
      )
      SELECT
        identity_key AS identityKey,
        CAST(COUNT(*) AS TEXT) AS duplicateCount,
        GROUP_CONCAT(full_name, ' | ') AS members
      FROM keyed
      GROUP BY identity_key
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, identity_key
      LIMIT 50
      `
    ).all() as Array<{
      identityKey: string;
      duplicateCount: string;
      members: string;
    }>;

    const duplicateCallings = db.prepare(
      `
      WITH normalized AS (
        SELECT
          m.lcr_member_id AS lcr_member_id,
          ${fullNameExpr} AS full_name,
          COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unit_name,
          TRIM(LOWER(REPLACE(REPLACE(REPLACE(c.title, '-', ' '), '.', ' '), ',', ' '))) AS title_key
        FROM callings c
        JOIN members m ON c.lcr_member_id = m.lcr_member_id
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE c.released_on IS NULL AND c.is_current = 1
      )
      SELECT
        lcr_member_id AS lcrMemberId,
        full_name AS fullName,
        unit_name AS unitName,
        title_key AS callingTitle,
        CAST(COUNT(*) AS TEXT) AS duplicateCount
      FROM normalized
      GROUP BY lcr_member_id, full_name, unit_name, title_key
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, full_name
      LIMIT 50
      `
    ).all() as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      callingTitle: string;
      duplicateCount: string;
    }>;

    const missingContacts = await getMissingContactDataList({ limit: 100 });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalMembers: Number.parseInt(summary.totalMembers, 10),
        missingPhone: Number.parseInt(summary.missingPhone, 10),
        missingEmail: Number.parseInt(summary.missingEmail, 10),
        missingAddress: Number.parseInt(summary.missingAddress, 10),
        duplicateIdentityGroups: duplicatesByIdentity.length,
        duplicateCallingGroups: duplicateCallings.length
      },
      details: {
        duplicateIdentities: duplicatesByIdentity.map((row) => ({
          ...row,
          duplicateCount: Number.parseInt(row.duplicateCount, 10)
        })),
        duplicateCallings: duplicateCallings.map((row) => ({
          ...row,
          duplicateCount: Number.parseInt(row.duplicateCount, 10),
          callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle
        })),
        missingContactSample: missingContacts
      }
    };
  } finally {
    db.close();
  }
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

  const db = openSqliteSpikeDb();
  try {
    const memberRows = db.prepare(
      `
      SELECT
        ${fullNameExpr} AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unitName
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      ORDER BY m.last_name, m.first_name
      LIMIT 2000
      `
    ).all() as Array<{ fullName: string; unitName: string }>;

    const memberTokens = memberRows
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
  } finally {
    db.close();
  }
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
