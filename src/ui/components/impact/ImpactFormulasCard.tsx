import { Icon } from '../../icons';
import {
  FORMULA_E1_TITLE,
  FORMULA_E1_SUMMARY,
  FORMULA_E1_EQUATIONS,
  FORMULA_X1_TITLE,
  FORMULA_X1_SUMMARY,
  FORMULA_X1_EQUATION,
  FORMULA_C1_TITLE,
  FORMULA_C1_SUMMARY,
  FORMULA_C1_EQUATION,
} from '../../../domain/config/impact-copy';

export function ImpactFormulasCard() {
  return (
    <section className="card" aria-labelledby="formulas-heading">
      <h3 id="formulas-heading" className="section-heading mb-2 flex-row-center gap-1">
        <Icon name="info" size={20} aria-hidden="true" />
        <span>How we calculate this</span>
      </h3>
      <div className="formulas-stack text-xs">
        <div className="mb-2">
          <strong className="text-accent">{FORMULA_E1_TITLE}</strong>
          <p className="formula-desc mt-1">
            {FORMULA_E1_SUMMARY}
            <br />• <em>{FORMULA_E1_EQUATIONS[0]}</em>
            <br />• <em>{FORMULA_E1_EQUATIONS[1]}</em>
          </p>
        </div>

        <div className="mb-2">
          <strong className="text-accent">{FORMULA_X1_TITLE}</strong>
          <p className="formula-desc mt-1">
            {FORMULA_X1_SUMMARY}
            <br />• <em>{FORMULA_X1_EQUATION}</em>
          </p>
        </div>

        <div>
          <strong className="text-accent">{FORMULA_C1_TITLE}</strong>
          <p className="formula-desc mt-1">
            {FORMULA_C1_SUMMARY}
            <br />• <em>{FORMULA_C1_EQUATION}</em>
          </p>
        </div>
      </div>
    </section>
  );
}
