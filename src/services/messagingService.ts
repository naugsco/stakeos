import { env, splitEmails } from "@/src/config/env";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { ensureMailer } from "@/src/email/mailer";

export type EmailTargetType = "calling" | "organization" | "stake_council" | "stake_presidency" | "custom";

interface RecipientRow {
  email: string;
  memberId: number;
  householdId: number | null;
}

interface SendEmailInput {
  targetType: EmailTargetType;
  targetValue: string;
  subject: string;
  body: string;
  includeSpouses?: boolean;
}

const dedupe = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const recipientsForCalling = (callingText: string): RecipientRow[] => {
  const db = openSqliteSpikeDb();
  try {
    return db
      .prepare<[string, string], RecipientRow>(
        `
        SELECT DISTINCT
          m.primary_email AS email,
          m.id AS memberId,
          m.household_id AS householdId
        FROM callings c
        JOIN members m ON c.member_id = m.id
        WHERE c.released_on IS NULL
          AND c.is_current = 1
          AND m.primary_email IS NOT NULL
          AND (c.title LIKE ? OR c.organization_name LIKE ?)
        `
      )
      .all(`%${callingText}%`, `%${callingText}%`);
  } finally {
    db.close();
  }
};

const recipientsForOrganization = (organizationText: string): RecipientRow[] => {
  const db = openSqliteSpikeDb();
  try {
    return db
      .prepare<[string], RecipientRow>(
        `
        SELECT DISTINCT
          m.primary_email AS email,
          m.id AS memberId,
          m.household_id AS householdId
        FROM callings c
        JOIN members m ON c.member_id = m.id
        WHERE c.released_on IS NULL
          AND c.is_current = 1
          AND m.primary_email IS NOT NULL
          AND c.organization_name LIKE ?
        `
      )
      .all(`%${organizationText}%`);
  } finally {
    db.close();
  }
};

const spouseEmails = (householdIds: number[]): string[] => {
  if (!householdIds.length) {
    return [];
  }

  const db = openSqliteSpikeDb();
  try {
    const placeholders = householdIds.map(() => "?").join(", ");
    const rows = db
      .prepare<unknown[], { email: string }>(
        `
        SELECT DISTINCT m.primary_email AS email
        FROM members m
        WHERE m.household_id IN (${placeholders})
          AND m.primary_email IS NOT NULL
        `
      )
      .all(...householdIds);

    return rows.map((row) => row.email);
  } finally {
    db.close();
  }
};

const resolveRecipients = (input: SendEmailInput): string[] => {
  if (input.targetType === "stake_presidency") {
    return splitEmails(env.STAKE_PRESIDENCY_EMAILS);
  }

  if (input.targetType === "stake_council") {
    return splitEmails(env.STAKE_COUNCIL_EMAILS);
  }

  if (input.targetType === "custom") {
    return dedupe(input.targetValue.split(","));
  }

  const baseRows =
    input.targetType === "calling"
      ? recipientsForCalling(input.targetValue)
      : recipientsForOrganization(input.targetValue);

  let recipients = baseRows.map((row) => row.email);

  if (input.includeSpouses) {
    const householdIds = dedupe(baseRows.map((row) => String(row.householdId ?? "")))
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    const spouseRecipientList = spouseEmails(householdIds);
    recipients = recipients.concat(spouseRecipientList);
  }

  return dedupe(recipients);
};

export const sendCallingEmail = async (input: SendEmailInput) => {
  const recipients = resolveRecipients(input);
  if (!recipients.length) {
    return { sent: 0, rejected: 0, messageId: null as string | null, recipients };
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

export const createWhatsAppInviteList = (
  mode: "calling" | "meeting" | "organization",
  value: string
): string => {
  if (mode === "meeting") {
    // No meeting_assignments table in SQLite schema; return empty list
    return `WhatsApp Invite List (meeting: ${value})`;
  }

  const db = openSqliteSpikeDb();
  try {
    const whereClause =
      mode === "calling"
        ? "(c.title LIKE ? OR c.organization_name LIKE ?)"
        : "c.organization_name LIKE ?";

    const params =
      mode === "calling"
        ? [`%${value}%`, `%${value}%`]
        : [`%${value}%`];

    const rows = db
      .prepare<unknown[], { fullName: string; phoneNumber: string }>(
        `
        SELECT DISTINCT
          TRIM(m.first_name || ' ' || m.last_name) AS fullName,
          m.primary_phone AS phoneNumber
        FROM callings c
        JOIN members m ON c.lcr_member_id = m.lcr_member_id
        WHERE c.released_on IS NULL
          AND c.is_current = 1
          AND m.primary_phone IS NOT NULL
          AND ${whereClause}
        ORDER BY fullName
        `
      )
      .all(...params);

    const lines = rows.map((row) => `${row.fullName}: ${row.phoneNumber}`);

    return [`WhatsApp Invite List (${mode}: ${value})`, ...lines].join("\n");
  } finally {
    db.close();
  }
};
