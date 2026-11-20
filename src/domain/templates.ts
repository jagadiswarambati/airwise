/**
 * Plain-language templates for all Action Catalog entries (IN-01..IN-10, PE-01..PE-04, MO-01..MO-07, CM-01..CM-04)
 * Strict public-health compliance:
 * - Grade 6–8 readability
 * - No medical diagnoses, dosing, or cures
 * - Verbatim safety disclaimers for PE-04, P-13, and P-22
 */

export interface ActionCopy {
  title: string;
  shortWhy: string;
  fullDescription: string;
  doesNotChange: string;
  assumptions: string[];
  fixedDisclaimer?: string;
}

export const ACTION_TEMPLATES: Record<string, ActionCopy> = {
  // --------------------------------------------------------------------------
  // Indoor Actions (IN-01 to IN-10)
  // --------------------------------------------------------------------------
  'IN-01': {
    title: 'Keep windows and doors closed',
    shortWhy: 'Prevents heavy outdoor particulate pollution from infiltrating living spaces.',
    fullDescription:
      'Keep exterior windows and balcony doors shut during elevated outdoor pollution. Use door snakes or rolled towels at the base of exterior doors to reduce drafts.',
    doesNotChange: 'Does not reduce indoor emissions from cooking or cleaning.',
    assumptions: ['Outdoor PM2.5 concentration is significantly higher than baseline indoor air.'],
  },
  'IN-02': {
    title: 'Brief ventilation in the cleanest window',
    shortWhy: 'Refreshes indoor air when outdoor conditions are temporarily cleaner.',
    fullDescription:
      'Open windows for 15 to 20 minutes during the cleanest forecast window to flush stale indoor air and moisture without accumulating heavy pollution.',
    doesNotChange: 'Does not protect during later peak outdoor pollution hours.',
    assumptions: ['Forecasted clean window materializes with low local traffic.'],
  },
  'IN-03': {
    title: 'Set up one cleaner room',
    shortWhy: 'Concentrates clean air protection in the bedroom of the most vulnerable family member.',
    fullDescription:
      'Choose a well-sealed room (such as a bedroom) with few exterior openings. Keep its door closed and direct any available air cleaning or damp wiping here.',
    doesNotChange: 'Does not clean air in other rooms or common corridors.',
    assumptions: ['Household has at least one room that can be closed off.'],
  },
  'IN-04': {
    title: 'Seal window and door gaps',
    shortWhy: 'Blocks dust and particulate infiltration through unsealed gaps and frame cracks.',
    fullDescription:
      'Place rolled towels or adhesive weather strips along door bottoms and loose window frames. This rented-friendly measure reduces outdoor air seepage.',
    doesNotChange: 'Does not clean air already inside the home.',
    assumptions: ['Home does not use unvented combustion heating or biomass fires.'],
  },
  'IN-05': {
    title: 'Run purifier in closed room',
    shortWhy: 'Circulates and filters airborne particles continuously in your main living space.',
    fullDescription:
      'Operate your air purifier with windows shut. Place it at least 30 cm away from walls and keep intake grills unobstructed. Check pre-filter monthly.',
    doesNotChange: 'Does not eliminate outdoor pollution or replace ventilation when air is clean.',
    assumptions: ['Purifier has functional HEPA filter correctly sized for the room.'],
  },
  'IN-06': {
    title: 'Set AC or HVAC to recirculate',
    shortWhy: 'Cools or conditions air without drawing dirty outdoor air inside.',
    fullDescription:
      'Switch window AC units or HVAC to recirculate mode. Ensure the outdoor air damper is closed and clean the dust mesh filter weekly.',
    doesNotChange: 'Does not provide true HEPA filtration unless high-MERV filter is installed.',
    assumptions: ['AC unit allows recirculation without forced fresh-air intake.'],
  },
  'IN-07': {
    title: 'Cook with exhaust or chimney on',
    shortWhy: 'Vents high cooking fumes, oil droplets, and combustion gases outdoors.',
    fullDescription:
      'Turn on the kitchen exhaust fan or chimney before lighting burners and keep it running for 5 minutes after cooking finishes.',
    doesNotChange: 'Does not reduce outdoor pollution entering through open doors.',
    assumptions: ['Kitchen has a functioning exhaust fan or chimney ducted outside.'],
  },
  'IN-08': {
    title: 'Practice low-smoke cooking',
    shortWhy: 'Reduces indoor smoke generation when mechanical exhaust is unavailable.',
    fullDescription:
      'Use tight-fitting lids on pans, minimize high-temperature deep frying, batch cook meals, and keep children and seniors out of the kitchen while cooking.',
    doesNotChange: 'Does not eliminate all cooking moisture or fine aerosols.',
    assumptions: ['Cooking can be adapted to boiling, steaming, or lidded simmering.'],
  },
  'IN-09': {
    title: 'Eliminate indoor smoke sources',
    shortWhy: 'Stops direct indoor generation of dangerous combustion particles.',
    fullDescription:
      'Avoid burning incense, dhoop, mosquito coils, scented candles, or tobacco indoors. Use electric repellents or bed nets instead.',
    doesNotChange: 'Does not remove outdoor pollution that has already entered.',
    assumptions: ['Household members agree to suspend incense and indoor smoking.'],
  },
  'IN-10': {
    title: 'Damp-mop surfaces instead of dry sweeping',
    shortWhy: 'Captures settled dust without resuspending fine particles into the breathing zone.',
    fullDescription:
      'Use a damp microfiber cloth or mop to clean floors and tabletops. Avoid dry brooms and feather dusters that stir settled dust back into the air.',
    doesNotChange: 'Does not capture airborne particles that remain suspended.',
    assumptions: ['Water and mop or cloth are readily available.'],
  },

  // --------------------------------------------------------------------------
  // Personal & Health Protection Actions (PE-01 to PE-04)
  // --------------------------------------------------------------------------
  'PE-01': {
    title: 'Limit outdoor exposure for sensitive members',
    shortWhy: 'Reduces inhaled pollution volume during peak smog hours.',
    fullDescription:
      'Keep young children, elderly family members, and individuals with asthma or heart conditions indoors during hours with elevated pollution.',
    doesNotChange: 'Does not reduce community emission levels.',
    assumptions: ['Indoor environment can be kept relatively cleaner than outdoor air.'],
  },
  'PE-02': {
    title: 'Wear fitted respirator (N95/FFP2) for essential trips',
    shortWhy: 'Filters out at least 95% of fine airborne particulate matter when properly fitted.',
    fullDescription:
      'Wear a well-fitted N95 or FFP2 respirator covering nose and chin for unavoidable outdoor travel. Note: Children under 5 should not wear respirators due to suffocation risk.',
    doesNotChange: 'Protects the wearer; does not reduce ambient pollution emissions.',
    assumptions: ['Respirator is properly sized and forms a tight seal around the face.'],
    fixedDisclaimer:
      'Some respirators make breathing harder. Ask your clinician if you have respiratory or heart conditions.',
  },
  'PE-03': {
    title: 'Shift active exercise and play indoors',
    shortWhy: 'Heavy breathing during exertion dramatically increases lung pollutant uptake.',
    fullDescription:
      'Replace outdoor jogging, cycling, or playground activities with indoor yoga, bodyweight exercises, or indoor games away from kitchen fumes.',
    doesNotChange: 'Does not substitute for medical treatment or preventive medications.',
    assumptions: ['Adequate indoor space exists for gentle exercise.'],
  },
  'PE-04': {
    title: 'Follow clinician plan and check on vulnerable members',
    shortWhy: 'Ensures rapid response to respiratory symptoms or changing health needs.',
    fullDescription:
      'Ensure routine inhalers and prescribed medicines are accessible. Regularly check on elderly relatives and children with breathing sensitivities.',
    doesNotChange: 'Informational only; does not replace individualized medical advice.',
    assumptions: ['Prescribed clinician action plan is available.'],
    fixedDisclaimer:
      "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe.",
  },

  // --------------------------------------------------------------------------
  // Mobility Actions (MO-01 to MO-07)
  // --------------------------------------------------------------------------
  'MO-01': {
    title: 'Shift commute to cleaner forecast window',
    shortWhy: 'Avoids peak traffic and meteorological pollution concentration peaks.',
    fullDescription:
      'Adjust your travel time by 30 to 60 minutes to coincide with forecasted lower particulate levels and lighter congestion.',
    doesNotChange: 'Does not eliminate all vehicle exhaust exposure during travel.',
    assumptions: ['Work or school schedule allows flexible departure times.'],
  },
  'MO-02': {
    title: 'Use public transit for trips',
    shortWhy: 'Replaces private vehicle trips to reduce overall urban exhaust emissions.',
    fullDescription:
      'Take the metro or public bus instead of driving a personal vehicle. Wear an N95 respirator if waiting outdoors at transit stops during poor air quality.',
    doesNotChange: 'Does not prevent exposure while waiting outdoors at unshielded stops.',
    assumptions: ['Reliable public transit is accessible for the planned journey.'],
  },
  'MO-03': {
    title: 'Carpool or share rides',
    shortWhy: 'Cuts motor vehicle-kilometers travelled and direct tailpipe emissions.',
    fullDescription:
      'Coordinate with coworkers or neighbours heading along the same route to share one vehicle instead of driving separately.',
    doesNotChange: 'Does not reduce exposure inside the car unless cabin AC is on recirculate.',
    assumptions: ['Average carpool occupancy of at least 2 people per shared vehicle.'],
  },
  'MO-04': {
    title: 'Combine errands into a single trip',
    shortWhy: 'Avoids cold engine starts and reduces total distance driven.',
    fullDescription:
      'Group grocery runs, deliveries, and visits into one linked journey rather than multiple separate return trips throughout the week.',
    doesNotChange: 'Does not change the pollution level along the travel corridor.',
    assumptions: ['Errands can be postponed or grouped without major disruption.'],
  },
  'MO-05': {
    title: 'Work remotely on high-pollution days',
    shortWhy: 'Eliminates travel exposure entirely and removes commute emissions.',
    fullDescription:
      'Arrange to work from home on days when air quality reaches Caution, Protect, or Severe levels.',
    doesNotChange: 'Does not clean indoor home air.',
    assumptions: ['Employer and job responsibilities permit remote telework.'],
  },
  'MO-06': {
    title: 'Turn engine off while idling',
    shortWhy: 'Eliminates unnecessary exhaust emissions while waiting or parked.',
    fullDescription:
      'Cut vehicle engine when waiting at railway crossings, school pickup gates, or driveways for more than 30 seconds.',
    doesNotChange: 'Does not reduce emissions while the vehicle is in motion.',
    assumptions: ['Vehicle restarts safely and idling period exceeds 30 seconds.'],
  },
  'MO-07': {
    title: 'Walk or cycle for short neighborhood trips',
    shortWhy: 'Replaces motorized trips with zero-emission active travel.',
    fullDescription:
      'Walk or bicycle for trips under 2 km during daylight hours when air quality is assessed as Clear or Watch.',
    doesNotChange: 'Not suitable when outdoor air is Caution, Protect, or Severe.',
    assumptions: ['Outdoor air is clean (level 0 or 1), daylight hours, safe walkway.'],
  },

  // --------------------------------------------------------------------------
  // Community Actions (CM-01 to CM-04)
  // --------------------------------------------------------------------------
  'CM-01': {
    title: 'Adopt neighborhood no-burning pledge',
    shortWhy: 'Prevents open burning of leaves, waste, and biomass in the community.',
    fullDescription:
      'Agree with neighbors and society staff to compost garden waste and report open biomass burning to municipal authorities.',
    doesNotChange: 'Does not eliminate regional background smog blown in from outside.',
    assumptions: ['Community has organized municipal waste disposal.'],
  },
  'CM-02': {
    title: 'Coordinate building carpool board',
    shortWhy: 'Pairs neighbors traveling along similar commute routes.',
    fullDescription:
      'Join or set up a shared ride board in your apartment group to connect commuters and school runs.',
    doesNotChange: 'Requires active neighbor participation and matching schedules.',
    assumptions: ['Community members share common travel destinations.'],
  },
  'CM-03': {
    title: 'Buddy check on vulnerable neighbors',
    shortWhy: 'Supports elderly residents and young families living nearby during severe smog.',
    fullDescription:
      'Check in on seniors living alone to assist with essential grocery errands or ensure they have clean indoor spaces.',
    doesNotChange: 'Does not alter outdoor air quality.',
    assumptions: ['Communication channels exist within the housing society.'],
  },
  'CM-04': {
    title: 'Share daily clean-air briefing',
    shortWhy: 'Coordinates neighborhood precautions with a shared status report.',
    fullDescription:
      'Post today’s AirWise community summary on your apartment society or family group chat to keep everyone informed.',
    doesNotChange: 'Information sharing only; requires individuals to act on guidance.',
    assumptions: ['Messaging group or society noticeboard is available.'],
  },
};

export const COMBUSTION_SAFETY_CAVEAT =
  'Ensure adequate fresh air ventilation if using combustion heaters or biomass cooking; never seal rooms completely with unvented heaters.';

