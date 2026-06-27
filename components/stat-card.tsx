interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-600 via-sky-600 to-amber-600" />
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
