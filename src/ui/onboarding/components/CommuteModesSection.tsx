import { type Mode } from '../../../domain/types';
import { Fieldset } from '../../primitives/Fieldset';
import { COMMUTE_MODE_OPTIONS } from '../options';

export interface CommuteModesProps {
  modes: Mode[];
  toggleMode: (m: Mode) => void;
  error?: string;
}

export function CommuteModesSection({ modes, toggleMode, error }: CommuteModesProps) {
  return (
    <Fieldset
      id="commute-modes"
      legend="Primary commute modes"
      helperText="Select all modes used regularly by household commuters"
      error={error}
      className="mb-4"
    >
      <div className="flags-wrap">
        {COMMUTE_MODE_OPTIONS.map(({ mode, label }) => {
          const active = modes.includes(mode);
          const inputId = `mode-${mode}`;
          return (
            <label key={mode} htmlFor={inputId} className="aw-choice-label">
              <input
                id={inputId}
                type="checkbox"
                checked={active}
                onChange={() => toggleMode(mode)}
                className="aw-choice-input"
              />
              <span className="aw-choice-title">{label}</span>
            </label>
          );
        })}
      </div>
    </Fieldset>
  );
}
