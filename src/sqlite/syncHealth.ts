import type Database from "better-sqlite3";
import type { MemberRecord } from "@/src/types/directory";

// A silent column-mapping break looks exactly like a successful sync: every row still
// imports, one field just arrives empty. That happened on 2026-05-04 when LCR switched to
// machine-key headers and the ministering aliases stopped matching, and it went unnoticed
// for four months. These guards compare the incoming scrape against what is already stored
// and refuse the write when a field that used to be populated arrives completely empty.
type GuardedField = {
  key: keyof MemberRecord;
  column: string;
  kind: "flag" | "text";
};

// Seminary and institute enrolment are deliberately absent: they legitimately fall to zero
// stake-wide over the summer when seminary is not in session, so guarding them would fail
// every sync between June and September.
const GUARDED_FIELDS: GuardedField[] = [
  { key: "ministeringBrothers", column: "ministering_brothers", kind: "text" },
  { key: "ministeringSisters", column: "ministering_sisters", kind: "text" },
  { key: "hasMinisteringBrothers", column: "has_ministering_brothers", kind: "flag" },
  { key: "hasMinisteringSisters", column: "has_ministering_sisters", kind: "flag" },
  { key: "isBornInCovenant", column: "is_born_in_covenant", kind: "flag" },
  { key: "isReturnedMissionary", column: "is_returned_missionary", kind: "flag" },
  { key: "isConvert", column: "is_convert", kind: "flag" },
  { key: "missionCountry", column: "mission_country", kind: "text" },
  { key: "baptismDate", column: "baptism_date", kind: "text" },
  { key: "confirmationDate", column: "confirmation_date", kind: "text" },
  { key: "moveInDate", column: "move_in_date", kind: "text" },
  { key: "templeRecommendStatus", column: "temple_recommend_status", kind: "text" },
  { key: "priesthoodOffice", column: "priesthood_office", kind: "text" },
  { key: "sealingToParents", column: "sealing_to_parents", kind: "text" },
  { key: "spouseName", column: "spouse_name", kind: "text" },
  { key: "callingsText", column: "callings_text", kind: "text" }
];

// Below this the stored coverage is too thin to tell a real regression from ordinary churn.
const MIN_STORED_COVERAGE = 25;

export interface CoverageCollapse {
  field: string;
  column: string;
  storedCount: number;
  incomingCount: number;
}

const countIncoming = (members: MemberRecord[], field: GuardedField) =>
  members.reduce((total, member) => {
    const value = member[field.key];
    if (field.kind === "flag") {
      return value === true ? total + 1 : total;
    }
    return typeof value === "string" && value.trim() !== "" ? total + 1 : total;
  }, 0);

const countStored = (db: Database.Database, field: GuardedField) => {
  const predicate =
    field.kind === "flag"
      ? `${field.column} = 1`
      : `NULLIF(TRIM(COALESCE(${field.column}, '')), '') IS NOT NULL`;
  const row = db.prepare(`SELECT COUNT(*) AS count FROM members WHERE ${predicate}`).get() as { count: number };
  return row.count;
};

export const findCoverageCollapses = (db: Database.Database, members: MemberRecord[]): CoverageCollapse[] => {
  if (members.length === 0) {
    return [];
  }

  const collapses: CoverageCollapse[] = [];
  for (const field of GUARDED_FIELDS) {
    const storedCount = countStored(db, field);
    if (storedCount < MIN_STORED_COVERAGE) {
      continue;
    }

    const incomingCount = countIncoming(members, field);
    if (incomingCount === 0) {
      collapses.push({ field: String(field.key), column: field.column, storedCount, incomingCount });
    }
  }

  return collapses;
};

export const assertMemberCoverageDidNotCollapse = (db: Database.Database, members: MemberRecord[]) => {
  const collapses = findCoverageCollapses(db, members);
  if (collapses.length === 0) {
    return;
  }

  const detail = collapses
    .map((c) => `  ${c.field} (${c.column}): ${c.storedCount} stored -> 0 incoming`)
    .join("\n");

  throw new Error(
    `Refusing to persist: ${collapses.length} field(s) that are populated in the database arrived empty.\n` +
      `${detail}\n` +
      "This usually means an LCR report column was renamed, removed, or is now served under a " +
      "machine key the parser does not recognise. The stored data has been left untouched. " +
      "Check the report's columns and the aliases in src/sync/lcrScraper.ts before re-running."
  );
};
