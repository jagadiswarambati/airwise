import {
  type CookingFuel,
  type HomeHeating,
  CookingFuelSchema,
  HomeHeatingSchema,
} from '../../../domain/types';
import { Field } from '../../primitives/Field';
import { Fieldset } from '../../primitives/Fieldset';
import { COOKING_FUEL_OPTIONS, HOME_HEATING_OPTIONS } from '../options';

export interface CookingHeatingProps {
  fuel: CookingFuel;
  setFuel: (val: CookingFuel) => void;
  hasExhaust: boolean;
  setHasExhaust: (val: boolean) => void;
  homeHeating: HomeHeating;
  setHomeHeating: (val: HomeHeating) => void;
}

export function CookingHeatingSection({
  fuel,
  setFuel,
  hasExhaust,
  setHasExhaust,
  homeHeating,
  setHomeHeating,
}: CookingHeatingProps) {
  return (
    <Fieldset legend="Cooking and heating setup" className="mb-4">
      <div className="grid-2-col">
        <Field id="cooking-fuel" label="Primary cooking fuel">
          <select
            value={fuel}
            onChange={(e) => {
              const res = CookingFuelSchema.safeParse(e.target.value);
              if (res.success) setFuel(res.data);
            }}
            className="form-select"
          >
            {COOKING_FUEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="cooking-exhaust" label="Kitchen ventilation">
          <select
            value={hasExhaust ? 'yes' : 'no'}
            onChange={(e) => setHasExhaust(e.target.value === 'yes')}
            className="form-select"
          >
            <option value="yes">Chimney or exhaust fan</option>
            <option value="no">No mechanical exhaust</option>
          </select>
        </Field>
      </div>

      <div className="mt-3">
        <Field
          id="home-heating"
          label="Home heating (combustion safety)"
          helperText="Unvented biomass or gas heaters require carbon monoxide precautions"
        >
          <select
            value={homeHeating}
            onChange={(e) => {
              const res = HomeHeatingSchema.safeParse(e.target.value);
              if (res.success) setHomeHeating(res.data);
            }}
            className="form-select"
          >
            {HOME_HEATING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Fieldset>
  );
}
