import React from 'react';
import { Prose } from '../components/Prose';
import { PageHeader } from '../shell/PageHeader';
import {
  OWNER_NAME,
  CONTACT_EMAIL,
  TERMS_JURISDICTION,
  LAST_UPDATED,
  OPEN_METEO_ATTRIBUTION,
  EMERGENCY_NOTICE,
} from '../../config/site';

interface TocItem {
  id: string;
  label: string;
}

const TOC_SECTIONS: TocItem[] = [
  { id: 'medical-boundary', label: '1. Not Medical Advice' },
  { id: 'forecast-nature', label: '2. Modelled Forecasts' },
  { id: 'demo-data-nature', label: '3. Demo Scenarios' },
  { id: 'acceptable-use', label: '4. Acceptable Use' },
  { id: 'liability-limits', label: '5. Liability & Warranty' },
  { id: 'attributions-license', label: '6. Attribution & License' },
  { id: 'governing-law', label: '7. Governing Law' },
  { id: 'contact-changes', label: '8. Contact & Changes' },
];

export const TermsScreen: React.FC = () => {
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.focus();
    }
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const h1 = document.querySelector('h1');
    if (h1) h1.focus();
  };

  return (
    <div className="aw-screen aw-screen-terms">
      <PageHeader
        title="Terms of Use"
        description="Please read these terms carefully before using AirWise. AirWise is an informational decision assistant, not a healthcare provider or emergency alert system."
        meta={<p className="text-muted text-xs mt-2">Last updated: {LAST_UPDATED}</p>}
      />

      <div className="aw-legal-layout">
        {/* Table of Contents for Desktop (>=1024px) */}
        <aside className="aw-toc" aria-label="Terms of use table of contents">
          <div className="aw-toc-card card">
            <h2 className="aw-toc-title">On this page</h2>
            <nav>
              <ul className="aw-toc-list">
                {TOC_SECTIONS.map((item) => (
                  <li key={item.id} className="aw-toc-item">
                    <button
                      type="button"
                      className="aw-toc-btn"
                      onClick={() => handleScrollTo(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Terms Prose */}
        <div className="aw-legal-content">
          <Prose>
            {/* 1. Not Medical Advice */}
            <section id="medical-boundary" tabIndex={-1} className="aw-prose-section">
              <h2>1. Informational Purpose Only — Not Medical Advice</h2>
              <div className="banner banner-warning mb-4">
                <p className="font-semibold">
                  {EMERGENCY_NOTICE}
                </p>
              </div>
              <p>
                AirWise provides informational household guidance regarding air pollution,
                ventilation, routine scheduling, and personal exposure reduction. It is not a
                medical device and does not provide clinical diagnosis, medical care, symptom
                treatment, or pharmaceutical prescriptions.
              </p>
              <p>
                Household members with pre-existing conditions—including asthma, chronic
                obstructive pulmonary disease (COPD), cardiovascular disease, or pregnancy—must
                continue following the explicit management plan established with their personal
                healthcare provider. Never disregard or delay professional clinical guidance
                because of information presented in this application.
              </p>
            </section>

            {/* 2. Modelled Forecasts */}
            <section id="forecast-nature" tabIndex={-1} className="aw-prose-section">
              <h2>2. Modelled Weather &amp; Air Quality Forecasts</h2>
              <p>
                Air quality estimates, hourly PM2.5 concentrations, and weather metrics are derived
                from numerical atmospheric models provided by Open-Meteo and Copernicus Atmosphere
                Monitoring Service (CAMS).
              </p>
              <p>
                Atmospheric models operate across regional grid cells (typically 11 to 25 kilometers
                wide) and represent simulated regional averages. They cannot detect hyper-local
                street-level pollution spikes, localized garbage burning, or indoor microclimates.
                Air forecasts may be delayed, incomplete, or inaccurate due to atmospheric changes
                or upstream data outages.
              </p>
            </section>

            {/* 3. Demo Scenarios */}
            <section id="demo-data-nature" tabIndex={-1} className="aw-prose-section">
              <h2>3. Demo Scenarios &amp; Simulated Community Data</h2>
              <p>
                AirWise includes evaluation presets and demonstration scenarios (such as Clear,
                Moderate, Severe Smog, and Stale data) alongside a simulated residential society
                (Green Meadows Apartments).
              </p>
              <p>
                All figures, pledges, and community tallies associated with demo scenarios are
                synthetic simulations designed to illustrate system behavior across diverse
                pollution states. They do not reflect live sensor readings or active neighborhood
                pledge registries.
              </p>
            </section>

            {/* 4. Acceptable Use */}
            <section id="acceptable-use" tabIndex={-1} className="aw-prose-section">
              <h2>4. Acceptable Use Policy</h2>
              <p>
                By accessing AirWise, you agree to use the application solely for lawful, personal,
                or community informational purposes. You agree not to:
              </p>
              <ul>
                <li>
                  Deploy automated scripts, bots, spiders, or scrapers against application
                  interfaces or underlying serverless endpoints.
                </li>
                <li>
                  Attempt to bypass, defeat, or manipulate API rate limits, request validation
                  schemas, or server-side security controls.
                </li>
                <li>
                  Interfere with or disrupt serverless hosting infrastructure, network integrity,
                  or service availability.
                </li>
                <li>
                  Rely on AirWise as an emergency alert system or life-critical monitoring system.
                </li>
              </ul>
            </section>

            {/* 5. Liability & Warranty */}
            <section id="liability-limits" tabIndex={-1} className="aw-prose-section">
              <h2>5. Warranty Disclaimer &amp; Limitation of Liability</h2>
              <p>
                AirWise is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
                warranty of any kind, express or implied, including but not limited to warranties
                of merchantability, fitness for a particular purpose, uninterrupted availability,
                or data accuracy.
              </p>
              <p>
                To the maximum extent permitted by applicable law, in no event shall the author,
                contributors, or project maintainer be held liable for any claim, injury, loss,
                or direct, indirect, incidental, special, or consequential damages arising out of
                or in connection with your use of, or inability to use, this application or its
                informational suggestions.
              </p>
            </section>

            {/* 6. Attribution & License */}
            <section id="attributions-license" tabIndex={-1} className="aw-prose-section">
              <h2>6. Data Attribution &amp; Source Code License</h2>
              <p>
                Air quality and meteorological information is attributed in accordance with
                upstream provider licensing:
              </p>
              <blockquote className="aw-legal-quote">
                {OPEN_METEO_ATTRIBUTION}
              </blockquote>
              <p>
                Data is utilized under the terms of Creative Commons Attribution 4.0 International
                (CC BY 4.0).
              </p>
              <p>
                <strong>Source code licence:</strong> MIT.
              </p>
            </section>

            {/* 7. Governing Law */}
            <section id="governing-law" tabIndex={-1} className="aw-prose-section">
              <h2>7. Governing Law &amp; Jurisdiction</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of{' '}
                <code>{TERMS_JURISDICTION}</code>, without regard to its conflict of law
                provisions. Any dispute arising under or in connection with these terms shall be
                subject to the jurisdiction of competent courts in that territory.
              </p>
            </section>

            {/* 8. Contact & Changes */}
            <section id="contact-changes" tabIndex={-1} className="aw-prose-section">
              <h2>8. Contact &amp; Modifications</h2>
              <p>
                We reserve the right to revise these terms to reflect technical, regulatory, or
                architectural updates. Your continued use of the application following any
                revisions constitutes acceptance of the amended terms.
              </p>
              <p>
                <strong>Project Maintainer:</strong> {OWNER_NAME}<br />
                <strong>Contact Email:</strong>{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="aw-inline-link">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </section>

            {/* Back to top button */}
            <div className="aw-back-to-top-wrapper mt-6">
              <button
                type="button"
                className="aw-btn aw-btn-secondary"
                onClick={handleScrollTop}
              >
                Back to top ↑
              </button>
            </div>
          </Prose>
        </div>
      </div>
    </div>
  );
};

export default TermsScreen;
