// Seed data for flower / organic-waste collection points.
//
// No public source consulted for this prototype lists named flower-collection
// points, so every entry here is a DEMO_PLACEHOLDER (fictional location) used to
// demonstrate the flow. They are labelled as placeholders in the UI. Load real
// collection points from your municipal corporation with `npm run db:import`.

const demo = (fields) => ({
  type: 'FLOWER_COLLECTION',
  acceptedWaste: ['FLOWERS', 'LEAVES', 'DECORATIONS_ORGANIC'],
  isActive: true,
  source: 'Prototype placeholder. Not a real collection point.',
  sourceUrl: '',
  statusNote: 'Fictional placeholder used to demonstrate the flower-disposal flow.',
  verification: 'DEMO_PLACEHOLDER',
  coordinateAccuracy: 'NOT_APPLICABLE',
  ...fields,
});

export const flowerPoints = [
  demo({
    id: 'demo-flower-1',
    name: 'Demo flower drop-off A (placeholder)',
    latitude: 17.4262,
    longitude: 78.4689,
    area: 'Placeholder near Hussain Sagar',
  }),
  demo({
    id: 'demo-flower-2',
    name: 'Demo flower drop-off B (placeholder)',
    latitude: 17.3631,
    longitude: 78.5188,
    area: 'Placeholder near Saroornagar',
  }),
  demo({
    id: 'demo-flower-3',
    name: 'Demo flower drop-off C (placeholder)',
    latitude: 17.4571,
    longitude: 78.3973,
    area: 'Placeholder near Kukatpally',
  }),
  demo({
    id: 'demo-flower-4',
    name: 'Demo flower drop-off D (placeholder)',
    latitude: 17.4452,
    longitude: 78.3801,
    area: 'Placeholder near Madhapur',
  }),
  demo({
    id: 'demo-flower-5',
    name: 'Demo flower drop-off E (placeholder)',
    latitude: 17.4588,
    longitude: 78.5301,
    area: 'Placeholder near Safilguda',
  }),
];
