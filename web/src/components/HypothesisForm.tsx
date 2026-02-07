import { useState } from 'react';
import type { Hypothesis } from '../types';

interface HypothesisFormProps {
  onSubmit: (hypothesis: Hypothesis) => void;
  disabled?: boolean;
}

export function HypothesisForm({ onSubmit, disabled = false }: HypothesisFormProps) {
  const [assumptions, setAssumptions] = useState<string[]>(['']);
  const [constraints, setConstraints] = useState<string[]>(['']);
  const [goals, setGoals] = useState<string[]>(['']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hypothesis: Hypothesis = {
      assumptions: assumptions.filter(a => a.trim() !== ''),
      constraints: constraints.filter(c => c.trim() !== ''),
      goals: goals.filter(g => g.trim() !== ''),
    };
    onSubmit(hypothesis);
  };

  const addField = (
    setFn: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[]
  ) => {
    setFn([...current, '']);
  };

  const updateField = (
    setFn: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setFn(current => {
      const updated = [...current];
      updated[index] = value;
      return updated;
    });
  };

  const removeField = (
    setFn: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
    index: number
  ) => {
    if (current.length > 1) {
      setFn(current.filter((_, i) => i !== index));
    }
  };

  const renderFields = (
    fields: string[],
    setFn: React.Dispatch<React.SetStateAction<string[]>>,
    label: string,
    placeholder: string
  ) => (
    <div className="field-group">
      <label className="field-label" htmlFor={`${label.toLowerCase()}-input-0`}>{label}</label>
      {fields.map((field, index) => {
        const fieldId = `${label.toLowerCase()}-input-${index}`;
        return (
          <div key={fieldId} className="field-row">
            <input
              type="text"
              id={fieldId}
              value={field}
              onChange={(e) => updateField(setFn, index, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="field-input"
            />
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => removeField(setFn, fields, index)}
                disabled={disabled}
                className="field-remove"
                aria-label="Remove field"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => addField(setFn, fields)}
        disabled={disabled}
        className="field-add"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="hypothesis-form">
      <h2 className="form-title">Hypothesis Input</h2>

      {renderFields(assumptions, setAssumptions, 'Assumptions', 'e.g., "The system has a decentralized structure"')}

      {renderFields(constraints, setConstraints, 'Constraints', 'e.g., "Budget is limited to $1M"')}

      {renderFields(goals, setGoals, 'Goals', 'e.g., "Achieve 90% user adoption"')}

      <div className="form-actions">
        <button type="submit" disabled={disabled} className="submit-button">
          Run Analysis
        </button>
      </div>
    </form>
  );
}
