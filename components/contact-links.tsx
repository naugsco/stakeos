"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";

const emailClassName =
  "text-teal-700 underline decoration-teal-300 underline-offset-4 transition hover:text-teal-900";
const phoneClassName =
  "text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900";

export function EmailAddressLink({
  email,
  className = emailClassName
}: {
  email: string | null | undefined;
  className?: string;
}) {
  const trimmed = email?.trim();
  if (!trimmed) {
    return <>-</>;
  }

  return (
    <a href={`mailto:${trimmed}`} className={className}>
      {trimmed}
    </a>
  );
}

export function CopyPhoneLink({
  phone,
  className = phoneClassName
}: {
  phone: string | null | undefined;
  className?: string;
}) {
  const trimmed = phone?.trim();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!trimmed) {
    return <>-</>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await copyToClipboard(trimmed);
          setFailed(false);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
          setFailed(true);
          window.setTimeout(() => setFailed(false), 2000);
        }
      }}
      title={failed ? "Couldn't copy" : copied ? "Copied" : "Copy phone number"}
    >
      {failed ? `${trimmed} (copy failed)` : copied ? `${trimmed} (copied)` : trimmed}
    </button>
  );
}

export function ContactMethodsInline({
  email,
  phone,
  fallback = "-"
}: {
  email?: string | null;
  phone?: string | null;
  fallback?: string;
}) {
  const hasEmail = Boolean(email?.trim());
  const hasPhone = Boolean(phone?.trim());

  if (!hasEmail && !hasPhone) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {hasEmail ? <EmailAddressLink email={email} /> : null}
      {hasPhone ? <CopyPhoneLink phone={phone} /> : null}
    </div>
  );
}

export function EmailListInline({ emails }: { emails: string[] }) {
  const values = emails.map((email) => email.trim()).filter(Boolean);
  if (values.length === 0) {
    return <>-</>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {values.map((email) => (
        <EmailAddressLink key={email} email={email} />
      ))}
    </div>
  );
}

export function PhoneListInline({ phones }: { phones: string[] }) {
  const values = phones.map((phone) => phone.trim()).filter(Boolean);
  if (values.length === 0) {
    return <>-</>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {values.map((phone) => (
        <CopyPhoneLink key={phone} phone={phone} />
      ))}
    </div>
  );
}

const compactAddress = (parts: Array<string | null | undefined>) =>
  parts.map((part) => part?.trim() ?? "").filter(Boolean).join(", ");

export function OpenAddressLink({
  address,
  className = emailClassName,
  label
}: {
  address: string | null | undefined;
  className?: string;
  label?: string;
}) {
  const trimmed = address?.trim();
  if (!trimmed) {
    return <>-</>;
  }

  const query = encodeURIComponent(trimmed);
  return (
    <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer" className={className}>
      {label ?? trimmed}
    </a>
  );
}

export function DirectionsAddressLink({
  address,
  className = emailClassName
}: {
  address: string | null | undefined;
  className?: string;
}) {
  const trimmed = address?.trim();
  if (!trimmed) {
    return null;
  }

  const destination = encodeURIComponent(trimmed);
  return (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      Directions
    </a>
  );
}

export function AddressMapLinks({
  parts,
  className = emailClassName
}: {
  parts: Array<string | null | undefined>;
  className?: string;
}) {
  const address = compactAddress(parts);
  if (!address) {
    return <>-</>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <OpenAddressLink address={address} className={className} />
      <DirectionsAddressLink address={address} className={className} />
    </div>
  );
}
