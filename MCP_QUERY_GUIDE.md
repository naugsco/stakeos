# StakeOS MCP Query Guide

This guide documents the StakeOS MCP tools and how to phrase queries in natural language.

Source of truth:
- `src/mcp/server.ts`
- `src/services/intelligenceService.ts`

## MCP Tools

| Tool | Inputs | Natural language intent |
|---|---|---|
| `get_calling_members` | `calling` | "Who is serving in this calling or organization?" |
| `get_spouse` | `member` | "Who is this member's spouse?" |
| `years_in_calling` | `calling`, `memberName` (optional) | "How long has this person been in this calling?" |
| `generate_report` | `reportType` | "Generate a leadership report of type X." |
| `send_calling_email` | `targetType`, `targetValue`, `subject`, `body`, `includeSpouses` (optional), `approvalToken` | "Send an email to this group/calling/organization (approval token required)." |
| `create_whatsapp_invite_list` | `by`, `value` | "Create a WhatsApp invite list by calling/meeting/organization." |
| `mission_eligible_members` | `ageMin` (optional), `ageMax` (optional) | "Show mission-eligible members in this age range (includes unit and contact fields)." |
| `mission_eligible_contact_list` | `ageMin` (optional), `ageMax` (optional), `unit` (optional), `gender` (optional), `requirePhone` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return a mission-eligible table with name, age, unit, phone, email, and readiness details." |
| `leadership_contact_list` | `unit` (optional), `calling` (optional), `includeSpouses` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return leadership contacts with spouse details." |
| `organization_contact_list` | `organization` (optional), `unit` (optional), `calling` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return organization roster contacts." |
| `committee_contact_list` | `committee` (optional), `unit` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return handbook-based committee membership contacts." |
| `youth_household_contact_list` | `ageMin` (optional), `ageMax` (optional), `unit` (optional), `requireGuardianContact` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return youth plus parent/guardian household contacts." |
| `mission_readiness_contact_list` | `ageMin` (optional), `ageMax` (optional), `unit` (optional), `gender` (optional), `requirePhone` (optional), `requireTempleRecommendActive` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return mission-readiness contacts and readiness signals." |
| `endowment_readiness_contact_list` | `minAge` (optional), `unit` (optional), `requirePhone` (optional), `requireTempleRecommendActive` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return endowment-readiness contacts." |
| `new_member_contact_list` | `unit` (optional), `includeConverts` (optional), `includeMoveIns` (optional), `monthsBack` (optional), `requireContact` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return recent convert/move-in contact list." |
| `missing_contact_data_list` | `unit` (optional), `youthOnly` (optional), `includeAdults` (optional), `sortBy` (optional), `sortDirection` (optional), `limit` (optional) | "Return members missing phone/email/address data." |
| `query_planner` | `goal`, `constraints` (optional), `desiredOutput` (optional) | "Plan the best MCP tool sequence for a request." |
| `explain_query` | `toolName`, `arguments` (optional) | "Explain how a tool filters data and what it returns." |
| `resolve_member` | `query`, `unit` (optional), `limit` (optional) | "Resolve/disambiguate a person before running actions." |
| `approval_gate_request` | `actionType`, `payload`, `ttlMinutes` (optional) | "Issue an approval token for risky send actions." |
| `people_contact_query` | `unit`, `ageMin`, `ageMax`, `gender`, `calling`, `organization`, `hasPhone`, `hasEmail`, `isConvert`, `isReturnedMissionary`, `templeRecommendStatus`, `isAttendingSeminary`, `isAttendingInstitute`, `search`, `sortBy`, `sortDirection`, `limit` | "Run a single unified person/contact query instead of chaining tools." |
| `saved_cohort_create` | `name`, `description` (optional), `tags` (optional), `query` | "Save or update a reusable filtered cohort." |
| `saved_cohort_list` | none | "List saved cohorts." |
| `saved_cohort_run` | `idOrName` | "Run a saved cohort and return current matches." |
| `leadership_gap_alerts` | `tenureYears` (optional), `limit` (optional) | "Detect leadership vacancies, over-tenure, duplicates, and contact gaps." |
| `sync_diff_report` | `limit` (optional) | "Show all changes since previous successful sync window." |
| `action_packet_generate` | `meetingType` | "Build a meeting-ready action packet." |
| `communication_campaign_prepare` | `targetType`, `targetValue` (optional), `includeSpouses` (optional), `peopleQuery` (optional) | "Preview campaign recipients before sending." |
| `communication_campaign_send` | `targetType`, `targetValue` (optional), `includeSpouses` (optional), `peopleQuery` (optional), `subject`, `body`, `approvalToken` | "Send campaign email to resolved recipients (approval token required)." |
| `member_timeline` | `member` | "Show a member timeline (move-in, baptism, calling events)." |
| `data_quality_workbench` | none | "Data quality summary and issue samples." |
| `document_cross_reference` | `folderPath` (optional), `query` (optional), `maxFiles` (optional), `maxMatches` (optional) | "Cross-reference local/Drive docs with stake directory names." |
| `task_recommendations` | none | "Return prioritized, evidence-based action recommendations." |
| `priesthood_advancement_candidates` | `nextOffice` (optional) | "Show priesthood advancement candidates for this next office." |
| `endowment_candidates` | `minAge` (optional) | "Show likely endowment candidates older than this age." |
| `query_member_attribute` | `attribute`, `value`, `limit` (optional) | "Find members where an attribute matches a value." |

## Contact Table Outputs

- `mission_eligible_contact_list`: `fullName, age, unitName, phoneNumber, email, gender, missionStatus, templeRecommendStatus, isAttendingSeminary, isAttendingInstitute, currentCalling`
- `leadership_contact_list`: `fullName, unitName, callingTitle, organizationName, sustainedOn, phoneNumber, email, spouseName, spousePhone, spouseEmail`
- `organization_contact_list`: `fullName, unitName, organizationName, callingTitle, phoneNumber, email`
- `committee_contact_list`: `committeeName, fullName, unitName, committeeRole, callingTitle, phoneNumber, email`
- `youth_household_contact_list`: `youthName, age, unitName, youthPhone, youthEmail, parentGuardianNames, parentGuardianPhones, parentGuardianEmails`
- `mission_readiness_contact_list`: `fullName, age, unitName, phoneNumber, email, missionStatus, templeRecommendStatus, isAttendingSeminary, isAttendingInstitute, currentCalling`
- `endowment_readiness_contact_list`: `fullName, age, unitName, templeEndowed, templeRecommendStatus, missionStatus, currentCalling, phoneNumber, email`
- `new_member_contact_list`: `fullName, unitName, convertFlag, moveInDate, callingTitle, phoneNumber, email, ministeringAssigned`
- `missing_contact_data_list`: `fullName, unitName, age, youthFlag, missingPhone, missingEmail, missingAddress, callingTitle`

## Approval Gate Flow (Required for Send Actions)

For `send_calling_email` and `communication_campaign_send`, run this sequence:

1. Build the exact final payload for the send action.
2. Call `approval_gate_request` with:
   - `actionType`: `send_calling_email` or `communication_campaign_send`
   - `payload`: the exact payload you plan to send
3. Receive `approvalToken`.
4. Call the send tool with the same payload plus `approvalToken`.

If payload fields differ between step 2 and step 4, token validation fails.

## `query_member_attribute` Structured Attributes

Use these exact attribute keys.

| Attribute key | Natural language meaning |
|---|---|
| `preferred_name` | Preferred name |
| `unit` | Unit/ward/branch name |
| `unit_abbreviation` | Unit abbreviation |
| `age` | Age |
| `gender` | Gender |
| `endowment_status` | Endowment status |
| `is_endowed` | Endowed (yes/no) |
| `is_widowed` | Widowed (yes/no) |
| `is_returned_missionary` | Returned missionary (yes/no) |
| `is_convert` | Convert (yes/no) |
| `has_children` | Has children (yes/no) |
| `is_sealed_to_parents` | Sealed to parents (yes/no) |
| `is_single` | Single (yes/no) |
| `is_sealed_to_spouse` | Sealed to spouse (yes/no) |
| `is_sealed_to_current_spouse` | Sealed to current spouse (yes/no) |
| `is_sealed_to_prior_spouse` | Sealed to prior spouse (yes/no) |
| `temple_recommend_status` | Temple recommend status |
| `mission_language` | Mission language |
| `mission_country` | Mission country |
| `callings` | Callings text |
| `callings_with_dates` | Callings with date sustained/set apart text |
| `move_in_date` | Move-in date |
| `institute_status` | Institute status |
| `is_attending_seminary` | Attending seminary (yes/no) |
| `is_attending_institute` | Attending institute (yes/no) |
| `has_ministering_sisters` | Has ministering sisters (yes/no) |
| `has_ministering_brothers` | Has ministering brothers (yes/no) |

## Boolean Normalization

For boolean-like attributes, StakeOS normalizes these values:

- True: `yes`, `y`, `1`, `true`
- False: `no`, `n`, `0`, `false`

## Raw/Fallback Attribute Queries

If an attribute key is not in the structured list above, `query_member_attribute` falls back to searching imported custom-report fields in `profile_data`.

This can include values from columns like:

- `Preferred Name`
- `Individual Phone`
- `Individual E-mail`
- `Callings with Date Sustained and Set Apart`
- `Unit`
- `Unit Abbreviation`
- `Address - Street 1`
- `Address - Street 2`
- `Address - City`
- `Address - Postal Code`
- `Age`
- `Endowment Status`
- `Gender`
- `Mission Language`
- `Priesthood office`
- `Is Endowed`
- `Is Widowed`
- `Is Returned Missionary`
- `Is Convert`
- `Has Children`
- `Is Sealed to Parents`
- `Is Single`
- `Is Sealed to a Spouse`
- `Is Sealed to Current Spouse`
- `Is Sealed to a Prior Spouse`
- `Temple Recommend Status`
- `Mission Country`
- `Callings`
- `Move In Date`
- `Institute Status`
- `Is Attending Seminary`
- `Is Attending Institute`
- `Has Ministering Sisters`
- `Has Ministering Brothers`

## Example Natural-Language Prompts

- "Show mission-eligible sisters age 16 to 25."
- "List all youth age 16-18 who could serve a mission soon, with name, age, unit, and phone; sort by unit then age."
- "Find members with `temple_recommend_status` containing 'Expired'."
- "Who has been in the bishop calling the longest?"
- "Get spouses for members in the Relief Society presidency."
- "Create a WhatsApp invite list for stake council."
- "Show members in Vancouver 1st with `is_attending_institute = yes`."
- "Find callings_with_dates containing 'Ward Missionary'."

## Best Practices

Use these patterns when writing prompts for Claude with StakeOS MCP.

For mission/youth lists that require contact details, prefer `mission_eligible_contact_list` over generic attribute queries.

### 1. Always scope by unit when possible

- Better: "Show mission-eligible members age 18-25 in Vancouver 1st."
- Why: Prevents stake-wide answers when you only need one ward/branch.

### 2. Always include age range for youth/mission queries

- Better: "List mission-eligible members age 18-25."
- Why: Keeps output aligned with your dashboard/report definitions.

### 3. Use exact attribute keys for `query_member_attribute`

- Better: "Query `is_attending_seminary=yes` and `unit=Vancouver 1st`."
- Why: Reduces ambiguity from natural-language synonyms.

### 4. Ask for explicit output format

- Better: "Return as a table: name, unit, age, phone, email."
- Why: Makes results immediately usable for leadership actions.

### 5. Ask for counts plus details

- Better: "Give count first, then top 25 names."
- Why: Helps validate reasonableness before reading long lists.

### 6. Specify current vs historical intent

- Better: "Current calling members" vs "members ever sustained in this calling."
- Why: Avoids mixing present assignments with historical entries.

### 7. Include spouse preference explicitly

- Better: "Send to elders quorum presidency and include spouses."
- Why: `includeSpouses` is optional and should be intentional.

### 8. Use one filter per step for debugging

- Better workflow:
  - Step 1: `unit=Vancouver 1st`
  - Step 2: add `is_convert=yes`
  - Step 3: add age filter
- Why: Makes it easy to find where unexpected counts appear.

### 9. Ask for de-duplication check on calling/date text

- Better: "Use `callings_with_dates` dates but dedupe by member + calling title."
- Why: Prevents duplicate person/calling rows when calling text columns overlap.

### 10. Provide target audience before messaging actions

- Better: "Target type: organization, value: Young Women."
- Why: Ensures email/invite tools resolve the right recipients.

## Recommended Prompt Template

Use this template for high-quality requests:

`Task: <what you need>`

`Scope: unit=<unit name>; date range=<range if relevant>; age range=<range if relevant>`

`Filters: <attribute_key=value pairs>`

`Output: count first; then table columns=<col1,col2,...>; limit=<n>`

`Action (optional): send email or generate WhatsApp list`
