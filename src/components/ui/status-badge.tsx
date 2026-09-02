type StatusBadgeProps = {
  label: string;
  tone?: "accent" | "neutral" | "warning" | "danger";
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge-${tone}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
