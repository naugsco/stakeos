export interface VisualOrgAssignedPerson {
  roleId: string;
  roleTitle: string;
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  callingTitle: string;
  email: string | null;
  phoneNumber: string | null;
}

export interface VisualOrgRoleAssignment {
  roleId: string;
  roleTitle: string;
  scope: "stake" | "ward";
  members: VisualOrgAssignedPerson[];
}

export interface VisualOrgMeetingRoster {
  meetingId: string;
  title: string;
  attendees: VisualOrgAssignedPerson[];
}

export interface VisualOrgPayload {
  selectedUnit: string | null;
  assignments: Record<string, VisualOrgRoleAssignment>;
  meetings: Record<string, VisualOrgMeetingRoster>;
  unitTrainingAssignments?: {
    highCouncilor: VisualOrgAssignedPerson | null;
  };
}
