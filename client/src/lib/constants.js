export const HYDERABAD_CENTER = [17.385, 78.4867];
export const DEFAULT_ZOOM = 11;

export const MATERIALS = [
  { value: 'CLAY', label: 'Clay' },
  { value: 'PLASTER_OF_PARIS', label: 'Plaster of Paris' },
  { value: 'UNKNOWN', label: 'Not sure' },
];

export const MATERIAL_LABEL = Object.fromEntries(MATERIALS.map((m) => [m.value, m.label]));

// Approximate area centres, used only when the browser cannot provide a GPS location.
export const FALLBACK_AREAS = [
  { label: 'Charminar', lat: 17.3616, lng: 78.4747 },
  { label: 'Secunderabad', lat: 17.4337, lng: 78.5019 },
  { label: 'Ameerpet', lat: 17.4375, lng: 78.4483 },
  { label: 'Banjara Hills', lat: 17.4156, lng: 78.4347 },
  { label: 'Mehdipatnam', lat: 17.395, lng: 78.44 },
  { label: 'Hitec City', lat: 17.4435, lng: 78.3772 },
  { label: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
  { label: 'Kukatpally', lat: 17.4948, lng: 78.3996 },
  { label: 'Dilsukhnagar', lat: 17.3688, lng: 78.5247 },
  { label: 'LB Nagar', lat: 17.3457, lng: 78.5522 },
  { label: 'Uppal', lat: 17.4058, lng: 78.5591 },
];

export const DISTANCE_OPTIONS = [
  { value: '', label: 'Any distance' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
];

export const VERIFICATION = {
  OFFICIAL_IMPORT: { label: 'Official data', tone: 'badge-green' },
  SOURCE_NAMED: { label: 'Named in press report', tone: 'badge-yellow' },
  DEMO_PLACEHOLDER: { label: 'Demo placeholder', tone: 'badge-red' },
};
