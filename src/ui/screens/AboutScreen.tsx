import React from 'react';
import { Prose } from '../components/Prose';
import { FeatureRow, FeatureItem } from '../components/FeatureRow';
import { StepList, StepItem } from '../components/StepList';
import { AudienceList, AudienceItem } from '../components/AudienceList';
import { SiteAtmosphere } from '../components/SiteAtmosphere';
import { navigate } from '../../state/route';
import { loadPriyaPreset } from '../../state/profileStore';
import { setScenario } from '../../state/scenarioStore';

interface AboutScreenProps {
  onStartOnboarding?: () => void;
  onLoadPriya?: () => void;
}

const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'Your Household Profile',
    description:
      'Enter basic home details: who lives with you (age bands), cooking and heating methods, available equipment, and daily routine hours. No personal names or accounts are ever requested; your answers stay stored on this device.',
  },
  {
    number: 2,
    title: 'Forecast & Safety Rules',
    description:
      'We fetch regional hourly air quality and weather forecasts from Open-Meteo. Our deterministic rule engine evaluates 22 public-health safety invariants to approve only actions suitable for your household and today’s air.',
  },
  {
    number: 3,
    title: 'Ranked Plan & Confidence',
    description:
      'You receive one prioritized daily Clean-Air Plan. Every action displays an honest confidence rating, clear assumptions, and explicit notes explaining what the action does and does not change.',
  },
];

const WHAT_YOU_GET_FEATURES: FeatureItem[] = [
  {
    icon: 'protect',
    title: "Today's Clean-Air Plan",
    description:
      'Three clear, practical actions to take today, tailored to your home budget and equipment with zero commercial product pushes.',
  },
  {
    icon: 'watch',
    title: 'Highest-Exposure Moment',
    description:
      'Pinpoints the peak pollution window during your routine (such as early morning school runs or evening commutes) so you can prepare.',
  },
  {
    icon: 'home',
    title: 'Cleaner Home Guidance',
    description:
      'Step-by-step indoor source control: smart ventilation windows, cooking exhaust advice, and setting up a cleaner-room sanctuary.',
  },
  {
    icon: 'car',
    title: 'Travel Timing & Route Choices',
    description:
      'Actionable commute scheduling and walk suitability checks that protect sensitive family members from high-pollution outdoor waiting.',
  },
  {
    icon: 'chart',
    title: 'Dual-Axis Impact & Community',
    description:
      'Honest separation of personal exposure reduction from citywide emissions savings, alongside a shareable neighborhood briefing.',
  },
];

const WHO_IT_HELPS: AudienceItem[] = [
  {
    title: 'Families with Children',
    description:
      'Helps parents decide when it is safe for kids to play outdoors, how to protect the morning school commute, and how to keep bedrooms clean.',
    focusPoint: 'Safer school runs & clean sleeping spaces',
  },
  {
    title: 'Older Adults & Caregivers',
    description:
      'Provides cautious guidance on walking, morning routines, and checking on vulnerable elders during emergency temperature inversions.',
    focusPoint: 'Capped physical exertion during peak smog',
  },
  {
    title: 'People with Respiratory Sensitivities',
    description:
      'Offers proactive routine adjustments for asthma or allergy sensitivities. Always informational, keeping clinical plans primary.',
    focusPoint: 'Avoiding outdoor exposure spikes',
  },
  {
    title: 'Outdoor & Transit Commuters',
    description:
      'Assists daily travelers in identifying cleaner commute windows, carpool opportunities, and appropriate respirator usage.',
    focusPoint: 'Commute exposure minimization',
  },
  {
    title: 'Housing Societies & Neighborhoods',
    description:
      'Supplies apartment complexes and resident welfare groups with a daily briefing and shared pledge coordination to stop waste burning.',
    focusPoint: 'Collective coordination & community pledges',
  },
];

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onStartOnboarding,
  onLoadPriya,
}) => {
  const handleStartOnboarding = () => {
    if (onStartOnboarding) {
      onStartOnboarding();
    } else {
      navigate('today');
    }
  };

  const handleTryDemo = () => {
    if (onLoadPriya) {
      onLoadPriya();
    } else {
      loadPriyaPreset();
      setScenario('severe');
      navigate('today');
    }
  };

  const renderCtaBlock = () => (
    <div className="aw-about-cta-card card">
      <div className="aw-btn-row aw-about-btn-row">
        <button
          type="button"
          className="aw-btn aw-btn-primary aw-btn-cta"
          onClick={handleStartOnboarding}
        >
          <span>Set up my household</span>
          <span className="text-xs opacity-80">(Takes 2 minutes)</span>
        </button>
        <button
          type="button"
          className="aw-btn aw-btn-secondary aw-btn-cta"
          onClick={handleTryDemo}
        >
          <span>Try a demo household</span>
          <span className="text-xs opacity-80">(Instant preview)</span>
        </button>
      </div>

      <div className="aw-about-cta-microcopy">
        <p className="aw-about-privacy-note">
          No account. Your details stay on this device.
        </p>
        <p className="aw-about-terms-consent">
          By continuing you agree to the{' '}
          <a
            href="#/terms"
            className="aw-inline-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('terms');
            }}
          >
            Terms
          </a>{' '}
          and have read the{' '}
          <a
            href="#/privacy"
            className="aw-inline-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('privacy');
            }}
          >
            Privacy policy
          </a>
          .
        </p>
      </div>
    </div>
  );

  return (
    <div className="aw-screen aw-screen-about">
      {/* Decorative Atmosphere Illustration */}
      <SiteAtmosphere />

      {/* Main Single H1 Landmark */}
      <header className="aw-page-header">
        <h1 tabIndex={-1} className="aw-page-title">
          Clean-air advice for your household, every morning.
        </h1>
        <p className="aw-page-description">
          AirWise converts urban air forecasts and your daily living reality into one
          honest, prioritized clean-air plan. No accounts, no medical claims, and no
          invented numbers.
        </p>
      </header>

      {/* Top CTA Row */}
      {renderCtaBlock()}

      <Prose>
        {/* Section 1: Why this exists */}
        <section id="why-this-exists" className="aw-prose-section">
          <h2>Why this exists</h2>
          <p>
            Millions of families check an Air Quality Index (AQI) number each winter morning,
            yet numbers alone do not answer daily household questions. A mother asks:
            <em>Should my child walk to school today? Should I open the bedroom windows?
            I cannot afford an expensive air purifier—what can I do instead?</em>
          </p>
          <p>
            Standard weather apps stop at a single citywide number. Generic chat assistants often
            hallucinate safety claims or invent medical percentages. AirWise was built to bridge
            that gap. It combines real physical science, deterministic safety rules, and your
            household’s budget to give clear, protective guidance in thirty seconds.
          </p>
        </section>

        {/* Section 2: How it works */}
        <section id="how-it-works" className="aw-prose-section">
          <h2>How it works</h2>
          <p>
            AirWise follows three straightforward steps to deliver transparent recommendations:
          </p>
          <StepList steps={HOW_IT_WORKS_STEPS} />
        </section>

        {/* Section 3: What you get */}
        <section id="what-you-get" className="aw-prose-section">
          <h2>What you get</h2>
          <p>
            Every morning AirWise summarizes what matters most for your family across five
            practical modules:
          </p>
          <FeatureRow features={WHAT_YOU_GET_FEATURES} />
        </section>

        {/* Section 4: Who it helps */}
        <section id="who-it-helps" className="aw-prose-section">
          <h2>Who it helps</h2>
          <p>
            AirWise is designed for real households managing urban pollution with differing
            sensitivities, budgets, and constraints:
          </p>
          <AudienceList audiences={WHO_IT_HELPS} />
        </section>

        {/* Section 5: How we keep it honest */}
        <section id="how-we-keep-it-honest" className="aw-prose-section">
          <h2>How we keep it honest</h2>
          <p>
            Safety and credibility are our highest commitments. We adhere to six foundational
            rules:
          </p>
          <ul className="aw-honest-principles-list">
            <li>
              <strong>Rules decide safety:</strong> All safety constraints, eligibility checks,
              and rankings are written in pure TypeScript code. An AI model never makes safety
              decisions or grants policy exceptions.
            </li>
            <li>
              <strong>Gemini only handles approved actions:</strong> When AI personalization is
              turned on, Google Gemini is strictly constrained to reordering and explaining
              candidate actions already approved by the rule engine.
            </li>
            <li>
              <strong>Validator fallback:</strong> Every model response must pass a strict schema
              and number allow-list check. If any check fails, the app instantly falls back to the
              deterministic standard plan.
            </li>
            <li>
              <strong>Modelled data transparency:</strong> Weather and air quality data from
              Open-Meteo is clearly labeled as modelled. We never claim localized street-level
              sensor readings that do not exist.
            </li>
            <li>
              <strong>Stale-data confidence:</strong> When live data feeds are delayed or
              unavailable, AirWise automatically lowers plan confidence and cautiously suppresses
              outdoor walk and ventilation advice.
            </li>
            <li>
              <strong>Separate exposure and emissions:</strong> We never conflate personal
              protection with emissions reduction. Wearing a mask lowers your inhaled dose but
              does not clean the city; carpooling reduces emissions but does not alter outdoor air
              outside your window today.
            </li>
          </ul>
        </section>
      </Prose>

      {/* Bottom Repeated CTA Block */}
      <section className="aw-about-bottom-cta mt-6">
        {renderCtaBlock()}
      </section>
    </div>
  );
};

export default AboutScreen;
