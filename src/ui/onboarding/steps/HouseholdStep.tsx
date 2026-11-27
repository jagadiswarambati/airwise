import React from 'react';
import { type Flag, type Member, AgeGroupSchema } from '../../../domain/types';
import { Field } from '../../primitives/Field';
import { Fieldset } from '../../primitives/Fieldset';
import { AGE_GROUP_OPTIONS, FLAG_OPTIONS } from '../options';

interface MemberItemProps {
  member: Member;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, updates: Partial<Member>) => void;
  onRemove: (id: string) => void;
  onToggleFlag: (id: string, flag: Flag) => void;
}

function MemberItem({
  member,
  index,
  canRemove,
  onUpdate,
  onRemove,
  onToggleFlag,
}: MemberItemProps) {
  return (
    <Fieldset
      legend={`Member ${index + 1}: ${member.roleLabel}`}
      className="aw-member-fieldset mb-3"
    >
      <div className="flex-between mb-3">
        <span className="text-sm font-semibold text-accent">{member.roleLabel}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(member.id)}
            className="member-remove-btn"
            aria-label={`Remove Member ${index + 1}`}
          >
            Remove
          </button>
        )}
      </div>

      <Field
        id={`member-${member.id}-age`}
        label="Age group"
        helperText="Used to evaluate sensitivity guidelines"
      >
        <select
          value={member.ageGroup}
          onChange={(e) => {
            const res = AgeGroupSchema.safeParse(e.target.value);
            if (res.success) onUpdate(member.id, { ageGroup: res.data });
          }}
          className="form-select"
        >
          {AGE_GROUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Fieldset legend="Health sensitivities" className="mt-3">
        <div className="flags-wrap">
          {FLAG_OPTIONS.map(({ flag, label }) => {
            const active = member.flags.includes(flag);
            const inputId = `member-${member.id}-flag-${flag}`;
            return (
              <label key={flag} htmlFor={inputId} className="aw-choice-label">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggleFlag(member.id, flag)}
                  className="aw-choice-input"
                />
                <span className="aw-choice-title">{label}</span>
              </label>
            );
          })}
        </div>
      </Fieldset>
    </Fieldset>
  );
}

export interface HouseholdStepProps {
  h1Ref: React.RefObject<HTMLHeadingElement>;
  members: Member[];
  addMember: () => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  removeMember: (id: string) => void;
  toggleFlag: (id: string, flag: Flag) => void;
  onBack: () => void;
}

export const HouseholdStep: React.FC<HouseholdStepProps> = ({
  h1Ref,
  members,
  addMember,
  updateMember,
  removeMember,
  toggleFlag,
  onBack,
}) => {
  return (
    <div className="card">
      <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
        Who lives here
      </h1>
      <p className="text-sm text-muted mb-4">
        We ask for age groups and respiratory sensitivities only. No personal names or exact
        dates of birth are ever recorded.
      </p>

      <div id="members-list" className="members-stack mb-4">
        {members.map((m, idx) => (
          <MemberItem
            key={m.id}
            member={m}
            index={idx}
            canRemove={members.length > 1}
            onUpdate={updateMember}
            onRemove={removeMember}
            onToggleFlag={toggleFlag}
          />
        ))}
      </div>

      <button type="button" className="aw-btn aw-btn-secondary mb-4" onClick={addMember}>
        + Add family member
      </button>

      <div className="aw-btn-row">
        <button type="button" className="aw-btn aw-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="aw-btn aw-btn-primary">
          Continue
        </button>
      </div>
    </div>
  );
};
