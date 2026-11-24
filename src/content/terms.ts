import {
  OWNER_NAME,
  CONTACT_EMAIL,
  TERMS_JURISDICTION,
  OPEN_METEO_ATTRIBUTION,
  EMERGENCY_NOTICE,
} from '../config/site';
import { type LegalSection } from './types';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'medical-boundary',
    heading: '1. Informational Purpose Only — Not Medical Advice',
    tocLabel: '1. Not Medical Advice',
    banner: {
      type: 'warning',
      text: EMERGENCY_NOTICE,
    },
    paragraphs: [
      'AirWise provides informational household guidance regarding air pollution, ventilation, routine scheduling, and personal exposure reduction. It is not a medical device and does not provide clinical diagnosis, medical care, symptom treatment, or pharmaceutical prescriptions.',
      'Household members with pre-existing conditions—including asthma, chronic obstructive pulmonary disease (COPD), cardiovascular disease, or pregnancy—must continue following the explicit management plan established with their personal healthcare provider. Never disregard or delay professional clinical guidance because of information presented in this application.',
    ],
  },
  {
    id: 'forecast-nature',
    heading: '2. Modelled Weather & Air Quality Forecasts',
    tocLabel: '2. Modelled Forecasts',
    paragraphs: [
      'Air quality estimates, hourly PM2.5 concentrations, and weather metrics are derived from numerical atmospheric models provided by Open-Meteo and Copernicus Atmosphere Monitoring Service (CAMS).',
      'Atmospheric models operate across regional grid cells (typically 11 to 25 kilometers wide) and represent simulated regional averages. They cannot detect hyper-local street-level pollution spikes, localized garbage burning, or indoor microclimates. Air forecasts may be delayed, incomplete, or inaccurate due to atmospheric changes or upstream data outages.',
    ],
  },
  {
    id: 'demo-data-nature',
    heading: '3. Demo Scenarios & Simulated Community Data',
    tocLabel: '3. Demo Scenarios',
    paragraphs: [
      'AirWise includes evaluation presets and demonstration scenarios (such as Clear, Moderate, Severe Smog, and Stale data) alongside a simulated residential society (Green Meadows Apartments).',
      'All figures, pledges, and community tallies associated with demo scenarios are synthetic simulations designed to illustrate system behavior across diverse pollution states. They do not reflect live sensor readings or active neighborhood pledge registries.',
    ],
  },
  {
    id: 'acceptable-use',
    heading: '4. Acceptable Use Policy',
    tocLabel: '4. Acceptable Use',
    paragraphs: [
      'By accessing AirWise, you agree to use the application solely for lawful, personal, or community informational purposes. You agree not to:',
    ],
    lists: [
      {
        items: [
          {
            text: 'Deploy automated scripts, bots, spiders, or scrapers against application interfaces or underlying serverless endpoints.',
          },
          {
            text: 'Attempt to bypass, defeat, or manipulate API rate limits, request validation schemas, or server-side security controls.',
          },
          {
            text: 'Interfere with or disrupt serverless hosting infrastructure, network integrity, or service availability.',
          },
          {
            text: 'Rely on AirWise as an emergency alert system or life-critical monitoring system.',
          },
        ],
      },
    ],
  },
  {
    id: 'liability-limits',
    heading: '5. Warranty Disclaimer & Limitation of Liability',
    tocLabel: '5. Liability & Warranty',
    paragraphs: [
      'AirWise is provided “as is” and “as available”, without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, uninterrupted availability, or data accuracy.',
      'To the maximum extent permitted by applicable law, in no event shall the author, contributors, or project maintainer be held liable for any claim, injury, loss, or direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of, or inability to use, this application or its informational suggestions.',
    ],
  },
  {
    id: 'attributions-license',
    heading: '6. Data Attribution & Source Code License',
    tocLabel: '6. Attribution & License',
    paragraphs: [
      'Air quality and meteorological information is attributed in accordance with upstream provider licensing:',
    ],
    quote: OPEN_METEO_ATTRIBUTION,
    lists: [
      {
        items: [
          {
            text: 'Data is utilized under the terms of Creative Commons Attribution 4.0 International (CC BY 4.0).',
          },
          {
            strong: 'Source code licence:',
            text: ' MIT.',
          },
        ],
      },
    ],
  },
  {
    id: 'governing-law',
    heading: '7. Governing Law & Jurisdiction',
    tocLabel: '7. Governing Law',
    paragraphs: [
      `These terms shall be governed by and construed in accordance with the laws of ${TERMS_JURISDICTION}, without regard to its conflict of law provisions. Any dispute arising under or in connection with these terms shall be subject to the jurisdiction of competent courts in that territory.`,
    ],
  },
  {
    id: 'contact-changes',
    heading: '8. Contact & Modifications',
    tocLabel: '8. Contact & Changes',
    paragraphs: [
      'We reserve the right to revise these terms to reflect technical, regulatory, or architectural updates. Your continued use of the application following any revisions constitutes acceptance of the amended terms.',
    ],
    contact: {
      maintainer: OWNER_NAME,
      email: CONTACT_EMAIL,
    },
  },
];
