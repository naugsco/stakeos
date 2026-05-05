import path from "node:path";
import { chromium, type Page } from "playwright";
import { env } from "@/src/config/env";
import type {
  CallingRecord,
  DirectorySnapshot,
  HouseholdRecord,
  MemberRecord,
  MeetingAssignmentRecord,
  OrganizationRecord,
  UnitRecord
} from "@/src/types/directory";
import { asBoolean, normalizeWhitespace } from "@/src/utils/text";
import { stableHash } from "@/src/utils/hash";

export interface ScrapedTable {
  headers: string[];
  rows: Record<string, string>[];
}

interface RawExtraction {
  tables: ScrapedTable[];
  payloadObjects: Record<string, unknown>[];
}

const defaultUnit: UnitRecord = {
  unitNumber: env.UNIT_NUMBER,
  name: env.STAKE_NAME,
  unitType: "Stake"
};

const deriveSyntheticUnitNumber = (unitName?: string, unitAbbreviation?: string) => {
  const label = normalizeWhitespace(unitName ?? unitAbbreviation ?? "").trim();
  if (!label) {
    return env.UNIT_NUMBER;
  }

  return `generated-unit-${stableHash(label.toLowerCase()).slice(0, 12)}`;
};

const inferUnitType = (unitName?: string) => {
  const label = normalizeWhitespace(unitName ?? "").trim();
  if (!label) {
    return "Unit";
  }
  if (/branch/i.test(label)) {
    return "Branch";
  }
  if (/ward/i.test(label)) {
    return "Ward";
  }
  return "Unit";
};

const buildUnitsFromMembers = (members: MemberRecord[]): UnitRecord[] => {
  const units = new Map<string, UnitRecord>();

  for (const member of members) {
    const unitName = normalizeWhitespace(member.unitName ?? member.unitAbbreviation ?? "").trim();
    if (!unitName) {
      continue;
    }

    if (!units.has(member.unitNumber)) {
      units.set(member.unitNumber, {
        unitNumber: member.unitNumber,
        name: unitName,
        unitType: inferUnitType(unitName)
      });
    }
  }

  return units.size > 0
    ? Array.from(units.values()).sort((left, right) => left.name.localeCompare(right.name))
    : [defaultUnit];
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\be\s+mail\b/g, "email")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const collapseRepeatedText = (value: string): string => {
  const cleaned = normalizeWhitespace(value);
  if (!cleaned) {
    return cleaned;
  }

  let current = cleaned;
  while (current.length % 2 === 0) {
    const midpoint = current.length / 2;
    const firstHalf = current.slice(0, midpoint);
    const secondHalf = current.slice(midpoint);
    if (firstHalf !== secondHalf || firstHalf.length < 3 || !/[a-z]/i.test(firstHalf)) {
      break;
    }
    current = firstHalf.trim();
  }

  return current;
};

const stripAliasPrefix = (value: string, aliases: string[]): string => {
  let output = value;
  let changed = true;

  while (changed) {
    changed = false;
    for (const alias of aliases) {
      if (!alias) {
        continue;
      }

      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
      const nextOutput = output.replace(new RegExp(`^${escapedAlias}\\s*`, "i"), "").trim();
      if (nextOutput !== output) {
        output = nextOutput;
        changed = true;
      }
    }
  }

  return output;
};

const normalizeDense = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const matchAliasScore = (rawKey: string, alias: string, strict: boolean): number => {
  const normalizedKey = normalizeKey(collapseRepeatedText(rawKey));
  const normalizedAlias = normalizeKey(alias);
  const denseKey = normalizeDense(collapseRepeatedText(rawKey));
  const denseAlias = normalizeDense(normalizedAlias);

  if ((!normalizedKey && !denseKey) || !normalizedAlias) {
    return -1;
  }

  if (normalizedKey === normalizedAlias || denseKey === denseAlias || denseKey === `${denseAlias}${denseAlias}`) {
    return 100;
  }

  // LCR custom reports can expose machine-prefixed headers, e.g. "record.individual.email".
  // Treat those as strict matches for the friendly aliases used by the importer.
  if (normalizedKey.endsWith(` ${normalizedAlias}`) || (denseAlias.length >= 6 && denseKey.endsWith(denseAlias))) {
    return strict ? 85 : 50;
  }

  if (strict && normalizedKey.includes(normalizedAlias) && normalizedAlias.length >= 8) {
    return 65;
  }

  if (strict) {
    return -1;
  }

  if (normalizedKey.startsWith(`${normalizedAlias} `)) {
    return 70;
  }

  if (normalizedKey.endsWith(` ${normalizedAlias}`)) {
    return 50;
  }

  if (normalizedAlias.includes(normalizedKey) && normalizedKey.length >= 8) {
    return 25;
  }

  if (normalizedKey.includes(normalizedAlias) && normalizedAlias.length >= 8) {
    return 10;
  }

  return -1;
};

const valueFromRow = (row: Record<string, unknown>, aliases: string[], options?: { strict?: boolean }): string | undefined => {
  const normalizedAliases = aliases.map(normalizeKey);
  const strict = options?.strict ?? false;
  let bestMatch: { value: string; score: number } | undefined;

  for (const [key, value] of Object.entries(row)) {
    if (typeof value !== "string") {
      continue;
    }

    const cleanedKey = collapseRepeatedText(key);
    const score = normalizedAliases.reduce((highest, alias) => Math.max(highest, matchAliasScore(cleanedKey, alias, strict)), -1);
    if (score < 0) {
      continue;
    }

    const cleaned = stripAliasPrefix(collapseRepeatedText(normalizeWhitespace(value)), [cleanedKey, ...aliases]);
    if (!cleaned) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { value: cleaned, score };
    }
  }

  return bestMatch?.value;
};

const toNumber = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeName = (value?: string) => {
  if (!value) {
    return { firstName: "Unknown", lastName: "Member", preferredName: undefined };
  }

  const cleaned = normalizeWhitespace(value);
  if (cleaned.includes(",")) {
    const [lastNamePart, firstNamePart] = cleaned.split(",").map((part) => part.trim());
    return {
      firstName: firstNamePart || "Unknown",
      lastName: lastNamePart || "Member",
      preferredName: cleaned
    };
  }

  const parts = cleaned.split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "Unknown",
    lastName: parts.slice(1).join(" ") || "Member",
    preferredName: cleaned
  };
};

const tableHasHeader = (table: ScrapedTable, aliases: string[]): boolean =>
  table.headers.some((header) => aliases.some((alias) => matchAliasScore(header, alias, true) >= 0));

export const parseReportMembersFromTables = (tables: ScrapedTable[]): MemberRecord[] => {
  const members = new Map<string, MemberRecord>();

  const reportTables = tables.filter(
    (table) =>
      tableHasHeader(table, ["Preferred Name", "record.preferred.name", "Name"]) &&
      tableHasHeader(table, ["Individual E-mail", "Individual Email", "record.individual.email", "Email"])
  );

  for (const table of reportTables) {
    for (const row of table.rows) {
      const preferredName = valueFromRow(row, ["Preferred Name", "record.preferred.name", "Name"], { strict: true });
      if (!preferredName) {
        continue;
      }

      const email = valueFromRow(row, ["Individual E-mail", "Individual Email", "record.individual.email", "Email"], { strict: true });
      const phone = valueFromRow(row, ["Individual Phone", "record.individual.phone", "Phone"], { strict: true });
      const unitName = valueFromRow(row, ["Unit", "custom-reports.unit"], { strict: true });
      const unitAbbreviation = valueFromRow(row, ["Unit Abbreviation", "custom-reports.unit.abbreviation"], { strict: true });
      const unitNumber = deriveSyntheticUnitNumber(unitName, unitAbbreviation);

      const memberId =
        valueFromRow(row, ["Individual ID", "Member ID", "Person ID"], { strict: true }) ??
        `generated-member-${stableHash(`${preferredName}|${email ?? ""}|${phone ?? ""}|${unitName ?? ""}`)}`;

      const { firstName, lastName } = normalizeName(preferredName);
      const addressLine1 = valueFromRow(row, ["Address - Street 1", "custom-reports.address.street1"], { strict: true });
      const addressLine2 = valueFromRow(row, ["Address - Street 2", "custom-reports.address.street2"], { strict: true });
      const addressCity = valueFromRow(row, ["Address - City", "custom-reports.address.city"], { strict: true });
      const addressStateOrProvince = valueFromRow(
        row,
        ["Address - State or Province", "Address - State", "custom-reports.address.state"],
        { strict: true }
      );
      const addressPostalCode = valueFromRow(row, ["Address - Postal Code", "custom-reports.address.postal.code"], { strict: true });
      const addressCountry = valueFromRow(row, ["Address - Country", "custom-reports.address.country"], { strict: true });
      const headOfHouse = valueFromRow(row, ["Head of House", "custom-reports.head.of.house"], { strict: true });
      const householdPosition = valueFromRow(row, ["Household Position", "custom-reports.household.position"], { strict: true });

      const householdSource = `${headOfHouse ?? lastName}|${addressLine1 ?? ""}|${addressCity ?? ""}|${addressPostalCode ?? ""}|${addressCountry ?? ""}|${unitName ?? ""}`;
      const lcrHouseholdId = `generated-household-${stableHash(householdSource)}`;

      const profileData = Object.fromEntries(
        Object.entries(row)
          .map(([key, value]) => {
            const cleanedKey = collapseRepeatedText(normalizeWhitespace(key));
            const cleanedValue = stripAliasPrefix(
              collapseRepeatedText(normalizeWhitespace(typeof value === "string" ? value : "")),
              [cleanedKey]
            );
            return [cleanedKey, cleanedValue];
          })
          .filter((entry) => entry[0] && entry[1])
      );

      const isEndowedFlag = asBoolean(valueFromRow(row, ["Is Endowed"], { strict: true }));
      const hasEndowmentStatus = /endowed/i.test(valueFromRow(row, ["Endowment Status"], { strict: true }) ?? "");
      const templeEndowed = isEndowedFlag ?? (hasEndowmentStatus ? true : undefined);

      const record: MemberRecord = {
        lcrMemberId: memberId,
        lcrHouseholdId,
        unitNumber,
        unitName,
        unitAbbreviation,
        preferredName,
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        addressCity,
        addressStateOrProvince,
        addressPostalCode,
        addressCountry,
        age: toNumber(valueFromRow(row, ["Age"], { strict: true })),
        gender: valueFromRow(row, ["Gender"], { strict: true }),
        birthdate: valueFromRow(row, ["Birth Date (1 Jan 1990)", "Birth Date", "custom-reports.birth.date.with.example"], {
          strict: true
        }),
        birthCountry: valueFromRow(row, ["Birth Country"], { strict: true }),
        birthplace: valueFromRow(row, ["Birthplace"], { strict: true }),
        moveInDate: valueFromRow(row, ["Move In Date"], { strict: true }),
        isConvert: asBoolean(valueFromRow(row, ["Is Convert"], { strict: true })),
        isWidowed: asBoolean(valueFromRow(row, ["Is Widowed"], { strict: true })),
        isReturnedMissionary: asBoolean(valueFromRow(row, ["Is Returned Missionary"], { strict: true })),
        isAccountable: asBoolean(valueFromRow(row, ["Is Accountable"], { strict: true })),
        isBornInCovenant: asBoolean(valueFromRow(row, ["Is Born in Covenant"], { strict: true })),
        isDivorced: asBoolean(valueFromRow(row, ["Is Divorced"], { strict: true })),
        isMarried: asBoolean(valueFromRow(row, ["Is Married"], { strict: true })),
        hasChildren: asBoolean(valueFromRow(row, ["Has Children"], { strict: true })),
        isSealedToParents: asBoolean(valueFromRow(row, ["Is Sealed to Parents"], { strict: true })),
        isSingle: asBoolean(valueFromRow(row, ["Is Single"], { strict: true })),
        isSealedToSpouse: asBoolean(valueFromRow(row, ["Is Sealed to a Spouse"], { strict: true })),
        isSealedToCurrentSpouse: asBoolean(valueFromRow(row, ["Is Sealed to Current Spouse"], { strict: true })),
        isSealedToPriorSpouse: asBoolean(valueFromRow(row, ["Is Sealed to a Prior Spouse"], { strict: true })),
        baptismDate: valueFromRow(row, ["Baptism Date"], { strict: true }),
        confirmationDate: valueFromRow(row, ["Confirmation Date"], { strict: true }),
        endowmentDate: valueFromRow(row, ["Endowment Date"], { strict: true }),
        templeEndowed,
        endowmentStatus: valueFromRow(row, ["Endowment Status"], { strict: true }),
        templeRecommendStatus: valueFromRow(row, ["Temple Recommend Status"], { strict: true }),
        templeRecommendExpirationDate: valueFromRow(row, ["Temple Recommend Expiration Date"], { strict: true }),
        templeRecommendType: valueFromRow(row, ["Temple Recommend Type"], { strict: true }),
        missionLanguage: valueFromRow(row, ["Mission Language"], { strict: true }),
        missionCountry: valueFromRow(row, ["Mission Country"], { strict: true }),
        missionStatus: valueFromRow(row, ["Mission"], { strict: true }),
        priesthoodType: valueFromRow(row, ["Priesthood"], { strict: true }),
        priesthoodOffice: valueFromRow(row, ["Priesthood office"], { strict: true }),
        callingsText: valueFromRow(row, ["Callings"], { strict: true }),
        callingsWithDatesText: valueFromRow(
          row,
          ["Callings with Date Sustained and Set Apart", "custom-reports.callings.with.date.sustained.and.set.apart"],
          { strict: true }
        ),
        instituteStatus: valueFromRow(row, ["Institute Status"], { strict: true }),
        seminaryStatus: valueFromRow(row, ["Seminary Status"], { strict: true }),
        isAttendingSeminary: asBoolean(valueFromRow(row, ["Is Attending Seminary"], { strict: true })),
        isAttendingInstitute: asBoolean(valueFromRow(row, ["Is Attending Institute"], { strict: true })),
        potentialInstituteStudent: asBoolean(valueFromRow(row, ["Potential Institute Student"], { strict: true })),
        potentialSeminaryStudent: asBoolean(valueFromRow(row, ["Potential Seminary Student"], { strict: true })),
        hasMinisteringSisters: asBoolean(valueFromRow(row, ["Has Ministering Sisters"], { strict: true })),
        hasMinisteringBrothers: asBoolean(valueFromRow(row, ["Has Ministering Brothers"], { strict: true })),
        ministeringBrothers: valueFromRow(row, ["Ministering Brothers"], { strict: true }),
        ministeringSisters: valueFromRow(row, ["Ministering Sisters"], { strict: true }),
        ordinationDate: valueFromRow(row, ["Ordination Date"], { strict: true }),
        marriageDate: valueFromRow(row, ["Marriage Date"], { strict: true }),
        marriageStatus: valueFromRow(row, ["Marriage Status"], { strict: true }),
        sealingToParents: valueFromRow(row, ["Sealing to Parents"], { strict: true }),
        sealingToSpouse: valueFromRow(row, ["Sealing to Spouse"], { strict: true }),
        spouseName: valueFromRow(row, ["Spouse Name"], { strict: true }),
        headOfHouse,
        householdPosition,
        profileData,
        emails: email ? [{ email, isPrimary: true }] : [],
        phoneNumbers: phone ? [{ phoneNumber: phone, isPrimary: true, canText: true }] : [],
        priesthood: {
          currentOffice: valueFromRow(row, ["Priesthood office"], { strict: true }),
          officeDate: valueFromRow(row, ["Ordination Date"], { strict: true })
        }
      };

      members.set(memberId, record);
    }
  }

  return Array.from(members.values());
};

const getFallbackMembersFromPayload = (payloadObjects: Record<string, unknown>[]): MemberRecord[] => {
  const members = new Map<string, MemberRecord>();

  for (const payload of payloadObjects) {
    const memberId =
      valueFromRow(payload, ["memberid", "individualid", "personid", "id"]) ??
      `generated-member-${stableHash(JSON.stringify(payload))}`;

    const nameCandidate =
      valueFromRow(payload, ["preferredname", "displayname", "name", "fullname"]) ??
      `${valueFromRow(payload, ["firstname"]) ?? "Unknown"} ${valueFromRow(payload, ["lastname"]) ?? "Member"}`;

    if (!nameCandidate || nameCandidate.toLowerCase().includes("organization")) {
      continue;
    }

    const { firstName, lastName, preferredName } = normalizeName(nameCandidate);
    const unitName = valueFromRow(payload, ["unitname", "unit", "ward", "branch"]);
    const unitAbbreviation = valueFromRow(payload, ["unitabbreviation", "unit abbreviation"]);
    const unitNumber = deriveSyntheticUnitNumber(unitName, unitAbbreviation);

    if (!members.has(memberId)) {
      members.set(memberId, {
        lcrMemberId: memberId,
        lcrHouseholdId: valueFromRow(payload, ["householdid"]),
        unitNumber,
        unitName,
        unitAbbreviation,
        preferredName,
        firstName,
        lastName,
        middleName: valueFromRow(payload, ["middlename"]),
        gender: valueFromRow(payload, ["gender", "sex"]),
        birthdate: valueFromRow(payload, ["birth", "dob"]),
        age: toNumber(valueFromRow(payload, ["age"])),
        memberStatus: valueFromRow(payload, ["status"]),
        isConvert: asBoolean(valueFromRow(payload, ["convert"])),
        baptismDate: valueFromRow(payload, ["baptism"]),
        confirmationDate: valueFromRow(payload, ["confirmation"]),
        templeEndowed: asBoolean(valueFromRow(payload, ["endowed"])),
        missionStatus: valueFromRow(payload, ["mission"]),
        missionLanguage: valueFromRow(payload, ["missionlanguage"]),
        missionCountry: valueFromRow(payload, ["missioncountry"]),
        priesthoodOffice: valueFromRow(payload, ["office", "priesthood"]),
        emails: [],
        phoneNumbers: [],
        priesthood: {
          currentOffice: valueFromRow(payload, ["office", "priesthood"]),
          officeDate: valueFromRow(payload, ["ordain", "office date"]),
          melchizedekPriesthoodDate: valueFromRow(payload, ["melchizedek"]),
          aaronicPriesthoodDate: valueFromRow(payload, ["aaronic"]),
          ordainedBy: valueFromRow(payload, ["ordained by"])
        }
      });
    }

    const member = members.get(memberId)!;
    const email = valueFromRow(payload, ["email"]);
    if (email && !member.emails.some((item) => item.email === email)) {
      member.emails.push({ email, isPrimary: true });
    }

    const phone = valueFromRow(payload, ["phone", "mobile", "cell"]);
    if (phone && !member.phoneNumbers.some((item) => item.phoneNumber === phone)) {
      member.phoneNumbers.push({ phoneNumber: phone, isPrimary: true, canText: true });
    }
  }

  return Array.from(members.values());
};

const parseMembers = (tables: ScrapedTable[], payloadObjects: Record<string, unknown>[]): MemberRecord[] => {
  const reportMembers = parseReportMembersFromTables(tables);
  if (reportMembers.length > 0) {
    return reportMembers;
  }

  if (env.LCR_DIRECTORY_URL.includes("/custom-reports-details/")) {
    return [];
  }

  return getFallbackMembersFromPayload(payloadObjects);
};

const parseHouseholds = (members: MemberRecord[], payloadObjects: Record<string, unknown>[]): HouseholdRecord[] => {
  const households = new Map<string, HouseholdRecord>();

  for (const member of members) {
    if (!member.lcrHouseholdId) {
      continue;
    }

      households.set(member.lcrHouseholdId, {
        lcrHouseholdId: member.lcrHouseholdId,
        unitNumber: member.unitNumber,
        householdName: member.headOfHouse ? `${member.headOfHouse} Household` : `${member.lastName} Household`,
        addressLine1: member.addressLine1,
        addressLine2: member.addressLine2,
        city: member.addressCity,
        state: member.addressStateOrProvince,
        postalCode: member.addressPostalCode,
        country: member.addressCountry
      });
  }

  if (households.size > 0) {
    return Array.from(households.values());
  }

  for (const payload of payloadObjects) {
    const maybeHouseholdId = valueFromRow(payload, ["householdid", "familyid"]);
    const hasAddress = Boolean(valueFromRow(payload, ["address", "city", "postal", "zip"]));
    if (!maybeHouseholdId && !hasAddress) {
      continue;
    }

    const lcrHouseholdId = maybeHouseholdId ?? `generated-household-${stableHash(JSON.stringify(payload))}`;
    const unitName = valueFromRow(payload, ["unitname", "unit", "ward", "branch"]);
    const unitAbbreviation = valueFromRow(payload, ["unitabbreviation", "unit abbreviation"]);

    households.set(lcrHouseholdId, {
      lcrHouseholdId,
      unitNumber: deriveSyntheticUnitNumber(unitName, unitAbbreviation),
      householdName: valueFromRow(payload, ["householdname", "familyname"]) ?? "Household",
      addressLine1: valueFromRow(payload, ["addressline1", "street"]),
      addressLine2: valueFromRow(payload, ["addressline2"]),
      city: valueFromRow(payload, ["city"]),
      state: valueFromRow(payload, ["state", "province"]),
      postalCode: valueFromRow(payload, ["postal", "zip"]),
      country: valueFromRow(payload, ["country"])
    });
  }

  return Array.from(households.values());
};

const parseOrganizations = (callings: CallingRecord[]): OrganizationRecord[] => {
  const organizations = new Map<string, OrganizationRecord>();

  for (const calling of callings) {
    const organizationName =
      calling.title.split("-")[0]?.trim() ??
      calling.title.split("(")[0]?.trim() ??
      "Uncategorized";

    const organizationId = `generated-org-${stableHash(organizationName)}`;
    organizations.set(organizationId, {
      lcrOrganizationId: organizationId,
      unitNumber: env.UNIT_NUMBER,
      name: organizationName,
      category: "Derived from custom report"
    });
  }

  return Array.from(organizations.values());
};

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

const parseCallingsFromMembers = (members: MemberRecord[]): CallingRecord[] => {
  const callings = new Map<string, CallingRecord>();

  for (const member of members) {
    const parsedEntries = parseDatedCallingEntries(member.callingsWithDatesText);
    if (parsedEntries.length === 0) {
      continue;
    }

    for (const entry of parsedEntries) {
      const titleKey = normalizeCallingTitleForKey(entry.title) || normalizeWhitespace(entry.title.toLowerCase());
      if (!titleKey) {
        continue;
      }

      const callingId = `generated-calling-${stableHash(`${member.lcrMemberId}:${titleKey}`)}`;
      const nextRecord: CallingRecord = {
        lcrCallingId: callingId,
        unitNumber: member.unitNumber,
        lcrMemberId: member.lcrMemberId,
        title: entry.title,
        sustainedOn: entry.calledOn,
        isCurrent: entry.sustained
      };

      const existing = callings.get(callingId);
      if (!existing) {
        callings.set(callingId, nextRecord);
        continue;
      }

      if (nextRecord.isCurrent && !existing.isCurrent) {
        callings.set(callingId, nextRecord);
        continue;
      }

      if (nextRecord.isCurrent === existing.isCurrent) {
        const existingDate = existing.sustainedOn ? new Date(existing.sustainedOn).getTime() : -1;
        const nextDate = nextRecord.sustainedOn ? new Date(nextRecord.sustainedOn).getTime() : -1;
        if (nextDate > existingDate) {
          callings.set(callingId, nextRecord);
        }
      }
    }
  }

  return Array.from(callings.values());
};

const parseMeetingAssignments = (): MeetingAssignmentRecord[] => [];

const isLikelyEntity = (obj: Record<string, unknown>) => {
  const keys = Object.keys(obj).map((key) => key.toLowerCase());
  const signalKeys = ["name", "member", "calling", "organization", "email", "phone", "household", "birth"];
  return signalKeys.some((signal) => keys.some((key) => key.includes(signal)));
};

const waitForReportRows = async (page: Page) => {
  const started = Date.now();
  const timeoutMs = Math.max(60000, env.LCR_TIMEOUT_MS);

  while (Date.now() - started < timeoutMs) {
    let readiness: {
      matchingTableRows: number;
      matchingGridRows: number;
      hasPreferredNameHeader: boolean;
      hasEmailHeader: boolean;
    } | null = null;
    try {
      const readinessScript = `(() => {
        const normalize = (value) => (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

        const tables = Array.from(document.querySelectorAll("table")).map((table) => {
          const headers = Array.from(table.querySelectorAll("thead th, tr:first-child th, tr:first-child td")).map((node) =>
            normalize(node.textContent)
          );
          const rowCount = table.querySelectorAll("tbody tr").length;
          return { headers, rowCount };
        });

        const matchingTables = tables.filter((table) => {
          const headerText = table.headers.join(" ");
          return headerText.includes("preferred name") || headerText.includes("individual e mail");
        });

        const matchingTableRows = matchingTables.reduce((max, table) => Math.max(max, table.rowCount), 0);

        const gridHeaders = Array.from(document.querySelectorAll("[role='columnheader']")).map((node) =>
          normalize(node.textContent)
        );
        const gridHeaderText = gridHeaders.join(" ");
        const gridMatches = gridHeaderText.includes("preferred name") || gridHeaderText.includes("individual e mail");
        const matchingGridRows = gridMatches
          ? Array.from(document.querySelectorAll("[role='row']")).filter((row) => row.querySelectorAll("[role='gridcell']").length > 0).length
          : 0;

        return {
          matchingTableRows,
          matchingGridRows,
          hasPreferredNameHeader: matchingTables.length > 0 || gridHeaderText.includes("preferred name"),
          hasEmailHeader: matchingTables.length > 0 || gridHeaderText.includes("individual e mail")
        };
      })()`;

      readiness = (await page.evaluate(readinessScript)) as {
        matchingTableRows: number;
        matchingGridRows: number;
        hasPreferredNameHeader: boolean;
        hasEmailHeader: boolean;
      };
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isNavigationRace = message.includes("execution context was destroyed") || message.includes("cannot find context");
      if (isNavigationRace) {
        await page.waitForTimeout(1500);
        continue;
      }
      throw error;
    }

    if (!readiness) {
      await page.waitForTimeout(1500);
      continue;
    }

    const enoughRows = readiness.matchingTableRows >= 5 || readiness.matchingGridRows >= 5;
    if (enoughRows && readiness.hasPreferredNameHeader && readiness.hasEmailHeader) {
      return;
    }

    await page.waitForTimeout(3000);
  }

  throw new Error(`Report rows did not load before timeout (${timeoutMs} ms).`);
};

const extractTablesAndPayload = async (page: Page): Promise<RawExtraction> => {
  const script = `(() => {
    const parseJsonSafe = (input) => {
      if (!input) return null;
      try {
        return JSON.parse(input);
      } catch {
        return null;
      }
    };

    const objects = [];
    const walk = (value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        for (const item of value) walk(item);
        return;
      }
      if (typeof value === "object") {
        objects.push(value);
        for (const nestedValue of Object.values(value)) walk(nestedValue);
      }
    };

    const nextDataNode = document.querySelector("#__NEXT_DATA__");
    const nextData = parseJsonSafe(nextDataNode ? nextDataNode.textContent : null);
    if (nextData) walk(nextData);

    for (const scriptNode of Array.from(document.querySelectorAll("script[type='application/json'], script"))) {
      const text = scriptNode.textContent;
      if (!text || text.length > 3000000) continue;
      const parsed = parseJsonSafe(text);
      if (parsed) walk(parsed);
    }

    const toRow = (cells, headers) => {
      const mapped = {};
      cells.forEach((cell, index) => {
        const key = headers[index] || "column_" + (index + 1);
        const text = cell.textContent;
        mapped[key] = text ? text.trim() : "";
      });
      return mapped;
    };

    const htmlTables = Array.from(document.querySelectorAll("table")).map((table) => {
      const headerCells = Array.from(table.querySelectorAll("thead th")).map((cell) => {
        const text = cell.textContent;
        return text ? text.trim() : "";
      });
      const fallbackHeaders = Array.from(table.querySelectorAll("tr:first-child th, tr:first-child td")).map((cell) => {
        const text = cell.textContent;
        return text ? text.trim() : "";
      });
      const headers = headerCells.length > 0 ? headerCells : fallbackHeaders;

      const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
      const rows = bodyRows.map((row) => toRow(Array.from(row.querySelectorAll("td")), headers));
      return { headers, rows };
    });

    const gridHeaderNodes = Array.from(document.querySelectorAll("[role='columnheader']"));
    const gridHeaders = gridHeaderNodes.map((node) => {
      const text = node.textContent;
      return text ? text.trim() : "";
    }).filter(Boolean);

    let gridTable = null;
    if (gridHeaders.length > 0) {
      const gridRows = Array.from(document.querySelectorAll("[role='row']"))
        .map((row) => Array.from(row.querySelectorAll("[role='gridcell']")))
        .filter((cells) => cells.length > 0)
        .map((cells) => toRow(cells, gridHeaders));

      gridTable = { headers: gridHeaders, rows: gridRows };
    }

    return {
      tables: gridTable ? htmlTables.concat([gridTable]) : htmlTables,
      payloadObjects: objects
    };
  })()`;

  const result = await page.evaluate(script);
  return result as RawExtraction;
};

const isOnTargetPath = (urlString: string, targetPath: string): boolean => {
  try {
    const parsed = new URL(urlString);
    return parsed.pathname.includes(targetPath);
  } catch {
    return false;
  }
};

export class LcrScraper {
  async scrapeDirectory(): Promise<DirectorySnapshot> {
    const userDataDir = path.resolve(process.cwd(), env.PLAYWRIGHT_USER_DATA_DIR);
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: env.PLAYWRIGHT_HEADLESS
    });

    try {
      const page = context.pages()[0] ?? (await context.newPage());
      await page.goto(env.LCR_DIRECTORY_URL, { waitUntil: "domcontentloaded" });

      const targetPath = new URL(env.LCR_DIRECTORY_URL).pathname;
      if (!isOnTargetPath(page.url(), targetPath)) {
        console.log("Manual login required. Complete login in the opened browser window.");
      }

      await page.waitForURL((url) => isOnTargetPath(url.toString(), targetPath), {
        timeout: env.LCR_TIMEOUT_MS
      });

      await page.waitForLoadState("domcontentloaded");
      await waitForReportRows(page);

      const extraction = await extractTablesAndPayload(page);
      const likelyObjects = extraction.payloadObjects.filter((item) => isLikelyEntity(item));

      const members = parseMembers(extraction.tables, likelyObjects);
      const households = parseHouseholds(members, likelyObjects);
      const callings = parseCallingsFromMembers(members);
      const organizations = parseOrganizations(callings);
      const meetingAssignments = parseMeetingAssignments();
      const tableDiagnostics = extraction.tables.slice(0, 4).map((table, index) => ({
        index,
        headerCount: table.headers.length,
        headers: table.headers.slice(0, 12),
        rowCount: table.rows.length,
        sampleRow: table.rows[0] ?? null
      }));

      if (env.LCR_DIRECTORY_URL.includes("/custom-reports-details/") && members.length === 0) {
        console.log(`Scrape table diagnostics: ${JSON.stringify(tableDiagnostics, null, 2)}`);
        throw new Error(
          "No members were extracted from the custom report. Verify login completed and the report table finished loading with visible rows."
        );
      }

      console.log(
        `Scrape diagnostics: tables=${extraction.tables.length}, payloadObjects=${likelyObjects.length}, members=${members.length}, households=${households.length}, callings=${callings.length}`
      );

      return {
        units: buildUnitsFromMembers(members),
        households,
        members,
        organizations,
        callings,
        meetingAssignments
      };
    } finally {
      await context.close();
    }
  }

  async scrapeCallingsOnly(): Promise<Pick<DirectorySnapshot, "units" | "organizations" | "callings">> {
    const snapshot = await this.scrapeDirectory();
    return {
      units: snapshot.units,
      organizations: snapshot.organizations,
      callings: snapshot.callings
    };
  }
}
