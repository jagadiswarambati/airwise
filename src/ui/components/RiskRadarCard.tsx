import React from 'react';
import { RiskRadarResult } from '../../domain/types';
import { Icon } from '../icons';

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

      <div className="radar-body">
        <div className="radar-profile-row">
          <Icon name="protect" size={24} aria-hidden="true" />
          <div>
            <div className="radar-role-title">
              {radar.memberRoleLabel}
            </div>
            <div className="radar-role-sub">
              Highest vulnerability today
            </div>
          </div>
        </div>

        <div className="radar-box">
          <strong>{radar.slotLabel}:</strong> {radar.explanation}
        </div>
      </div>
    </section>
  );
};
