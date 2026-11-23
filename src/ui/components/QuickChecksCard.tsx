import React, { useState } from 'react';
import { QuickCheckResult } from '../../domain/quickchecks';

interface QuickChecksCardProps {
  checks: QuickCheckResult[];
}

export const QuickChecksCard: React.FC<QuickChecksCardProps> = ({ checks }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  const getVerdictClass = (verdict: QuickCheckResult['verdict']) => {
    switch (verdict) {
      case 'Yes':
        return 'verdict-yes';
      case 'No':
        return 'verdict-no';
      case 'Brief':
        return 'verdict-brief';
      case 'With precautions':
        return 'verdict-precautions';
    }
  };

  return (
    <section className="card" aria-label="Deterministic Quick Checks">
      <div className="card-header">
        <span className="card-title">Quick Checks</span>
        <span className="tag tag-cost">Deterministic</span>
      </div>

      <div className="quick-checks-list">
        {checks.map((check, idx) => {
          const isExpanded = expandedIdx === idx;
          return (
            <div key={idx} className="quick-check-item">
              <button
                type="button"
                className="qc-question-row"
                onClick={() => toggleExpand(idx)}
                aria-expanded={isExpanded}
              >
                <span className="qc-question">{check.question}</span>
                <span className={`qc-verdict ${getVerdictClass(check.verdict)}`}>
                  {check.verdict}
                </span>
              </button>

              <div className="qc-answer">
                {check.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
