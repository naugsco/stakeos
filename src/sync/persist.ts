import type { PoolClient } from "pg";
import { pool } from "@/src/db/pool";
import type { CallingRecord, DirectorySnapshot, MemberRecord, OrganizationRecord } from "@/src/types/directory";
import { asIsoDate } from "@/src/utils/date";

interface PersistResult {
  recordsProcessed: number;
}

const fullNameExpr = `TRIM(CONCAT(m.first_name, ' ', m.last_name))`;

const insertSyncLog = async (client: PoolClient, syncType: string) => {
  const result = await client.query<{ id: number }>(
    `INSERT INTO sync_logs (sync_type, status, started_at) VALUES ($1, 'running', NOW()) RETURNING id`,
    [syncType]
  );
  return result.rows[0].id;
};

const completeSyncLog = async (
  client: PoolClient,
  logId: number,
  status: "success" | "error",
  recordsProcessed: number,
  errorMessage?: string,
  metadata?: Record<string, unknown>
) => {
  await client.query(
    `
      UPDATE sync_logs
      SET
        status = $2,
        completed_at = NOW(),
        records_processed = $3,
        error_message = $4,
        metadata = $5
      WHERE id = $1
    `,
    [logId, status, recordsProcessed, errorMessage ?? null, metadata ? JSON.stringify(metadata) : null]
  );
};

const upsertUnits = async (client: PoolClient, units: DirectorySnapshot["units"]) => {
  const unitMap = new Map<string, number>();

  for (const unit of units) {
    const result = await client.query<{ id: number }>(
      `
      INSERT INTO units (unit_number, name, unit_type, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (unit_number)
      DO UPDATE SET name = EXCLUDED.name, unit_type = EXCLUDED.unit_type, updated_at = NOW()
      RETURNING id
      `,
      [unit.unitNumber, unit.name, unit.unitType ?? null]
    );

    unitMap.set(unit.unitNumber, result.rows[0].id);
  }

  return unitMap;
};

const upsertHouseholds = async (
  client: PoolClient,
  households: DirectorySnapshot["households"],
  unitMap: Map<string, number>
) => {
  const householdMap = new Map<string, number>();

  for (const household of households) {
    const result = await client.query<{ id: number }>(
      `
      INSERT INTO households (
        lcr_household_id,
        unit_id,
        household_name,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (lcr_household_id)
      DO UPDATE SET
        unit_id = EXCLUDED.unit_id,
        household_name = EXCLUDED.household_name,
        address_line1 = EXCLUDED.address_line1,
        address_line2 = EXCLUDED.address_line2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        postal_code = EXCLUDED.postal_code,
        country = EXCLUDED.country,
        updated_at = NOW()
      RETURNING id
      `,
      [
        household.lcrHouseholdId,
        unitMap.get(household.unitNumber) ?? null,
        household.householdName,
        household.addressLine1 ?? null,
        household.addressLine2 ?? null,
        household.city ?? null,
        household.state ?? null,
        household.postalCode ?? null,
        household.country ?? null
      ]
    );

    householdMap.set(household.lcrHouseholdId, result.rows[0].id);
  }

  return householdMap;
};

const upsertMemberCore = async (
  client: PoolClient,
  member: MemberRecord,
  unitMap: Map<string, number>,
  householdMap: Map<string, number>
) => {
  const result = await client.query<{ id: number }>(
    `
    INSERT INTO members (
      lcr_member_id,
      household_id,
      unit_id,
      unit_name,
      unit_abbreviation,
      preferred_name,
      first_name,
      middle_name,
      last_name,
      address_line1,
      address_line2,
      address_city,
      address_state_or_province,
      address_postal_code,
      address_country,
      gender,
      birthdate,
      birth_country,
      birthplace,
      age,
      member_status,
      move_in_date,
      is_convert,
      is_widowed,
      is_returned_missionary,
      is_accountable,
      is_born_in_covenant,
      is_divorced,
      is_married,
      has_children,
      is_sealed_to_parents,
      is_single,
      is_sealed_to_spouse,
      is_sealed_to_current_spouse,
      is_sealed_to_prior_spouse,
      baptism_date,
      confirmation_date,
      endowment_date,
      temple_endowed,
      endowment_status,
      temple_recommend_status,
      temple_recommend_expiration_date,
      temple_recommend_type,
      mission_status,
      mission_language,
      mission_country,
      priesthood,
      priesthood_office,
      callings_text,
      callings_with_dates_text,
      institute_status,
      seminary_status,
      is_attending_seminary,
      is_attending_institute,
      potential_institute_student,
      potential_seminary_student,
      has_ministering_sisters,
      has_ministering_brothers,
      ministering_brothers,
      ministering_sisters,
      ordination_date,
      marriage_date,
      marriage_status,
      sealing_to_parents,
      sealing_to_spouse,
      spouse_name,
      head_of_house,
      household_position,
      profile_data,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      $16,
      $17::date,
      $18,
      $19,
      $20,
      $21,
      $22::date,
      $23,
      $24,
      $25,
      $26,
      $27,
      $28,
      $29,
      $30,
      $31,
      $32,
      $33,
      $34,
      $35,
      $36::date,
      $37::date,
      $38::date,
      $39,
      $40,
      $41,
      $42::date,
      $43,
      $44,
      $45,
      $46,
      $47,
      $48,
      $49,
      $50,
      $51,
      $52,
      $53,
      $54,
      $55,
      $56,
      $57,
      $58,
      $59,
      $60,
      $61::date,
      $62::date,
      $63,
      $64,
      $65,
      $66,
      $67,
      $68,
      $69::jsonb,
      NOW()
    )
    ON CONFLICT (lcr_member_id)
    DO UPDATE SET
      household_id = EXCLUDED.household_id,
      unit_id = EXCLUDED.unit_id,
      unit_name = EXCLUDED.unit_name,
      unit_abbreviation = EXCLUDED.unit_abbreviation,
      preferred_name = EXCLUDED.preferred_name,
      first_name = EXCLUDED.first_name,
      middle_name = EXCLUDED.middle_name,
      last_name = EXCLUDED.last_name,
      address_line1 = EXCLUDED.address_line1,
      address_line2 = EXCLUDED.address_line2,
      address_city = EXCLUDED.address_city,
      address_state_or_province = EXCLUDED.address_state_or_province,
      address_postal_code = EXCLUDED.address_postal_code,
      address_country = EXCLUDED.address_country,
      gender = EXCLUDED.gender,
      birthdate = EXCLUDED.birthdate,
      birth_country = EXCLUDED.birth_country,
      birthplace = EXCLUDED.birthplace,
      age = EXCLUDED.age,
      member_status = EXCLUDED.member_status,
      move_in_date = EXCLUDED.move_in_date,
      is_convert = EXCLUDED.is_convert,
      is_widowed = EXCLUDED.is_widowed,
      is_returned_missionary = EXCLUDED.is_returned_missionary,
      is_accountable = EXCLUDED.is_accountable,
      is_born_in_covenant = EXCLUDED.is_born_in_covenant,
      is_divorced = EXCLUDED.is_divorced,
      is_married = EXCLUDED.is_married,
      has_children = EXCLUDED.has_children,
      is_sealed_to_parents = EXCLUDED.is_sealed_to_parents,
      is_single = EXCLUDED.is_single,
      is_sealed_to_spouse = EXCLUDED.is_sealed_to_spouse,
      is_sealed_to_current_spouse = EXCLUDED.is_sealed_to_current_spouse,
      is_sealed_to_prior_spouse = EXCLUDED.is_sealed_to_prior_spouse,
      baptism_date = EXCLUDED.baptism_date,
      confirmation_date = EXCLUDED.confirmation_date,
      endowment_date = EXCLUDED.endowment_date,
      temple_endowed = EXCLUDED.temple_endowed,
      endowment_status = EXCLUDED.endowment_status,
      temple_recommend_status = EXCLUDED.temple_recommend_status,
      temple_recommend_expiration_date = EXCLUDED.temple_recommend_expiration_date,
      temple_recommend_type = EXCLUDED.temple_recommend_type,
      mission_status = EXCLUDED.mission_status,
      mission_language = EXCLUDED.mission_language,
      mission_country = EXCLUDED.mission_country,
      priesthood = EXCLUDED.priesthood,
      priesthood_office = EXCLUDED.priesthood_office,
      callings_text = EXCLUDED.callings_text,
      callings_with_dates_text = EXCLUDED.callings_with_dates_text,
      institute_status = EXCLUDED.institute_status,
      seminary_status = EXCLUDED.seminary_status,
      is_attending_seminary = EXCLUDED.is_attending_seminary,
      is_attending_institute = EXCLUDED.is_attending_institute,
      potential_institute_student = EXCLUDED.potential_institute_student,
      potential_seminary_student = EXCLUDED.potential_seminary_student,
      has_ministering_sisters = EXCLUDED.has_ministering_sisters,
      has_ministering_brothers = EXCLUDED.has_ministering_brothers,
      ministering_brothers = EXCLUDED.ministering_brothers,
      ministering_sisters = EXCLUDED.ministering_sisters,
      ordination_date = EXCLUDED.ordination_date,
      marriage_date = EXCLUDED.marriage_date,
      marriage_status = EXCLUDED.marriage_status,
      sealing_to_parents = EXCLUDED.sealing_to_parents,
      sealing_to_spouse = EXCLUDED.sealing_to_spouse,
      spouse_name = EXCLUDED.spouse_name,
      head_of_house = EXCLUDED.head_of_house,
      household_position = EXCLUDED.household_position,
      profile_data = EXCLUDED.profile_data,
      updated_at = NOW()
    RETURNING id
    `,
    [
      member.lcrMemberId,
      member.lcrHouseholdId ? householdMap.get(member.lcrHouseholdId) ?? null : null,
      unitMap.get(member.unitNumber) ?? null,
      member.unitName ?? null,
      member.unitAbbreviation ?? null,
      member.preferredName ?? null,
      member.firstName,
      member.middleName ?? null,
      member.lastName,
      member.addressLine1 ?? null,
      member.addressLine2 ?? null,
      member.addressCity ?? null,
      member.addressStateOrProvince ?? null,
      member.addressPostalCode ?? null,
      member.addressCountry ?? null,
      member.gender ?? null,
      asIsoDate(member.birthdate) ?? null,
      member.birthCountry ?? null,
      member.birthplace ?? null,
      member.age ?? null,
      member.memberStatus ?? null,
      asIsoDate(member.moveInDate) ?? null,
      member.isConvert ?? null,
      member.isWidowed ?? null,
      member.isReturnedMissionary ?? null,
      member.isAccountable ?? null,
      member.isBornInCovenant ?? null,
      member.isDivorced ?? null,
      member.isMarried ?? null,
      member.hasChildren ?? null,
      member.isSealedToParents ?? null,
      member.isSingle ?? null,
      member.isSealedToSpouse ?? null,
      member.isSealedToCurrentSpouse ?? null,
      member.isSealedToPriorSpouse ?? null,
      asIsoDate(member.baptismDate) ?? null,
      asIsoDate(member.confirmationDate) ?? null,
      asIsoDate(member.endowmentDate) ?? null,
      member.templeEndowed ?? null,
      member.endowmentStatus ?? null,
      member.templeRecommendStatus ?? null,
      asIsoDate(member.templeRecommendExpirationDate) ?? null,
      member.templeRecommendType ?? null,
      member.missionStatus ?? null,
      member.missionLanguage ?? null,
      member.missionCountry ?? null,
      member.priesthoodType ?? null,
      member.priesthoodOffice ?? member.priesthood?.currentOffice ?? null,
      member.callingsText ?? null,
      member.callingsWithDatesText ?? null,
      member.instituteStatus ?? null,
      member.seminaryStatus ?? null,
      member.isAttendingSeminary ?? null,
      member.isAttendingInstitute ?? null,
      member.potentialInstituteStudent ?? null,
      member.potentialSeminaryStudent ?? null,
      member.hasMinisteringSisters ?? null,
      member.hasMinisteringBrothers ?? null,
      member.ministeringBrothers ?? null,
      member.ministeringSisters ?? null,
      asIsoDate(member.ordinationDate ?? member.priesthood?.officeDate) ?? null,
      asIsoDate(member.marriageDate) ?? null,
      member.marriageStatus ?? null,
      member.sealingToParents ?? null,
      member.sealingToSpouse ?? null,
      member.spouseName ?? null,
      member.headOfHouse ?? null,
      member.householdPosition ?? null,
      member.profileData ? JSON.stringify(member.profileData) : null
    ]
  );

  return result.rows[0].id;
};

const refreshMemberContacts = async (
  client: PoolClient,
  memberId: number,
  member: MemberRecord,
  householdMap: Map<string, number>
) => {
  await client.query(`DELETE FROM emails WHERE member_id = $1`, [memberId]);
  for (const email of member.emails) {
    await client.query(
      `
      INSERT INTO emails (member_id, email, email_type, is_primary, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (member_id, email)
      DO UPDATE SET
        email_type = EXCLUDED.email_type,
        is_primary = EXCLUDED.is_primary,
        updated_at = NOW()
      `,
      [memberId, email.email, email.type ?? null, email.isPrimary ?? false]
    );
  }

  await client.query(`DELETE FROM phone_numbers WHERE member_id = $1`, [memberId]);
  for (const phone of member.phoneNumbers) {
    await client.query(
      `
      INSERT INTO phone_numbers (member_id, household_id, phone_number, phone_type, is_primary, can_text, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (member_id, phone_number)
      DO UPDATE SET
        phone_type = EXCLUDED.phone_type,
        is_primary = EXCLUDED.is_primary,
        can_text = EXCLUDED.can_text,
        updated_at = NOW()
      `,
      [
        memberId,
        member.lcrHouseholdId ? householdMap.get(member.lcrHouseholdId) ?? null : null,
        phone.phoneNumber,
        phone.type ?? null,
        phone.isPrimary ?? false,
        phone.canText ?? null
      ]
    );
  }

  if (!member.priesthood) {
    return;
  }

  await client.query(
    `
    INSERT INTO priesthood (
      member_id,
      current_office,
      office_date,
      melchizedek_priesthood_date,
      aaronic_priesthood_date,
      ordained_by,
      updated_at
    )
    VALUES ($1, $2, $3::date, $4::date, $5::date, $6, NOW())
    ON CONFLICT (member_id)
    DO UPDATE SET
      current_office = EXCLUDED.current_office,
      office_date = EXCLUDED.office_date,
      melchizedek_priesthood_date = EXCLUDED.melchizedek_priesthood_date,
      aaronic_priesthood_date = EXCLUDED.aaronic_priesthood_date,
      ordained_by = EXCLUDED.ordained_by,
      updated_at = NOW()
    `,
    [
      memberId,
      member.priesthood.currentOffice ?? null,
      asIsoDate(member.priesthood.officeDate) ?? null,
      asIsoDate(member.priesthood.melchizedekPriesthoodDate) ?? null,
      asIsoDate(member.priesthood.aaronicPriesthoodDate) ?? null,
      member.priesthood.ordainedBy ?? null
    ]
  );
};

const upsertMembers = async (
  client: PoolClient,
  members: DirectorySnapshot["members"],
  unitMap: Map<string, number>,
  householdMap: Map<string, number>
) => {
  const memberMap = new Map<string, number>();

  for (const member of members) {
    const memberId = await upsertMemberCore(client, member, unitMap, householdMap);
    memberMap.set(member.lcrMemberId, memberId);
    await refreshMemberContacts(client, memberId, member, householdMap);
  }

  return memberMap;
};

const insertMemberStatusHistory = async (
  client: PoolClient,
  members: DirectorySnapshot["members"],
  memberMap: Map<string, number>,
  syncLogId: number
) => {
  for (const member of members) {
    const memberId = memberMap.get(member.lcrMemberId);
    if (!memberId) {
      continue;
    }

    await client.query(
      `
      INSERT INTO member_status_history (
        member_id,
        lcr_member_id,
        sync_log_id,
        snapshot_at,
        unit_name,
        temple_recommend_status,
        mission_status,
        temple_endowed,
        is_attending_seminary,
        is_attending_institute
      )
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
      ON CONFLICT (member_id, sync_log_id)
      DO UPDATE SET
        unit_name = EXCLUDED.unit_name,
        temple_recommend_status = EXCLUDED.temple_recommend_status,
        mission_status = EXCLUDED.mission_status,
        temple_endowed = EXCLUDED.temple_endowed,
        is_attending_seminary = EXCLUDED.is_attending_seminary,
        is_attending_institute = EXCLUDED.is_attending_institute
      `,
      [
        memberId,
        member.lcrMemberId,
        syncLogId,
        member.unitName ?? null,
        member.templeRecommendStatus ?? null,
        member.missionStatus ?? null,
        member.templeEndowed ?? null,
        member.isAttendingSeminary ?? null,
        member.isAttendingInstitute ?? null
      ]
    );
  }
};

const upsertOrganizations = async (
  client: PoolClient,
  organizations: OrganizationRecord[],
  unitMap: Map<string, number>
) => {
  const organizationMap = new Map<string, number>();

  for (const organization of organizations) {
    const result = await client.query<{ id: number }>(
      `
      INSERT INTO organizations (lcr_organization_id, unit_id, name, category, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (lcr_organization_id)
      DO UPDATE SET
        unit_id = EXCLUDED.unit_id,
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        updated_at = NOW()
      RETURNING id
      `,
      [organization.lcrOrganizationId, unitMap.get(organization.unitNumber) ?? null, organization.name, organization.category ?? null]
    );

    organizationMap.set(organization.lcrOrganizationId, result.rows[0].id);
  }

  for (const organization of organizations.filter((item) => item.parentLcrOrganizationId)) {
    const id = organizationMap.get(organization.lcrOrganizationId);
    const parentId = organizationMap.get(organization.parentLcrOrganizationId!);
    if (!id || !parentId) {
      continue;
    }

    await client.query(`UPDATE organizations SET parent_organization_id = $2 WHERE id = $1`, [id, parentId]);
  }

  return organizationMap;
};

const upsertCallings = async (
  client: PoolClient,
  callings: CallingRecord[],
  unitMap: Map<string, number>,
  memberMap: Map<string, number>,
  organizationMap: Map<string, number>
) => {
  const activeCallingIds = new Set<string>();
  const allKnownMemberIds = new Set<number>(Array.from(memberMap.values()));

  for (const calling of callings) {
    const memberId = calling.lcrMemberId ? memberMap.get(calling.lcrMemberId) ?? null : null;
    activeCallingIds.add(calling.lcrCallingId);

    await client.query(
      `
      INSERT INTO callings (
        lcr_calling_id,
        unit_id,
        member_id,
        organization_id,
        title,
        standard_name,
        sustained_on,
        set_apart_on,
        released_on,
        is_current,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8::date, $9::date, $10, NOW())
      ON CONFLICT (lcr_calling_id)
      DO UPDATE SET
        unit_id = EXCLUDED.unit_id,
        member_id = EXCLUDED.member_id,
        organization_id = EXCLUDED.organization_id,
        title = EXCLUDED.title,
        standard_name = EXCLUDED.standard_name,
        sustained_on = EXCLUDED.sustained_on,
        set_apart_on = EXCLUDED.set_apart_on,
        released_on = EXCLUDED.released_on,
        is_current = EXCLUDED.is_current,
        updated_at = NOW()
      `,
      [
        calling.lcrCallingId,
        unitMap.get(calling.unitNumber) ?? null,
        memberId,
        calling.lcrOrganizationId ? organizationMap.get(calling.lcrOrganizationId) ?? null : null,
        calling.title,
        calling.standardName ?? null,
        asIsoDate(calling.sustainedOn) ?? null,
        asIsoDate(calling.setApartOn) ?? null,
        asIsoDate(calling.releasedOn) ?? null,
        calling.isCurrent
      ]
    );
  }

  if (allKnownMemberIds.size > 0) {
    await client.query(
      `
      UPDATE callings
      SET
        is_current = FALSE,
        released_on = COALESCE(released_on, CURRENT_DATE),
        updated_at = NOW()
      WHERE member_id = ANY($1::bigint[])
        AND is_current = TRUE
        AND (
          cardinality($2::text[]) = 0
          OR lcr_calling_id <> ALL($2::text[])
        )
      `,
      [Array.from(allKnownMemberIds), Array.from(activeCallingIds)]
    );
  }
};

const upsertMeetingAssignments = async (
  client: PoolClient,
  meetingAssignments: DirectorySnapshot["meetingAssignments"],
  unitMap: Map<string, number>,
  memberMap: Map<string, number>,
  organizationMap: Map<string, number>
) => {
  for (const assignment of meetingAssignments) {
    const callingLookup = assignment.lcrCallingId
      ? await client.query<{ id: number }>(`SELECT id FROM callings WHERE lcr_calling_id = $1`, [assignment.lcrCallingId])
      : { rows: [] as { id: number }[] };

    await client.query(
      `
      INSERT INTO meeting_assignments (
        assignment_key,
        unit_id,
        meeting_name,
        meeting_date,
        member_id,
        calling_id,
        organization_id,
        assignment_type,
        notes,
        status,
        updated_at
      )
      VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (assignment_key)
      DO UPDATE SET
        unit_id = EXCLUDED.unit_id,
        meeting_name = EXCLUDED.meeting_name,
        meeting_date = EXCLUDED.meeting_date,
        member_id = EXCLUDED.member_id,
        calling_id = EXCLUDED.calling_id,
        organization_id = EXCLUDED.organization_id,
        assignment_type = EXCLUDED.assignment_type,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        updated_at = NOW()
      `,
      [
        assignment.assignmentKey,
        unitMap.get(assignment.unitNumber) ?? null,
        assignment.meetingName,
        asIsoDate(assignment.meetingDate) ?? null,
        assignment.lcrMemberId ? memberMap.get(assignment.lcrMemberId) ?? null : null,
        callingLookup.rows[0]?.id ?? null,
        assignment.lcrOrganizationId ? organizationMap.get(assignment.lcrOrganizationId) ?? null : null,
        assignment.assignmentType ?? null,
        assignment.notes ?? null,
        assignment.status ?? null
      ]
    );
  }
};

const pruneMissingMembers = async (client: PoolClient, members: DirectorySnapshot["members"]) => {
  const activeMemberIds = members.map((member) => member.lcrMemberId).filter(Boolean);

  if (activeMemberIds.length === 0) {
    return;
  }

  await client.query(
    `
    DELETE FROM members
    WHERE lcr_member_id <> ALL($1::text[])
    `,
    [activeMemberIds]
  );
};

const pruneMissingHouseholds = async (client: PoolClient, households: DirectorySnapshot["households"]) => {
  const activeHouseholdIds = households.map((household) => household.lcrHouseholdId).filter(Boolean);

  if (activeHouseholdIds.length === 0) {
    return;
  }

  await client.query(
    `
    DELETE FROM households
    WHERE lcr_household_id <> ALL($1::text[])
    `,
    [activeHouseholdIds]
  );
};

const insertMemberSnapshots = async (client: PoolClient, syncLogId: number) => {
  await client.query(
    `
    INSERT INTO sync_member_snapshots (
      sync_log_id,
      lcr_member_id,
      full_name,
      unit_name,
      move_in_date,
      row_hash,
      snapshot_data
    )
    SELECT
      $1,
      m.lcr_member_id,
      ${fullNameExpr},
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown'),
      m.move_in_date,
      md5((to_jsonb(m) - 'id' - 'created_at' - 'updated_at' - 'profile_data')::text),
      to_jsonb(m) - 'id' - 'created_at' - 'updated_at' - 'profile_data'
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    ON CONFLICT (sync_log_id, lcr_member_id) DO NOTHING
    `,
    [syncLogId]
  );
};

const insertCallingSnapshots = async (client: PoolClient, syncLogId: number) => {
  await client.query(
    `
    INSERT INTO sync_calling_snapshots (
      sync_log_id,
      lcr_calling_id,
      unit_name,
      member_lcr_member_id,
      member_name,
      calling_title,
      is_current,
      sustained_on,
      released_on,
      row_hash,
      snapshot_data
    )
    SELECT
      $1,
      c.lcr_calling_id,
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown'),
      m.lcr_member_id,
      CASE WHEN m.id IS NULL THEN '' ELSE ${fullNameExpr} END,
      c.title,
      c.is_current,
      c.sustained_on,
      c.released_on,
      md5((to_jsonb(c) - 'id' - 'created_at' - 'updated_at')::text),
      to_jsonb(c) - 'id' - 'created_at' - 'updated_at'
    FROM callings c
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON c.unit_id = u.id
    ON CONFLICT (sync_log_id, lcr_calling_id) DO NOTHING
    `,
    [syncLogId]
  );
};

const insertEmailSnapshots = async (client: PoolClient, syncLogId: number) => {
  await client.query(
    `
    INSERT INTO sync_email_snapshots (
      sync_log_id,
      member_lcr_member_id,
      full_name,
      unit_name,
      email,
      row_hash,
      snapshot_data
    )
    SELECT
      $1,
      m.lcr_member_id,
      ${fullNameExpr},
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown'),
      e.email,
      md5((to_jsonb(e) - 'id' - 'member_id' - 'created_at' - 'updated_at')::text),
      to_jsonb(e) - 'id' - 'member_id' - 'created_at' - 'updated_at'
    FROM emails e
    JOIN members m ON e.member_id = m.id
    LEFT JOIN units u ON m.unit_id = u.id
    ON CONFLICT (sync_log_id, member_lcr_member_id, email) DO NOTHING
    `,
    [syncLogId]
  );
};

const insertPhoneSnapshots = async (client: PoolClient, syncLogId: number) => {
  await client.query(
    `
    INSERT INTO sync_phone_snapshots (
      sync_log_id,
      member_lcr_member_id,
      full_name,
      unit_name,
      phone_number,
      row_hash,
      snapshot_data
    )
    SELECT
      $1,
      m.lcr_member_id,
      ${fullNameExpr},
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown'),
      p.phone_number,
      md5((to_jsonb(p) - 'id' - 'member_id' - 'household_id' - 'created_at' - 'updated_at')::text),
      to_jsonb(p) - 'id' - 'member_id' - 'household_id' - 'created_at' - 'updated_at'
    FROM phone_numbers p
    JOIN members m ON p.member_id = m.id
    LEFT JOIN units u ON m.unit_id = u.id
    ON CONFLICT (sync_log_id, member_lcr_member_id, phone_number) DO NOTHING
    `,
    [syncLogId]
  );
};

export const seedSnapshotTablesForSyncLog = async (
  client: PoolClient,
  syncLogId: number,
  options: {
    includeMembers?: boolean;
    includeCallings?: boolean;
    includeEmails?: boolean;
    includePhones?: boolean;
  } = {}
) => {
  if (options.includeMembers) {
    await insertMemberSnapshots(client, syncLogId);
  }
  if (options.includeCallings) {
    await insertCallingSnapshots(client, syncLogId);
  }
  if (options.includeEmails) {
    await insertEmailSnapshots(client, syncLogId);
  }
  if (options.includePhones) {
    await insertPhoneSnapshots(client, syncLogId);
  }
};

export const persistSnapshot = async (syncType: string, snapshot: DirectorySnapshot): Promise<PersistResult> => {
  const client = await pool.connect();
  let logId = -1;

  try {
    await client.query("BEGIN");
    logId = await insertSyncLog(client, syncType);

    const unitMap = await upsertUnits(client, snapshot.units);
    const householdMap = await upsertHouseholds(client, snapshot.households, unitMap);
    const memberMap = await upsertMembers(client, snapshot.members, unitMap, householdMap);
    await insertMemberStatusHistory(client, snapshot.members, memberMap, logId);
    const organizationMap = await upsertOrganizations(client, snapshot.organizations, unitMap);
    await upsertCallings(client, snapshot.callings, unitMap, memberMap, organizationMap);
    await upsertMeetingAssignments(client, snapshot.meetingAssignments, unitMap, memberMap, organizationMap);
    await pruneMissingMembers(client, snapshot.members);
    await pruneMissingHouseholds(client, snapshot.households);
    await insertMemberSnapshots(client, logId);
    await insertCallingSnapshots(client, logId);
    await insertEmailSnapshots(client, logId);
    await insertPhoneSnapshots(client, logId);

    const recordsProcessed =
      snapshot.units.length +
      snapshot.households.length +
      snapshot.members.length +
      snapshot.organizations.length +
      snapshot.callings.length +
      snapshot.meetingAssignments.length;

    await completeSyncLog(client, logId, "success", recordsProcessed, undefined, {
      units: snapshot.units.length,
      households: snapshot.households.length,
      members: snapshot.members.length,
      organizations: snapshot.organizations.length,
      callings: snapshot.callings.length,
      meetingAssignments: snapshot.meetingAssignments.length
    });

    await client.query("COMMIT");
    return { recordsProcessed };
  } catch (error) {
    await client.query("ROLLBACK");

    if (logId > 0) {
      await completeSyncLog(
        client,
        logId,
        "error",
        0,
        error instanceof Error ? error.message : "Unknown sync error"
      );
    }

    throw error;
  } finally {
    client.release();
  }
};

export const persistCallingSnapshot = async (
  syncType: string,
  payload: Pick<DirectorySnapshot, "units" | "organizations" | "callings">
): Promise<PersistResult> => {
  const client = await pool.connect();
  let logId = -1;

  try {
    await client.query("BEGIN");
    logId = await insertSyncLog(client, syncType);

    const unitMap = await upsertUnits(client, payload.units);
    const organizationMap = await upsertOrganizations(client, payload.organizations, unitMap);

    const existingMembers = await client.query<{
      lcrMemberId: string;
      id: number;
    }>(`
      SELECT
        lcr_member_id AS "lcrMemberId",
        id
      FROM members
    `);

    const memberMap = new Map<string, number>();
    for (const row of existingMembers.rows) {
      memberMap.set(row.lcrMemberId, row.id);
    }

    await upsertCallings(client, payload.callings, unitMap, memberMap, organizationMap);
    await insertCallingSnapshots(client, logId);

    const recordsProcessed = payload.units.length + payload.organizations.length + payload.callings.length;

    await completeSyncLog(client, logId, "success", recordsProcessed, undefined, {
      units: payload.units.length,
      organizations: payload.organizations.length,
      callings: payload.callings.length
    });

    await client.query("COMMIT");
    return { recordsProcessed };
  } catch (error) {
    await client.query("ROLLBACK");

    if (logId > 0) {
      await completeSyncLog(
        client,
        logId,
        "error",
        0,
        error instanceof Error ? error.message : "Unknown sync error"
      );
    }

    throw error;
  } finally {
    client.release();
  }
};
