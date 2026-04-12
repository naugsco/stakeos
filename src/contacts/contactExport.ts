export type ExportContact = {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  unitName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateOrProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  title?: string | null;
  notes?: string[];
};

const sanitizeFilenamePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "stakeos";

const formatDatePart = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const splitFullName = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
  };
};

const csvEscape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;

const vcardEscape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const formatAddress = (contact: ExportContact) =>
  [contact.addressLine1, contact.addressLine2, contact.city, contact.stateOrProvince, contact.postalCode, contact.country]
    .map((part) => part?.trim() || "")
    .filter(Boolean)
    .join(", ");

const buildNotes = (contact: ExportContact) =>
  (contact.notes ?? [])
    .map((note) => note.trim())
    .filter(Boolean)
    .join("\n");

export const buildContactsFilename = (stakeName: string, scope: string, extension: "vcf" | "csv") =>
  `${sanitizeFilenamePart(stakeName)}-${sanitizeFilenamePart(scope)}-${formatDatePart()}.${extension}`;

export const buildAppleContactsVcf = (contacts: ExportContact[], stakeName: string) =>
  contacts
    .map((contact) => {
      const nameParts = {
        firstName: contact.firstName?.trim() || splitFullName(contact.fullName).firstName,
        lastName: contact.lastName?.trim() || splitFullName(contact.fullName).lastName
      };
      const address = formatAddress(contact);
      const note = buildNotes(contact);
      const title = contact.title?.trim() || "";

      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${vcardEscape(contact.fullName)}`,
        `N:${vcardEscape(nameParts.lastName)};${vcardEscape(nameParts.firstName)};;;`,
        `ORG:${vcardEscape(stakeName)}`,
        title ? `TITLE:${vcardEscape(title)}` : "",
        contact.email?.trim() ? `EMAIL;TYPE=INTERNET:${vcardEscape(contact.email.trim())}` : "",
        contact.phoneNumber?.trim() ? `TEL;TYPE=CELL:${vcardEscape(contact.phoneNumber.trim())}` : "",
        address
          ? `ADR;TYPE=HOME:;;${vcardEscape(contact.addressLine1?.trim() || "")}${contact.addressLine2?.trim() ? `\\n${vcardEscape(contact.addressLine2.trim())}` : ""};${vcardEscape(contact.city?.trim() || "")};${vcardEscape(contact.stateOrProvince?.trim() || "")};${vcardEscape(contact.postalCode?.trim() || "")};${vcardEscape(contact.country?.trim() || "")}`
          : "",
        note ? `NOTE:${vcardEscape(note)}` : "",
        "END:VCARD"
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

export const buildGoogleContactsCsv = (contacts: ExportContact[], stakeName: string) => {
  const header = [
    "Name",
    "Given Name",
    "Family Name",
    "E-mail 1 - Type",
    "E-mail 1 - Value",
    "Phone 1 - Type",
    "Phone 1 - Value",
    "Address 1 - Type",
    "Address 1 - Formatted",
    "Organization 1 - Name",
    "Organization 1 - Title",
    "Group Membership",
    "Notes"
  ];

  const rows = contacts.map((contact) => {
    const nameParts = {
      firstName: contact.firstName?.trim() || splitFullName(contact.fullName).firstName,
      lastName: contact.lastName?.trim() || splitFullName(contact.fullName).lastName
    };
    const address = formatAddress(contact);
    const note = buildNotes(contact);

    return [
      contact.fullName,
      nameParts.firstName,
      nameParts.lastName,
      contact.email?.trim() ? "* Home" : "",
      contact.email?.trim() || "",
      contact.phoneNumber?.trim() ? "Mobile" : "",
      contact.phoneNumber?.trim() || "",
      address ? "Home" : "",
      address,
      stakeName,
      contact.title?.trim() || "",
      `* myContacts ::: ${stakeName}`,
      note
    ].map((value) => csvEscape(value));
  });

  return [header.map(csvEscape).join(","), ...rows.map((row) => row.join(","))].join("\n");
};

export const downloadTextFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
