import {
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_SCENARIO,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_MANUAL_SEVERE_MODE,
  STORAGE_KEY_COMMUNITY_PLEDGE,
  STORAGE_PREFIX_AIR_CACHE,
} from '../state/keys';
import { CONTACT_EMAIL } from '../config/site';
import { type LegalSection } from './types';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    heading: '1. What AirWise Does',
    tocLabel: '1. What AirWise Does',
    paragraphs: [
      'AirWise provides actionable, household-specific clean-air recommendations during urban smog and winter pollution. Because indoor air and household vulnerabilities differ across families, recommendations are customized using your home equipment, cooking setup, and family routine.',
      'Crucially, AirWise operates without requiring any user registration, passwords, emails, or backend user accounts. Everything you configure remains under your exclusive local control.',
    ],
  },
  {
    id: 'storage-keys',
    heading: '2. What Stays on Your Device (Local Storage Keys)',
    tocLabel: '2. What Stays On-Device',
    paragraphs: [
      'All user data is stored strictly in your browser’s LocalStorage using the standardized airwise_ namespace prefix. Here is an exact accounting of every storage key used:',
    ],
    lists: [
      {
        className: 'aw-storage-key-list',
        items: [
          {
            key: STORAGE_KEY_PROFILE,
            text: ': Stores your household configuration, including age groups, general sensitivity flags, equipment booleans (purifier, window AC, exhaust), cooking fuel, home heating type, travel distance, and clock times for waking, leaving, and sleeping. This never leaves your device.',
          },
          {
            key: STORAGE_KEY_SCENARIO,
            text: ': Remembers the active air quality scenario selected in the Demo switcher (live, clear, moderate, severe, or stale).',
          },
          {
            key: STORAGE_KEY_SETTINGS,
            text: ': Saves application preferences, including color theme (system, light, or dark), the animated sky background toggle, and whether optional AI personalization is enabled.',
          },
          {
            key: STORAGE_KEY_MANUAL_SEVERE_MODE,
            text: ': Records whether you have manually activated Severe Smog Mode to preview emergency procedures.',
          },
          {
            key: STORAGE_KEY_COMMUNITY_PLEDGE,
            text: ': A local boolean flag indicating whether your household has pledged not to burn waste or leaves.',
          },
          {
            key: `${STORAGE_PREFIX_AIR_CACHE}*`,
            text: `: Temporary caches of hourly air quality data keyed by rounded coordinates (e.g. ${STORAGE_PREFIX_AIR_CACHE}17.38_78.48). Cached data expires after 15 minutes and ensures smooth offline fallback without repeated network queries.`,
          },
        ],
      },
    ],
  },
  {
    id: 'data-in-transit',
    heading: '3. What Leaves Your Device',
    tocLabel: '3. What Leaves Your Device',
    paragraphs: [
      'To provide timely air guidance, AirWise only transmits the minimal technical data required to fetch forecasts:',
    ],
    lists: [
      {
        items: [
          {
            strong: 'Rounded Coordinates (~1.1 km):',
            text: ' If you select current location, your latitude and longitude are immediately truncated to two decimal places (for example, 17.38, 78.48) before sending to /api/air. Precise GPS coordinates are discarded immediately on device.',
          },
          {
            strong: 'Place-Name Searches:',
            text: ' When searching for a city in onboarding, the query text (trimmed up to 60 characters) is sent to /api/geocode.',
          },
          {
            strong: 'Anonymised AI Payload (Only when AI is Enabled):',
            text: ' If you opt-in to AI personalization, an abstract payload of approved action IDs and routine slot hours is transmitted to /api/plan.',
          },
        ],
      },
    ],
  },
  {
    id: 'ai-boundaries',
    heading: '4. What Google Gemini Receives and Does Not Receive',
    tocLabel: '4. AI Data Minimisation',
    paragraphs: [
      'When AI personalization is turned on, the request payload is rigorously minimized:',
    ],
    comparisonGrid: {
      leftTitle: 'What AI Receives',
      leftItems: [
        'Coarse age band labels (e.g. “Child, 5–12”)',
        'General sensitivity category (respiratory, other, none)',
        'Equipment flags (purifier: true/false, AC: true/false)',
        'Budget tier and heating type',
        'Routine time slot labels (e.g. “Morning Commute”)',
        'Calculated risk levels and approved action IDs',
      ],
      rightTitle: 'What AI Never Receives',
      rightItems: [
        'Zero names or family member identifiers',
        'Zero exact ages or birth dates',
        'Zero geographic coordinates or city names',
        'Zero clinical diagnoses or medication specifics',
        'Zero raw profile objects or device identifiers',
        'Zero free-text prompt inputs from users',
      ],
    },
  },
  {
    id: 'third-parties',
    heading: '5. Hosting Provider and External Services',
    tocLabel: '5. External Services',
    paragraphs: [
      'AirWise communicates only with same-origin serverless API endpoints, which proxy to verified upstream services:',
    ],
    lists: [
      {
        items: [
          {
            strong: 'Hosting & Compute:',
            text: ' Hosted on Vercel, providing static delivery and stateless serverless functions.',
            link: { href: 'https://vercel.com/', text: 'Vercel' },
          },
          {
            strong: 'Weather & Air Quality Data:',
            text: ' Provided by Open-Meteo under open access terms and Copernicus Atmosphere Monitoring Service (CAMS) information.',
          },
          {
            strong: 'AI Reasoning Overlay:',
            text: ' Powered by Google Gemini via secure server-side API keys.',
            link: { href: 'https://ai.google.dev/', text: 'Google Gemini' },
          },
        ],
      },
    ],
  },
  {
    id: 'cookies-tracking',
    heading: '6. Zero Cookies and Tracking',
    tocLabel: '6. Cookies & Tracking',
    paragraphs: ['AirWise contains no tracking infrastructure:'],
    lists: [
      {
        items: [
          { text: 'Zero HTTP cookies are set, read, or requested.' },
          { text: 'Zero third-party analytics SDKs or tracking pixels are included.' },
          { text: 'Zero advertising networks or user profiling engines are connected.' },
          { text: 'Zero cross-site trackers or session replay tools exist in our code.' },
        ],
      },
    ],
  },
  {
    id: 'retention-logs',
    heading: '7. Data Retention, Hosting Logs & Rate Limits',
    tocLabel: '7. Retention & Logs',
    paragraphs: [
      'Serverless API endpoints are completely stateless. We operate no databases, user tables, or persistent cache stores.',
      'Server logs generated by the hosting infrastructure record basic HTTP request status, response duration, and timestamp. Request bodies and coordinates are never written to operational logs.',
      'In-memory rate limiting is applied on serverless instances (6 to 20 calls per minute per IP) to prevent service exhaustion. Rate limit counters reside solely in volatile memory and expire automatically.',
    ],
  },
  {
    id: 'children-privacy',
    heading: '8. Children and Household Profiles',
    tocLabel: '8. Children’s Privacy',
    paragraphs: [
      'AirWise is designed for household use by adults and caregivers. We collect no names, school names, exact birth dates, or identifiers of minors.',
      'Children are identified solely by coarse developmental categories (e.g. “Under 5 years” or “5–12 years”) so the safety engine can enforce mandatory pediatric rules, such as prohibiting respirators for children under five and recommending indoor play during severe smog.',
    ],
  },
  {
    id: 'user-controls',
    heading: '9. Your Controls: Export, Delete-All & AI-Off',
    tocLabel: '9. Export & Deletion',
    paragraphs: ['You maintain complete authority over your information:'],
    lists: [
      {
        items: [
          {
            strong: 'Export My Data:',
            text: ' You can download a complete JSON backup of your profile at any time from the Menu.',
          },
          {
            strong: 'Delete All Data:',
            text: ' Clicking “Delete all data” in the Menu instantly wipes every airwise_ key from your browser storage and resets the application. Because no server-side copy exists, this deletion is absolute.',
            code: 'airwise_',
          },
          {
            strong: 'AI Toggle:',
            text: ' AI personalization is disabled by default. If enabled, you can switch it off at any time in the Menu to return to 100% deterministic rule processing.',
          },
        ],
      },
    ],
  },
  {
    id: 'security-headers',
    heading: '10. HTTPS, Security Headers & Secrets Protection',
    tocLabel: '10. Security Headers',
    paragraphs: [
      'All communications use modern TLS (HTTPS) with Strict-Transport-Security (HSTS). Our production deployment enforces a strict Content Security Policy (CSP):',
      'Upstream API keys (such as Google Gemini) are stored strictly as server-side environment variables and never leak into client-side JavaScript bundles.',
    ],
    codeBlock:
      "default-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none';",
  },
  {
    id: 'contact-updates',
    heading: '11. Policy Changes & Contact Information',
    tocLabel: '11. Updates & Contact',
    paragraphs: [
      'If this privacy policy is updated, the last modified date will be reflected at the top of this page. For any questions regarding privacy or data handling, contact:',
    ],
    contact: {
      maintainer: 'AMBATI JAGADISWAR REDDY',
      email: CONTACT_EMAIL,
    },
  },
];
