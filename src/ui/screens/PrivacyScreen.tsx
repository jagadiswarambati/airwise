import React from 'react';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';

export const PrivacyScreen: React.FC = () => {
  return (
    <div className="aw-screen aw-screen-privacy">
      <PageHeader
        title="Privacy Policy"
        description={ROUTE_DESCRIPTIONS.privacy}
      />

      <section className="card aw-placeholder-card">
        <h2 className="text-lg font-bold mb-2">Your Privacy is Protected</h2>
        <p className="text-muted text-base mb-4">
          AirWise stores your household profile and settings strictly in your local browser storage.
          No personal data or exact coordinates are ever transmitted to remote databases.
        </p>
        <p className="text-muted text-sm italic">
          Full privacy policy coming in the next step.
        </p>
      </section>
    </div>
  );
};

export default PrivacyScreen;
