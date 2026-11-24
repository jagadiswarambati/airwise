import React from 'react';
import { HouseholdProfile, RiskRadarResult } from '../../domain/types';
import { Icon } from '../icons';

export interface RadarLineProps {
  radar: RiskRadarResult;
  profile?: HouseholdProfile;
}

/**
 * RadarLine: Plain sentence summarizing peak exposure risk for the household today.
 * Replaces bulky boxed card with a clean divided one-sentence announcement.
 */
export const RadarLine: React.FC<RadarLineProps> = ({ radar, profile }) => {
  // Format approximate time based on slot and profile routine
  let timeClause = '';
  const routine = profile?.routine;
  if (routine) {
    if (radar.slotId === 'commute-out' && routine.leave) {
      timeClause = `around ${routine.leave} on the `;
    } else if (radar.slotId === 'commute-back' && routine.returnHome) {
      timeClause = `around ${routine.returnHome} on the `;
    } else if (radar.slotId === 'early-morning' && routine.wake) {
      timeClause = `around ${routine.wake} in the `;
    } else if (radar.slotId === 'evening' && routine.returnHome) {
      timeClause = `around ${routine.returnHome} in the `;
    }
  }

  const roleText = radar.memberRoleLabel ? radar.memberRoleLabel.toLowerCase() : 'household';
  const slotText = radar.slotLabel ? radar.slotLabel.toLowerCase() : 'routine';
  const sentence = timeClause
    ? `Highest exposure today: ${roleText}, ${timeClause}${slotText}.`
    : `Highest exposure today: ${roleText} during the ${slotText}.`;

  return (
    <div className="aw-radar-line" aria-label="Household Risk Radar Announcement">
      <div className="aw-radar-icon" aria-hidden="true">
        <Icon name="watch" size={18} />
      </div>
      <p className="aw-radar-text">{sentence}</p>
    </div>
  );
};
