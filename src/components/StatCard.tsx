export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="stat-card">
      <span className="label">{label}</span>
      <strong className="value mono">{value}</strong>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}
