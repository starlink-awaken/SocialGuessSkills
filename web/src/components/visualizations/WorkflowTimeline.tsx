import { WORKFLOW_STEPS } from '../../lib/constants';

interface Props {
  currentStep: number;
}

export function WorkflowTimeline({ currentStep }: Props) {
  return (
    <div className="workflow-timeline">
      {WORKFLOW_STEPS.map((step, i) => {
        const status = step.id < currentStep ? 'done' : step.id === currentStep ? 'active' : 'pending';
        return (
          <div key={step.id} className={`timeline-step ${status}`}>
            <div className="timeline-icon">
              {status === 'done' ? '✓' : step.icon}
            </div>
            <div className="timeline-label">{step.name}</div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={`timeline-connector ${status === 'done' ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
