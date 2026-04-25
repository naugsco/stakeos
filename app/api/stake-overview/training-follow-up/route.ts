import { NextResponse } from "next/server";
import { ensureSqliteSpikeSchema, openSqliteSpikeDb } from "@/src/sqlite/db";
import type { TrainingFollowUpStateRecord } from "@/lib/dashboardData";

type RequestBody = {
  action?: "drafted" | "sent";
  groupKey?: string;
  groupLabel?: string;
  signature?: string;
  subject?: string;
};

type TrainingFollowUpStateRow = TrainingFollowUpStateRecord & {
  groupKey: string;
};

const selectState = (groupKey: string) => {
  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
    return db.prepare(
      `SELECT
        group_key AS groupKey,
        group_label AS groupLabel,
        last_draft_at AS lastDraftAt,
        last_draft_signature AS lastDraftSignature,
        last_draft_subject AS lastDraftSubject,
        last_sent_at AS lastSentAt,
        last_sent_signature AS lastSentSignature,
        last_sent_subject AS lastSentSubject
       FROM training_follow_up_state
       WHERE group_key = ?`
    ).get(groupKey) as TrainingFollowUpStateRow | undefined;
  } finally {
    db.close();
  }
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as RequestBody | null;

  if (
    !body ||
    (body.action !== "drafted" && body.action !== "sent") ||
    typeof body.groupKey !== "string" ||
    typeof body.groupLabel !== "string" ||
    typeof body.signature !== "string" ||
    typeof body.subject !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = openSqliteSpikeDb();

  try {
    ensureSqliteSpikeSchema(db);

    if (body.action === "drafted") {
      db.prepare(
        `INSERT INTO training_follow_up_state (
          group_key,
          group_label,
          last_draft_at,
          last_draft_signature,
          last_draft_subject,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(group_key) DO UPDATE SET
          group_label = excluded.group_label,
          last_draft_at = excluded.last_draft_at,
          last_draft_signature = excluded.last_draft_signature,
          last_draft_subject = excluded.last_draft_subject,
          updated_at = excluded.updated_at`
      ).run(body.groupKey, body.groupLabel, now, body.signature, body.subject, now);
    } else {
      db.prepare(
        `INSERT INTO training_follow_up_state (
          group_key,
          group_label,
          last_draft_at,
          last_draft_signature,
          last_draft_subject,
          last_sent_at,
          last_sent_signature,
          last_sent_subject,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(group_key) DO UPDATE SET
          group_label = excluded.group_label,
          last_draft_at = excluded.last_draft_at,
          last_draft_signature = excluded.last_draft_signature,
          last_draft_subject = excluded.last_draft_subject,
          last_sent_at = excluded.last_sent_at,
          last_sent_signature = excluded.last_sent_signature,
          last_sent_subject = excluded.last_sent_subject,
          updated_at = excluded.updated_at`
      ).run(body.groupKey, body.groupLabel, now, body.signature, body.subject, now, body.signature, body.subject, now);
    }
  } finally {
    db.close();
  }

  const state = selectState(body.groupKey);

  return NextResponse.json({
    state: state
      ? {
          groupLabel: state.groupLabel,
          lastDraftAt: state.lastDraftAt,
          lastDraftSignature: state.lastDraftSignature,
          lastDraftSubject: state.lastDraftSubject,
          lastSentAt: state.lastSentAt,
          lastSentSignature: state.lastSentSignature,
          lastSentSubject: state.lastSentSubject
        }
      : null
  });
}
