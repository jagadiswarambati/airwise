import React from 'react';
import { Prose } from '../components/Prose';
import { PageHeader } from '../shell/PageHeader';
import {
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_SCENARIO,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_MANUAL_SEVERE_MODE,
  STORAGE_KEY_COMMUNITY_PLEDGE,
  STORAGE_PREFIX_AIR_CACHE,
} from '../../state/keys';
import { CONTACT_EMAIL, LAST_UPDATED } from '../../config/site';

interface TocItem {
  id: string;
  label: string;
}

const TOC_SECTIONS: TocItem[] = [
  { id: 'overview', label: '1. What AirWise Does' },
  { id: 'storage-keys', label: '2. What Stays On-Device' },
  { id: 'data-in-transit', label: '3. What Leaves Your Device' },
  { id: 'ai-boundaries', label: '4. AI Data Minimisation' },
  { id: 'third-parties', label: '5. External Services' },
  { id: 'cookies-tracking', label: '6. Cookies & Tracking' },
  { id: 'retention-logs', label: '7. Retention & Logs' },
  { id: 'children-privacy', label: '8. Children’s Privacy' },
  { id: 'user-controls', label: '9. Export & Deletion' },
  { id: 'security-headers', label: '10. Security Headers' },
  { id: 'contact-updates', label: '11. Updates & Contact' },
];

export const PrivacyScreen: React.FC = () => {
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
    <div className="aw-screen aw-screen-privacy">
      {/* Have this reviewed before commercial use. */}

      <PageHeader
        title="Privacy Policy"
        description="AirWise is built on a privacy-by-design foundation. Your household profile stays strictly in your browser. We collect no accounts, set zero cookies, and never track you."
        meta={<p className="text-muted text-xs mt-2">Last updated: {LAST_UPDATED}</p>}
      />

      <div className="aw-legal-layout">
        {/* Table of Contents for Desktop (>=1024px) */}
        <aside className="aw-toc" aria-label="Privacy policy table of contents">
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

        {/* Main Privacy Prose */}
        <div className="aw-legal-content">
          <Prose>
            {/* 1. What AirWise Does */}
            <section id="overview" tabIndex={-1} className="aw-prose-section">
              <h2>1. What AirWise Does</h2>
              <p>
                AirWise provides actionable, household-specific clean-air recommendations during
                urban smog and winter pollution. Because indoor air and household vulnerabilities
                differ across families, recommendations are customized using your home equipment,
                cooking setup, and family routine.
              </p>
              <p>
                Crucially, AirWise operates without requiring any user registration, passwords,
                emails, or backend user accounts. Everything you configure remains under your
                exclusive local control.
              </p>
            </section>

            {/* 2. What Stays On-Device */}
            <section id="storage-keys" tabIndex={-1} className="aw-prose-section">
              <h2>2. What Stays on Your Device (Local Storage Keys)</h2>
              <p>
                All user data is stored strictly in your browser’s LocalStorage using the
                standardized <code>airwise_</code> namespace prefix. Here is an exact accounting
                of every storage key used:
              </p>
              <ul className="aw-storage-key-list">
                <li>
                  <code>{STORAGE_KEY_PROFILE}</code>: Stores your household configuration,
                  including age groups, general sensitivity flags, equipment booleans (purifier,
                  window AC, exhaust), cooking fuel, home heating type, travel distance, and
                  clock times for waking, leaving, and sleeping. This never leaves your device.
                </li>
                <li>
                  <code>{STORAGE_KEY_SCENARIO}</code>: Remembers the active air quality scenario
                  selected in the Demo switcher (<code>live</code>, <code>clear</code>,{' '}
                  <code>moderate</code>, <code>severe</code>, or <code>stale</code>).
                </li>
                <li>
                  <code>{STORAGE_KEY_SETTINGS}</code>: Saves application preferences, including
                  color theme (<code>system</code>, <code>light</code>, or <code>dark</code>),
                  the animated sky background toggle, and whether optional AI personalization is
                  enabled.
                </li>
                <li>
                  <code>{STORAGE_KEY_MANUAL_SEVERE_MODE}</code>: Records whether you have manually
                  activated Severe Smog Mode to preview emergency procedures.
                </li>
                <li>
                  <code>{STORAGE_KEY_COMMUNITY_PLEDGE}</code>: A local boolean flag indicating
                  whether your household has pledged not to burn waste or leaves.
                </li>
                <li>
                  <code>{STORAGE_PREFIX_AIR_CACHE}*</code>: Temporary caches of hourly air quality
                  data keyed by rounded coordinates (e.g.{' '}
                  <code>{STORAGE_PREFIX_AIR_CACHE}17.38_78.48</code>). Cached data expires after
                  15 minutes and ensures smooth offline fallback without repeated network queries.
                </li>
              </ul>
            </section>

            {/* 3. What Leaves Your Device */}
            <section id="data-in-transit" tabIndex={-1} className="aw-prose-section">
              <h2>3. What Leaves Your Device</h2>
              <p>
                To provide timely air guidance, AirWise only transmits the minimal technical data
                required to fetch forecasts:
              </p>
              <ul>
                <li>
                  <strong>Rounded Coordinates (~1.1 km):</strong> If you select current location,
                  your latitude and longitude are immediately truncated to two decimal places
                  (for example, <code>17.38, 78.48</code>) before sending to <code>/api/air</code>.
                  Precise GPS coordinates are discarded immediately on device.
                </li>
                <li>
                  <strong>Place-Name Searches:</strong> When searching for a city in onboarding,
                  the query text (trimmed up to 60 characters) is sent to <code>/api/geocode</code>.
                </li>
                <li>
                  <strong>Anonymised AI Payload (Only when AI is Enabled):</strong> If you
                  opt-in to AI personalization, an abstract payload of approved action IDs and
                  routine slot hours is transmitted to <code>/api/plan</code>.
                </li>
              </ul>
            </section>

            {/* 4. AI Data Minimisation */}
            <section id="ai-boundaries" tabIndex={-1} className="aw-prose-section">
              <h2>4. What Google Gemini Receives and Does Not Receive</h2>
              <p>
                When AI personalization is turned on, the request payload is rigorously minimized:
              </p>
              <div className="aw-ai-comparison-grid">
                <div className="card">
                  <h3 className="text-sm font-bold text-main mb-2">What AI Receives</h3>
                  <ul className="text-xs text-muted">
                    <li>Coarse age band labels (e.g. &ldquo;Child, 5–12&rdquo;)</li>
                    <li>General sensitivity category (respiratory, other, none)</li>
                    <li>Equipment flags (purifier: true/false, AC: true/false)</li>
                    <li>Budget tier and heating type</li>
                    <li>Routine time slot labels (e.g. &ldquo;Morning Commute&rdquo;)</li>
                    <li>Calculated risk levels and approved action IDs</li>
                  </ul>
                </div>
                <div className="card">
                  <h3 className="text-sm font-bold text-main mb-2">What AI Never Receives</h3>
                  <ul className="text-xs text-muted">
                    <li>Zero names or family member identifiers</li>
                    <li>Zero exact ages or birth dates</li>
                    <li>Zero geographic coordinates or city names</li>
                    <li>Zero clinical diagnoses or medication specifics</li>
                    <li>Zero raw profile objects or device identifiers</li>
                    <li>Zero free-text prompt inputs from users</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. External Services */}
            <section id="third-parties" tabIndex={-1} className="aw-prose-section">
              <h2>5. Hosting Provider and External Services</h2>
              <p>
                AirWise communicates only with same-origin serverless API endpoints, which proxy to
                verified upstream services:
              </p>
              <ul>
                <li>
                  <strong>Hosting &amp; Compute:</strong> Hosted on{' '}
                  <a
                    href="https://vercel.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aw-inline-link"
                  >
                    Vercel
                  </a>
                  , providing static delivery and stateless serverless functions.
                </li>
                <li>
                  <strong>Weather &amp; Air Quality Data:</strong> Provided by Open-Meteo under open
                  access terms and Copernicus Atmosphere Monitoring Service (CAMS) information.
                </li>
                <li>
                  <strong>AI Reasoning Overlay:</strong> Powered by{' '}
                  <a
                    href="https://ai.google.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aw-inline-link"
                  >
                    Google Gemini
                  </a>{' '}
                  via secure server-side API keys.
                </li>
              </ul>
            </section>

            {/* 6. Cookies & Tracking */}
            <section id="cookies-tracking" tabIndex={-1} className="aw-prose-section">
              <h2>6. Zero Cookies and Tracking</h2>
              <p>
                AirWise contains no tracking infrastructure:
              </p>
              <ul>
                <li>Zero HTTP cookies are set, read, or requested.</li>
                <li>Zero third-party analytics SDKs or tracking pixels are included.</li>
                <li>Zero advertising networks or user profiling engines are connected.</li>
                <li>Zero cross-site trackers or session replay tools exist in our code.</li>
              </ul>
            </section>

            {/* 7. Retention & Logs */}
            <section id="retention-logs" tabIndex={-1} className="aw-prose-section">
              <h2>7. Data Retention, Hosting Logs &amp; Rate Limits</h2>
              <p>
                Serverless API endpoints are completely stateless. We operate no databases, user
                tables, or persistent cache stores.
              </p>
              <p>
                Server logs generated by the hosting infrastructure record basic HTTP request
                status, response duration, and timestamp. Request bodies and coordinates are
                never written to operational logs.
              </p>
              <p>
                In-memory rate limiting is applied on serverless instances (6 to 20 calls per
                minute per IP) to prevent service exhaustion. Rate limit counters reside solely
                in volatile memory and expire automatically.
              </p>
            </section>

            {/* 8. Children’s Privacy */}
            <section id="children-privacy" tabIndex={-1} className="aw-prose-section">
              <h2>8. Children and Household Profiles</h2>
              <p>
                AirWise is designed for household use by adults and caregivers. We collect no
                names, school names, exact birth dates, or identifiers of minors.
              </p>
              <p>
                Children are identified solely by coarse developmental categories (e.g. &ldquo;Under
                5 years&rdquo; or &ldquo;5–12 years&rdquo;) so the safety engine can enforce mandatory
                pediatric rules, such as prohibiting respirators for children under five and
                recommending indoor play during severe smog.
              </p>
            </section>

            {/* 9. Export & Deletion */}
            <section id="user-controls" tabIndex={-1} className="aw-prose-section">
              <h2>9. Your Controls: Export, Delete-All &amp; AI-Off</h2>
              <p>
                You maintain complete authority over your information:
              </p>
              <ul>
                <li>
                  <strong>Export My Data:</strong> You can download a complete JSON backup of your
                  profile at any time from the Menu.
                </li>
                <li>
                  <strong>Delete All Data:</strong> Clicking &ldquo;Delete all data&rdquo; in the Menu
                  instantly wipes every <code>airwise_</code> key from your browser storage and resets
                  the application. Because no server-side copy exists, this deletion is absolute.
                </li>
                <li>
                  <strong>AI Toggle:</strong> AI personalization is disabled by default. If enabled,
                  you can switch it off at any time in the Menu to return to 100% deterministic
                  rule processing.
                </li>
              </ul>
            </section>

            {/* 10. Security Headers */}
            <section id="security-headers" tabIndex={-1} className="aw-prose-section">
              <h2>10. HTTPS, Security Headers &amp; Secrets Protection</h2>
              <p>
                All communications use modern TLS (HTTPS) with Strict-Transport-Security (HSTS).
                Our production deployment enforces a strict Content Security Policy (CSP):
              </p>
              <pre className="aw-code-block">
                <code>
                  default-src &apos;self&apos;; script-src &apos;self&apos;; connect-src &apos;self&apos;; frame-ancestors &apos;none&apos;;
                </code>
              </pre>
              <p>
                Upstream API keys (such as Google Gemini) are stored strictly as server-side
                environment variables and never leak into client-side JavaScript bundles.
              </p>
            </section>

            {/* 11. Updates & Contact */}
            <section id="contact-updates" tabIndex={-1} className="aw-prose-section">
              <h2>11. Policy Changes &amp; Contact Information</h2>
              <p>
                If this privacy policy is updated, the last modified date will be reflected at the
                top of this page. For any questions regarding privacy or data handling, contact:
              </p>
              <p>
                <strong>Maintainer:</strong> AMBATI JAGADISWAR REDDY<br />
                <strong>Email:</strong>{' '}
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

export default PrivacyScreen;
