// Seed data for immersion points.
//
// DATA INTEGRITY RULES
//  * Nothing here is presented as an official, surveyed GHMC/HYDRAA record.
//  * "SOURCE_NAMED" entries are locations that are named as immersion sites in
//    press coverage of civic arrangements (links in `sourceUrl`). The name and
//    existence come from that coverage. The COORDINATES are approximate lake
//    centres entered by the developer and must be confirmed (see README).
//  * Fields the sources do not publish (idol-size limit, allowed materials) are
//    stored as null and shown as "not published" in the app. Nothing is guessed.
//  * "DEMO_PLACEHOLDER" entries are fictional placeholders so the artificial-pond
//    flow can be demonstrated. They are NOT real facilities and are labelled as
//    such everywhere in the UI. Replace them with official data via `npm run db:import`.

const PRESS_SIASAT =
  'https://www.siasat.com/hyderabad-sees-elaborate-arrangements-for-ganesh-chaturthi-3265020/';
const PRESS_TELANGANA_TODAY =
  'https://telanganatoday.com/arrangements-in-place-for-ganesh-idol-immersion-across-hyderabad';

const named = (fields) => ({
  type: 'NATURAL_LAKE',
  maxIdolSizeFt: null,
  allowedMaterials: null,
  isArtificialPond: false,
  isActive: true,
  statusNote: 'Live status is not verified by this app. Check official advisories.',
  verification: 'SOURCE_NAMED',
  coordinateAccuracy: 'APPROXIMATE',
  ...fields,
});

export const immersionPoints = [
  named({
    id: 'imm-hussain-sagar',
    name: 'Hussain Sagar',
    latitude: 17.4239,
    longitude: 78.4738,
    area: 'Central Hyderabad',
    source: 'Named as an immersion site in press coverage of GHMC arrangements',
    sourceUrl: PRESS_SIASAT,
  }),
  named({
    id: 'imm-saroor-nagar',
    name: 'Saroor Nagar Lake',
    latitude: 17.3547,
    longitude: 78.5236,
    area: 'Saroornagar',
    source: 'Named as an immersion site in press coverage of GHMC arrangements',
    sourceUrl: PRESS_SIASAT,
  }),
  named({
    id: 'imm-safilguda',
    name: 'Safilguda Lake',
    latitude: 17.4666,
    longitude: 78.534,
    area: 'Safilguda, Malkajgiri',
    source: 'Named as an immersion site in press coverage of GHMC arrangements',
    sourceUrl: PRESS_SIASAT,
  }),
  named({
    id: 'imm-idl-lake',
    name: 'IDL Lake',
    latitude: 17.4713,
    longitude: 78.408,
    area: 'Kukatpally',
    source: 'Named as an immersion site in press coverage of GHMC arrangements',
    sourceUrl: PRESS_SIASAT,
  }),
  named({
    id: 'imm-sunnam-cheruvu',
    name: 'Sunnam Cheruvu',
    latitude: 17.4393,
    longitude: 78.384,
    area: 'Madhapur',
    source: 'Named as an immersion site in press coverage of GHMC arrangements',
    sourceUrl: PRESS_SIASAT,
  }),
  named({
    id: 'imm-shamirpet',
    name: 'Shamirpet Lake',
    latitude: 17.594,
    longitude: 78.574,
    area: 'Shamirpet',
    source: 'Named as a major immersion site in press coverage',
    sourceUrl: PRESS_TELANGANA_TODAY,
  }),
  named({
    id: 'imm-edulabad',
    name: 'Edulabad Lake',
    latitude: 17.453,
    longitude: 78.693,
    area: 'Edulabad, Ghatkesar',
    source: 'Named as a major immersion site in press coverage',
    sourceUrl: PRESS_TELANGANA_TODAY,
  }),

  // ---- DEMO PLACEHOLDERS (fictional, clearly labelled) ------------------
  {
    id: 'demo-artificial-pond-1',
    name: 'Demo artificial pond A (placeholder)',
    latitude: 17.4325,
    longitude: 78.4551,
    type: 'ARTIFICIAL_POND',
    area: 'Placeholder near central Hyderabad',
    maxIdolSizeFt: 4,
    allowedMaterials: ['CLAY', 'PLASTER_OF_PARIS'],
    isArtificialPond: true,
    isActive: true,
    source: 'Prototype placeholder. Not a real facility.',
    sourceUrl: '',
    statusNote: 'Fictional placeholder used to demonstrate the artificial-pond flow.',
    verification: 'DEMO_PLACEHOLDER',
    coordinateAccuracy: 'NOT_APPLICABLE',
  },
  {
    id: 'demo-artificial-pond-2',
    name: 'Demo artificial pond B (placeholder)',
    latitude: 17.4062,
    longitude: 78.5407,
    type: 'ARTIFICIAL_POND',
    area: 'Placeholder near eastern Hyderabad',
    maxIdolSizeFt: 5,
    allowedMaterials: ['CLAY', 'PLASTER_OF_PARIS'],
    isArtificialPond: true,
    isActive: true,
    source: 'Prototype placeholder. Not a real facility.',
    sourceUrl: '',
    statusNote: 'Fictional placeholder used to demonstrate the artificial-pond flow.',
    verification: 'DEMO_PLACEHOLDER',
    coordinateAccuracy: 'NOT_APPLICABLE',
  },
  {
    id: 'demo-artificial-pond-3',
    name: 'Demo artificial pond C (placeholder)',
    latitude: 17.4859,
    longitude: 78.3992,
    type: 'ARTIFICIAL_POND',
    area: 'Placeholder near north-west Hyderabad',
    maxIdolSizeFt: 4,
    allowedMaterials: ['CLAY', 'PLASTER_OF_PARIS'],
    isArtificialPond: true,
    isActive: true,
    source: 'Prototype placeholder. Not a real facility.',
    sourceUrl: '',
    statusNote: 'Fictional placeholder used to demonstrate the artificial-pond flow.',
    verification: 'DEMO_PLACEHOLDER',
    coordinateAccuracy: 'NOT_APPLICABLE',
  },
];
