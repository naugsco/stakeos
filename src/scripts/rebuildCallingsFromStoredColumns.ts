import { pool, query } from "@/src/db/pool";
import { persistCallingSnapshot } from "@/src/sync/persist";
import type { CallingRecord, OrganizationRecord, UnitRecord } from "@/src/types/directory";
import { stableHash } from "@/src/utils/hash";
import { normalizeWhitespace } from "@/src/utils/text";

const toIsoDate = (input?: string): string | undefined => {
  if (!input) {
    return undefined;
  }
  const cleaned = input.trim();
  if (!cleaned) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = Number.parseInt(slashMatch[1], 10);
    const day = Number.parseInt(slashMatch[2], 10);
    let year = Number.parseInt(slashMatch[3], 10);
    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
};

const normalizeCallingTitleForKey = (value: string): string =>
  normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/\b\d{1,2}\s+[a-z]{3,9}\s+\d{4}\b/g, " ")
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " ")
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
      .replace(/\/\s*(yes|no)(?=[a-z]|[A-Z]|\b|$)/g, " ")
      .replace(/\b(set\s*apart|sustain(?:ed)?)\b/g, " ")
      .replace(/\bwith\s+date\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
  );

const parseDatedCallingEntries = (
  rawValue?: string
): Array<{ title: string; calledOn?: string; sustained: boolean }> => {
  if (!rawValue) {
    return [];
  }

  const value = normalizeWhitespace(rawValue);
  if (!value) {
    return [];
  }

  const datePattern = String.raw`(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})`;
  const entryPattern = new RegExp(String.raw`([^()]+?)\s*\(\s*${datePattern}\s*\/\s*(Yes|No)\s*\)`, "gi");

  const entries: Array<{ title: string; calledOn?: string; sustained: boolean }> = [];
  for (const match of value.matchAll(entryPattern)) {
    const rawTitle = normalizeWhitespace(match[1]).replace(/\bwith\s+date\b/gi, "").replace(/[\/\-,]+$/, "");
    const title = normalizeWhitespace(rawTitle);
    if (!title) {
      continue;
    }
    entries.push({
      title,
      calledOn: toIsoDate(match[2]),
      sustained: (match[3] ?? "Yes").toLowerCase() === "yes"
    });
  }

  return entries;
};

const main = async () => {
  const unitsResult = await query<{
    unitNumber: string;
    name: string;
    unitType: string | null;
  }>(`
    SELECT
      unit_number AS "unitNumber",
      name,
      unit_type AS "unitType"
    FROM units
    ORDER BY name
  `);

  const units: UnitRecord[] = unitsResult.rows.map((row) => ({
    unitNumber: row.unitNumber,
    name: row.name,
    unitType: row.unitType ?? undefined
  }));

  const membersResult = await query<{
    lcrMemberId: string;
    unitNumber: string;
    callingsWithDatesText: string | null;
  }>(`
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      COALESCE(u.unit_number, '000000') AS "unitNumber",
      m.callings_with_dates_text AS "callingsWithDatesText"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
  `);

  const callingsMap = new Map<string, CallingRecord>();
  for (const member of membersResult.rows) {
    const entries = parseDatedCallingEntries(member.callingsWithDatesText ?? undefined);
    if (!entries.length) {
      continue;
    }

    for (const entry of entries) {
      const titleKey = normalizeCallingTitleForKey(entry.title) || normalizeWhitespace(entry.title.toLowerCase());
      if (!titleKey) {
        continue;
      }

      const lcrCallingId = `generated-calling-${stableHash(`${member.lcrMemberId}:${titleKey}`)}`;
      const nextRecord: CallingRecord = {
        lcrCallingId,
        unitNumber: member.unitNumber,
        lcrMemberId: member.lcrMemberId,
        title: entry.title,
        sustainedOn: entry.calledOn,
        isCurrent: entry.sustained
      };

      const existing = callingsMap.get(lcrCallingId);
      if (!existing) {
        callingsMap.set(lcrCallingId, nextRecord);
        continue;
      }

      if (nextRecord.isCurrent && !existing.isCurrent) {
        callingsMap.set(lcrCallingId, nextRecord);
        continue;
      }

      if (nextRecord.isCurrent === existing.isCurrent) {
        const existingDate = existing.sustainedOn ? new Date(existing.sustainedOn).getTime() : -1;
        const nextDate = nextRecord.sustainedOn ? new Date(nextRecord.sustainedOn).getTime() : -1;
        if (nextDate > existingDate) {
          callingsMap.set(lcrCallingId, nextRecord);
        }
      }
    }
  }

  const callings = Array.from(callingsMap.values());
  const organizationsMap = new Map<string, OrganizationRecord>();
  for (const calling of callings) {
    const organizationName =
      calling.title.split("-")[0]?.trim() ??
      calling.title.split("(")[0]?.trim() ??
      "Uncategorized";
    const lcrOrganizationId = `generated-org-${stableHash(organizationName)}`;
    organizationsMap.set(lcrOrganizationId, {
      lcrOrganizationId,
      unitNumber: calling.unitNumber,
      name: organizationName,
      category: "Derived from stored callings_with_dates_text"
    });
  }

  const result = await persistCallingSnapshot("local_calling_rebuild", {
    units,
    organizations: Array.from(organizationsMap.values()),
    callings
  });

  console.log(
    `Calling rebuild complete. Parsed callings=${callings.length}, organizations=${organizationsMap.size}, records processed=${result.recordsProcessed}`
  );
  await pool.end();
};

main().catch(async (error) => {
  console.error("Calling rebuild failed", error);
  await pool.end();
  process.exit(1);
});
