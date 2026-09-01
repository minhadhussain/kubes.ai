type ModulePlaceholderProps = {
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2";
};

export function ModulePlaceholder({ title, description, priority }: ModulePlaceholderProps) {
  return (
    <section className="placeholder-panel">
      <div className="badge-row">
        <span className="priority-badge">{priority}</span>
        <span className="muted">Planned module</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
