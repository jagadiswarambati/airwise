import React from 'react';
import { LegalDocument } from '../components/LegalDocument';
import { TERMS_SECTIONS } from '../../content/terms';

export const TermsScreen: React.FC = () => {
  return (
    <LegalDocument
      title="Terms of Use"
      description="Please read these terms carefully before using AirWise. AirWise is an informational decision assistant, not a healthcare provider or emergency alert system."
      screenClass="aw-screen-terms"
      tocAriaLabel="Terms of use table of contents"
      sections={TERMS_SECTIONS}
    />
  );
};

export default TermsScreen;
