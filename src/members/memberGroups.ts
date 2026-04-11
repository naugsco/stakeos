export type MemberGroupId =
  | "all_members"
  | "all_adult_members"
  | "all_men"
  | "all_women"
  | "all_melchizedek_priesthood_holders"
  | "single_adults"
  | "young_single_adults"
  | "young_men"
  | "young_women"
  | "parents_of_young_men"
  | "parents_of_young_women"
  | "parents_of_primary_children"
  | "full_time_missionaries";

export interface MemberGroupDefinition {
  id: MemberGroupId;
  label: string;
  column: 1 | 2;
}

export interface MemberFilterCandidate {
  lcrMemberId: string;
  age: number | null;
  gender: string | null;
  householdId: number | null;
  householdPosition: string | null;
  memberStatus: string | null;
  isMarried: boolean | null;
  isSingle: boolean | null;
  marriageStatus: string | null;
  missionStatus: string | null;
  missionCountry: string | null;
  isReturnedMissionary: boolean | null;
  priesthoodType: string | null;
  priesthoodOffice: string | null;
}

export const MEMBER_GROUP_DEFINITIONS: MemberGroupDefinition[] = [
  { id: "all_members", label: "All Members", column: 1 },
  { id: "all_adult_members", label: "All Adult Members", column: 1 },
  { id: "all_men", label: "All Men", column: 1 },
  { id: "all_women", label: "All Women", column: 1 },
  { id: "all_melchizedek_priesthood_holders", label: "All Melchizedek Priesthood Holders", column: 1 },
  { id: "single_adults", label: "Single Adults", column: 1 },
  { id: "young_single_adults", label: "Young Single Adults", column: 1 },
  { id: "young_men", label: "Young Men", column: 2 },
  { id: "young_women", label: "Young Women", column: 2 },
  { id: "parents_of_young_men", label: "Parents of Young Men", column: 2 },
  { id: "parents_of_young_women", label: "Parents of Young Women", column: 2 },
  { id: "parents_of_primary_children", label: "Parents of Primary Children", column: 2 },
  { id: "full_time_missionaries", label: "Full-Time Missionaries", column: 2 }
];

const normalizeGender = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const isAdult = (member: MemberFilterCandidate) => typeof member.age === "number" && member.age >= 18;
const isYouth = (member: MemberFilterCandidate, minAge: number, maxAge: number) =>
  typeof member.age === "number" && member.age >= minAge && member.age <= maxAge;
const isMale = (member: MemberFilterCandidate) => ["m", "male", "man"].includes(normalizeGender(member.gender));
const isFemale = (member: MemberFilterCandidate) => ["f", "female", "woman"].includes(normalizeGender(member.gender));
const isActiveMember = (member: MemberFilterCandidate) => {
  const status = normalizeText(member.memberStatus);
  return !status || status.startsWith("active");
};
const isUnmarried = (member: MemberFilterCandidate) => {
  if (member.isMarried === true) {
    return false;
  }
  if (member.isSingle === true) {
    return true;
  }
  return normalizeText(member.marriageStatus) === "single";
};
const isMelchizedekPriesthoodHolder = (member: MemberFilterCandidate) => {
  const type = normalizeText(member.priesthoodType);
  const office = normalizeText(member.priesthoodOffice);
  return (
    type.includes("melchizedek") ||
    ["elder", "high priest", "seventy", "patriarch", "apostle"].includes(office)
  );
};
const isCurrentlyServingMissionary = (member: MemberFilterCandidate) => {
  if (member.isReturnedMissionary) {
    return false;
  }
  return Boolean(normalizeText(member.missionStatus) || normalizeText(member.missionCountry));
};
const isParentLikeAdult = (member: MemberFilterCandidate) => {
  if (!isAdult(member) || !isActiveMember(member)) {
    return false;
  }
  const position = normalizeText(member.householdPosition);
  if (!position) {
    return true;
  }
  return /(head|spouse|parent|guardian)/.test(position);
};

export interface MemberGroupContext {
  householdsWithYoungMen: Set<number>;
  householdsWithYoungWomen: Set<number>;
  householdsWithPrimaryChildren: Set<number>;
}

export const buildMemberGroupContext = (members: MemberFilterCandidate[]): MemberGroupContext => {
  const householdsWithYoungMen = new Set<number>();
  const householdsWithYoungWomen = new Set<number>();
  const householdsWithPrimaryChildren = new Set<number>();

  for (const member of members) {
    if (!isActiveMember(member) || member.householdId === null || member.householdId === undefined) {
      continue;
    }

    if (isYouth(member, 12, 18) && isMale(member)) {
      householdsWithYoungMen.add(member.householdId);
    }
    if (isYouth(member, 12, 18) && isFemale(member)) {
      householdsWithYoungWomen.add(member.householdId);
    }
    if (isYouth(member, 3, 11)) {
      householdsWithPrimaryChildren.add(member.householdId);
    }
  }

  return { householdsWithYoungMen, householdsWithYoungWomen, householdsWithPrimaryChildren };
};

export const matchesMemberGroup = (
  member: MemberFilterCandidate,
  groupId: MemberGroupId,
  context: MemberGroupContext
) => {
  switch (groupId) {
    case "all_members":
      return isActiveMember(member);
    case "all_adult_members":
      return isActiveMember(member) && isAdult(member);
    case "all_men":
      return isActiveMember(member) && isMale(member);
    case "all_women":
      return isActiveMember(member) && isFemale(member);
    case "all_melchizedek_priesthood_holders":
      return isActiveMember(member) && isMelchizedekPriesthoodHolder(member);
    case "single_adults":
      return isActiveMember(member) && isAdult(member) && isUnmarried(member) && typeof member.age === "number" && member.age >= 31;
    case "young_single_adults":
      return isActiveMember(member) && isUnmarried(member) && isYouth(member, 18, 35);
    case "young_men":
      return isActiveMember(member) && isYouth(member, 12, 18) && isMale(member);
    case "young_women":
      return isActiveMember(member) && isYouth(member, 12, 18) && isFemale(member);
    case "parents_of_young_men":
      return (
        member.householdId !== null &&
        member.householdId !== undefined &&
        context.householdsWithYoungMen.has(member.householdId) &&
        isParentLikeAdult(member)
      );
    case "parents_of_young_women":
      return (
        member.householdId !== null &&
        member.householdId !== undefined &&
        context.householdsWithYoungWomen.has(member.householdId) &&
        isParentLikeAdult(member)
      );
    case "parents_of_primary_children":
      return (
        member.householdId !== null &&
        member.householdId !== undefined &&
        context.householdsWithPrimaryChildren.has(member.householdId) &&
        isParentLikeAdult(member)
      );
    case "full_time_missionaries":
      return isActiveMember(member) && isCurrentlyServingMissionary(member);
    default:
      return false;
  }
};
