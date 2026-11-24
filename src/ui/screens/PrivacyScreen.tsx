import React from 'react';
import { LegalDocument } from '../components/LegalDocument';
import { PRIVACY_SECTIONS } from '../../content/privacy';

export const PrivacyScreen: React.FC = () => {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="AirWise is built on a privacy-by-design foundation. Your household profile stays strictly in your browser. We collect no accounts, set zero cookies, and never track you."
      screenClass="aw-screen-privacy"
      tocAriaLabel="Privacy policy table of contents"
      sections={PRIVACY_SECTIONS}
    />
  );
};

export default PrivacyScreen;
