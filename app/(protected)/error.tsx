"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ProtectedError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in the desktop console/logs for troubleshooting.
    console.error("StakeOS page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl rounded-panel-lg border border-rose-200 bg-rose-50/80 p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">This page couldn&apos;t load its data</h1>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        StakeOS reads from the local intelligence database. This usually happens right
        after install, while a sync is running, or if the database needs to be rebuilt.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
        >
          Try again
        </button>
        <Link
          href="/sync-center"
          className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Open Sync Center
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-4 text-xs text-slate-500">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
