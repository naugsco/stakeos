export type CallingGroupId =
  | "all_callings"
  | "all_bishops"
  | "all_bishoprics"
  | "all_clerks"
  | "all_executive_secretaries"
  | "all_organization_presidencies"
  | "all_elders_quorum_presidencies"
  | "all_relief_society_presidencies"
  | "all_young_women_presidencies"
  | "all_sunday_school_presidencies"
  | "all_primary_presidencies"
  | "all_ward_mission_leaders"
  | "all_ward_councils"
  | "all_ward_young_single_adult_leaders"
  | "all_temple_family_history_leaders";

export type CallingGroupDefinition = {
  id: CallingGroupId;
  label: string;
  column: 1 | 2;
};

export type CallingFilterCandidate = {
  callingTitle: string;
  organizationName?: string | null;
};

export const CALLING_GROUP_DEFINITIONS: CallingGroupDefinition[] = [
  { id: "all_callings", label: "All Callings", column: 1 },
  { id: "all_bishops", label: "All Bishops", column: 1 },
  { id: "all_bishoprics", label: "All Bishoprics", column: 1 },
  { id: "all_clerks", label: "All Clerks", column: 1 },
  { id: "all_executive_secretaries", label: "All Executive Secretaries", column: 1 },
  { id: "all_organization_presidencies", label: "All Organization Presidencies", column: 1 },
  { id: "all_elders_quorum_presidencies", label: "All Elders Quorum Presidencies", column: 1 },
  { id: "all_relief_society_presidencies", label: "All Relief Society Presidencies", column: 1 },
  { id: "all_young_women_presidencies", label: "All Young Women Presidencies", column: 2 },
  { id: "all_sunday_school_presidencies", label: "All Sunday School Presidencies", column: 2 },
  { id: "all_primary_presidencies", label: "All Primary Presidencies", column: 2 },
  { id: "all_ward_mission_leaders", label: "All Ward Mission Leaders", column: 2 },
  { id: "all_ward_councils", label: "All Ward Councils", column: 2 },
  { id: "all_ward_young_single_adult_leaders", label: "All Ward Young Single Adult Leaders", column: 2 },
  { id: "all_temple_family_history_leaders", label: "All Temple and Family History Leaders", column: 2 }
];

const normalize = (value: string | null | undefined) =>
  value
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";

const isBishopTitle = (title: string) => /^(bishop|branch president)$/.test(title);
const isBishopricTitle = (title: string) =>
  isBishopTitle(title) || /^(bishopric|branch presidency) (first|second) counselor$/.test(title);
const isClerkTitle = (title: string) => /\bclerk\b/.test(title);
const isExecutiveSecretaryTitle = (title: string) => /\bexecutive secretary\b/.test(title);
const isEldersQuorumPresidencyTitle = (title: string) => /^(elders quorum) (president|first counselor|second counselor)$/.test(title);
const isReliefSocietyPresidencyTitle = (title: string) => /^(relief society) (president|first counselor|second counselor)$/.test(title);
const isYoungWomenPresidencyTitle = (title: string) => /^(young women) (president|first counselor|second counselor)$/.test(title);
const isSundaySchoolPresidencyTitle = (title: string) => /^(sunday school) (president|first counselor|second counselor)$/.test(title);
const isPrimaryPresidencyTitle = (title: string) => /^(primary) (president|first counselor|second counselor)$/.test(title);
const isWardMissionLeaderTitle = (title: string) => /^(ward|branch) mission leader$/.test(title);
const isWardYsaLeaderTitle = (title: string, organizationName: string) =>
  /young single adult/.test(title) || /young single adult/.test(organizationName);
const isTempleFamilyHistoryLeaderTitle = (title: string, organizationName: string) =>
  /(temple and family history|family history)/.test(title) || /(temple and family history|family history)/.test(organizationName);

export const matchesCallingGroup = (candidate: CallingFilterCandidate, groupId: CallingGroupId) => {
  const title = normalize(candidate.callingTitle);
  const organizationName = normalize(candidate.organizationName);

  switch (groupId) {
    case "all_callings":
      return true;
    case "all_bishops":
      return isBishopTitle(title);
    case "all_bishoprics":
      return isBishopricTitle(title);
    case "all_clerks":
      return isClerkTitle(title);
    case "all_executive_secretaries":
      return isExecutiveSecretaryTitle(title);
    case "all_organization_presidencies":
      return (
        isEldersQuorumPresidencyTitle(title) ||
        isReliefSocietyPresidencyTitle(title) ||
        isYoungWomenPresidencyTitle(title) ||
        isSundaySchoolPresidencyTitle(title) ||
        isPrimaryPresidencyTitle(title)
      );
    case "all_elders_quorum_presidencies":
      return isEldersQuorumPresidencyTitle(title);
    case "all_relief_society_presidencies":
      return isReliefSocietyPresidencyTitle(title);
    case "all_young_women_presidencies":
      return isYoungWomenPresidencyTitle(title);
    case "all_sunday_school_presidencies":
      return isSundaySchoolPresidencyTitle(title);
    case "all_primary_presidencies":
      return isPrimaryPresidencyTitle(title);
    case "all_ward_mission_leaders":
      return isWardMissionLeaderTitle(title);
    case "all_ward_councils":
      return (
        isBishopricTitle(title) ||
        isClerkTitle(title) ||
        isExecutiveSecretaryTitle(title) ||
        /^(elders quorum|relief society|young women|primary|sunday school) president$/.test(title) ||
        isWardMissionLeaderTitle(title)
      );
    case "all_ward_young_single_adult_leaders":
      return isWardYsaLeaderTitle(title, organizationName);
    case "all_temple_family_history_leaders":
      return isTempleFamilyHistoryLeaderTitle(title, organizationName) && /(leader|consultant|coordinator)/.test(title);
  }
};

export const getCallingGroupMatches = (candidate: CallingFilterCandidate) =>
  CALLING_GROUP_DEFINITIONS.filter((group) => matchesCallingGroup(candidate, group.id)).map((group) => group.id);
