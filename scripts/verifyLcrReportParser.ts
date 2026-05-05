import assert from "node:assert/strict";
import { parseReportMembersFromTables, type ScrapedTable } from "@/src/sync/lcrScraper";

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
    "Birth Date (1 Jan 1990)"
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
      "Birth Date (1 Jan 1990)": "18 Dec 2014"
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
    "custom-reports.birth.date.with.examplecustom-reports.birth.date.with.example"
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
        "custom-reports.birth.date.with.examplecustom-reports.birth.date.with.example18 Dec 2014"
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
};

assertParsedMember(friendlyTable);
assertParsedMember(machineTable);

console.log("LCR report parser fixture verification passed.");
