import { StatusBadge } from "@/components/ui/status-badge";

export type TimelineItem = {
  time: string;
  title: string;
  description: string;
  tone?: "accent" | "neutral" | "warning" | "danger";
};

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={`${item.time}-${item.title}`} className="timeline-item">
          <div className="timeline-line" aria-hidden="true" />
          <div className="timeline-content">
            <div className="timeline-row">
              <span className="timeline-time">{item.time}</span>
              <StatusBadge label={item.tone === "danger" ? "Risk" : item.tone === "warning" ? "Watch" : "Live"} tone={item.tone ?? "neutral"} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
