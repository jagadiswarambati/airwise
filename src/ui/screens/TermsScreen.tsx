import React from 'react';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';

export const TermsScreen: React.FC = () => {
  return (
    <div className="aw-screen aw-screen-terms">
      <PageHeader
        title="Terms of Use"
        description={ROUTE_DESCRIPTIONS.terms}
      />

      <section className="card aw-placeholder-card">
        <h2 className="text-lg font-bold mb-2">Terms &amp; Disclaimers</h2>
        <p className="text-muted text-base mb-4">
          AirWise is informational only and does not provide medical or clinical advice.
          Always consult a qualified clinician regarding personal health decisions.
        </p>
        <p className="text-muted text-sm italic">
          Full terms of use coming in the next step.
        </p>
      </section>
    </div>
  );
};

export default TermsScreen;
