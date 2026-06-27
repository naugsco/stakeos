import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  consumeActionApprovalGate,
  createActionApprovalGate,
  createSavedCohort,
  documentCrossReference,
  explainQuery,
  generateActionPacket,
  getCallingGroupContactList,
  getCallingChangesSince,
  getDataQualityWorkbench,
  getLeadershipGapAlerts,
  getMemberTimeline,
  getSyncDiffReport,
  getTaskRecommendations,
  listSavedCohorts,
  peopleContactQuery,
  prepareCommunicationCampaign,
  queryPlanner,
  resolveMember,
  runSavedCohort,
  sendCommunicationCampaign
} from "@/src/services/advancedMcpService";
import {
  getCovenantPathProgressionReport,
  getCurrentlyServingMissionaries,
  endowmentCandidates,
  generateReport,
  getHouseholdContactList,
  getHouseholdMembers,
  getMissionaryFamilyInfo,
  getCommitteeContactList,
  getHouseholdOutreachReport,
  getEndowmentReadinessContactList,
  getCallingMembers,
  getLeadershipContactList,
  getMarriedCouplesContactList,
  getMembersWithoutMinisteringContactList,
  getMinisteringGapReport,
  getMissionReadinessContactList,
  getMissingContactDataList,
  getNewMemberContactList,
  getOrganizationContactList,
  getRecentBaptismContactList,
  getRecentBaptismReport,
  getRecommendExpirationRiskReport,
  getSeminaryInstituteOpportunityReport,
  getMinisteringAssignments,
  getMemberProfile,
  getReverseMinisteringLookup,
  getUpcomingBirthdays,
  getUnitMinisteringCoverage,
  getSpouse,
  getYouthHouseholdContactList,
  missionEligibleContactList,
  missionEligibleMembers,
  priesthoodAdvancementCandidates,
  queryMembersByAttribute,
  yearsInCalling
} from "@/src/services/intelligenceService";
import { createWhatsAppInviteList, sendCallingEmail } from "@/src/services/messagingService";

const server = new Server(
  {
    name: "stakeos-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

const tools = [
  {
    name: "get_calling_members",
    description: "Get members currently serving in a calling or organization.",
    inputSchema: {
      type: "object",
      properties: {
        calling: { type: "string", description: "Calling title or organization text filter" }
      },
      required: ["calling"]
    }
  },
  {
    name: "get_spouse",
    description: "Find the probable spouse of a member by household.",
    inputSchema: {
      type: "object",
      properties: {
        member: { type: "string", description: "Member full name or LCR member id" }
      },
      required: ["member"]
    }
  },
  {
    name: "ministering_assignments",
    description: "Return the ministering brothers and sisters assigned to a member, by name or LCR member id.",
    inputSchema: {
      type: "object",
      properties: {
        member: { type: "string", description: "Member full name or LCR member id" }
      },
      required: ["member"]
    }
  },
  {
    name: "reverse_ministering_lookup",
    description: "Find which households a minister is assigned to — i.e. who does Brother or Sister X minister to.",
    inputSchema: {
      type: "object",
      properties: {
        member: { type: "string", description: "Minister's full name or LCR member id" }
      },
      required: ["member"]
    }
  },
  {
    name: "member_profile",
    description: "360 profile card for a member: calling(s), household, spouse, ministering, recommend status, and convert/RM flags — one call instead of four.",
    inputSchema: {
      type: "object",
      properties: {
        member: { type: "string", description: "Member full name or LCR member id" }
      },
      required: ["member"]
    }
  },
  {
    name: "upcoming_birthdays",
    description: "List members with birthdays in the next N days, optionally filtered by unit and age range.",
    inputSchema: {
      type: "object",
      properties: {
        windowDays: { type: "number", description: "How many days ahead to look (default 30)" },
        unit: { type: "string", description: "Ward/branch name to filter by (optional)" },
        minAge: { type: "number", description: "Minimum age to include (optional)" },
        maxAge: { type: "number", description: "Maximum age to include (optional)" }
      },
      required: []
    }
  },
  {
    name: "unit_ministering_coverage",
    description: "Companionship-level ministering coverage for a ward/branch: who is assigned to whom and which households are unassigned.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string", description: "Ward or branch name" }
      },
      required: ["unit"]
    }
  },
  {
    name: "years_in_calling",
    description: "Calculate years in a calling based on sustained date.",
    inputSchema: {
      type: "object",
      properties: {
        calling: { type: "string" },
        memberName: { type: "string" }
      },
      required: ["calling"]
    }
  },
  {
    name: "generate_report",
    description: "Generate a leadership intelligence report from local StakeOS data.",
    inputSchema: {
      type: "object",
      properties: {
        reportType: { type: "string" }
      },
      required: ["reportType"]
    }
  },
  {
    name: "send_calling_email",
    description: "Send email to calling, organization, stake council, stake presidency, or custom group.",
    inputSchema: {
      type: "object",
      properties: {
        targetType: {
          type: "string",
          enum: ["calling", "organization", "stake_council", "stake_presidency", "custom"]
        },
        targetValue: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        includeSpouses: { type: "boolean" },
        approvalToken: { type: "string" }
      },
      required: ["targetType", "targetValue", "subject", "body", "approvalToken"]
    }
  },
  {
    name: "create_whatsapp_invite_list",
    description: "Generate formatted phone invite lists for WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        by: {
          type: "string",
          enum: ["calling", "meeting", "organization"]
        },
        value: { type: "string" }
      },
      required: ["by", "value"]
    }
  },
  {
    name: "mission_eligible_members",
    description: "List mission-eligible members by age range, including unit and contact details.",
    inputSchema: {
      type: "object",
      properties: {
        ageMin: { type: "number" },
        ageMax: { type: "number" }
      }
    }
  },
  {
    name: "mission_eligible_contact_list",
    description:
      "Mission-eligible member table with name, age, unit, phone, email, and additional youth readiness fields. Supports filtering and sorting.",
    inputSchema: {
      type: "object",
      properties: {
        ageMin: { type: "number" },
        ageMax: { type: "number" },
        unit: { type: "string" },
        gender: { type: "string" },
        requirePhone: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit_age", "age", "unit", "name"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "calling_group_contact_list",
    description: "Current calling contact list for one or more named StakeOS calling groups. Presidency groups include the secretary when one is present.",
    inputSchema: {
      type: "object",
      properties: {
        groups: {
          type: "array",
          items: { type: "string" },
          description: "Calling group ids such as all_bishops or all_ward_councils."
        },
        unit: { type: "string" },
        limit: { type: "number" }
      },
      required: ["groups"]
    }
  },
  {
    name: "leadership_contact_list",
    description: "Leadership contact table with calling, unit, contact details, and optional spouse details.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" },
        calling: { type: "string" },
        includeSpouses: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit", "name", "calling", "sustained"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "organization_contact_list",
    description: "Organization roster contact table with calling and unit filters.",
    inputSchema: {
      type: "object",
      properties: {
        organization: { type: "string" },
        unit: { type: "string" },
        calling: { type: "string" },
        sortBy: { type: "string", enum: ["unit", "name", "organization", "calling"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "committee_contact_list",
    description: "Committee contact table mapped to handbook-based stake committees and meetings.",
    inputSchema: {
      type: "object",
      properties: {
        committee: { type: "string" },
        unit: { type: "string" },
        sortBy: { type: "string", enum: ["committee", "unit", "name", "role"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "household_contact_list",
    description: "Household-level contact list with member names, email rollups, and phone rollups.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" },
        search: { type: "string" }
      }
    }
  },
  {
    name: "household_members",
    description: "Return the members and contact rollup for a household by household name, head of house, member name, or household id.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string" }
      },
      required: ["search"]
    }
  },
  {
    name: "married_couples_contact_list",
    description: "Married-couple household contact list for outreach or email prep.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" }
      }
    }
  },
  {
    name: "youth_household_contact_list",
    description: "Youth contact table with household parent/guardian contact rollups.",
    inputSchema: {
      type: "object",
      properties: {
        ageMin: { type: "number" },
        ageMax: { type: "number" },
        unit: { type: "string" },
        requireGuardianContact: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit", "age", "name"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "recent_baptism_contact_list",
    description: "Recent baptisms with phone and email for follow-up or welcome efforts.",
    inputSchema: {
      type: "object",
      properties: {
        monthsBack: { type: "number" },
        unit: { type: "string" }
      }
    }
  },
  {
    name: "members_without_ministering_contact_list",
    description: "Members with no ministering assigned, including contact details for follow-up.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" }
      }
    }
  },
  {
    name: "ministering_gap_report",
    description: "Ministering-gap summary and list of members missing ministering assignments.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "recommend_expiration_risk_report",
    description: "Temple recommend expiration risk summary and at-risk member list.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "recent_baptism_report",
    description: "Recent baptism summary and member list for current-year and trailing-period follow-up.",
    inputSchema: {
      type: "object",
      properties: {
        monthsBack: { type: "number" }
      }
    }
  },
  {
    name: "seminary_institute_opportunity_report",
    description: "Eligible seminary/institute members not currently attending, with contact information.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "household_outreach_report",
    description: "Household outreach opportunities across youth, recent baptisms, recommend risk, and ministering gaps.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "covenant_path_progression",
    description: "Members showing covenant-path or church-service progression, scored from ordinance milestones and current engagement.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" },
        minScore: { type: "number" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "mission_readiness_contact_list",
    description: "Mission-readiness list with contact info, recommend status, seminary/institute, and current calling.",
    inputSchema: {
      type: "object",
      properties: {
        ageMin: { type: "number" },
        ageMax: { type: "number" },
        unit: { type: "string" },
        gender: { type: "string" },
        requirePhone: { type: "boolean" },
        requireTempleRecommendActive: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit_age", "age", "unit", "name"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "endowment_readiness_contact_list",
    description: "Endowment-readiness list with contact details and current calling.",
    inputSchema: {
      type: "object",
      properties: {
        minAge: { type: "number" },
        unit: { type: "string" },
        requirePhone: { type: "boolean" },
        requireTempleRecommendActive: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit", "age", "name"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "new_member_contact_list",
    description: "Recent converts/move-ins contact table with ministering assignment status.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" },
        includeConverts: { type: "boolean" },
        includeMoveIns: { type: "boolean" },
        monthsBack: { type: "number" },
        requireContact: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit", "name", "move_in_date"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "missing_contact_data_list",
    description: "Data-quality list of members missing phone, email, or address fields.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" },
        youthOnly: { type: "boolean" },
        includeAdults: { type: "boolean" },
        sortBy: { type: "string", enum: ["unit", "name", "age"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "priesthood_advancement_candidates",
    description: "Identify priesthood advancement candidates.",
    inputSchema: {
      type: "object",
      properties: {
        nextOffice: { type: "string" }
      }
    }
  },
  {
    name: "endowment_candidates",
    description: "List likely endowment candidates from local data.",
    inputSchema: {
      type: "object",
      properties: {
        minAge: { type: "number" }
      }
    }
  },
  {
    name: "query_member_attribute",
    description:
      "Query members by any custom report attribute (for example: mission_country, temple_recommend_status, is_attending_seminary).",
    inputSchema: {
      type: "object",
      properties: {
        attribute: { type: "string" },
        value: { type: "string" },
        limit: { type: "number" }
      },
      required: ["attribute", "value"]
    }
  },
  {
    name: "query_planner",
    description: "Plan which MCP tools to call and in what order for a user goal.",
    inputSchema: {
      type: "object",
      properties: {
        goal: { type: "string" },
        constraints: { type: "string" },
        desiredOutput: { type: "string" }
      },
      required: ["goal"]
    }
  },
  {
    name: "explain_query",
    description: "Explain how a specific MCP tool query works, filters, and expected output.",
    inputSchema: {
      type: "object",
      properties: {
        toolName: { type: "string" },
        arguments: { type: "object" }
      },
      required: ["toolName"]
    }
  },
  {
    name: "resolve_member",
    description: "Resolve a member reference to best candidate records before downstream actions. Query can be a name, LCR member id, email, or phone number.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Member name, LCR member id, email, or phone number." },
        unit: { type: "string" },
        limit: { type: "number" }
      },
      required: ["query"]
    }
  },
  {
    name: "approval_gate_request",
    description: "Issue an approval token for risky send actions. Token must be used with exact same payload.",
    inputSchema: {
      type: "object",
      properties: {
        actionType: { type: "string", enum: ["send_calling_email", "communication_campaign_send"] },
        payload: { type: "object" },
        ttlMinutes: { type: "number" }
      },
      required: ["actionType", "payload"]
    }
  },
  {
    name: "people_contact_query",
    description: "Unified people/contact query tool with filters, columns, and sorting in one request. The free-text search supports name, email, and phone matching.",
    inputSchema: {
      type: "object",
      properties: {
        unit: { type: "string" },
        ageMin: { type: "number" },
        ageMax: { type: "number" },
        gender: { type: "string" },
        calling: { type: "string" },
        organization: { type: "string" },
        hasPhone: { type: "boolean" },
        hasEmail: { type: "boolean" },
        isConvert: { type: "boolean" },
        isReturnedMissionary: { type: "boolean" },
        templeRecommendStatus: { type: "string" },
        isAttendingSeminary: { type: "boolean" },
        isAttendingInstitute: { type: "boolean" },
        search: { type: "string", description: "Free-text search across member name, email, and phone." },
        sortBy: { type: "string", enum: ["unit", "age", "name", "calling"] },
        sortDirection: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "saved_cohort_create",
    description: "Create or update a reusable saved cohort based on people_contact_query filters.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        query: { type: "object" }
      },
      required: ["name", "query"]
    }
  },
  {
    name: "saved_cohort_list",
    description: "List all saved cohorts.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "saved_cohort_run",
    description: "Run a saved cohort by id or name and return current members.",
    inputSchema: {
      type: "object",
      properties: {
        idOrName: { type: "string" }
      },
      required: ["idOrName"]
    }
  },
  {
    name: "leadership_gap_alerts",
    description: "Detect leadership gaps (vacancies, over-tenure, missing contacts, duplicate assignments).",
    inputSchema: {
      type: "object",
      properties: {
        tenureYears: { type: "number" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "sync_diff_report",
    description: "Show all directory/calling/contact changes since the previous successful sync.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" }
      }
    }
  },
  {
    name: "calling_changes_since",
    description: "Return only meaningful calling changes between two points in time: sustained, released, and transferred.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "string", description: "Required baseline timestamp or date string." },
        until: { type: "string", description: "Optional target timestamp or date string. Defaults to the latest successful calling snapshot." },
        unit: { type: "string", description: "Optional unit filter." },
        limit: { type: "number" }
      },
      required: ["since"]
    }
  },
  {
    name: "action_packet_generate",
    description: "Generate a meeting-ready action packet (stake council, bishops council, youth committee, general).",
    inputSchema: {
      type: "object",
      properties: {
        meetingType: { type: "string" }
      },
      required: ["meetingType"]
    }
  },
  {
    name: "communication_campaign_prepare",
    description: "Prepare a campaign recipient list (dry run) from calling/org/committee/cohort/custom/query targets.",
    inputSchema: {
      type: "object",
      properties: {
        targetType: {
          type: "string",
          enum: ["calling", "calling_group", "organization", "committee", "cohort", "custom", "people_query"]
        },
        targetValue: { type: "string" },
        includeSpouses: { type: "boolean" },
        peopleQuery: { type: "object" }
      },
      required: ["targetType"]
    }
  },
  {
    name: "communication_campaign_send",
    description: "Send an email campaign to prepared recipients resolved from target filters.",
    inputSchema: {
      type: "object",
      properties: {
        targetType: {
          type: "string",
          enum: ["calling", "calling_group", "organization", "committee", "cohort", "custom", "people_query"]
        },
        targetValue: { type: "string" },
        includeSpouses: { type: "boolean" },
        peopleQuery: { type: "object" },
        approvalToken: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["targetType", "subject", "body", "approvalToken"]
    }
  },
  {
    name: "member_timeline",
    description: "Return a date-based timeline of key member events and calling history.",
    inputSchema: {
      type: "object",
      properties: {
        member: { type: "string" }
      },
      required: ["member"]
    }
  },
  {
    name: "data_quality_workbench",
    description: "Return data-quality summary and samples (missing contacts, duplicates, inconsistent records).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "document_cross_reference",
    description: "Cross-reference local/Google Drive documents with member names and optional query terms.",
    inputSchema: {
      type: "object",
      properties: {
        folderPath: { type: "string" },
        query: { type: "string" },
        maxFiles: { type: "number" },
        maxMatches: { type: "number" }
      }
    }
  },
  {
    name: "task_recommendations",
    description: "Generate prioritized stake action recommendations from current data and alerts.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "currently_serving_missionaries",
    description: "List all currently serving missionaries with mission country, status, contact info, and current calling.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "missionary_family_info",
    description: "Look up a currently-serving missionary by name or LCR member ID and return their household members and contact info — for contacting parents or siblings.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Missionary name or LCR member ID" }
      },
      required: ["search"]
    }
  }
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  try {
    switch (name) {
      case "get_calling_members": {
        const result = await getCallingMembers(String(args.calling ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "get_spouse": {
        const result = await getSpouse(String(args.member ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "ministering_assignments": {
        const result = await getMinisteringAssignments(String(args.member ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "reverse_ministering_lookup": {
        const result = await getReverseMinisteringLookup(String(args.member ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "member_profile": {
        const result = await getMemberProfile(String(args.member ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "upcoming_birthdays": {
        const result = await getUpcomingBirthdays(
          args.windowDays ? Number(args.windowDays) : 30,
          args.unit ? String(args.unit) : null,
          args.minAge != null ? Number(args.minAge) : null,
          args.maxAge != null ? Number(args.maxAge) : null
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "unit_ministering_coverage": {
        const result = await getUnitMinisteringCoverage(String(args.unit ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "years_in_calling": {
        const result = await yearsInCalling(String(args.calling ?? ""), args.memberName ? String(args.memberName) : undefined);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "generate_report": {
        const result = await generateReport(String(args.reportType ?? "general"));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "send_calling_email": {
        const payload = {
          targetType: String(args.targetType),
          targetValue: String(args.targetValue ?? ""),
          subject: String(args.subject ?? ""),
          body: String(args.body ?? ""),
          includeSpouses: Boolean(args.includeSpouses)
        };
        await consumeActionApprovalGate({
          actionType: "send_calling_email",
          payload,
          approvalToken: String(args.approvalToken ?? "")
        });
        const result = await sendCallingEmail({
          targetType: String(args.targetType) as
            | "calling"
            | "organization"
            | "stake_council"
            | "stake_presidency"
            | "custom",
          targetValue: payload.targetValue,
          subject: payload.subject,
          body: payload.body,
          includeSpouses: payload.includeSpouses
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "create_whatsapp_invite_list": {
        const result = await createWhatsAppInviteList(
          String(args.by ?? "calling") as "calling" | "meeting" | "organization",
          String(args.value ?? "")
        );
        return { content: [{ type: "text", text: result }] };
      }
      case "mission_eligible_members": {
        const result = await missionEligibleMembers(
          args.ageMin ? Number(args.ageMin) : 16,
          args.ageMax ? Number(args.ageMax) : 25
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "mission_eligible_contact_list": {
        const result = await missionEligibleContactList({
          ageMin: args.ageMin ? Number(args.ageMin) : 16,
          ageMax: args.ageMax ? Number(args.ageMax) : 25,
          unit: args.unit ? String(args.unit) : undefined,
          gender: args.gender ? String(args.gender) : undefined,
          requirePhone: args.requirePhone === undefined ? false : Boolean(args.requirePhone),
          sortBy: args.sortBy
            ? (String(args.sortBy) as "unit_age" | "age" | "unit" | "name")
            : "unit_age",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "calling_group_contact_list": {
        const result = await getCallingGroupContactList({
          groups: Array.isArray(args.groups) ? args.groups.map((group) => String(group)) : [],
          unit: args.unit ? String(args.unit) : undefined,
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "leadership_contact_list": {
        const result = await getLeadershipContactList({
          unit: args.unit ? String(args.unit) : undefined,
          calling: args.calling ? String(args.calling) : undefined,
          includeSpouses: args.includeSpouses === undefined ? true : Boolean(args.includeSpouses),
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "name" | "calling" | "sustained") : "unit",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "organization_contact_list": {
        const result = await getOrganizationContactList({
          organization: args.organization ? String(args.organization) : undefined,
          unit: args.unit ? String(args.unit) : undefined,
          calling: args.calling ? String(args.calling) : undefined,
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "name" | "organization" | "calling") : "organization",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "committee_contact_list": {
        const result = await getCommitteeContactList({
          committee: args.committee ? String(args.committee) : undefined,
          unit: args.unit ? String(args.unit) : undefined,
          sortBy: args.sortBy ? (String(args.sortBy) as "committee" | "unit" | "name" | "role") : "committee",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "household_contact_list": {
        const result = await getHouseholdContactList(
          args.unit ? String(args.unit) : undefined,
          args.search ? String(args.search) : undefined
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "household_members": {
        const result = await getHouseholdMembers(String(args.search ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "married_couples_contact_list": {
        const result = await getMarriedCouplesContactList(args.unit ? String(args.unit) : undefined);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "youth_household_contact_list": {
        const result = await getYouthHouseholdContactList({
          ageMin: args.ageMin ? Number(args.ageMin) : 12,
          ageMax: args.ageMax ? Number(args.ageMax) : 18,
          unit: args.unit ? String(args.unit) : undefined,
          requireGuardianContact: args.requireGuardianContact === undefined ? false : Boolean(args.requireGuardianContact),
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "age" | "name") : "unit",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "recent_baptism_contact_list": {
        const result = await getRecentBaptismContactList(
          args.monthsBack ? Number(args.monthsBack) : 12,
          args.unit ? String(args.unit) : undefined
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "members_without_ministering_contact_list": {
        const result = await getMembersWithoutMinisteringContactList(args.unit ? String(args.unit) : undefined);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "ministering_gap_report": {
        const result = await getMinisteringGapReport();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "recommend_expiration_risk_report": {
        const result = await getRecommendExpirationRiskReport();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "recent_baptism_report": {
        const result = await getRecentBaptismReport(args.monthsBack ? Number(args.monthsBack) : 12);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "seminary_institute_opportunity_report": {
        const result = await getSeminaryInstituteOpportunityReport();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "household_outreach_report": {
        const result = await getHouseholdOutreachReport();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "covenant_path_progression": {
        const result = await getCovenantPathProgressionReport({
          unit: args.unit ? String(args.unit) : undefined,
          minScore: args.minScore ? Number(args.minScore) : undefined,
          limit: args.limit ? Number(args.limit) : undefined
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "mission_readiness_contact_list": {
        const result = await getMissionReadinessContactList({
          ageMin: args.ageMin ? Number(args.ageMin) : 16,
          ageMax: args.ageMax ? Number(args.ageMax) : 25,
          unit: args.unit ? String(args.unit) : undefined,
          gender: args.gender ? String(args.gender) : undefined,
          requirePhone: args.requirePhone === undefined ? false : Boolean(args.requirePhone),
          requireTempleRecommendActive:
            args.requireTempleRecommendActive === undefined ? false : Boolean(args.requireTempleRecommendActive),
          sortBy: args.sortBy
            ? (String(args.sortBy) as "unit_age" | "age" | "unit" | "name")
            : "unit_age",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "endowment_readiness_contact_list": {
        const result = await getEndowmentReadinessContactList({
          minAge: args.minAge ? Number(args.minAge) : 18,
          unit: args.unit ? String(args.unit) : undefined,
          requirePhone: args.requirePhone === undefined ? false : Boolean(args.requirePhone),
          requireTempleRecommendActive:
            args.requireTempleRecommendActive === undefined ? false : Boolean(args.requireTempleRecommendActive),
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "age" | "name") : "age",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "desc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "new_member_contact_list": {
        const result = await getNewMemberContactList({
          unit: args.unit ? String(args.unit) : undefined,
          includeConverts: args.includeConverts === undefined ? true : Boolean(args.includeConverts),
          includeMoveIns: args.includeMoveIns === undefined ? true : Boolean(args.includeMoveIns),
          monthsBack: args.monthsBack ? Number(args.monthsBack) : 12,
          requireContact: args.requireContact === undefined ? false : Boolean(args.requireContact),
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "name" | "move_in_date") : "move_in_date",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "desc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "missing_contact_data_list": {
        const result = await getMissingContactDataList({
          unit: args.unit ? String(args.unit) : undefined,
          youthOnly: args.youthOnly === undefined ? false : Boolean(args.youthOnly),
          includeAdults: args.includeAdults === undefined ? true : Boolean(args.includeAdults),
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "name" | "age") : "unit",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "priesthood_advancement_candidates": {
        const result = await priesthoodAdvancementCandidates(args.nextOffice ? String(args.nextOffice) : "Elder");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "endowment_candidates": {
        const result = await endowmentCandidates(args.minAge ? Number(args.minAge) : 18);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "query_member_attribute": {
        const result = await queryMembersByAttribute(
          String(args.attribute ?? ""),
          String(args.value ?? ""),
          args.limit ? Number(args.limit) : 100
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "query_planner": {
        const result = await queryPlanner({
          goal: String(args.goal ?? ""),
          constraints: args.constraints ? String(args.constraints) : undefined,
          desiredOutput: args.desiredOutput ? String(args.desiredOutput) : undefined
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "explain_query": {
        const result = await explainQuery({
          toolName: String(args.toolName ?? ""),
          arguments:
            typeof args.arguments === "object" && args.arguments !== null
              ? (args.arguments as Record<string, unknown>)
              : undefined
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "resolve_member": {
        const result = await resolveMember({
          query: String(args.query ?? ""),
          unit: args.unit ? String(args.unit) : undefined,
          limit: args.limit ? Number(args.limit) : 25
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "approval_gate_request": {
        const result = await createActionApprovalGate({
          actionType: String(args.actionType ?? "") as "send_calling_email" | "communication_campaign_send",
          payload:
            typeof args.payload === "object" && args.payload !== null
              ? (args.payload as Record<string, unknown>)
              : {},
          ttlMinutes: args.ttlMinutes ? Number(args.ttlMinutes) : 30
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "people_contact_query": {
        const result = await peopleContactQuery({
          unit: args.unit ? String(args.unit) : undefined,
          ageMin: args.ageMin ? Number(args.ageMin) : undefined,
          ageMax: args.ageMax ? Number(args.ageMax) : undefined,
          gender: args.gender ? String(args.gender) : undefined,
          calling: args.calling ? String(args.calling) : undefined,
          organization: args.organization ? String(args.organization) : undefined,
          hasPhone: args.hasPhone === undefined ? undefined : Boolean(args.hasPhone),
          hasEmail: args.hasEmail === undefined ? undefined : Boolean(args.hasEmail),
          isConvert: args.isConvert === undefined ? undefined : Boolean(args.isConvert),
          isReturnedMissionary: args.isReturnedMissionary === undefined ? undefined : Boolean(args.isReturnedMissionary),
          templeRecommendStatus: args.templeRecommendStatus ? String(args.templeRecommendStatus) : undefined,
          isAttendingSeminary: args.isAttendingSeminary === undefined ? undefined : Boolean(args.isAttendingSeminary),
          isAttendingInstitute: args.isAttendingInstitute === undefined ? undefined : Boolean(args.isAttendingInstitute),
          search: args.search ? String(args.search) : undefined,
          sortBy: args.sortBy ? (String(args.sortBy) as "unit" | "age" | "name" | "calling") : "unit",
          sortDirection: args.sortDirection ? (String(args.sortDirection) as "asc" | "desc") : "asc",
          limit: args.limit ? Number(args.limit) : 500
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "saved_cohort_create": {
        const result = await createSavedCohort({
          name: String(args.name ?? ""),
          description: args.description ? String(args.description) : undefined,
          tags: Array.isArray(args.tags) ? args.tags.map((tag) => String(tag)) : undefined,
          query: (typeof args.query === "object" && args.query !== null ? args.query : {}) as Record<string, unknown>
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "saved_cohort_list": {
        const result = await listSavedCohorts();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "saved_cohort_run": {
        const result = await runSavedCohort(String(args.idOrName ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "leadership_gap_alerts": {
        const result = await getLeadershipGapAlerts({
          tenureYears: args.tenureYears ? Number(args.tenureYears) : 4,
          limit: args.limit ? Number(args.limit) : 50
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "sync_diff_report": {
        const result = await getSyncDiffReport({
          limit: args.limit ? Number(args.limit) : 30
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "calling_changes_since": {
        const result = await getCallingChangesSince({
          since: String(args.since ?? ""),
          until: args.until ? String(args.until) : undefined,
          unit: args.unit ? String(args.unit) : undefined,
          limit: args.limit ? Number(args.limit) : 200
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "action_packet_generate": {
        const result = await generateActionPacket(String(args.meetingType ?? "general"));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "communication_campaign_prepare": {
        const result = await prepareCommunicationCampaign({
          targetType: String(args.targetType ?? "custom") as
            | "calling"
            | "calling_group"
            | "organization"
            | "committee"
            | "cohort"
            | "custom"
            | "people_query",
          targetValue: args.targetValue ? String(args.targetValue) : undefined,
          includeSpouses: args.includeSpouses === undefined ? false : Boolean(args.includeSpouses),
          peopleQuery:
            typeof args.peopleQuery === "object" && args.peopleQuery !== null
              ? (args.peopleQuery as Record<string, unknown>)
              : undefined
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "communication_campaign_send": {
        const payload = {
          targetType: String(args.targetType ?? "custom"),
          targetValue: args.targetValue ? String(args.targetValue) : undefined,
          includeSpouses: args.includeSpouses === undefined ? false : Boolean(args.includeSpouses),
          peopleQuery:
            typeof args.peopleQuery === "object" && args.peopleQuery !== null
              ? (args.peopleQuery as Record<string, unknown>)
              : undefined,
          subject: String(args.subject ?? ""),
          body: String(args.body ?? "")
        };
        await consumeActionApprovalGate({
          actionType: "communication_campaign_send",
          payload,
          approvalToken: String(args.approvalToken ?? "")
        });

        const result = await sendCommunicationCampaign({
          targetType: payload.targetType as
            | "calling"
            | "calling_group"
            | "organization"
            | "committee"
            | "cohort"
            | "custom"
            | "people_query",
          targetValue: payload.targetValue,
          includeSpouses: payload.includeSpouses,
          peopleQuery: payload.peopleQuery,
          subject: payload.subject,
          body: payload.body
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "member_timeline": {
        const result = await getMemberTimeline(String(args.member ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "data_quality_workbench": {
        const result = await getDataQualityWorkbench();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "document_cross_reference": {
        const result = await documentCrossReference({
          folderPath: args.folderPath ? String(args.folderPath) : undefined,
          query: args.query ? String(args.query) : undefined,
          maxFiles: args.maxFiles ? Number(args.maxFiles) : undefined,
          maxMatches: args.maxMatches ? Number(args.maxMatches) : undefined
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "task_recommendations": {
        const result = await getTaskRecommendations();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "currently_serving_missionaries": {
        const result = await getCurrentlyServingMissionaries();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "missionary_family_info": {
        const result = await getMissionaryFamilyInfo(String(args.search ?? ""));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${name}` }]
        };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error instanceof Error ? error.message : "Tool execution failed" }]
    };
  }
});

const start = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

start().catch((error) => {
  console.error("Failed to start StakeOS MCP server", error);
  process.exit(1);
});
