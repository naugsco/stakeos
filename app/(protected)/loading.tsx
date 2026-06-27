export default function ProtectedLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading data…</span>
      <div className="h-40 animate-pulse rounded-panel-lg border border-line bg-white/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-card border border-line bg-white/70" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-panel border border-line bg-white/70" />
        ))}
      </div>
    </div>
  );
}
