type WorkflowStepProps = {
  index: string;
  title: string;
  description: string;
  meta: string;
};

export function WorkflowStep({ index, title, description, meta }: WorkflowStepProps) {
  return (
    <article className="workflow-step">
      <div className="workflow-step-index">{index}</div>
      <div className="workflow-step-body">
        <p className="section-label">{meta}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
