import type { VisualOrgAssignedPerson, VisualOrgMeetingRoster, VisualOrgPayload, VisualOrgRoleAssignment } from "@/src/types/visualOrg";

export type VisualOrgSourceRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  callingTitle: string;
  email: string | null;
  phoneNumber: string | null;
};

type RoleDefinition = {
  roleId: string;
  roleTitle: string;
  scope: "stake" | "ward";
  matchers: RegExp[];
};

const ROLE_DEFINITIONS: RoleDefinition[] = [
  { roleId: "stakePresident", roleTitle: "Stake President", scope: "stake", matchers: [/^\s*stake president\s*$/i] },
  { roleId: "highCouncilor", roleTitle: "High Councilors (12)", scope: "stake", matchers: [/^\s*stake high councilor\s*$/i] },
  {
    roleId: "stakeRS",
    roleTitle: "Stake RS Presidency",
    scope: "stake",
    matchers: [/\bstake relief society (president|first counselor|second counselor|secretary)\b/i]
  },
  {
    roleId: "stakeYW",
    roleTitle: "Stake YW Presidency",
    scope: "stake",
    matchers: [/\bstake young women (president|first counselor|second counselor)\b/i]
  },
  {
    roleId: "stakePrimary",
    roleTitle: "Stake Primary Presidency",
    scope: "stake",
    matchers: [/\bstake primary (president|first counselor|second counselor|secretary)\b/i]
  },
  {
    roleId: "stakeSS",
    roleTitle: "Stake SS President",
    scope: "stake",
    matchers: [/\bstake sunday school president\b/i]
  },
  { roleId: "bishop", roleTitle: "Bishop", scope: "ward", matchers: [/^\s*bishop\s*$/i, /^\s*branch president\s*$/i] },
  {
    roleId: "bishopC1",
    roleTitle: "1st Counselor (Bishopric)",
    scope: "ward",
    matchers: [/\bbishopric first counselor\b/i, /\bbranch presidency first counselor\b/i]
  },
  {
    roleId: "bishopC2",
    roleTitle: "2nd Counselor (Bishopric)",
    scope: "ward",
    matchers: [/\bbishopric second counselor\b/i, /\bbranch presidency second counselor\b/i]
  },
  {
    roleId: "wardClerk",
    roleTitle: "Ward Clerk",
    scope: "ward",
    matchers: [/^\s*ward clerk\s*$/i, /^\s*branch clerk\s*$/i]
  },
  {
    roleId: "execSec",
    roleTitle: "Executive Secretary",
    scope: "ward",
    matchers: [/^\s*ward executive secretary\s*$/i, /^\s*branch executive secretary\s*$/i]
  },
  { roleId: "eqPres", roleTitle: "Elders Quorum President", scope: "ward", matchers: [/^\s*elders quorum president\s*$/i] },
  { roleId: "eqC1", roleTitle: "EQ 1st Counselor", scope: "ward", matchers: [/^\s*elders quorum first counselor\s*$/i] },
  { roleId: "eqC2", roleTitle: "EQ 2nd Counselor", scope: "ward", matchers: [/^\s*elders quorum second counselor\s*$/i] },
  { roleId: "rsPres", roleTitle: "Relief Society President", scope: "ward", matchers: [/^\s*relief society president\s*$/i] },
  { roleId: "rsC1", roleTitle: "RS 1st Counselor", scope: "ward", matchers: [/^\s*relief society first counselor\s*$/i] },
  { roleId: "rsC2", roleTitle: "RS 2nd Counselor", scope: "ward", matchers: [/^\s*relief society second counselor\s*$/i] },
  { roleId: "ywPres", roleTitle: "Young Women President", scope: "ward", matchers: [/^\s*young women president\s*$/i] },
  { roleId: "ywC1", roleTitle: "YW 1st Counselor", scope: "ward", matchers: [/^\s*young women first counselor\s*$/i] },
  { roleId: "ywC2", roleTitle: "YW 2nd Counselor", scope: "ward", matchers: [/^\s*young women second counselor\s*$/i] },
  { roleId: "primaryPres", roleTitle: "Primary President", scope: "ward", matchers: [/^\s*primary president\s*$/i] },
  { roleId: "primaryC1", roleTitle: "Primary 1st Counselor", scope: "ward", matchers: [/^\s*primary first counselor\s*$/i] },
  { roleId: "primaryC2", roleTitle: "Primary 2nd Counselor", scope: "ward", matchers: [/^\s*primary second counselor\s*$/i] },
  { roleId: "ssPres", roleTitle: "Sunday School President", scope: "ward", matchers: [/^\s*sunday school president\s*$/i] },
  { roleId: "ssC1", roleTitle: "SS 1st Counselor", scope: "ward", matchers: [/^\s*sunday school first counselor\s*$/i] },
  { roleId: "ssC2", roleTitle: "SS 2nd Counselor", scope: "ward", matchers: [/^\s*sunday school second counselor\s*$/i] },
  {
    roleId: "wardMissionLeader",
    roleTitle: "Ward Mission Leader",
    scope: "ward",
    matchers: [/^\s*ward mission leader\s*$/i, /^\s*assistant ward mission leader\s*$/i]
  },
  {
    roleId: "templeFHLeader",
    roleTitle: "Temple & FH Leader",
    scope: "ward",
    matchers: [/^\s*ward temple and family history leader\s*$/i, /^\s*branch temple and family history leader\s*$/i]
  }
];

const MEETING_ROLE_IDS: Record<string, { title: string; attendeeRoleIds: string[] }> = {
  sacramentMeeting: { title: "Sacrament Meeting", attendeeRoleIds: ["bishop", "bishopC1", "bishopC2", "wardClerk", "execSec"] },
  bishopricMeeting: { title: "Bishopric Meeting", attendeeRoleIds: ["bishop", "bishopC1", "bishopC2", "wardClerk", "execSec"] },
  wardCouncil: {
    title: "Ward Council",
    attendeeRoleIds: ["bishop", "bishopC1", "bishopC2", "wardClerk", "execSec", "eqPres", "rsPres", "ywPres", "primaryPres", "ssPres", "wardMissionLeader", "templeFHLeader"]
  },
  wardYouthCouncil: { title: "Ward Youth Council", attendeeRoleIds: ["bishop", "bishopC1", "bishopC2", "ywPres"] },
  missionaryCoord: { title: "Missionary Coordination", attendeeRoleIds: ["wardMissionLeader", "eqC1", "rsC1", "primaryPres"] },
  templeFHCoord: { title: "Temple & FH Coordination", attendeeRoleIds: ["templeFHLeader", "eqC2", "rsC2", "primaryPres"] },
  eqPresidency: { title: "EQ Presidency Meeting", attendeeRoleIds: ["eqPres", "eqC1", "eqC2"] },
  rsPresidency: { title: "RS Presidency Meeting", attendeeRoleIds: ["rsPres", "rsC1", "rsC2"] },
  ywPresidency: { title: "YW Presidency Meeting", attendeeRoleIds: ["ywPres", "ywC1", "ywC2"] },
  primaryPresidency: { title: "Primary Presidency", attendeeRoleIds: ["primaryPres", "primaryC1", "primaryC2"] },
  teacherCouncil: { title: "Teacher Council", attendeeRoleIds: ["ssPres", "ssC1", "ssC2"] },
  highCouncilMeeting: { title: "High Council Meeting", attendeeRoleIds: ["stakePresident", "highCouncilor"] },
  stakeCouncil: { title: "Stake Council", attendeeRoleIds: ["stakePresident", "highCouncilor", "stakeRS", "stakeYW", "stakePrimary", "stakeSS"] },
  stakeConference: { title: "Stake Conference", attendeeRoleIds: ["stakePresident", "highCouncilor", "stakeRS", "stakeYW", "stakePrimary", "stakeSS"] },
  stakePriesthoodLeadership: { title: "Stake PH Leadership", attendeeRoleIds: ["stakePresident", "highCouncilor", "stakeRS"] }
};

export const normalizeVisualOrgUnit = (unit?: string | null) => {
  const trimmed = unit?.trim();
  if (!trimmed || /^entire stake$/i.test(trimmed) || /^all units$/i.test(trimmed)) {
    return null;
  }
  return trimmed;
};

const matchRole = (title: string, unitScope: string | null): RoleDefinition | null => {
  for (const definition of ROLE_DEFINITIONS) {
    if (!unitScope && definition.scope === "ward") {
      continue;
    }
    if (definition.matchers.some((matcher) => matcher.test(title))) {
      return definition;
    }
  }
  return null;
};

const dedupePeople = (rows: VisualOrgAssignedPerson[]) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.roleId}:${row.lcrMemberId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const buildVisualOrgPayload = (
  rows: VisualOrgSourceRow[],
  selectedUnit: string | null
): VisualOrgPayload => {
  const assignments = Object.fromEntries(
    ROLE_DEFINITIONS.map((definition) => [
      definition.roleId,
      {
        roleId: definition.roleId,
        roleTitle: definition.roleTitle,
        scope: definition.scope,
        members: [] as VisualOrgAssignedPerson[]
      }
    ])
  ) as Record<string, VisualOrgRoleAssignment>;

  for (const row of rows) {
    const definition = matchRole(row.callingTitle, selectedUnit);
    if (!definition) {
      continue;
    }

    assignments[definition.roleId].members.push({
      roleId: definition.roleId,
      roleTitle: definition.roleTitle,
      lcrMemberId: row.lcrMemberId,
      fullName: row.fullName,
      unitName: row.unitName,
      callingTitle: row.callingTitle,
      email: row.email,
      phoneNumber: row.phoneNumber
    });
  }

  for (const definition of ROLE_DEFINITIONS) {
    assignments[definition.roleId].members = dedupePeople(assignments[definition.roleId].members);
  }

  const meetings = Object.fromEntries(
    Object.entries(MEETING_ROLE_IDS).map(([meetingId, meeting]) => {
      const attendees = dedupePeople(
        meeting.attendeeRoleIds.flatMap((roleId) => assignments[roleId]?.members ?? [])
      );

      return [
        meetingId,
        {
          meetingId,
          title: meeting.title,
          attendees
        } satisfies VisualOrgMeetingRoster
      ];
    })
  ) as Record<string, VisualOrgMeetingRoster>;

  return {
    selectedUnit,
    assignments,
    meetings
  };
};
