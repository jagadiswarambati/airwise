import { Fieldset } from '../../primitives/Fieldset';

export interface EquipmentSectionProps {
  hasPurifier: boolean;
  setHasPurifier: (val: boolean) => void;
  hasWindowAC: boolean;
  setHasWindowAC: (val: boolean) => void;
  hasHvac: boolean;
  setHasHvac: (val: boolean) => void;
}

export function EquipmentSection({
  hasPurifier,
  setHasPurifier,
  hasWindowAC,
  setHasWindowAC,
  hasHvac,
  setHasHvac,
}: EquipmentSectionProps) {
  return (
    <Fieldset legend="Air quality equipment" className="mb-4">
      <div className="checkbox-group">
        <label htmlFor="eq-purifier" className="aw-choice-label">
          <input
            id="eq-purifier"
            type="checkbox"
            checked={hasPurifier}
            onChange={(e) => setHasPurifier(e.target.checked)}
            className="aw-choice-input"
          />
          <span className="aw-choice-title">HEPA air purifier</span>
        </label>

        <label htmlFor="eq-window-ac" className="aw-choice-label">
          <input
            id="eq-window-ac"
            type="checkbox"
            checked={hasWindowAC}
            onChange={(e) => setHasWindowAC(e.target.checked)}
            className="aw-choice-input"
          />
          <span className="aw-choice-title">Window or split AC</span>
        </label>

        <label htmlFor="eq-hvac" className="aw-choice-label">
          <input
            id="eq-hvac"
            type="checkbox"
            checked={hasHvac}
            onChange={(e) => setHasHvac(e.target.checked)}
            className="aw-choice-input"
          />
          <span className="aw-choice-title">Central HVAC</span>
        </label>
      </div>
    </Fieldset>
  );
}
