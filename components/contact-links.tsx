"use client";

import { useState } from "react";

const emailClassName =
  "text-teal-700 underline decoration-teal-300 underline-offset-4 transition hover:text-teal-900";
const phoneClassName =
  "text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900";

const copyToClipboard = async (value: string) => {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable.");
  }

  await navigator.clipboard.writeText(value);
};

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
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
      title={copied ? "Copied" : "Copy phone number"}
    >
      {copied ? `${trimmed} (copied)` : trimmed}
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
