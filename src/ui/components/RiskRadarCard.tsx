import React from 'react';
import { RiskRadarResult } from '../../domain/types';

interface RiskRadarCardProps {
  radar: RiskRadarResult;
}

export const RiskRadarCard: React.FC<RiskRadarCardProps> = ({ radar }) => {
  return (
    <section className="card" aria-label="Household Risk Radar">
      <div className="card-header">
        <span className="card-title">Household Risk Radar</span>
        <span className="tag tag-exposure">Priority Focus</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🎯</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {radar.memberRoleLabel}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Highest vulnerability today
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle)',
            padding: '10px 12px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            lineHeight: 1.4,
          }}
        >
          <strong>{radar.slotLabel}:</strong> {radar.explanation}
        </div>
      </div>
    </section>
  );
};

