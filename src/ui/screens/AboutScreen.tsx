import React from 'react';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';

export const AboutScreen: React.FC = () => {
  return (
    <div className="aw-screen aw-screen-about">
      <PageHeader
        title="About AirWise"
        description={ROUTE_DESCRIPTIONS.about}
      />

      <section className="card aw-placeholder-card">
        <h2 className="text-lg font-bold mb-2">About AirWise</h2>
        <p className="text-muted text-base mb-4">
          AirWise provides deterministic, evidence-backed air quality actions tailored
          to your household’s specific routine and health sensitivities.
        </p>
        <p className="text-muted text-sm italic">
          Full about page coming in the next step.
        </p>
      </section>
    </div>
  );
};

export default AboutScreen;
