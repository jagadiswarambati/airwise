import { Fieldset } from '../../primitives/Fieldset';

export interface FlexibilityProps {
  canShiftTime: boolean;
  setCanShiftTime: (val: boolean) => void;
  canWorkRemotely: boolean;
  setCanWorkRemotely: (val: boolean) => void;
  outdoorWorker: boolean;
  setOutdoorWorker: (val: boolean) => void;
}

export function CommuteFlexibilitySection({
  canShiftTime,
  setCanShiftTime,
  canWorkRemotely,
  setCanWorkRemotely,
  outdoorWorker,
  setOutdoorWorker,
}: FlexibilityProps) {
  return (
    <Fieldset legend="Schedule flexibility and outdoor exposure" className="mb-4">
      <div className="checkbox-group">
        <label htmlFor="flex-shift" className="aw-choice-label">
          <input
            id="flex-shift"
            type="checkbox"
            checked={canShiftTime}
            onChange={(e) => setCanShiftTime(e.target.checked)}
            className="aw-choice-input"
          />
          <span className="aw-choice-title">
            Can shift commute departure by 30–60 minutes
          </span>
        </label>

        <label htmlFor="flex-remote" className="aw-choice-label">
          <input
            id="flex-remote"
            type="checkbox"
            checked={canWorkRemotely}
            onChange={(e) => setCanWorkRemotely(e.target.checked)}
            className="aw-choice-input"
          />
          <span className="aw-choice-title">
            Can work remotely on bad pollution days
          </span>
        </label>

        <label htmlFor="flex-worker" className="aw-choice-label">
          <input
            id="flex-worker"
            type="checkbox"
            checked={outdoorWorker}
            onChange={(e) => setOutdoorWorker(e.target.checked)}
            className="aw-choice-input"
          />
          <span className="aw-choice-title">
            Household member is an outdoor worker
          </span>
        </label>
      </div>
    </Fieldset>
  );
}
