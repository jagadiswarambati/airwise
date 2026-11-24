import React from 'react';

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ChoiceGroupProps {
  name: string;
  type?: 'radio' | 'checkbox';
  options: ChoiceOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  className?: string;
  idPrefix?: string;
  inline?: boolean;
}

export const ChoiceGroup: React.FC<ChoiceGroupProps> = ({
  name,
  type = 'radio',
  options,
  value,
  onChange,
  className = '',
  idPrefix = name,
  inline = false,
}) => {
  const isCheckbox = type === 'checkbox';

  const handleCheckboxChange = (optValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (checked) {
      onChange([...currentValues, optValue]);
    } else {
      onChange(currentValues.filter((v) => v !== optValue));
    }
  };

  return (
    <div
      className={`aw-choice-group ${inline ? 'aw-choice-group-inline' : ''} ${className}`.trim()}
    >
      {options.map((option) => {
        const inputId = `${idPrefix}-${option.value}`;
        const isChecked = isCheckbox
          ? Array.isArray(value) && value.includes(option.value)
          : value === option.value;

        return (
          <div key={option.value} className="aw-choice-item">
            <label htmlFor={inputId} className="aw-choice-label">
              <input
                id={inputId}
                type={type}
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={option.disabled}
                onChange={(e) => {
                  if (isCheckbox) {
                    handleCheckboxChange(option.value, e.target.checked);
                  } else {
                    onChange(option.value);
                  }
                }}
                className="aw-choice-input"
              />
              <span className="aw-choice-text">
                <span className="aw-choice-title">{option.label}</span>
                {option.description && (
                  <span className="aw-choice-desc">{option.description}</span>
                )}
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default ChoiceGroup;
