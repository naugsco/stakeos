import { loadDashboardData } from "@/lib/dashboardData";
import { query } from "@/src/db/pool";
import { openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import { loadSqliteSpikeDashboardData } from "@/src/sqlite-spike/queries";

export interface SqliteComparisonRow {
  category: string;
  metric: string;
  postgresValue: number;
  sqliteValue: number;
  diff: number;
  note: string | null;
  supported: boolean;
}

export interface SqliteComparisonReport {
  postgresLatestFullSyncAt: string | null;
  sqliteLatestFullSyncAt: string | null;
  rows: SqliteComparisonRow[];
  nonZeroRows: SqliteComparisonRow[];
  supportedRows: SqliteComparisonRow[];
  unsupportedRows: SqliteComparisonRow[];
  exactMatchCount: number;
  nonZeroCount: number;
}

const byLabel = (rows: Array<{ label: string; value: number }>) =>
  new Map(rows.map((row) => [row.label, row.value]));

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const supportedForMetric = (_category: string, _metric: string) => {
  return true;
};

const noteForMetric = (category: string, metric: string, diff: number) => {
  if (diff === 0) {
    return null;
  }

  if (metric === "Members With A Current Calling" || metric === "Members Without A Current Calling") {
    return "This compares member-level calling coverage derived from current_callings_dedup on PostgreSQL and current member-bound callings in the SQLite spike.";
  }

  if (category === "Temple Recommend Health" && metric === "Limited Use") {
    return "SQLite spike explicitly buckets Limited Use recommends. The main dashboard summary may still be collapsing or omitting them.";
  }

  if (metric === "Total Members") {
    return "Check snapshot recency first. SQLite is being compared against the current PostgreSQL snapshot, which may be from a different full-sync run.";
  }

  if (category === "Ministering Coverage Totals" && (metric === "Eligible Active Members" || metric === "No Assigned")) {
    return "This tracks the same -5 member drift as Total Members. Check snapshot recency before treating it as a porting bug.";
  }

  if (category === "Recent Baptisms" || category === "Recommend Expiration Risk") {
    return "Likely a date-boundary or timezone-normalization difference between PostgreSQL SQL and SQLite JavaScript aggregation.";
  }

  if (category === "Seminary / Institute Totals") {
    return "Likely an age-band normalization difference or unit rollup difference.";
  }

  if (category === "Ministering Coverage Totals") {
    return "Likely an active-member filter difference between PostgreSQL SQL and the SQLite spike helper.";
  }

  if (category === "Mission Readiness") {
    return "Likely a cohort eligibility or readiness-scoring difference in the ported logic.";
  }

  return "Needs direct query comparison to identify the exact rule difference.";
};

export const buildSqliteComparisonReport = async (): Promise<SqliteComparisonReport> => {
  const [postgres, sqlite, latestFullSync] = await Promise.all([
    loadDashboardData(),
    loadSqliteSpikeDashboardData(),
    query<{ completedAt: string | null }>(
      `
      SELECT completed_at::text AS "completedAt"
      FROM sync_logs
      WHERE status = 'success'
        AND sync_type = 'nightly_full_directory_sync'
      ORDER BY started_at DESC
      LIMIT 1
      `
    )
  ]);

  const postgresTemple = byLabel(postgres.templeRecommendHealth.statusCounts);
  const sqliteTemple = byLabel(sqlite.templeRecommendHealth);
  const postgresMission = byLabel(postgres.missionReadiness.summary);
  const sqliteMission = byLabel(sqlite.missionReadiness);
  const postgresBaptisms = byLabel(postgres.recentBaptisms.summary);
  const sqliteBaptisms = byLabel(sqlite.recentBaptisms);
  const postgresRecommendRisk = byLabel(postgres.recommendExpirationRisk.summary);
  const sqliteRecommendRisk = byLabel(sqlite.recommendExpirationRisk);

  const postgresSeminaryEligible = sum(postgres.seminaryInstituteByUnit.map((row) => row.seminaryEligible));
  const postgresSeminaryAttending = sum(postgres.seminaryInstituteByUnit.map((row) => row.seminaryAttending));
  const sqliteSeminaryEligible = sum(sqlite.seminaryByUnit.map((row) => row.potential));
  const sqliteSeminaryAttending = sum(sqlite.seminaryByUnit.map((row) => row.actual));

  const postgresInstituteEligible = sum(postgres.seminaryInstituteByUnit.map((row) => row.instituteEligible));
  const postgresInstituteAttending = sum(postgres.seminaryInstituteByUnit.map((row) => row.instituteAttending));
  const sqliteInstituteEligible = sum(sqlite.instituteByUnit.map((row) => row.potential));
  const sqliteInstituteAttending = sum(sqlite.instituteByUnit.map((row) => row.actual));

  const sqliteCurrentCallings = sqlite.overview.currentCallings;

  const postgresMinisteringEligible = sum(postgres.ministeringCoverageByUnit.map((row) => row.eligibleCount));
  const postgresNoAssigned = sum(postgres.ministeringCoverageByUnit.map((row) => row.noAssignedCount));
  const postgresBrothersOnly = sum(postgres.ministeringCoverageByUnit.map((row) => row.brothersOnlyCount));
  const postgresSistersOnly = sum(postgres.ministeringCoverageByUnit.map((row) => row.sistersOnlyCount));
  const postgresBothAssigned = sum(postgres.ministeringCoverageByUnit.map((row) => row.bothAssignedCount));

  const sqliteMinisteringEligible = sum(sqlite.ministeringCoverageByUnit.map((row) => row.eligibleCount));
  const sqliteNoAssigned = sum(sqlite.ministeringCoverageByUnit.map((row) => row.noAssignedCount));
  const sqliteBrothersOnly = sum(sqlite.ministeringCoverageByUnit.map((row) => row.brothersOnlyCount));
  const sqliteSistersOnly = sum(sqlite.ministeringCoverageByUnit.map((row) => row.sistersOnlyCount));
  const sqliteBothAssigned = sum(sqlite.ministeringCoverageByUnit.map((row) => row.bothAssignedCount));

  const spikeDb = openSqliteSpikeDb();
  let sqliteWithCallingCount = 0;
  let sqliteWithoutCallingCount = 0;
  try {
    const coverage = spikeDb
      .prepare(
        `
        SELECT
          SUM(
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM callings c
                WHERE c.is_current = 1
                  AND c.lcr_member_id = m.lcr_member_id
              ) THEN 1
              ELSE 0
            END
          ) AS with_current_calling,
          SUM(
            CASE
              WHEN NOT EXISTS (
                SELECT 1
                FROM callings c
                WHERE c.is_current = 1
                  AND c.lcr_member_id = m.lcr_member_id
              ) THEN 1
              ELSE 0
            END
          ) AS without_current_calling
        FROM members m
        `
      )
      .get() as { with_current_calling: number; without_current_calling: number };
    sqliteWithCallingCount = Number(coverage.with_current_calling ?? 0);
    sqliteWithoutCallingCount = Number(coverage.without_current_calling ?? 0);
  } finally {
    spikeDb.close();
  }

  const rowsBase: Array<Omit<SqliteComparisonRow, "diff" | "note" | "supported">> = [
    { category: "Overview", metric: "Total Members", postgresValue: postgres.overview.totalMembers, sqliteValue: sqlite.overview.totalMembers },
    { category: "Overview", metric: "Current Callings", postgresValue: postgres.overview.currentCallings, sqliteValue: sqliteCurrentCallings },
    { category: "Overview", metric: "Members With A Current Calling", postgresValue: postgres.overview.membersWithCurrentCalling, sqliteValue: sqliteWithCallingCount },
    { category: "Overview", metric: "Members Without A Current Calling", postgresValue: postgres.overview.membersWithoutCurrentCalling, sqliteValue: sqliteWithoutCallingCount },
    { category: "Overview", metric: "Recommend Active", postgresValue: postgresTemple.get("Active") ?? 0, sqliteValue: sqlite.overview.recommendActive },
    { category: "Overview", metric: "Mission Ready", postgresValue: postgresMission.get("Ready") ?? 0, sqliteValue: sqlite.overview.missionReady },
    { category: "Overview", metric: "Recent Baptisms This Year", postgresValue: postgresBaptisms.get("This Year") ?? 0, sqliteValue: sqlite.overview.recentBaptismsThisYear },

    { category: "Temple Recommend Health", metric: "Active", postgresValue: postgresTemple.get("Active") ?? 0, sqliteValue: sqliteTemple.get("Active") ?? 0 },
    { category: "Temple Recommend Health", metric: "Expired", postgresValue: postgresTemple.get("Expired") ?? 0, sqliteValue: sqliteTemple.get("Expired") ?? 0 },
    { category: "Temple Recommend Health", metric: "Limited Use", postgresValue: postgresTemple.get("Limited Use") ?? 0, sqliteValue: sqliteTemple.get("Limited Use") ?? 0 },
    { category: "Temple Recommend Health", metric: "No Status", postgresValue: postgresTemple.get("No Status") ?? 0, sqliteValue: sqliteTemple.get("No Status") ?? 0 },
    { category: "Temple Recommend Health", metric: "Other", postgresValue: postgresTemple.get("Other") ?? 0, sqliteValue: sqliteTemple.get("Other") ?? 0 },

    { category: "Mission Readiness", metric: "Ready", postgresValue: postgresMission.get("Ready") ?? 0, sqliteValue: sqliteMission.get("Ready") ?? 0 },
    { category: "Mission Readiness", metric: "Progressing", postgresValue: postgresMission.get("Progressing") ?? 0, sqliteValue: sqliteMission.get("Progressing") ?? 0 },
    { category: "Mission Readiness", metric: "Needs Focus", postgresValue: postgresMission.get("Needs Focus") ?? 0, sqliteValue: sqliteMission.get("Needs Focus") ?? 0 },

    { category: "Recent Baptisms", metric: "Last 30 Days", postgresValue: postgresBaptisms.get("Last 30 Days") ?? 0, sqliteValue: sqliteBaptisms.get("Last 30 Days") ?? 0 },
    { category: "Recent Baptisms", metric: "Last 90 Days", postgresValue: postgresBaptisms.get("Last 90 Days") ?? 0, sqliteValue: sqliteBaptisms.get("Last 90 Days") ?? 0 },
    { category: "Recent Baptisms", metric: "This Year", postgresValue: postgresBaptisms.get("This Year") ?? 0, sqliteValue: sqliteBaptisms.get("This Year") ?? 0 },

    { category: "Recommend Expiration Risk", metric: "Expired", postgresValue: postgresRecommendRisk.get("Expired") ?? 0, sqliteValue: sqliteRecommendRisk.get("Expired") ?? 0 },
    { category: "Recommend Expiration Risk", metric: "Next 30 Days", postgresValue: postgresRecommendRisk.get("Next 30 Days") ?? 0, sqliteValue: sqliteRecommendRisk.get("Next 30 Days") ?? 0 },
    { category: "Recommend Expiration Risk", metric: "31-90 Days", postgresValue: postgresRecommendRisk.get("31-90 Days") ?? 0, sqliteValue: sqliteRecommendRisk.get("31-90 Days") ?? 0 },

    { category: "Seminary / Institute Totals", metric: "Seminary Eligible", postgresValue: postgresSeminaryEligible, sqliteValue: sqliteSeminaryEligible },
    { category: "Seminary / Institute Totals", metric: "Seminary Attending", postgresValue: postgresSeminaryAttending, sqliteValue: sqliteSeminaryAttending },
    { category: "Seminary / Institute Totals", metric: "Institute Eligible", postgresValue: postgresInstituteEligible, sqliteValue: sqliteInstituteEligible },
    { category: "Seminary / Institute Totals", metric: "Institute Attending", postgresValue: postgresInstituteAttending, sqliteValue: sqliteInstituteAttending },

    { category: "Ministering Coverage Totals", metric: "Eligible Active Members", postgresValue: postgresMinisteringEligible, sqliteValue: sqliteMinisteringEligible },
    { category: "Ministering Coverage Totals", metric: "No Assigned", postgresValue: postgresNoAssigned, sqliteValue: sqliteNoAssigned },
    { category: "Ministering Coverage Totals", metric: "Brothers Only", postgresValue: postgresBrothersOnly, sqliteValue: sqliteBrothersOnly },
    { category: "Ministering Coverage Totals", metric: "Sisters Only", postgresValue: postgresSistersOnly, sqliteValue: sqliteSistersOnly },
    { category: "Ministering Coverage Totals", metric: "Both Assigned", postgresValue: postgresBothAssigned, sqliteValue: sqliteBothAssigned }
  ];

  const rows = rowsBase.map((row) => {
    const diff = row.sqliteValue - row.postgresValue;
    const supported = supportedForMetric(row.category, row.metric);
    return {
      ...row,
      diff,
      supported,
      note: noteForMetric(row.category, row.metric, diff)
    };
  });

  const supportedRows = rows.filter((row) => row.supported);
  const unsupportedRows = rows.filter((row) => !row.supported);
  const nonZeroRows = supportedRows.filter((row) => row.diff !== 0);

  return {
    postgresLatestFullSyncAt: latestFullSync.rows[0]?.completedAt ?? null,
    sqliteLatestFullSyncAt: sqlite.status.latestSyncCompletedAt,
    rows,
    supportedRows,
    unsupportedRows,
    nonZeroRows,
    exactMatchCount: supportedRows.length - nonZeroRows.length,
    nonZeroCount: nonZeroRows.length
  };
};
