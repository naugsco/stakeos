import { env, splitEmails } from "@/src/config/env";
import { query } from "@/src/db/pool";
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

const recipientsForCalling = async (callingText: string): Promise<RecipientRow[]> => {
  const result = await query<RecipientRow>(
    `
    SELECT DISTINCT
      e.email,
      m.id AS "memberId",
      m.household_id AS "householdId"
    FROM current_callings_dedup c
    JOIN members m ON c.member_id = m.id
    JOIN emails e ON e.member_id = m.id
    LEFT JOIN organizations o ON c.organization_id = o.id
    WHERE c.title ILIKE $1 OR o.name ILIKE $1
    `,
    [`%${callingText}%`]
  );

  return result.rows;
};

const recipientsForOrganization = async (organizationText: string): Promise<RecipientRow[]> => {
  const result = await query<RecipientRow>(
    `
    SELECT DISTINCT
      e.email,
      m.id AS "memberId",
      m.household_id AS "householdId"
    FROM current_callings_dedup c
    JOIN organizations o ON c.organization_id = o.id
    JOIN members m ON c.member_id = m.id
    JOIN emails e ON e.member_id = m.id
    WHERE o.name ILIKE $1
    `,
    [`%${organizationText}%`]
  );

  return result.rows;
};

const spouseEmails = async (householdIds: number[]): Promise<string[]> => {
  if (!householdIds.length) {
    return [];
  }

  const result = await query<{ email: string }>(
    `
    SELECT DISTINCT e.email
    FROM members m
    JOIN emails e ON e.member_id = m.id
    WHERE m.household_id = ANY($1::bigint[])
    `,
    [householdIds]
  );

  return result.rows.map((row) => row.email);
};

const resolveRecipients = async (input: SendEmailInput): Promise<string[]> => {
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
      ? await recipientsForCalling(input.targetValue)
      : await recipientsForOrganization(input.targetValue);

  let recipients = baseRows.map((row) => row.email);

  if (input.includeSpouses) {
    const householdIds = dedupe(baseRows.map((row) => String(row.householdId ?? "")))
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    const spouseRecipientList = await spouseEmails(householdIds);
    recipients = recipients.concat(spouseRecipientList);
  }

  return dedupe(recipients);
};

export const sendCallingEmail = async (input: SendEmailInput) => {
  const recipients = await resolveRecipients(input);
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

export const createWhatsAppInviteList = async (
  mode: "calling" | "meeting" | "organization",
  value: string
): Promise<string> => {
  let result;

  if (mode === "meeting") {
    result = await query<{
      fullName: string;
      phoneNumber: string;
    }>(
      `
      SELECT DISTINCT
        TRIM(CONCAT(m.first_name, ' ', m.last_name)) AS "fullName",
        p.phone_number AS "phoneNumber"
      FROM meeting_assignments ma
      JOIN members m ON ma.member_id = m.id
      JOIN phone_numbers p ON p.member_id = m.id
      WHERE ma.meeting_name ILIKE $1
      ORDER BY "fullName"
      `,
      [`%${value}%`]
    );
  } else {
    const whereClause =
      mode === "calling"
        ? "c.title ILIKE $1"
        : "o.name ILIKE $1";

    result = await query<{
      fullName: string;
      phoneNumber: string;
    }>(
      `
      SELECT DISTINCT
        TRIM(CONCAT(m.first_name, ' ', m.last_name)) AS "fullName",
        p.phone_number AS "phoneNumber"
      FROM current_callings_dedup c
      LEFT JOIN organizations o ON c.organization_id = o.id
      JOIN members m ON c.member_id = m.id
      JOIN phone_numbers p ON p.member_id = m.id
      WHERE ${whereClause}
      ORDER BY "fullName"
      `,
      [`%${value}%`]
    );
  }

  const lines = result.rows.map((row) => `${row.fullName}: ${row.phoneNumber}`);

  return [`WhatsApp Invite List (${mode}: ${value})`, ...lines].join("\n");
};
