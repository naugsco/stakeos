// LCR's member report has no "Mission" column, so mission status is derived during sync.
// Mission country/language only ever accompany the returned-missionary flag, so this is the
// only status the source data can establish — nothing here implies current service.
export const RETURNED_MISSIONARY_STATUS = "Returned Missionary";

export interface UnitRecord {
  unitNumber: string;
  name: string;
  unitType?: string;
}

export interface HouseholdRecord {
  lcrHouseholdId: string;
  unitNumber: string;
  householdName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface EmailRecord {
  email: string;
  type?: string;
  isPrimary?: boolean;
}

export interface PhoneRecord {
  phoneNumber: string;
  type?: string;
  isPrimary?: boolean;
  canText?: boolean;
}

export interface PriesthoodRecord {
  currentOffice?: string;
  officeDate?: string;
  melchizedekPriesthoodDate?: string;
  aaronicPriesthoodDate?: string;
  ordainedBy?: string;
}

export interface MemberRecord {
  lcrMemberId: string;
  lcrHouseholdId?: string;
  unitNumber: string;
  unitName?: string;
  unitAbbreviation?: string;
  preferredName?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressStateOrProvince?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  gender?: string;
  birthdate?: string;
  birthCountry?: string;
  birthplace?: string;
  age?: number;
  memberStatus?: string;
  moveInDate?: string;
  isConvert?: boolean;
  isWidowed?: boolean;
  isReturnedMissionary?: boolean;
  isAccountable?: boolean;
  isBornInCovenant?: boolean;
  isDivorced?: boolean;
  isMarried?: boolean;
  hasChildren?: boolean;
  isSealedToParents?: boolean;
  isSingle?: boolean;
  isSealedToSpouse?: boolean;
  isSealedToCurrentSpouse?: boolean;
  isSealedToPriorSpouse?: boolean;
  baptismDate?: string;
  confirmationDate?: string;
  endowmentDate?: string;
  templeEndowed?: boolean;
  endowmentStatus?: string;
  templeRecommendStatus?: string;
  templeRecommendExpirationDate?: string;
  templeRecommendType?: string;
  missionStatus?: string;
  missionLanguage?: string;
  missionCountry?: string;
  priesthoodType?: string;
  priesthoodOffice?: string;
  callingsText?: string;
  callingsWithDatesText?: string;
  instituteStatus?: string;
  seminaryStatus?: string;
  isAttendingSeminary?: boolean;
  isAttendingInstitute?: boolean;
  potentialInstituteStudent?: boolean;
  potentialSeminaryStudent?: boolean;
  hasMinisteringSisters?: boolean;
  hasMinisteringBrothers?: boolean;
  ministeringBrothers?: string;
  ministeringSisters?: string;
  ordinationDate?: string;
  marriageDate?: string;
  marriageStatus?: string;
  sealingToParents?: string;
  sealingToSpouse?: string;
  spouseName?: string;
  headOfHouse?: string;
  householdPosition?: string;
  profileData?: Record<string, string>;
  emails: EmailRecord[];
  phoneNumbers: PhoneRecord[];
  priesthood?: PriesthoodRecord;
}

export interface OrganizationRecord {
  lcrOrganizationId: string;
  unitNumber: string;
  name: string;
  category?: string;
  parentLcrOrganizationId?: string;
}

export interface CallingRecord {
  lcrCallingId: string;
  unitNumber: string;
  lcrMemberId?: string;
  lcrOrganizationId?: string;
  title: string;
  standardName?: string;
  sustainedOn?: string;
  setApartOn?: string;
  releasedOn?: string;
  isCurrent: boolean;
  /** LCR reports set-apart as a Yes/No flag, not a date, so setApartOn stays unset. */
  isSetApart?: boolean;
}

export interface MeetingAssignmentRecord {
  assignmentKey: string;
  unitNumber: string;
  meetingName: string;
  meetingDate?: string;
  lcrMemberId?: string;
  lcrCallingId?: string;
  lcrOrganizationId?: string;
  assignmentType?: string;
  notes?: string;
  status?: string;
}

export interface DirectorySnapshot {
  units: UnitRecord[];
  households: HouseholdRecord[];
  members: MemberRecord[];
  organizations: OrganizationRecord[];
  callings: CallingRecord[];
  meetingAssignments: MeetingAssignmentRecord[];
}
