import React, { useState } from 'react';
import { QuickCheckResult } from '../../domain/quickchecks';
import { Sheet } from './Sheet';

export interface QuickChecksCardProps {
  checks: QuickCheckResult[];
}

function getVerdictClass(verdict: QuickCheckResult['verdict']): string {
  switch (verdict) {
    case 'Yes':
      return 'verdict-yes';
    case 'No':
      return 'verdict-no';
    case 'Brief':
      return 'verdict-brief';
    case 'With precautions':
      return 'verdict-precautions';
    default:
      return '';
  }
}

/**
 * QuickChecksCard: Clean, unboxed Quick Questions presented as interactive Chips.
 * Clicking any chip opens a full Sheet showing the answer and reasoning. No nested cards.
 */
export const QuickChecksCard: React.FC<QuickChecksCardProps> = ({ checks }) => {
  const [selectedCheck, setSelectedCheck] = useState<QuickCheckResult | null>(null);

  return (
    <section className="aw-quick-questions-section" aria-label="Quick Checks">
      <h2 className="aw-section-title">Quick Checks</h2>
      <div className="aw-quick-chips-wrap">
        {checks.map((check, idx) => {
          const verdictCls = getVerdictClass(check.verdict);
          return (
            <button
              key={idx}
              type="button"
              className="aw-quick-chip"
              onClick={() => setSelectedCheck(check)}
              aria-label={`${check.question}: ${check.verdict}. Tap for explanation.`}
            >
              <span className="aw-qc-chip-q">{check.question}</span>
              <span className={`aw-qc-chip-verdict ${verdictCls}`}>
                {check.verdict}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCheck && (
        <Sheet
          isOpen={!!selectedCheck}
          onClose={() => setSelectedCheck(null)}
          title={selectedCheck.question}
        >
          <div className="aw-qc-sheet-body">
            <div className={`aw-qc-sheet-badge ${getVerdictClass(selectedCheck.verdict)}`}>
              {selectedCheck.verdict}
            </div>
            <p className="aw-qc-sheet-answer">{selectedCheck.answer}</p>
          </div>
        </Sheet>
      )}
    </section>
  );
};
