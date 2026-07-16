export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { AddressMapLinks, DirectionsAddressLink, EmailListInline, OpenAddressLink, PhoneListInline } from "@/components/contact-links";
import { loadMemberDetailPageDataBySource } from "@/lib/dashboardData";

interface MemberDetailPageProps {
  params: {
    lcrMemberId: string;
  };
}

const yesNo = (value: boolean | null) => (value === null ? "-" : value ? "Yes" : "No");

// LCR reports set-apart as Yes/No rather than a date, so prefer the flag and fall back
// to a date only if some other source ever supplies one.
const setApartLabel = (calling: { setApartOn: string | null; isSetApart: number | null }) => {
  if (calling.setApartOn) {
    return calling.setApartOn;
  }

  if (calling.isSetApart === null) {
    return "-";
  }

  return calling.isSetApart === 1 ? "Yes" : "No";
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const member = await loadMemberDetailPageDataBySource(params.lcrMemberId);
  if (!member) {
    notFound();
  }

  const fullAddress =
    [member.addressLine1, member.addressLine2, member.city, member.stateOrProvince, member.postalCode, member.country]
      .filter(Boolean)
      .join(", ") || null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/members"
          className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
        >
          ← Back to Members
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">{member.fullName}</h1>
        <p className="text-sm text-slate-600">
          {member.unitName ?? "Unknown Unit"} | ID: {member.lcrMemberId}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Personal</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Preferred Name</dt>
            <dd>{member.preferredName ?? "-"}</dd>
            <dt className="text-slate-500">Age</dt>
            <dd>{member.age ?? "-"}</dd>
            <dt className="text-slate-500">Gender</dt>
            <dd>{member.gender ?? "-"}</dd>
            <dt className="text-slate-500">Birthdate</dt>
            <dd>{member.birthdate ?? "-"}</dd>
            <dt className="text-slate-500">Birth Country</dt>
            <dd>{member.birthCountry ?? "-"}</dd>
            <dt className="text-slate-500">Birthplace</dt>
            <dd>{member.birthplace ?? "-"}</dd>
            <dt className="text-slate-500">Move In Date</dt>
            <dd>{member.moveInDate ?? "-"}</dd>
            <dt className="text-slate-500">Member Status</dt>
            <dd>{member.memberStatus ?? "-"}</dd>
            <dt className="text-slate-500">Baptism Date</dt>
            <dd>{member.baptismDate ?? "-"}</dd>
            <dt className="text-slate-500">Confirmation Date</dt>
            <dd>{member.confirmationDate ?? "-"}</dd>
            <dt className="text-slate-500">Accountable</dt>
            <dd>{yesNo(member.isAccountable)}</dd>
            <dt className="text-slate-500">Born in Covenant</dt>
            <dd>{yesNo(member.isBornInCovenant)}</dd>
          </dl>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Contact</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Address:</span>{" "}
              <OpenAddressLink address={fullAddress} />
            </p>
            <p>
              <span className="text-slate-500">Map:</span>{" "}
              <AddressMapLinks parts={[member.addressLine1, member.addressLine2, member.city, member.stateOrProvince, member.postalCode, member.country]} />
            </p>
            <p>
              <span className="text-slate-500">Emails:</span> <EmailListInline emails={member.emails} />
            </p>
            <p>
              <span className="text-slate-500">Phones:</span> <PhoneListInline phones={member.phoneNumbers} />
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Temple, Mission, and Institute</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Endowment Status</dt>
            <dd>{member.endowmentStatus ?? "-"}</dd>
            <dt className="text-slate-500">Endowment Date</dt>
            <dd>{member.endowmentDate ?? "-"}</dd>
            <dt className="text-slate-500">Temple Recommend</dt>
            <dd>{member.templeRecommendStatus ?? "-"}</dd>
            <dt className="text-slate-500">Recommend Expiration</dt>
            <dd>{member.templeRecommendExpirationDate ?? "-"}</dd>
            <dt className="text-slate-500">Recommend Type</dt>
            <dd>{member.templeRecommendType ?? "-"}</dd>
            <dt className="text-slate-500">Mission Status</dt>
            <dd>{member.missionStatus ?? "-"}</dd>
            <dt className="text-slate-500">Mission Language</dt>
            <dd>{member.missionLanguage ?? "-"}</dd>
            <dt className="text-slate-500">Mission Country</dt>
            <dd>{member.missionCountry ?? "-"}</dd>
            <dt className="text-slate-500">Institute Status</dt>
            <dd>{member.instituteStatus ?? "-"}</dd>
            <dt className="text-slate-500">Seminary Status</dt>
            <dd>{member.seminaryStatus ?? "-"}</dd>
            <dt className="text-slate-500">Attending Seminary</dt>
            <dd>{yesNo(member.isAttendingSeminary)}</dd>
            <dt className="text-slate-500">Attending Institute</dt>
            <dd>{yesNo(member.isAttendingInstitute)}</dd>
            <dt className="text-slate-500">Potential Seminary</dt>
            <dd>{yesNo(member.potentialSeminaryStudent)}</dd>
            <dt className="text-slate-500">Potential Institute</dt>
            <dd>{yesNo(member.potentialInstituteStudent)}</dd>
            <dt className="text-slate-500">Priesthood</dt>
            <dd>{member.priesthoodType ?? "-"}</dd>
            <dt className="text-slate-500">Priesthood Office</dt>
            <dd>{member.priesthoodOffice ?? "-"}</dd>
            <dt className="text-slate-500">Ordination Date</dt>
            <dd>{member.ordinationDate ?? "-"}</dd>
          </dl>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Current Callings</h2>
          {member.currentCallings.length === 0 ? (
            <p className="text-sm text-slate-600">No current callings found.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {member.currentCallings.map((calling, index) => (
                <li key={`${calling.callingTitle}-${index}`} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{calling.callingTitle}</p>
                    {calling.isSetApart === 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Not set apart
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-600">{calling.organizationName ?? "Unassigned Organization"}</p>
                  <p className="text-slate-500">
                    Sustained: {calling.sustainedOn ?? "-"} | Set Apart: {setApartLabel(calling)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Marriage and Sealing</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Is Married</dt>
            <dd>{yesNo(member.isMarried)}</dd>
            <dt className="text-slate-500">Is Divorced</dt>
            <dd>{yesNo(member.isDivorced)}</dd>
            <dt className="text-slate-500">Marriage Status</dt>
            <dd>{member.marriageStatus ?? "-"}</dd>
            <dt className="text-slate-500">Marriage Date</dt>
            <dd>{member.marriageDate ?? "-"}</dd>
            <dt className="text-slate-500">Spouse Name</dt>
            <dd>{member.spouseName ?? "-"}</dd>
            <dt className="text-slate-500">Sealing to Parents</dt>
            <dd>{member.sealingToParents ?? "-"}</dd>
            <dt className="text-slate-500">Sealing to Spouse</dt>
            <dd>{member.sealingToSpouse ?? "-"}</dd>
          </dl>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Ministering and Household Role</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Head of House</dt>
            <dd>{member.headOfHouse ?? "-"}</dd>
            <dt className="text-slate-500">Household Position</dt>
            <dd>{member.householdPosition ?? "-"}</dd>
            <dt className="text-slate-500">Ministering Brothers</dt>
            <dd>{member.ministeringBrothers ?? "-"}</dd>
            <dt className="text-slate-500">Ministering Sisters</dt>
            <dd>{member.ministeringSisters ?? "-"}</dd>
          </dl>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Household</h2>
        {fullAddress ? (
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <OpenAddressLink address={fullAddress} label="View on Map" />
            <DirectionsAddressLink address={fullAddress} />
          </div>
        ) : null}
        {member.householdMembers.length === 0 ? (
          <p className="text-sm text-slate-600">No household members found.</p>
        ) : (
          <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Age</th>
                <th className="px-3 py-2">Gender</th>
                <th className="px-3 py-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {member.householdMembers.map((person) => (
                <tr key={person.lcrMemberId} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link
                      href={`/members/${encodeURIComponent(person.lcrMemberId)}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {person.fullName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{person.age ?? "-"}</td>
                  <td className="px-3 py-2">{person.gender ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{person.relationshipHint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
