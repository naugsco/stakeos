import assert from "node:assert/strict";
import { parseCallingsFromMembers, parseReportMembersFromTables, type ScrapedTable } from "@/src/sync/lcrScraper";
import type { MemberRecord } from "@/src/types/directory";

const friendlyTable: ScrapedTable = {
  headers: [
    "Preferred Name",
    "Individual Phone",
    "Individual E-mail",
    "Callings with Date Sustained and Set Apart",
    "Unit",
    "Unit Abbreviation",
    "Address - Street 1",
    "Address - City",
    "Address - State or Province",
    "Address - Postal Code",
    "Age",
    "Birth Date (1 Jan 1990)",
    "Ministering Brothers",
    "Ministering Sisters",
    "Has Ministering Brothers",
    "Has Ministering Sisters",
    "Is Born in Covenant",
    "Is Attending Seminary"
  ],
  rows: [
    {
      "Preferred Name": "Abad, Gabriel",
      "Individual Phone": "(604) 555-0100",
      "Individual E-mail": "gabriel@example.com",
      "Callings with Date Sustained and Set Apart": "Bishop (1 May 2026 / Yes)",
      Unit: "North Shore Ward",
      "Unit Abbreviation": "NS",
      "Address - Street 1": "1366 Kings Ave",
      "Address - City": "West Vancouver",
      "Address - State or Province": "British Columbia",
      "Address - Postal Code": "V7T 2C6",
      Age: "11",
      "Birth Date (1 Jan 1990)": "18 Dec 2014",
      "Ministering Brothers": "Chang, Eric / Naugle, Nick",
      "Ministering Sisters": "Dowling, Jan / Koochin, Teleni",
      "Has Ministering Brothers": "Yes",
      "Has Ministering Sisters": "Yes",
      "Is Born in Covenant": "Yes",
      "Is Attending Seminary": "Yes"
    }
  ]
};

const machineTable: ScrapedTable = {
  headers: [
    "record.preferred.namerecord.preferred.name",
    "record.individual.phonerecord.individual.phone",
    "record.individual.emailrecord.individual.email",
    "custom-reports.callings.with.date.sustained.and.set.apartcustom-reports.callings.with.date.sustained.and.set.apart",
    "custom-reports.unitcustom-reports.unit",
    "custom-reports.unit.abbreviationcustom-reports.unit.abbreviation",
    "custom-reports.address.street1custom-reports.address.street1",
    "custom-reports.address.citycustom-reports.address.city",
    "custom-reports.address.statecustom-reports.address.state",
    "custom-reports.address.postal.codecustom-reports.address.postal.code",
    "AgeAge",
    "custom-reports.birth.date.with.examplecustom-reports.birth.date.with.example",
    "record.home.teachersrecord.home.teachers",
    "record.visiting.teachersrecord.visiting.teachers",
    "custom-reports.has.home.teacherscustom-reports.has.home.teachers",
    "custom-reports.has.visiting.teacherscustom-reports.has.visiting.teachers",
    "custom-reports.is.biccustom-reports.is.bic",
    "custom-reports.is.attending.seminarycustom-reports.is.attending.seminary"
  ],
  rows: [
    {
      "record.preferred.namerecord.preferred.name": "record.preferred.namerecord.preferred.nameAbad, Gabriel",
      "record.individual.phonerecord.individual.phone": "record.individual.phonerecord.individual.phone(604) 555-0100",
      "record.individual.emailrecord.individual.email": "record.individual.emailrecord.individual.emailgabriel@example.com",
      "custom-reports.callings.with.date.sustained.and.set.apartcustom-reports.callings.with.date.sustained.and.set.apart":
        "custom-reports.callings.with.date.sustained.and.set.apartcustom-reports.callings.with.date.sustained.and.set.apartBishop (1 May 2026 / Yes)",
      "custom-reports.unitcustom-reports.unit": "custom-reports.unitcustom-reports.unitNorth Shore Ward",
      "custom-reports.unit.abbreviationcustom-reports.unit.abbreviation": "custom-reports.unit.abbreviationcustom-reports.unit.abbreviationNS",
      "custom-reports.address.street1custom-reports.address.street1": "custom-reports.address.street1custom-reports.address.street11366 Kings Ave",
      "custom-reports.address.citycustom-reports.address.city": "custom-reports.address.citycustom-reports.address.cityWest Vancouver",
      "custom-reports.address.statecustom-reports.address.state": "custom-reports.address.statecustom-reports.address.stateBritish Columbia",
      "custom-reports.address.postal.codecustom-reports.address.postal.code": "custom-reports.address.postal.codecustom-reports.address.postal.codeV7T 2C6",
      AgeAge: "AgeAge11",
      "custom-reports.birth.date.with.examplecustom-reports.birth.date.with.example":
        "custom-reports.birth.date.with.examplecustom-reports.birth.date.with.example18 Dec 2014",
      "record.home.teachersrecord.home.teachers": "record.home.teachersrecord.home.teachersChang, Eric / Naugle, Nick",
      "record.visiting.teachersrecord.visiting.teachers":
        "record.visiting.teachersrecord.visiting.teachersDowling, Jan / Koochin, Teleni",
      "custom-reports.has.home.teacherscustom-reports.has.home.teachers":
        "custom-reports.has.home.teacherscustom-reports.has.home.teachersYes",
      "custom-reports.has.visiting.teacherscustom-reports.has.visiting.teachers":
        "custom-reports.has.visiting.teacherscustom-reports.has.visiting.teachersYes",
      "custom-reports.is.biccustom-reports.is.bic": "custom-reports.is.biccustom-reports.is.bicYes",
      "custom-reports.is.attending.seminarycustom-reports.is.attending.seminary":
        "custom-reports.is.attending.seminarycustom-reports.is.attending.seminaryYes"
    }
  ]
};

const assertParsedMember = (table: ScrapedTable) => {
  const members = parseReportMembersFromTables([table]);
  assert.equal(members.length, 1);

  const member = members[0];
  assert.equal(member.preferredName, "Abad, Gabriel");
  assert.equal(member.emails[0]?.email, "gabriel@example.com");
  assert.equal(member.phoneNumbers[0]?.phoneNumber, "(604) 555-0100");
  assert.equal(member.unitName, "North Shore Ward");
  assert.equal(member.unitAbbreviation, "NS");
  assert.equal(member.addressLine1, "1366 Kings Ave");
  assert.equal(member.addressCity, "West Vancouver");
  assert.equal(member.addressStateOrProvince, "British Columbia");
  assert.equal(member.addressPostalCode, "V7T 2C6");
  assert.equal(member.age, 11);
  assert.equal(member.birthdate, "18 Dec 2014");
  assert.equal(member.callingsWithDatesText, "Bishop (1 May 2026 / Yes)");

  // Ministering, born-in-covenant and seminary silently emptied for four months because
  // LCR's machine headers use different wording than the friendly labels and nothing here
  // covered them. Assert them in both header dialects so that cannot recur unnoticed.
  assert.equal(member.ministeringBrothers, "Chang, Eric / Naugle, Nick");
  assert.equal(member.ministeringSisters, "Dowling, Jan / Koochin, Teleni");
  assert.equal(member.hasMinisteringBrothers, true);
  assert.equal(member.hasMinisteringSisters, true);
  assert.equal(member.isBornInCovenant, true);
  assert.equal(member.isAttendingSeminary, true);
};

assertParsedMember(friendlyTable);
assertParsedMember(machineTable);

// LCR exposes no "Mission" column, so mission status is deduced from the returned-missionary
// flag plus mission country/language. It must never be inferred for a member with no mission
// data at all, or every never-served member would read as having a mission history.
const assertMissionStatusIsDerived = () => {
  const base = {
    "Preferred Name": "Kerr, Walter",
    "Individual E-mail": "walter@example.com",
    Unit: "North Shore Ward"
  };

  const build = (extra: Record<string, string>): ScrapedTable => {
    const row = { ...base, ...extra };
    return { headers: Object.keys(row), rows: [row] };
  };

  const returned = parseReportMembersFromTables([
    build({ "Is Returned Missionary": "Yes", "Mission Country": "Japan", "Mission Language": "Japanese" })
  ])[0];
  assert.equal(returned?.missionStatus, "Returned Missionary");
  assert.equal(returned?.missionCountry, "Japan");
  assert.equal(returned?.missionLanguage, "Japanese");

  // Mission country without the flag is still mission history, not current service.
  const countryOnly = parseReportMembersFromTables([build({ "Mission Country": "Japan" })])[0];
  assert.equal(countryOnly?.missionStatus, "Returned Missionary");

  const neverServed = parseReportMembersFromTables([build({ "Is Returned Missionary": "No" })])[0];
  assert.equal(neverServed?.missionStatus, undefined, "no mission data must not invent a status");
};

assertMissionStatusIsDerived();

// The trailing Yes/No in "Callings with Date Sustained and Set Apart" is set-apart
// status, not whether the calling is current. A member who has been sustained but not
// yet set apart still currently holds the calling.
const assertSetApartDoesNotGateCurrent = () => {
  const member = {
    lcrMemberId: "member-1",
    unitNumber: "000000",
    firstName: "Cristian",
    lastName: "Villiers",
    callingsWithDatesText:
      "Building Representative (1 Jun 2025/No) Stake High Councilor (12 Jul 2026/No) Elders Quorum Teacher (26 Oct 2025/Yes)"
  } as MemberRecord;

  const callings = parseCallingsFromMembers([member]);
  const byTitle = new Map(callings.map((calling) => [calling.title, calling]));

  assert.equal(callings.length, 3, "all three callings should be parsed");
  assert.ok(
    callings.every((calling) => calling.isCurrent),
    "a calling is current regardless of set-apart status"
  );

  assert.equal(byTitle.get("Building Representative")?.isSetApart, false);
  assert.equal(byTitle.get("Building Representative")?.sustainedOn, "2025-06-01");
  assert.equal(byTitle.get("Stake High Councilor")?.isSetApart, false);
  assert.equal(byTitle.get("Stake High Councilor")?.sustainedOn, "2026-07-12");
  assert.equal(byTitle.get("Elders Quorum Teacher")?.isSetApart, true);
  assert.equal(byTitle.get("Elders Quorum Teacher")?.sustainedOn, "2025-10-26");
};

// A repeated title collapses to one calling: newest sustaining wins, set apart if any
// entry reports it.
const assertDuplicateTitlesMerge = () => {
  const member = {
    lcrMemberId: "member-2",
    unitNumber: "000000",
    firstName: "Test",
    lastName: "Member",
    callingsWithDatesText: "Ward Clerk (1 Jan 2024/No) Ward Clerk (1 Jun 2025/Yes)"
  } as MemberRecord;

  const callings = parseCallingsFromMembers([member]);
  assert.equal(callings.length, 1);
  assert.equal(callings[0]?.sustainedOn, "2025-06-01");
  assert.equal(callings[0]?.isSetApart, true);
  assert.equal(callings[0]?.isCurrent, true);
};

assertSetApartDoesNotGateCurrent();
assertDuplicateTitlesMerge();

console.log("LCR report parser fixture verification passed.");
