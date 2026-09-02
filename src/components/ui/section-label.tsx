type SectionLabelProps = {
  children: string;
  tone?: "default" | "accent";
};

export function SectionLabel({ children, tone = "default" }: SectionLabelProps) {
  return <p className={`section-label section-label-${tone}`}>{children}</p>;
}
